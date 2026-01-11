/**
 * Client-side utilities for user preferences
 * These functions mirror the server-side logic but run in the browser
 */

export interface UserPreferences {
  id?: string;
  user_id: string;
  preferred_sectors?: string[];
  preferred_regions?: string[];
  preferred_event_types?: string[];
  focus_areas?: string[];
  feed_priority?: 'relevance' | 'recency' | 'impact' | 'balanced';
  min_impact_score?: number;
  min_confidence_score?: number;
  preferred_time_horizons?: string[];
  notify_on_new_event?: boolean;
  notify_frequency?: 'realtime' | 'hourly' | 'daily' | 'weekly';
  created_at?: string;
  updated_at?: string;
}

export interface EventForRelevance {
  event_type: string;
  sector: string | null;
  region: string | null;
  impact_score: number | null;
  confidence: number | null;
  created_at: string;
  nucigen_causal_chains?: Array<{
    affected_sectors: string[];
    affected_regions: string[];
    time_horizon: string;
  }>;
}

/**
 * Calculate relevance score for an event based on user preferences
 * 
 * This function now supports ML-based prediction via API call.
 * Falls back to rule-based calculation if ML is not available.
 */
export async function calculateEventRelevance(
  event: EventForRelevance,
  preferences: UserPreferences | null,
  userId?: string,
  eventId?: string,
  useML: boolean = true
): Promise<number> {
  // Try ML prediction if available and user/event IDs provided
  if (useML && userId && eventId) {
    try {
      const apiUrl = import.meta.env.DEV
        ? 'http://localhost:3001/api/predict-relevance'
        : '/api/predict-relevance';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, userId }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.relevanceScore !== undefined) {
          return data.relevanceScore;
        }
      }
    } catch (error) {
      // Fall through to rule-based calculation
      console.warn('[calculateEventRelevance] ML prediction failed, using fallback:', error);
    }
  }

  // Fallback: Rule-based calculation (original logic)
  return calculateEventRelevanceFallback(event, preferences);
}

/**
 * Fallback rule-based relevance calculation
 * (Original implementation kept for backward compatibility)
 */
export function calculateEventRelevanceFallback(
  event: EventForRelevance,
  preferences: UserPreferences | null
): number {
  if (!preferences) {
    return 0.5; // Neutral score if no preferences
  }

  let score = 0.5; // Base score
  let matches = 0;
  let totalChecks = 0;

  // Check event type match
  if (preferences.preferred_event_types && preferences.preferred_event_types.length > 0) {
    totalChecks++;
    if (preferences.preferred_event_types.includes(event.event_type)) {
      score += 0.2;
      matches++;
    }
  }

  // Check sector match
  if (preferences.preferred_sectors && preferences.preferred_sectors.length > 0) {
    totalChecks++;
    const eventSector = event.sector?.toLowerCase();
    const chainSectors = event.nucigen_causal_chains?.[0]?.affected_sectors?.map(s => s.toLowerCase()) || [];
    const preferredSectors = preferences.preferred_sectors.map(s => s.toLowerCase());
    
    if (eventSector && preferredSectors.includes(eventSector)) {
      score += 0.2;
      matches++;
    } else if (chainSectors.some(s => preferredSectors.includes(s))) {
      score += 0.15;
      matches++;
    }
  }

  // Check region match
  if (preferences.preferred_regions && preferences.preferred_regions.length > 0) {
    totalChecks++;
    const eventRegion = event.region?.toLowerCase();
    const chainRegions = event.nucigen_causal_chains?.[0]?.affected_regions?.map(r => r.toLowerCase()) || [];
    const preferredRegions = preferences.preferred_regions.map(r => r.toLowerCase());
    
    if (eventRegion && preferredRegions.includes(eventRegion)) {
      score += 0.2;
      matches++;
    } else if (chainRegions.some(r => preferredRegions.includes(r))) {
      score += 0.15;
      matches++;
    }
  }

  // Check time horizon match
  if (preferences.preferred_time_horizons && preferences.preferred_time_horizons.length > 0) {
    totalChecks++;
    const timeHorizon = event.nucigen_causal_chains?.[0]?.time_horizon;
    if (timeHorizon && preferences.preferred_time_horizons.includes(timeHorizon)) {
      score += 0.1;
      matches++;
    }
  }

  // Boost score based on match ratio
  if (totalChecks > 0) {
    const matchRatio = matches / totalChecks;
    score += matchRatio * 0.2;
  }

  // Apply impact and confidence filters
  if (preferences.min_impact_score !== undefined && event.impact_score !== null) {
    if (event.impact_score < preferences.min_impact_score) {
      score *= 0.5; // Reduce score if below threshold
    }
  }

  if (preferences.min_confidence_score !== undefined && event.confidence !== null) {
    if (event.confidence < preferences.min_confidence_score) {
      score *= 0.5; // Reduce score if below threshold
    }
  }

  // Normalize to 0-1 range
  return Math.min(1, Math.max(0, score));
}

