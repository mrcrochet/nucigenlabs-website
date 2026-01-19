/**
 * Trending Alerts
 * 
 * Detects emerging trends and automatically alerts users
 * Shows trending topics, sudden spikes, and pattern changes
 */

import { useState, useEffect, useMemo } from 'react';
import { TrendingUp, AlertCircle, Bell, X } from 'lucide-react';
import { toast } from 'sonner';
import type { SearchResult } from '../../types/search';

interface TrendingAlert {
  id: string;
  type: 'spike' | 'emerging' | 'pattern' | 'consensus';
  title: string;
  description: string;
  severity: 'high' | 'medium' | 'low';
  relatedResults: string[];
  timestamp: Date;
}

interface TrendingAlertsProps {
  results: SearchResult[];
  threshold?: number; // 0-1, minimum score to trigger alert
  onTrendDetected?: (alert: TrendingAlert) => void;
  autoDismiss?: boolean;
  dismissTime?: number; // milliseconds
}

function detectTrends(results: SearchResult[], threshold: number = 0.7): TrendingAlert[] {
  const alerts: TrendingAlert[] = [];

  // 1. Detect sudden spikes in mentions
  const entityMentions = new Map<string, { count: number; results: SearchResult[] }>();
  results.forEach(result => {
    result.entities.forEach(entity => {
      if (!entityMentions.has(entity.name)) {
        entityMentions.set(entity.name, { count: 0, results: [] });
      }
      const data = entityMentions.get(entity.name)!;
      data.count++;
      data.results.push(result);
    });
  });

  // Find entities with sudden spike (appearing in >threshold% of results)
  entityMentions.forEach((data, entityName) => {
    const mentionRate = data.count / results.length;
    if (mentionRate >= threshold && data.count >= 3) {
      alerts.push({
        id: `spike-${entityName}`,
        type: 'spike',
        title: `Spike in mentions: ${entityName}`,
        description: `${entityName} appears in ${data.count} of ${results.length} results (${(mentionRate * 100).toFixed(0)}%)`,
        severity: mentionRate > 0.8 ? 'high' : mentionRate > 0.6 ? 'medium' : 'low',
        relatedResults: data.results.map(r => r.id),
        timestamp: new Date(),
      });
    }
  });

  // 2. Detect emerging topics (recent results with high relevance)
  const recentResults = results
    .filter(r => {
      const date = new Date(r.publishedAt);
      const daysAgo = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
      return daysAgo <= 1; // Last 24 hours
    })
    .filter(r => r.relevanceScore > 0.7);

  if (recentResults.length >= 3) {
    const avgRelevance = recentResults.reduce((sum, r) => sum + r.relevanceScore, 0) / recentResults.length;
    if (avgRelevance >= threshold) {
      alerts.push({
        id: 'emerging-topic',
        type: 'emerging',
        title: 'Emerging high-relevance topic',
        description: `${recentResults.length} highly relevant results in the last 24 hours (avg relevance: ${(avgRelevance * 100).toFixed(0)}%)`,
        severity: avgRelevance > 0.85 ? 'high' : 'medium',
        relatedResults: recentResults.map(r => r.id),
        timestamp: new Date(),
      });
    }
  }

  // 3. Detect consensus patterns (multiple sources saying similar things)
  const sourceGroups = new Map<string, SearchResult[]>();
  results.forEach(result => {
    if (!sourceGroups.has(result.source)) {
      sourceGroups.set(result.source, []);
    }
    sourceGroups.get(result.source)!.push(result);
  });

  if (sourceGroups.size >= 3) {
    const highRelevanceSources = Array.from(sourceGroups.values())
      .filter(group => group.some(r => r.relevanceScore > 0.7))
      .length;

    if (highRelevanceSources >= 3) {
      alerts.push({
        id: 'consensus-pattern',
        type: 'consensus',
        title: 'Multi-source consensus detected',
        description: `${highRelevanceSources} different sources reporting on this topic with high relevance`,
        severity: highRelevanceSources >= 5 ? 'high' : 'medium',
        relatedResults: results.slice(0, 5).map(r => r.id),
        timestamp: new Date(),
      });
    }
  }

  // 4. Detect sentiment patterns
  const sentimentCounts = {
    positive: 0,
    negative: 0,
    neutral: 0,
  };

  results.forEach(result => {
    const text = `${result.title} ${result.summary}`.toLowerCase();
    const hasPositive = ['growth', 'increase', 'rise', 'gain', 'profit', 'success'].some(k => text.includes(k));
    const hasNegative = ['decline', 'fall', 'drop', 'loss', 'crisis', 'collapse'].some(k => text.includes(k));
    
    if (hasPositive && !hasNegative) sentimentCounts.positive++;
    else if (hasNegative && !hasPositive) sentimentCounts.negative++;
    else sentimentCounts.neutral++;
  });

  const total = sentimentCounts.positive + sentimentCounts.negative + sentimentCounts.neutral;
  if (total > 0) {
    const dominantSentiment = sentimentCounts.negative > sentimentCounts.positive ? 'negative' : 'positive';
    const sentimentRatio = dominantSentiment === 'negative' 
      ? sentimentCounts.negative / total 
      : sentimentCounts.positive / total;

    if (sentimentRatio >= threshold && (sentimentCounts.negative >= 3 || sentimentCounts.positive >= 3)) {
      alerts.push({
        id: 'sentiment-pattern',
        type: 'pattern',
        title: `Strong ${dominantSentiment} sentiment pattern`,
        description: `${(sentimentRatio * 100).toFixed(0)}% of results show ${dominantSentiment} sentiment`,
        severity: sentimentRatio > 0.8 ? 'high' : 'medium',
        relatedResults: results.slice(0, 5).map(r => r.id),
        timestamp: new Date(),
      });
    }
  }

  return alerts.sort((a, b) => {
    const severityOrder = { high: 3, medium: 2, low: 1 };
    return severityOrder[b.severity] - severityOrder[a.severity];
  });
}

