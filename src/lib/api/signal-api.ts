/**
 * Signal API
 * 
 * API layer for SignalAgent
 * This is what the Intelligence page should call
 */

import type { Signal, PressureSignal, PressureSystem, PressureCluster } from '../../types/intelligence';
import type { EventWithChain } from '../supabase';
import { safeFetchJson } from '../safe-fetch-json';

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
    const { apiUrl } = await import('../api-base');
    const url = apiUrl('/api/signals');

    const response = await fetch(url, {
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
    console.error('[signal-api] Failed to fetch signals:', error.message);
    return [];
  }
}

/**
 * Get pressure-enriched signals with optional filters
 */
export async function getPressureSignals(filters?: {
  system?: PressureSystem;
  impact_order?: 1 | 2 | 3;
  min_magnitude?: number;
  min_confidence?: number;
}): Promise<PressureSignal[]> {
  const params = new URLSearchParams();
  if (filters?.system) params.set('system', filters.system);
  if (filters?.impact_order) params.set('impact_order', String(filters.impact_order));
  if (filters?.min_magnitude) params.set('min_magnitude', String(filters.min_magnitude));
  if (filters?.min_confidence) params.set('min_confidence', String(filters.min_confidence));

  const data = await safeFetchJson<{
    success: boolean;
    signals: PressureSignal[];
    total: number;
    error?: string;
  }>(`/api/pressure-signals?${params.toString()}`, undefined, { timeoutMs: 90_000 });

  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch pressure signals');
  }

  return data.signals || [];
}

/**
 * Get aggregated pressure clusters by system
 */
export async function getPressureClusters(): Promise<PressureCluster[]> {
  const data = await safeFetchJson<{
    success: boolean;
    clusters: PressureCluster[];
    error?: string;
  }>('/api/pressure-signals/clusters', undefined, { timeoutMs: 90_000 });

  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch pressure clusters');
  }

  return data.clusters || [];
}
