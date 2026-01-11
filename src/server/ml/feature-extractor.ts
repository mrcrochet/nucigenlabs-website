/**
 * Feature Extractor
 * 
 * Extracts ML features from events, users, and historical data.
 * Features are stored in the feature store for fast model training and prediction.
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
  console.warn('[FeatureExtractor] Supabase not configured. Feature extraction will be limited.');
}

const supabase = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

export interface EventFeatures {
  // Event identification
  event_type: string;
  event_sector: string | null;
  event_region: string | null;
  event_country: string | null;
  
  // Event scores
  event_impact_score: number | null;
  event_confidence: number | null;
  
  // Event metadata
  event_actors_count: number;
  event_has_causal_chain: boolean;
  event_days_since_publication: number;
  event_source_quality_score: number | null;
  
  // Causal chain features
  has_first_order_effect: boolean;
  has_second_order_effect: boolean;
  affected_sectors_count: number;
  affected_regions_count: number;
  time_horizon_hours: number | null; // Converted to hours for numerical feature
}

export interface UserFeatures {
  // User profile
  user_sector: string | null;
  user_professional_role: string | null;
  user_company: string | null;
  
  // User preferences
  user_preferred_sectors_count: number;
  user_preferred_regions_count: number;
  user_preferred_event_types_count: number;
  user_min_impact_score: number | null;
  user_min_confidence_score: number | null;
  
  // User engagement
  user_account_age_days: number;
  user_engagement_score: number; // Calculated from historical actions
  user_total_clicks: number;
  user_total_reads: number;
  user_total_shares: number;
}

export interface EventUserPairFeatures {
  // Match features
  sector_match: boolean;
  region_match: boolean;
  event_type_match: boolean;
  country_match: boolean;
  
  // Threshold matches
  impact_score_above_threshold: boolean;
  confidence_above_threshold: boolean;
  
  // Historical interaction features
  historical_interaction_count: number;
  historical_click_rate: number;
  historical_read_rate: number;
  historical_share_rate: number;
  historical_avg_time_spent: number;
  
  // Similarity features
  similarity_to_clicked_events: number; // Average similarity to events user clicked
  similarity_to_shared_events: number; // Average similarity to events user shared
}

export interface QueryFeatures {
  query_length: number;
  query_keyword_count: number;
  query_has_sector: boolean;
  query_has_region: boolean;
  query_has_temporal_indicator: boolean;
  query_has_event_type: boolean;
}

/**
 * Extract features from an event
 */
export async function extractEventFeatures(eventId: string): Promise<EventFeatures | null> {
  if (!supabase) {
    console.error('[FeatureExtractor] Supabase not configured');
    return null;
  }

  try {
    // Fetch event with related data
    const { data: event, error } = await supabase
      .from('nucigen_events')
      .select(`
        *,
        source_event:events(*),
        causal_chains:nucigen_causal_chains(*)
      `)
      .eq('id', eventId)
      .maybeSingle();

    if (error || !event) {
      console.error(`[FeatureExtractor] Error fetching event ${eventId}:`, error?.message);
      return null;
    }

    const sourceEvent = event.source_event;
    const causalChains = event.causal_chains || [];
    const firstChain = causalChains[0];

    // Calculate days since publication
    const publishedAt = sourceEvent?.published_at ? new Date(sourceEvent.published_at) : new Date();
    const daysSincePublication = Math.floor((Date.now() - publishedAt.getTime()) / (1000 * 60 * 60 * 24));

    // Convert time horizon to hours
    let timeHorizonHours: number | null = null;
    if (firstChain?.time_horizon) {
      const timeHorizon = firstChain.time_horizon.toLowerCase();
      if (timeHorizon.includes('hour')) {
        timeHorizonHours = 12; // Approximate
      } else if (timeHorizon.includes('day')) {
        timeHorizonHours = 24;
      } else if (timeHorizon.includes('week')) {
        timeHorizonHours = 168;
      } else if (timeHorizon.includes('month')) {
        timeHorizonHours = 720;
      }
    }

    const features: EventFeatures = {
      event_type: event.event_type || '',
      event_sector: event.sector || null,
      event_region: event.region || null,
      event_country: event.country || null,
      event_impact_score: event.impact_score ? parseFloat(event.impact_score.toString()) : null,
      event_confidence: event.confidence ? parseFloat(event.confidence.toString()) : null,
      event_actors_count: event.actors?.length || 0,
      event_has_causal_chain: causalChains.length > 0,
      event_days_since_publication: daysSincePublication,
      event_source_quality_score: null, // Can be calculated from source metadata
      has_first_order_effect: !!event.first_order_effect,
      has_second_order_effect: !!event.second_order_effect,
      affected_sectors_count: firstChain?.affected_sectors?.length || 0,
      affected_regions_count: firstChain?.affected_regions?.length || 0,
      time_horizon_hours: timeHorizonHours,
    };

    return features;
  } catch (error: any) {
    console.error(`[FeatureExtractor] Error extracting event features for ${eventId}:`, error.message);
    return null;
  }
}

