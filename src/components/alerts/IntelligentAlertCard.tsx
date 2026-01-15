/**
 * IntelligentAlertCard - Alert card with explanation
 * 
 * Displays alert with:
 * - Why it was triggered (explanation)
 * - Additional context
 * - Recommended action
 */

import { useState, useEffect } from 'react';
import { AlertTriangle, Info, Lightbulb, Loader2 } from 'lucide-react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import type { Alert } from '../../types/intelligence';

interface IntelligentAlertData {
  explanation: string;
  context: string;
  recommended_action?: string;
}

interface IntelligentAlertCardProps {
  alert: Alert;
  onMarkRead?: (alertId: string) => void;
}

export default function IntelligentAlertCard({ alert, onMarkRead }: IntelligentAlertCardProps) {
  const [intelligentData, setIntelligentData] = useState<IntelligentAlertData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // If alert already has explanation in trigger_reason, use it
    // Otherwise, fetch intelligent explanation
    if (alert.trigger_reason && alert.trigger_reason.length > 50) {
      // Assume it's already an explanation
      setIntelligentData({
        explanation: alert.trigger_reason,
        context: '',
      });
    } else {
      // Fetch intelligent explanation
      loadIntelligentExplanation();
    }
  }, [alert]);

  const loadIntelligentExplanation = async () => {
    try {
      setLoading(true);
      
      // Determine alert type from alert data
      let alertType: 'signal_threshold' | 'critical_event' | 'trajectory_change' = 'signal_threshold';
      if (alert.threshold_exceeded?.includes('Critical event')) {
        alertType = 'critical_event';
      } else if (alert.threshold_exceeded?.includes('Trajectory')) {
        alertType = 'trajectory_change';
      }

      const API_BASE = import.meta.env.DEV ? '/api' : '/api';
      const response = await fetch(`${API_BASE}/alerts/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          alertType,
          signal: alert.related_signal_ids && alert.related_signal_ids.length > 0 ? {
            id: alert.related_signal_ids[0],
            title: alert.title,
            impact_score: alert.impact,
            confidence_score: alert.confidence,
          } : undefined,
          threshold: {
            impact_threshold: 70,
            confidence_threshold: 60,
          },
        }),
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setIntelligentData(result.data);
        }
      }
    } catch (error) {
      console.error('[IntelligentAlertCard] Error loading explanation:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-500 bg-red-500/20 border-red-500/30';
      case 'high':
        return 'text-yellow-500 bg-yellow-500/20 border-yellow-500/30';
      default:
        return 'text-orange-500 bg-orange-500/20 border-orange-500/30';
    }
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-primary-red" />
          <span className="text-sm text-text-secondary">Loading alert explanation...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card
      className={`p-6 ${
        alert.severity === 'critical'
          ? 'border-red-500/20 bg-red-500/5'
          : alert.severity === 'high'
          ? 'border-yellow-500/20 bg-yellow-500/5'
          : ''
      }`}
    >
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div className="flex-1 w-full">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-3">
            <div className={`p-2 rounded-lg border ${getSeverityColor(alert.severity)}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge variant={alert.severity === 'critical' ? 'critical' : 'level'}>
                  {alert.severity}
                </Badge>
                <Badge variant="neutral">
                  {alert.impact}% impact
                </Badge>
                <Badge variant="level">
                  {alert.confidence}% confidence
                </Badge>
              </div>
              <h3 className="text-lg font-light text-text-primary mb-2">
                {alert.title}
              </h3>
            </div>
          </div>

          {/* Explanation */}
          {intelligentData?.explanation && (
            <div className="mb-4 p-3 bg-background-glass-subtle rounded-lg border border-borders-subtle">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-text-secondary" />
                <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Why This Alert
                </span>
              </div>
              <p className="text-sm text-text-primary leading-relaxed">
                {intelligentData.explanation}
              </p>
            </div>
          )}

          {/* Context */}
          {intelligentData?.context && (
            <div className="mb-4 p-3 bg-background-glass-subtle rounded-lg border border-borders-subtle">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-text-secondary" />
                <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
                  Additional Context
                </span>
              </div>
              <p className="text-sm text-text-secondary leading-relaxed">
                {intelligentData.context}
              </p>
            </div>
          )}

          {/* Recommended Action */}
          {intelligentData?.recommended_action && (
            <div className="mb-4 p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                  Recommended Action
                </span>
              </div>
              <p className="text-sm text-text-primary leading-relaxed">
                {intelligentData.recommended_action}
              </p>
            </div>
          )}

          {/* Threshold Info */}
          <p className="text-xs text-text-tertiary mb-3">
            Threshold exceeded: {alert.threshold_exceeded}
          </p>
        </div>
      </div>
    </Card>
  );
}
