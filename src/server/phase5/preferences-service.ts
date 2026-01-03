/**
 * PHASE 5: User Preferences Service
 * 
 * Manages user preferences for feed personalization
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

/**
 * Get user preferences
 */
export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to fetch user preferences: ${error.message}`);
  }

  return data;
}

/**
 * Update user preferences
 */
export async function updateUserPreferences(
  userId: string,
  preferences: Partial<UserPreferences>
): Promise<UserPreferences> {
  const { data, error } = await supabase
    .from('user_preferences')
    .upsert({
      user_id: userId,
      ...preferences,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update user preferences: ${error.message}`);
  }

  return data;
}

/**
 * Calculate relevance score for an event based on user preferences
 */
export function calculateEventRelevance(
  event: {
    event_type: string;
    sector: string | null;
    region: string | null;
    impact_score: number | null;
    confidence: number | null;
    nucigen_causal_chains?: Array<{
      affected_sectors: string[];
      affected_regions: string[];
      time_horizon: string;
    }>;
  },
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
export function sortEventsByPreferences(
  events: any[],
  preferences: UserPreferences | null
): any[] {
  if (!preferences) {
    return events; // Return as-is if no preferences
  }

  const eventsWithScores = events.map(event => ({
    ...event,
    relevanceScore: calculateEventRelevance(event, preferences),
  }));

  switch (preferences.feed_priority) {
    case 'relevance':
      return eventsWithScores
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .map(({ relevanceScore, ...event }) => event);
    
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
          const recencyScore = 1 - (Date.now() - new Date(event.created_at).getTime()) / (7 * 24 * 60 * 60 * 1000); // Decay over 7 days
          const impactScore = event.impact_score || 0;
          const combinedScore = (
            event.relevanceScore * 0.5 +
            recencyScore * 0.3 +
            impactScore * 0.2
          );
          return { ...event, combinedScore };
        })
        .sort((a, b) => b.combinedScore - a.combinedScore)
        .map(({ relevanceScore, combinedScore, ...event }) => event);
  }
}

