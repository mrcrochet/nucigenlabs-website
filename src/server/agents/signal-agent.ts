/**
 * Intelligence Signal Agent
 * 
 * REAL AGENT IMPLEMENTATION
 * 
 * Replaces:
 * - eventsToSignals()
 * - filterSignalsByPreferences()
 * 
 * Responsibilities:
 * - Synthesize multiple events into signals
 * - Apply user preferences
 * - Return ONLY Signal[] (UI contract)
 */

import type {
  SignalAgent,
  SignalAgentInput,
  AgentResponse,
} from '../../lib/agents/agent-interfaces';
import type { Signal } from '../../types/intelligence';
import type { EventWithChain } from '../../lib/supabase';

export class IntelligenceSignalAgent implements SignalAgent {
  /**
   * Synthesize multiple events into a single signal
   * Returns null if fewer than 2 related events exist (unless high-impact single event)
   */
  async generateSignal(input: SignalAgentInput): Promise<AgentResponse<Signal>> {
    const startTime = Date.now();

    try {
      if (!input.events || input.events.length === 0) {
        return {
          data: null,
          error: 'No events provided',
          metadata: {
            processing_time_ms: Date.now() - startTime,
          },
        };
      }

      // Generate all signals first
      const signalsResponse = await this.generateSignals(input);
      
      if (!signalsResponse.data || signalsResponse.data.length === 0) {
        return {
          data: null,
          error: 'No signals generated',
          metadata: signalsResponse.metadata,
        };
      }

      // Return the highest priority signal
      const topSignal = signalsResponse.data[0];

      return {
        data: topSignal,
        metadata: {
          ...signalsResponse.metadata,
          confidence: topSignal.confidence_score / 100,
        },
      };
    } catch (error: any) {
      return {
        data: null,
        error: error.message || 'Failed to generate signal',
        metadata: {
          processing_time_ms: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * Generate multiple signals from a batch of events
   * This is the main method used by Intelligence page
   */
  async generateSignals(input: SignalAgentInput): Promise<AgentResponse<Signal[]>> {
    const startTime = Date.now();

    try {
      if (!input.events || input.events.length === 0) {
        return {
          data: [],
          metadata: {
            processing_time_ms: Date.now() - startTime,
          },
        };
      }

      // Step 1: Group events by sector/region/type
      const eventGroups = this.groupEventsBySimilarity(input.events);

      // Step 2: Convert groups to signals
      const signals: Signal[] = [];

      eventGroups.forEach((groupEvents) => {
        // Create signal from group (or single high-impact event)
        const signal = this.createSignalFromEvents(groupEvents);
        if (signal) {
          signals.push(signal);
        }
      });

      // Step 3: Apply user preferences filtering
      const filteredSignals = this.applyPreferencesFilter(signals, input.user_preferences);

      // Step 4: Sort by priority (impact * confidence)
      filteredSignals.sort((a, b) => {
        const scoreA = a.impact_score * a.confidence_score;
        const scoreB = b.impact_score * b.confidence_score;
        return scoreB - scoreA;
      });

      return {
        data: filteredSignals,
        metadata: {
          processing_time_ms: Date.now() - startTime,
          confidence: filteredSignals.length > 0 
            ? filteredSignals[0].confidence_score / 100 
            : 0,
        },
      };
    } catch (error: any) {
      return {
        data: [],
        error: error.message || 'Failed to generate signals',
        metadata: {
          processing_time_ms: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * Group events by similarity (sector + region + event_type)
   */
  private groupEventsBySimilarity(events: EventWithChain[]): Map<string, EventWithChain[]> {
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

    return eventGroups;
  }

  /**
   * Create a signal from a group of events
   * Handles both multi-event groups and single high-impact events
   */
  private createSignalFromEvents(groupEvents: EventWithChain[]): Signal | null {
    if (groupEvents.length === 0) {
      return null;
    }

    // Special case: Single high-impact event
    if (groupEvents.length === 1) {
      const singleEvent = groupEvents[0];
      if (singleEvent && (singleEvent.impact_score || 0) >= 0.7 && (singleEvent.confidence || 0) >= 0.7) {
        return this.createSignalFromSingleEvent(singleEvent);
      }
      return null; // Single event but not high-impact enough
    }

    // Multi-event group: synthesize
    const firstEvent = groupEvents[0];
    const totalImpact = groupEvents.reduce((sum, e) => sum + (e.impact_score || 0), 0);
    const avgImpact = totalImpact / groupEvents.length;
    const totalConfidence = groupEvents.reduce((sum, e) => sum + (e.confidence || 0), 0);
    const avgConfidence = totalConfidence / groupEvents.length;

    // Determine time horizon from causal chains
    let horizon: 'immediate' | 'short' | 'medium' | 'long' = 'medium';
    const chain = firstEvent.nucigen_causal_chains?.[0];
    if (chain) {
      if (chain.time_horizon === 'hours') horizon = 'immediate';
      else if (chain.time_horizon === 'days') horizon = 'short';
      else if (chain.time_horizon === 'weeks') horizon = 'medium';
      else horizon = 'long';
    }

    // Determine scope
    let scope: 'global' | 'regional' | 'sectorial' | 'asset' | 'actor' = 'global';
    if (firstEvent.region) {
      if (['US', 'EU', 'China', 'Asia'].includes(firstEvent.region)) {
        scope = 'regional';
      }
    }
    if (firstEvent.sector) {
      scope = 'sectorial';
    }

    // Create signal title
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
      summary: summary.substring(0, 300),
      impact_score: Math.round(avgImpact * 100),
      confidence_score: Math.round(avgConfidence * 100),
      time_horizon: horizon,
      related_event_ids: groupEvents.map(e => e.id),
      why_it_matters: firstEvent.why_it_matters || `Multiple related events indicate significant activity in ${firstEvent.sector || 'this sector'}.`,
    };

    return signal;
  }

  /**
   * Create signal from a single high-impact event
   */
  private createSignalFromSingleEvent(event: EventWithChain): Signal {
    let horizon: 'immediate' | 'short' | 'medium' | 'long' = 'medium';
    const chain = event.nucigen_causal_chains?.[0];
    if (chain) {
      if (chain.time_horizon === 'hours') horizon = 'immediate';
      else if (chain.time_horizon === 'days') horizon = 'short';
      else if (chain.time_horizon === 'weeks') horizon = 'medium';
      else horizon = 'long';
    }

    let scope: 'global' | 'regional' | 'sectorial' | 'asset' | 'actor' = 'global';
    if (event.region) {
      if (['US', 'EU', 'China', 'Asia'].includes(event.region)) {
        scope = 'regional';
      }
    }
    if (event.sector) {
      scope = 'sectorial';
    }

    return {
      id: `signal-${event.id}`,
      type: 'signal',
      scope,
      confidence: Math.round((event.confidence || 0) * 100),
      impact: Math.round((event.impact_score || 0) * 100),
      horizon,
      source_count: 1,
      last_updated: event.created_at,
      title: `${event.sector || 'Global'} ${event.event_type || 'Event'}`,
      summary: event.summary.substring(0, 300),
      impact_score: Math.round((event.impact_score || 0) * 100),
      confidence_score: Math.round((event.confidence || 0) * 100),
      time_horizon: horizon,
      related_event_ids: [event.id],
      why_it_matters: event.why_it_matters || `High-impact event in ${event.sector || 'this sector'}.`,
    };
  }

  /**
   * Apply user preferences filter to signals
   */
  private applyPreferencesFilter(
    signals: Signal[],
    preferences?: {
      preferred_sectors?: string[];
      preferred_regions?: string[];
      preferred_event_types?: string[];
      min_impact_score?: number;
      min_confidence_score?: number;
    }
  ): Signal[] {
    if (!preferences) {
      return signals;
    }

    return signals.filter(signal => {
      // Filter by impact
      if (preferences.min_impact_score !== undefined) {
        if (signal.impact_score < preferences.min_impact_score * 100) {
          return false;
        }
      }

      // Filter by confidence
      if (preferences.min_confidence_score !== undefined) {
        if (signal.confidence_score < preferences.min_confidence_score * 100) {
          return false;
        }
      }

      // Note: Sector/region/event_type filtering would require
      // looking at related events, which we'll implement later
      // For now, we just filter by scores

      return true;
    });
  }
}

// Export singleton instance
export const signalAgent = new IntelligenceSignalAgent();
