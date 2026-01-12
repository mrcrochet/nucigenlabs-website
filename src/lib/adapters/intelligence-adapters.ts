/**
 * Intelligence Adapters
 * 
 * Temporary adapters to transform existing Supabase data
 * into UI contract-compliant types
 * 
 * These will be replaced by proper API endpoints later
 */

import type { EventWithChain } from '../supabase';
import type { Signal, Event, IntelligenceScope, TimeHorizon } from '../../types/intelligence';

// ============================================
// EVENT → SIGNAL ADAPTER
// ============================================

/**
 * Transform events into signals for Intelligence page
 * Aggregates related events into prioritized signals
 */
export function eventsToSignals(events: EventWithChain[]): Signal[] {
  if (events.length === 0) return [];

  // Group events by sector/region/type to create signals
  const eventGroups = new Map<string, EventWithChain[]>();

  events.forEach(event => {
    // Create a key based on sector + region + event_type
    const key = [
      event.sector || 'unknown',
      event.region || 'unknown',
      event.event_type || 'unknown'
    ].join('::');

    if (!eventGroups.has(key)) {
      eventGroups.set(key, []);
    }
    eventGroups.get(key)!.push(event);
  });

  // Convert groups to signals
  const signals: Signal[] = [];

  eventGroups.forEach((groupEvents, key) => {
    // Only create signal if we have at least 2 related events
    // BUT: If we have only one event but it's high-impact, create a signal anyway
    if (groupEvents.length < 2) {
      // Allow single high-impact events to become signals
      const singleEvent = groupEvents[0];
      if (singleEvent && (singleEvent.impact_score || 0) >= 0.7 && (singleEvent.confidence || 0) >= 0.7) {
        // Create signal from single high-impact event
        const signal: Signal = {
          id: `signal-${singleEvent.id}`,
          type: 'signal',
          scope: singleEvent.region ? 'regional' : 'global',
          confidence: Math.round((singleEvent.confidence || 0) * 100),
          impact: Math.round((singleEvent.impact_score || 0) * 100),
          horizon: getTimeHorizonFromChain(singleEvent.nucigen_causal_chains?.[0]?.time_horizon),
          source_count: 1,
          last_updated: singleEvent.created_at,
          title: `${singleEvent.sector || 'Global'} ${singleEvent.event_type || 'Event'}`,
          summary: singleEvent.summary.substring(0, 300),
          impact_score: Math.round((singleEvent.impact_score || 0) * 100),
          confidence_score: Math.round((singleEvent.confidence || 0) * 100),
          time_horizon: getTimeHorizonFromChain(singleEvent.nucigen_causal_chains?.[0]?.time_horizon),
          related_event_ids: [singleEvent.id],
          why_it_matters: singleEvent.why_it_matters || `High-impact event in ${singleEvent.sector || 'this sector'}.`,
        };
        signals.push(signal);
      }
      return;
    }

    const firstEvent = groupEvents[0];
    const totalImpact = groupEvents.reduce((sum, e) => sum + (e.impact_score || 0), 0);
    const avgImpact = totalImpact / groupEvents.length;
    const totalConfidence = groupEvents.reduce((sum, e) => sum + (e.confidence || 0), 0);
    const avgConfidence = totalConfidence / groupEvents.length;

    // Determine time horizon from causal chains
    let horizon: TimeHorizon = 'medium';
    const chain = firstEvent.nucigen_causal_chains?.[0];
    if (chain) {
      if (chain.time_horizon === 'hours') horizon = 'immediate';
      else if (chain.time_horizon === 'days') horizon = 'short';
      else if (chain.time_horizon === 'weeks') horizon = 'medium';
      else horizon = 'long';
    }

    // Determine scope
    let scope: IntelligenceScope = 'global';
    if (firstEvent.region) {
      if (['US', 'EU', 'China', 'Asia'].includes(firstEvent.region)) {
        scope = 'regional';
      }
    }
    if (firstEvent.sector) {
      scope = 'sectorial';
    }

    // Create signal title from first event
    const title = `${firstEvent.sector || 'Global'} ${firstEvent.event_type || 'Event'} Activity`;
    
    // Create summary (max 2 sentences)
    const summary = groupEvents.length === 1
      ? firstEvent.summary.substring(0, 200)
      : `${groupEvents.length} related ${firstEvent.event_type?.toLowerCase() || 'events'} detected in ${firstEvent.sector || 'multiple sectors'}. ${firstEvent.why_it_matters || firstEvent.summary.substring(0, 100)}`;

    const signal: Signal = {
      id: `signal-${firstEvent.id}`,
      type: 'signal',
      scope,
      confidence: Math.round(avgConfidence * 100),
      impact: Math.round(avgImpact * 100),
      horizon,
      source_count: groupEvents.length,
      last_updated: firstEvent.created_at,
      title,
      summary: summary.substring(0, 300), // Ensure max length
      impact_score: Math.round(avgImpact * 100),
      confidence_score: Math.round(avgConfidence * 100),
      time_horizon: horizon,
      related_event_ids: groupEvents.map(e => e.id),
      why_it_matters: firstEvent.why_it_matters || `Multiple related events indicate significant activity in ${firstEvent.sector || 'this sector'}.`,
    };

    signals.push(signal);
  });

  // Sort by impact * confidence
  signals.sort((a, b) => {
    const scoreA = a.impact_score * a.confidence_score;
    const scoreB = b.impact_score * b.confidence_score;
    return scoreB - scoreA;
  });

  return signals;
}

