/**
 * Signal API
 * 
 * API layer for SignalAgent
 * This is what the Intelligence page should call
 */

import type { Signal } from '../../types/intelligence';
import type { EventWithChain } from '../supabase';

export interface SignalApiOptions {
  searchQuery?: string;
  scope?: 'global' | 'regional' | 'sectorial' | 'asset' | 'actor';
  horizon?: 'immediate' | 'short' | 'medium' | 'long';
  min_impact?: number;
  min_confidence?: number;
  user_preferences?: {
    preferred_sectors?: string[];
    preferred_regions?: string[];
    preferred_event_types?: string[];
    min_impact_score?: number;
    min_confidence_score?: number;
  };
}

/**
 * Get signals via SignalAgent (via API endpoint)
 * Intelligence page should ONLY use this - never access Event[] directly
 */
export async function getSignalsViaAgent(
  events: EventWithChain[],
  options: SignalApiOptions = {}
): Promise<Signal[]> {
  try {
    // Call API endpoint (agent runs on server)
    const response = await fetch('http://localhost:3001/api/signals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        events,
        user_preferences: options.user_preferences,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to generate signals' }));
      throw new Error(errorData.error || 'Failed to generate signals');
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }

    let signals: Signal[] = data.signals || [];

    // Apply additional filters if needed
    if (options.min_impact !== undefined) {
      signals = signals.filter(s => s.impact_score >= options.min_impact!);
    }

    if (options.min_confidence !== undefined) {
      signals = signals.filter(s => s.confidence_score >= options.min_confidence!);
    }

    if (options.scope) {
      signals = signals.filter(s => s.scope === options.scope);
    }

    if (options.horizon) {
      signals = signals.filter(s => s.horizon === options.horizon);
    }

    return signals;
  } catch (error: any) {
    // Fallback: use client-side adapter if API is not available
    console.warn('API endpoint not available, using client-side adapter:', error.message);
    
    // Import adapter as fallback
    const { eventsToSignals, filterSignalsByPreferences } = await import('../adapters/intelligence-adapters');
    const allSignals = eventsToSignals(events);
    const filteredSignals = filterSignalsByPreferences(allSignals, options.user_preferences);
    
    return filteredSignals;
  }
}