/**
 * Sort events based on user preferences
 */
export async function sortEventsByPreferences<T extends EventForRelevance>(
  events: T[],
  preferences: UserPreferences | null,
  userId?: string,
  useML: boolean = true
): Promise<T[]> {
  if (!preferences) {
    return events; // Return as-is if no preferences
  }

  // Calculate relevance scores (with ML if available)
  const eventsWithScores = await Promise.all(
    events.map(async (event) => {
      // Extract event ID from event if available (assuming event has id field)
      const eventId = (event as any).id;
      const relevanceScore = await calculateEventRelevance(
        event,
        preferences,
        userId,
        eventId,
        useML
      );
      return { ...event, relevanceScore };
    })
  );

  switch (preferences.feed_priority) {
    case 'relevance':
      return eventsWithScores
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .map(({ relevanceScore, ...event }) => event as unknown as T);
    
    case 'recency':
      return events.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    
    case 'impact':
      return events.sort((a, b) => 
        (b.impact_score || 0) - (a.impact_score || 0)
      );
    
    case 'balanced':
    default:
      // Combine relevance, recency, and impact
      return eventsWithScores
        .map(event => {
          const recencyScore = Math.max(0, 1 - (Date.now() - new Date(event.created_at).getTime()) / (7 * 24 * 60 * 60 * 1000)); // Decay over 7 days
          const impactScore = event.impact_score || 0;
          const combinedScore = (
            event.relevanceScore * 0.5 +
            recencyScore * 0.3 +
            impactScore * 0.2
          );
          return { ...event, combinedScore };
        })
        .sort((a, b) => b.combinedScore - a.combinedScore)
        .map(({ relevanceScore, combinedScore, ...event }) => event as unknown as T);
  }
}

/**
 * Filter events based on user preferences thresholds
 */
export function filterEventsByPreferences<T extends EventForRelevance>(
  events: T[],
  preferences: UserPreferences | null
): T[] {
  if (!preferences) {
    return events; // Return all if no preferences
  }

  return events.filter(event => {
    // Filter by minimum impact score
    if (preferences.min_impact_score !== undefined && event.impact_score !== null) {
      if (event.impact_score < preferences.min_impact_score) {
        return false;
      }
    }

    // Filter by minimum confidence score
    if (preferences.min_confidence_score !== undefined && event.confidence !== null) {
      if (event.confidence < preferences.min_confidence_score) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Check if an event is highly relevant (score >= 0.7)
 */
export async function isEventHighlyRelevant(
  event: EventForRelevance,
  preferences: UserPreferences | null,
  userId?: string,
  eventId?: string,
  useML: boolean = true
): Promise<boolean> {
  const relevanceScore = await calculateEventRelevance(event, preferences, userId, eventId, useML);
  return relevanceScore >= 0.7;
}

