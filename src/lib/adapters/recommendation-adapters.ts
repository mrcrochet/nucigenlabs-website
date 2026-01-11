/**
 * Recommendation Adapters
 * 
 * Temporary adapters to generate recommendations from signals and events
 */

import type { Signal, Event, Recommendation } from '../../types/intelligence';

/**
 * Generate recommendations from signals and events
 * Rule: No signal → no recommendation
 */
export function generateRecommendationsFromSignals(
  signals: Signal[],
  events: Event[],
  userContext?: {
    role?: string;
    company?: string;
    sector?: string;
  }
): Recommendation[] {
  if (signals.length === 0) {
    return []; // No signals = no recommendations
  }

  const recommendations: Recommendation[] = [];

  signals.forEach((signal, index) => {
    // Only create recommendations for high-impact signals
    if (signal.impact_score < 60 || signal.confidence_score < 50) {
      return;
    }

    // Determine risk level based on impact and confidence
    let riskLevel: 'low' | 'medium' | 'high' = 'medium';
    if (signal.impact_score >= 80 && signal.confidence_score >= 70) {
      riskLevel = 'high';
    } else if (signal.impact_score < 60 || signal.confidence_score < 50) {
      riskLevel = 'low';
    }

    // Generate action based on signal type and scope
    let action = '';
    let rationale = '';

    if (signal.scope === 'sectorial') {
      action = `Monitor ${signal.title.toLowerCase()} developments closely`;
      rationale = `High-impact signal detected in your sector with ${signal.impact_score}% impact and ${signal.confidence_score}% confidence.`;
    } else if (signal.scope === 'regional') {
      action = `Assess regional exposure to ${signal.title.toLowerCase()}`;
      rationale = `Regional signal indicates significant activity with ${signal.impact_score}% impact.`;
    } else {
      action = `Review global implications of ${signal.title.toLowerCase()}`;
      rationale = `Global signal detected with ${signal.impact_score}% impact.`;
    }

    // Add user context if available
    if (userContext?.sector && signal.scope === 'sectorial') {
      action = `Review ${userContext.sector} sector exposure`;
      rationale += ` This directly affects your sector.`;
    }

    const recommendation: Recommendation = {
      id: `recommendation-${signal.id}`,
      type: 'recommendation',
      scope: signal.scope,
      confidence: signal.confidence_score,
      impact: signal.impact_score,
      horizon: signal.horizon,
      source_count: signal.source_count,
      last_updated: signal.last_updated,
      action,
      rationale,
      supporting_signal_ids: [signal.id],
      risk_level: riskLevel,
      confidence_score: signal.confidence_score,
      related_event_ids: signal.related_event_ids,
    };

    recommendations.push(recommendation);
  });

  // Sort by impact * confidence
  recommendations.sort((a, b) => {
    const scoreA = a.impact * a.confidence;
    const scoreB = b.impact * b.confidence;
    return scoreB - scoreA;
  });

  return recommendations;
}