// ============================================
// EVENT WITH CHAIN → EVENT ADAPTER
// ============================================

/**
 * Transform EventWithChain to UI contract Event
 * This is the source of truth format
 */
export function eventWithChainToEvent(event: EventWithChain): Event & {
  // Extended properties for causal chain display
  causal_chain?: {
    cause?: string;
    first_order_effect?: string;
    second_order_effect?: string | null;
    time_horizon?: string;
    affected_sectors?: string[];
    affected_regions?: string[];
    confidence?: number;
  };
} {
  const chain = event.nucigen_causal_chains?.[0];
  
  return {
    id: event.id,
    type: 'event',
    scope: event.region ? 'regional' : 'global',
    confidence: Math.round((event.confidence || 0) * 100),
    impact: Math.round((event.impact_score || 0) * 100),
    horizon: getTimeHorizonFromChain(chain?.time_horizon),
    source_count: 1,
    last_updated: event.created_at,
    event_id: event.id,
    headline: event.summary,
    description: event.summary,
    date: event.created_at,
    location: event.country || event.region || null,
    actors: event.actors || [],
    sectors: event.sector ? [event.sector] : [],
    sources: [], // Will be populated from source_event_id if available
    event_type: event.event_type,
    event_subtype: event.event_subtype || null,
    region: event.region || null,
    country: event.country || null,
    why_it_matters: event.why_it_matters,
    first_order_effect: event.first_order_effect || chain?.first_order_effect || null,
    second_order_effect: event.second_order_effect || chain?.second_order_effect || null,
    impact_score: event.impact_score,
    // Extended properties for causal chain
    causal_chain: chain ? {
      cause: chain.cause,
      first_order_effect: chain.first_order_effect,
      second_order_effect: chain.second_order_effect || null,
      time_horizon: chain.time_horizon,
      affected_sectors: chain.affected_sectors || [],
      affected_regions: chain.affected_regions || [],
      confidence: chain.confidence,
    } : undefined,
  } as Event & { causal_chain?: any };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function getTimeHorizonFromChain(chainHorizon?: string): TimeHorizon {
  if (!chainHorizon) return 'medium';
  
  switch (chainHorizon) {
    case 'hours': return 'immediate';
    case 'days': return 'short';
    case 'weeks': return 'medium';
    default: return 'long';
  }
}

/**
 * Filter signals by user preferences
 */
export function filterSignalsByPreferences(
  signals: Signal[],
  preferences: {
    preferred_sectors?: string[];
    preferred_regions?: string[];
    preferred_event_types?: string[];
    min_impact_score?: number;
    min_confidence_score?: number;
  } | null
): Signal[] {
  if (!preferences) return signals;

  return signals.filter(signal => {
    // Filter by impact
    if (preferences.min_impact_score !== undefined) {
      if (signal.impact_score < preferences.min_impact_score) return false;
    }

    // Filter by confidence
    if (preferences.min_confidence_score !== undefined) {
      if (signal.confidence_score < preferences.min_confidence_score) return false;
    }

    // Note: Sector/region/event_type filtering would require
    // looking at related events, which we'll implement later
    // For now, we just filter by scores

    return true;
  });
}