export default function TrendingAlerts({
  results,
  threshold = 0.7,
  onTrendDetected,
  autoDismiss = false,
  dismissTime = 10000,
}: TrendingAlertsProps) {
  const [alerts, setAlerts] = useState<TrendingAlert[]>([]);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());

  // Detect trends when results change
  useEffect(() => {
    if (results.length === 0) {
      setAlerts([]);
      return;
    }

    const detectedAlerts = detectTrends(results, threshold);
    setAlerts(detectedAlerts);

    // Notify parent of new alerts
    detectedAlerts.forEach(alert => {
      if (onTrendDetected && !dismissedAlerts.has(alert.id)) {
        onTrendDetected(alert);
      }
    });
  }, [results, threshold, onTrendDetected, dismissedAlerts]);

  // Auto-dismiss alerts
  useEffect(() => {
    if (!autoDismiss) return;

    const timer = setTimeout(() => {
      setAlerts(prev => prev.slice(1)); // Remove oldest alert
    }, dismissTime);

    return () => clearTimeout(timer);
  }, [alerts, autoDismiss, dismissTime]);

  const visibleAlerts = alerts.filter(alert => !dismissedAlerts.has(alert.id));

  if (visibleAlerts.length === 0) {
    return null;
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-500/20 border-red-500/50 text-red-400';
      case 'medium':
        return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400';
      default:
        return 'bg-blue-500/20 border-blue-500/50 text-blue-400';
    }
  };

  const getSeverityIcon = (severity: string) => {
    if (severity === 'high') {
      return <AlertCircle className="w-4 h-4" />;
    }
    return <TrendingUp className="w-4 h-4" />;
  };

  return (
    <div className="space-y-2">
      {visibleAlerts.slice(0, 3).map((alert) => (
        <div
          key={alert.id}
          className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)} flex items-start gap-3`}
        >
          <div className="flex-shrink-0 mt-0.5">
            {getSeverityIcon(alert.severity)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="text-sm font-semibold mb-1">{alert.title}</h4>
                <p className="text-xs opacity-90">{alert.description}</p>
                <div className="mt-2 text-xs opacity-75">
                  {alert.relatedResults.length} related results
                </div>
              </div>
              <button
                onClick={() => setDismissedAlerts(prev => new Set([...prev, alert.id]))}
                className="flex-shrink-0 p-1 hover:bg-black/20 rounded transition-colors"
                aria-label="Dismiss alert"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ))}
      {visibleAlerts.length > 3 && (
        <div className="text-xs text-text-tertiary text-center py-2">
          +{visibleAlerts.length - 3} more alerts
        </div>
      )}
    </div>
  );
}