/**
 * Extract features from a user
 */
export async function extractUserFeatures(userId: string): Promise<UserFeatures | null> {
  if (!supabase) {
    console.error('[FeatureExtractor] Supabase not configured');
    return null;
  }

  try {
    // Fetch user profile and preferences
    const [profileResult, prefsResult, actionsResult] = await Promise.all([
      supabase
        .from('users')
        .select('sector, professional_role, company, created_at')
        .eq('id', userId)
        .maybeSingle(),
      supabase
        .from('user_preferences')
        .select('preferred_sectors, preferred_regions, preferred_event_types, min_impact_score, min_confidence_score')
        .eq('user_id', userId)
        .maybeSingle(),
      supabase
        .from('user_actions')
        .select('action_type, time_spent_seconds')
        .eq('user_id', userId),
    ]);

    const profile = profileResult.data;
    const prefs = prefsResult.data;
    const actions = actionsResult.data || [];

    if (!profile) {
      console.warn(`[FeatureExtractor] User ${userId} not found`);
      return null;
    }

    // Calculate account age
    const createdAt = profile.created_at ? new Date(profile.created_at) : new Date();
    const accountAgeDays = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));

    // Calculate engagement metrics
    const clicks = actions.filter(a => a.action_type === 'click').length;
    const reads = actions.filter(a => a.action_type === 'read').length;
    const shares = actions.filter(a => a.action_type === 'share').length;
    const totalTimeSpent = actions
      .filter(a => a.time_spent_seconds)
      .reduce((sum, a) => sum + (a.time_spent_seconds || 0), 0);

    // Calculate engagement score (weighted)
    const engagementScore = Math.min(1.0, (
      clicks * 1.0 +
      reads * 2.0 +
      shares * 3.0 +
      (totalTimeSpent > 0 ? 1.0 : 0)
    ) / 10.0);

    const features: UserFeatures = {
      user_sector: profile.sector || null,
      user_professional_role: profile.professional_role || null,
      user_company: profile.company || null,
      user_preferred_sectors_count: prefs?.preferred_sectors?.length || 0,
      user_preferred_regions_count: prefs?.preferred_regions?.length || 0,
      user_preferred_event_types_count: prefs?.preferred_event_types?.length || 0,
      user_min_impact_score: prefs?.min_impact_score ? parseFloat(prefs.min_impact_score.toString()) : null,
      user_min_confidence_score: prefs?.min_confidence_score ? parseFloat(prefs.min_confidence_score.toString()) : null,
      user_account_age_days: accountAgeDays,
      user_engagement_score: engagementScore,
      user_total_clicks: clicks,
      user_total_reads: reads,
      user_total_shares: shares,
    };

    return features;
  } catch (error: any) {
    console.error(`[FeatureExtractor] Error extracting user features for ${userId}:`, error.message);
    return null;
  }
}

/**
 * Extract features for an event-user pair (for relevance prediction)
 */
