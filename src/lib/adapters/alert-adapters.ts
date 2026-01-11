/**
 * Alert Adapters
 * 
 * Temporary adapters to generate alerts from signals when thresholds are exceeded
 */

import type { Signal, Alert } from '../../types/intelligence';

export interface AlertThresholds {
  impact_threshold?: number; // 0-100
  confidence_threshold?: number; // 0-100
  severity_level?: 'moderate' | 'high' | 'critical';
}

/**
 * Detect alerts when thresholds are exceeded
 * Returns empty array if no threshold is exceeded
 */
export function detectAlertsFromSignals(
  signals: Signal[],
  thresholds: AlertThresholds = {
    impact_threshold: 70,
    confidence_threshold: 60,
    severity_level: 'moderate',
  }
): Alert[] {
  const alerts: Alert[] = [];

  signals.forEach((signal) => {
    // Check if thresholds are exceeded
    const impactExceeded = thresholds.impact_threshold 
      ? signal.impact_score >= thresholds.impact_threshold 
      : false;
    
    const confidenceExceeded = thresholds.confidence_threshold
      ? signal.confidence_score >= thresholds.confidence_threshold
      : false;

    if (!impactExceeded && !confidenceExceeded) {
      return; // No threshold exceeded
    }

    // Determine severity
    let severity: 'moderate' | 'high' | 'critical' = 'moderate';
    if (signal.impact_score >= 85 && signal.confidence_score >= 75) {
      severity = 'critical';
    } else if (signal.impact_score >= 75 || signal.confidence_score >= 70) {
      severity = 'high';
    }

    // Only create alerts for moderate+ severity if specified
    if (thresholds.severity_level) {
      const severityLevels = ['moderate', 'high', 'critical'];
      const requiredIndex = severityLevels.indexOf(thresholds.severity_level);
      const actualIndex = severityLevels.indexOf(severity);
      if (actualIndex < requiredIndex) {
        return; // Severity too low
      }
    }

    // Determine which threshold was exceeded
    let thresholdExceeded = '';
    if (impactExceeded && confidenceExceeded) {
      thresholdExceeded = `Impact (${signal.impact_score}%) and confidence (${signal.confidence_score}%) thresholds exceeded`;
    } else if (impactExceeded) {
      thresholdExceeded = `Impact threshold (${thresholds.impact_threshold}%) exceeded: ${signal.impact_score}%`;
    } else {
      thresholdExceeded = `Confidence threshold (${thresholds.confidence_threshold}%) exceeded: ${signal.confidence_score}%`;
    }

    const triggerReason = `Signal "${signal.title}" has exceeded critical thresholds and requires immediate attention.`;

    const alert: Alert = {
      id: `alert-${signal.id}`,
      type: 'alert',
      scope: signal.scope,
      confidence: signal.confidence_score,
      impact: signal.impact_score,
      horizon: signal.horizon,
      source_count: signal.source_count,
      last_updated: signal.last_updated,
      title: `High-Impact Signal: ${signal.title}`,
      trigger_reason: triggerReason,
      threshold_exceeded: thresholdExceeded,
      severity,
      related_signal_ids: [signal.id],
      related_event_ids: signal.related_event_ids,
    };

    alerts.push(alert);
  });

  // Sort by severity (critical first), then by impact
  alerts.sort((a, b) => {
    const severityOrder = { critical: 3, high: 2, moderate: 1 };
    const severityDiff = severityOrder[b.severity] - severityOrder[a.severity];
    if (severityDiff !== 0) return severityDiff;
    return b.impact - a.impact;
  });

  return alerts;
}
