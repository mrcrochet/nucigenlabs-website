/**
 * Metric Adapters
 * 
 * Temporary adapters to generate system quality metrics
 */

import type { Metric } from '../../types/intelligence';

export interface PipelineLogs {
  events_processed: number;
  signals_generated: number;
  recommendations_active: number;
  alerts_triggered: number;
  errors: number;
  latency_ms: number[];
}

export interface TimeWindow {
  start: string; // ISO-8601
  end: string; // ISO-8601
}

/**
 * Assess system quality and reliability
 */
export function assessQualityFromLogs(
  logs: PipelineLogs,
  timeWindow: TimeWindow
): Metric {
  // Calculate error rate
  const totalOperations = logs.events_processed + logs.signals_generated;
  const errorRate = totalOperations > 0 ? logs.errors / totalOperations : 0;

  // Calculate average latency
  const avgLatency = logs.latency_ms.length > 0
    ? logs.latency_ms.reduce((sum, ms) => sum + ms, 0) / logs.latency_ms.length
    : 0;

  // Calculate coverage score (based on activity)
  // Higher activity = better coverage
  let coverageScore = 0;
  if (logs.events_processed > 100) coverageScore += 40;
  else if (logs.events_processed > 50) coverageScore += 30;
  else if (logs.events_processed > 20) coverageScore += 20;
  else if (logs.events_processed > 0) coverageScore += 10;

  if (logs.signals_generated > 20) coverageScore += 30;
  else if (logs.signals_generated > 10) coverageScore += 20;
  else if (logs.signals_generated > 5) coverageScore += 10;

  if (logs.recommendations_active > 10) coverageScore += 20;
  else if (logs.recommendations_active > 5) coverageScore += 10;

  if (errorRate < 0.01) coverageScore += 10; // Low error rate bonus

  // Validation notes
  const validationNotes: string[] = [];
  
  if (errorRate > 0.05) {
    validationNotes.push(`High error rate detected: ${(errorRate * 100).toFixed(1)}%`);
  } else if (errorRate > 0.01) {
    validationNotes.push(`Moderate error rate: ${(errorRate * 100).toFixed(1)}%`);
  } else {
    validationNotes.push(`Low error rate: ${(errorRate * 100).toFixed(2)}%`);
  }

  if (avgLatency > 5000) {
    validationNotes.push(`High latency detected: ${Math.round(avgLatency)}ms average`);
  } else if (avgLatency > 2000) {
    validationNotes.push(`Moderate latency: ${Math.round(avgLatency)}ms average`);
  } else {
    validationNotes.push(`Good performance: ${Math.round(avgLatency)}ms average latency`);
  }

  if (logs.events_processed === 0) {
    validationNotes.push(`Warning: No events processed in time window`);
  }

  if (logs.signals_generated === 0 && logs.events_processed > 0) {
    validationNotes.push(`Warning: Events processed but no signals generated`);
  }

  const metric: Metric = {
    id: `metric-${Date.now()}`,
    type: 'metric',
    scope: 'global',
    confidence: 100, // System metrics are always 100% confident
    impact: 0, // Not applicable for system metrics
    horizon: 'immediate',
    source_count: 1,
    last_updated: new Date().toISOString(),
    coverage_score: Math.min(100, coverageScore),
    latency_ms: Math.round(avgLatency),
    error_rate: errorRate,
    validation_notes: validationNotes.join('. '),
    events_processed: logs.events_processed,
    signals_generated: logs.signals_generated,
    recommendations_active: logs.recommendations_active,
    alerts_triggered: logs.alerts_triggered,
    data_sources_active: 1, // Placeholder
  };

  return metric;
}
