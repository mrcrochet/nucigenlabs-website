/**
 * Analysis Adapters
 * 
 * Temporary adapters to generate long-form analysis from events and signals
 */

import type { Signal, Event, Analysis } from '../../types/intelligence';

/**
 * Generate analysis from multiple events and signals
 * Focus on medium-to-long-term implications
 */
export function generateAnalysisFromEvents(
  events: Event[],
  signals?: Signal[],
  topic?: string,
  timeHorizon: 'medium' | 'long' = 'medium'
): Analysis[] {
  if (events.length === 0) {
    return [];
  }

  const analyses: Analysis[] = [];

  // Group events by sector or region for thematic analysis
  const eventGroups = new Map<string, Event[]>();

  events.forEach(event => {
    const key = event.sectors && event.sectors.length > 0
      ? `sector-${event.sectors[0]}`
      : event.region
      ? `region-${event.region}`
      : 'global';

    if (!eventGroups.has(key)) {
      eventGroups.set(key, []);
    }
    eventGroups.get(key)!.push(event);
  });

  // Generate analysis for each group
  eventGroups.forEach((groupEvents, key) => {
    if (groupEvents.length < 3) {
      return; // Need at least 3 events for meaningful analysis
    }

    const firstEvent = groupEvents[0];
    const sector = firstEvent.sectors?.[0] || 'Global';
    const region = firstEvent.region || 'Global';

    // Identify trends
    const keyTrends: string[] = [];
    
    // Trend 1: Event frequency
    if (groupEvents.length >= 5) {
      keyTrends.push(`Increased activity: ${groupEvents.length} events detected in ${sector} sector`);
    }

    // Trend 2: Impact levels
    const avgImpact = groupEvents.reduce((sum, e) => sum + (e.impact || 0), 0) / groupEvents.length;
    if (avgImpact >= 70) {
      keyTrends.push(`High-impact events dominating: Average impact of ${Math.round(avgImpact)}%`);
    }

    // Trend 3: Time horizon
    const horizons = groupEvents.map(e => e.horizon);
    const mostCommonHorizon = horizons.sort((a, b) =>
      horizons.filter(v => v === a).length - horizons.filter(v => v === b).length
    ).pop();
    if (mostCommonHorizon) {
      keyTrends.push(`Primary time horizon: ${mostCommonHorizon}-term implications`);
    }

    // Generate implications
    const implications: string[] = [];
    
    if (avgImpact >= 70) {
      implications.push(`High-impact events suggest significant structural changes in ${sector}`);
    }
    
    if (region !== 'Global') {
      implications.push(`Regional concentration in ${region} indicates localized dynamics`);
    }

    implications.push(`Multiple related events suggest a pattern rather than isolated incidents`);

    // Executive summary
    const executiveSummary = `${groupEvents.length} related events in ${sector}${region !== 'Global' ? ` (${region})` : ''} indicate significant developments. Average impact: ${Math.round(avgImpact)}%. Primary time horizon: ${mostCommonHorizon || 'medium'}-term.`;

    const analysis: Analysis = {
      id: `analysis-${key}-${Date.now()}`,
      type: 'analysis',
      scope: firstEvent.scope,
      confidence: Math.round(
        groupEvents.reduce((sum, e) => sum + (e.confidence || 0), 0) / groupEvents.length
      ),
      impact: Math.round(avgImpact),
      horizon: timeHorizon,
      source_count: groupEvents.length,
      last_updated: groupEvents[0].last_updated,
      title: `${sector} Sector Analysis: ${timeHorizon === 'long' ? 'Long-term' : 'Medium-term'} Implications`,
      executive_summary: executiveSummary,
      key_trends: keyTrends,
      implications,
      time_horizon: timeHorizon,
      referenced_event_ids: groupEvents.map(e => e.id),
      referenced_signal_ids: signals?.filter(s => 
        s.related_event_ids.some(id => groupEvents.some(e => e.id === id))
      ).map(s => s.id) || [],
    };

    analyses.push(analysis);
  });

  // Sort by impact
  analyses.sort((a, b) => b.impact - a.impact);

  return analyses;
}
