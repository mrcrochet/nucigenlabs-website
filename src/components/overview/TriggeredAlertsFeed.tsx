/**
 * TriggeredAlertsFeed - 8 alerts
 * 
 * Data: GET /alerts/triggered?range=7d&limit=8
 */

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { Link } from 'react-router-dom';
import Card from '../ui/Card';
import SectionHeader from '../ui/SectionHeader';
import Badge from '../ui/Badge';
import { Bell, AlertCircle } from 'lucide-react';

interface Alert {
  id: string;
  title: string;
  severity: 'moderate' | 'high' | 'critical';
  triggeredAt: string;
  relatedEventId?: string;
  relatedSignalId?: string;
}

export default function TriggeredAlertsFeed() {
  const { user } = useUser();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadAlerts = async () => {
      if (!user?.id) {
        setLoading(false);
        return;
      }

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch('/api/alerts/triggered?range=24h&limit=8', {
          headers: {
            'x-clerk-user-id': user.id,
          },
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data?.alerts) {
            // Map API response to component format
            const mappedAlerts = data.data.alerts.map((alert: any) => ({
              id: alert.id,
              title: alert.title || alert.message || 'Alert',
              severity: alert.severity || 'moderate',
              triggered_at: alert.triggered_at,
              triggeredAt: alert.triggered_at || alert.triggeredAt,
              related_event_id: alert.related_event_id,
              relatedEventId: alert.related_event_id,
              related_signal_id: alert.related_signal_id,
              relatedSignalId: alert.related_signal_id,
            }));
            setAlerts(mappedAlerts);
          }
        }
      } catch (error: any) {
        // Silently handle network errors - server not available
        if (error.name === 'AbortError' || error.name === 'TypeError' || error.message?.includes('fetch')) {
          console.debug('[TriggeredAlertsFeed] API server not available');
        } else {
          console.error('Error loading alerts:', error);
        }
        // Set empty array to show empty state
        setAlerts([]);
      } finally {
        setLoading(false);
      }
    };

    loadAlerts();
  }, [user?.id]);

  if (loading) {
    return (
      <Card>
        <div className="h-64 animate-pulse bg-background-glass-subtle rounded-lg" />
      </Card>
    );
  }

  if (alerts.length === 0) {
    return (
      <Card className="bg-gradient-to-br from-[#E1463E]/5 to-[#E1463E]/2 border border-[#E1463E]/20">
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="w-5 h-5 text-[#E1463E]" />
          <SectionHeader title="Triggered Alerts" />
        </div>
        <div className="mt-4 text-sm text-text-secondary flex items-center gap-2 p-4 bg-background-glass-subtle rounded-lg">
          <Bell className="w-4 h-4 text-green-400" />
          <span className="font-medium">No critical alerts in the last 24h</span>
        </div>
      </Card>
    );
  }

  const getSeverityVariant = (severity: Alert['severity']) => {
    switch (severity) {
      case 'critical':
        return 'critical';
      case 'high':
        return 'level';
      default:
        return 'neutral';
    }
  };

  return (
    <Card className="bg-gradient-to-br from-[#E1463E]/10 to-[#E1463E]/5 border border-[#E1463E]/30">
      <div className="flex items-center gap-2 mb-3">
        <AlertCircle className="w-5 h-5 text-[#E1463E]" />
        <SectionHeader title="Triggered Alerts" />
      </div>
      
      <div className="mt-4 space-y-3">
        {alerts.map((alert) => (
          <Link
            key={alert.id}
            to={`/alerts/${alert.id}`}
            className="block p-3 bg-background-glass-subtle rounded-lg hover:bg-background-glass-medium transition-colors"
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <h4 className="text-sm font-medium text-text-primary flex-1">
                {alert.title}
              </h4>
              <Badge variant={getSeverityVariant(alert.severity)}>
                {alert.severity}
              </Badge>
            </div>
            <div className="text-xs text-text-tertiary">
              {new Date(alert.triggeredAt || alert.triggered_at || Date.now()).toLocaleDateString()}
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}