export async function extractEventUserPairFeatures(
  eventId: string,
  userId: string
): Promise<EventUserPairFeatures | null> {
  if (!supabase) {
    console.error('[FeatureExtractor] Supabase not configured');
    return null;
  }

  try {
    const [eventFeatures, userFeatures, historicalActions] = await Promise.all([
      extractEventFeatures(eventId),
      extractUserFeatures(userId),
      supabase
        .from('user_actions')
        .select('event_id, action_type, time_spent_seconds')
        .eq('user_id', userId)
        .not('event_id', 'is', null),
    ]);

    if (!eventFeatures || !userFeatures) {
      return null;
    }

    // Calculate match features
    const sectorMatch = eventFeatures.event_sector && userFeatures.user_sector
      ? eventFeatures.event_sector.toLowerCase() === userFeatures.user_sector.toLowerCase()
      : false;

    const regionMatch = eventFeatures.event_region && userFeatures.user_preferred_regions_count > 0
      ? true // Simplified - would need to check actual region match
      : false;

    // Get user preferences for event type match
    const { data: prefs } = await supabase
      .from('user_preferences')
      .select('preferred_event_types')
      .eq('user_id', userId)
      .maybeSingle();

    const eventTypeMatch = prefs?.preferred_event_types?.includes(eventFeatures.event_type) || false;

    // Threshold matches
    const impactScoreAboveThreshold = userFeatures.user_min_impact_score === null ||
      (eventFeatures.event_impact_score !== null && eventFeatures.event_impact_score >= userFeatures.user_min_impact_score);

    const confidenceAboveThreshold = userFeatures.user_min_confidence_score === null ||
      (eventFeatures.event_confidence !== null && eventFeatures.event_confidence >= userFeatures.user_min_confidence_score);

    // Historical interaction features
    const actions = historicalActions.data || [];
    const eventActions = actions.filter(a => a.event_id === eventId);
    const historicalInteractionCount = eventActions.length;

    const allClicks = actions.filter(a => a.action_type === 'click');
    const allReads = actions.filter(a => a.action_type === 'read');
    const allShares = actions.filter(a => a.action_type === 'share');

    const historicalClickRate = allClicks.length > 0 ? allClicks.length / actions.length : 0;
    const historicalReadRate = allReads.length > 0 ? allReads.length / actions.length : 0;
    const historicalShareRate = allShares.length > 0 ? allShares.length / actions.length : 0;

    const avgTimeSpent = allReads.length > 0
      ? allReads.reduce((sum, a) => sum + (a.time_spent_seconds || 0), 0) / allReads.length
      : 0;

    // Similarity features (simplified - would need actual similarity calculation)
    const similarityToClickedEvents = 0.5; // Placeholder
    const similarityToSharedEvents = 0.5; // Placeholder

    const features: EventUserPairFeatures = {
      sector_match: sectorMatch,
      region_match: regionMatch,
      event_type_match: eventTypeMatch,
      country_match: false, // Would need country matching logic
      impact_score_above_threshold: impactScoreAboveThreshold,
      confidence_above_threshold: confidenceAboveThreshold,
      historical_interaction_count: historicalInteractionCount,
      historical_click_rate: historicalClickRate,
      historical_read_rate: historicalReadRate,
      historical_share_rate: historicalShareRate,
      historical_avg_time_spent: avgTimeSpent,
      similarity_to_clicked_events: similarityToClickedEvents,
      similarity_to_shared_events: similarityToSharedEvents,
    };

    return features;
  } catch (error: any) {
    console.error(`[FeatureExtractor] Error extracting event-user pair features:`, error.message);
    return null;
  }
}

/**
 * Extract features from a query (for query optimization)
 */
export function extractQueryFeatures(query: string): QueryFeatures {
  const queryLower = query.toLowerCase();
  
  // Common sectors
  const sectors = ['energy', 'technology', 'finance', 'healthcare', 'manufacturing', 'agriculture', 'mining'];
  const hasSector = sectors.some(sector => queryLower.includes(sector));

  // Common regions
  const regions = ['europe', 'asia', 'america', 'africa', 'middle east', 'china', 'usa', 'russia'];
  const hasRegion = regions.some(region => queryLower.includes(region));

  // Temporal indicators
  const temporalIndicators = ['recent', 'latest', 'new', 'today', 'yesterday', 'week', 'month', '2025', '2024'];
  const hasTemporalIndicator = temporalIndicators.some(indicator => queryLower.includes(indicator));

  // Event types
  const eventTypes = ['geopolitical', 'regulatory', 'industrial', 'market', 'supply chain', 'security'];
  const hasEventType = eventTypes.some(type => queryLower.includes(type));

  return {
    query_length: query.length,
    query_keyword_count: query.split(/\s+/).length,
    query_has_sector: hasSector,
    query_has_region: hasRegion,
    query_has_temporal_indicator: hasTemporalIndicator,
    query_has_event_type: hasEventType,
  };
}

/**
 * Save features to feature store
 */
export async function saveFeaturesToStore(
  entityType: 'event' | 'user' | 'event_user_pair' | 'query',
  entityId: string,
  features: EventFeatures | UserFeatures | EventUserPairFeatures | QueryFeatures,
  featureSetVersion: number = 1
): Promise<boolean> {
  if (!supabase) {
    console.error('[FeatureExtractor] Supabase not configured');
    return false;
  }

  try {
    // Convert features to JSONB
    const allFeatures = features as any;

    const { error } = await supabase
      .from('ml_features')
      .upsert({
        entity_type: entityType,
        entity_id: entityId,
        feature_set_version: featureSetVersion,
        ...allFeatures,
        all_features: allFeatures,
      }, {
        onConflict: 'entity_type,entity_id',
      });

    if (error) {
      console.error(`[FeatureExtractor] Error saving features:`, error.message);
      return false;
    }

    return true;
  } catch (error: any) {
    console.error(`[FeatureExtractor] Error saving features:`, error.message);
    return false;
  }
}

/**
 * Get features from feature store
 */
export async function getFeaturesFromStore(
  entityType: 'event' | 'user' | 'event_user_pair' | 'query',
  entityId: string,
  featureSetVersion?: number
): Promise<any | null> {
  if (!supabase) {
    return null;
  }

  try {
    let query = supabase
      .from('ml_features')
      .select('all_features, extracted_at')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId);

    if (featureSetVersion) {
      query = query.eq('feature_set_version', featureSetVersion);
    }

    const { data, error } = await query
      .order('extracted_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return null;
    }

    return data.all_features;
  } catch (error: any) {
    console.error(`[FeatureExtractor] Error getting features:`, error.message);
    return null;
  }
}
