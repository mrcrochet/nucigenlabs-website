/**
 * Adaptive Cache
 * 
 * ML-based adaptive caching that predicts cache reuse probability
 * and adjusts TTL dynamically based on access patterns.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { setCacheEntry, CacheOptions } from '../services/cache-service';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('[AdaptiveCache] Supabase not configured.');
}

const supabase = supabaseUrl && supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

export interface CacheAccessPattern {
  cacheKey: string;
  accessCount: number;
  lastAccess: Date;
  firstAccess: Date;
  accessFrequency: number; // Accesses per hour
  timeSinceFirstAccess: number; // Hours
}

export interface CachePrediction {
  cacheKey: string;
  reuseProbability: number; // 0-1
  recommendedTTL: number; // Milliseconds
  confidence: number; // 0-1
  reasoning?: string;
}

// Default TTLs by API type
const DEFAULT_TTLS: Record<string, number> = {
  openai: 24 * 60 * 60 * 1000, // 24 hours
  tavily: 7 * 24 * 60 * 60 * 1000, // 7 days
  firecrawl: 30 * 24 * 60 * 60 * 1000, // 30 days
  default: 1 * 60 * 60 * 1000, // 1 hour
};

/**
 * Get adaptive TTL for a cache entry
 */
export async function getAdaptiveTTL(
  apiType: string,
  cacheKey: string,
  context?: {
    eventId?: string;
    userId?: string;
    relevanceScore?: number;
  }
): Promise<number> {
  // Get default TTL
  const defaultTTL = DEFAULT_TTLS[apiType] || DEFAULT_TTLS.default;

  // Try to predict reuse probability
  const prediction = await predictCacheReuse(cacheKey, context);

  if (prediction) {
    // Adjust TTL based on reuse probability
    // Higher probability = longer TTL
    const adjustedTTL = defaultTTL * (0.5 + prediction.reuseProbability * 0.5);
    return Math.min(adjustedTTL, defaultTTL * 2); // Cap at 2x default
  }

  return defaultTTL;
}

/**
 * Predict cache reuse probability
 */
async function predictCacheReuse(
  cacheKey: string,
  context?: {
    eventId?: string;
    userId?: string;
    relevanceScore?: number;
  }
): Promise<CachePrediction | null> {
  if (!supabase) {
    return null;
  }

  try {
    // Get access pattern from cache metadata
    const accessPattern = await getCacheAccessPattern(cacheKey);

    if (!accessPattern) {
      // No history, use default prediction
      return {
        cacheKey,
        reuseProbability: 0.5,
        recommendedTTL: DEFAULT_TTLS.default,
        confidence: 0.3,
        reasoning: 'No access history available',
      };
    }

    // Calculate reuse probability based on access pattern
    let reuseProbability = 0.5; // Base probability

    // Higher frequency = higher probability
    if (accessPattern.accessFrequency > 1) {
      reuseProbability += Math.min(0.3, accessPattern.accessFrequency * 0.1);
    }

    // Recent access = higher probability
    const hoursSinceLastAccess = (Date.now() - accessPattern.lastAccess.getTime()) / (1000 * 60 * 60);
    if (hoursSinceLastAccess < 24) {
      reuseProbability += 0.2;
    } else if (hoursSinceLastAccess < 168) { // 7 days
      reuseProbability += 0.1;
    }

    // Use relevance score if available (for event-related caches)
    if (context?.relevanceScore !== undefined) {
      reuseProbability = reuseProbability * 0.7 + context.relevanceScore * 0.3;
    }

    // Normalize
    reuseProbability = Math.min(1.0, Math.max(0.0, reuseProbability));

    // Calculate recommended TTL
    const baseTTL = DEFAULT_TTLS.default;
    const recommendedTTL = baseTTL * (0.5 + reuseProbability * 1.5);

    return {
      cacheKey,
      reuseProbability,
      recommendedTTL,
      confidence: accessPattern.accessCount > 5 ? 0.8 : 0.5,
      reasoning: `Based on ${accessPattern.accessCount} accesses, ${accessPattern.accessFrequency.toFixed(2)}/hour frequency`,
    };
  } catch (error: any) {
    console.error('[AdaptiveCache] Error predicting reuse:', error.message);
    return null;
  }
}

/**
 * Get cache access pattern
 */
async function getCacheAccessPattern(cacheKey: string): Promise<CacheAccessPattern | null> {
  if (!supabase) {
    return null;
  }

  try {
    // Query cache table for access metadata
    // Note: This would require adding access tracking to cache-service
    // For now, return null (would need to implement access logging)
    return null;
  } catch (error: any) {
    console.error('[AdaptiveCache] Error getting access pattern:', error.message);
    return null;
  }
}

/**
 * Record cache access for learning
 */
export async function recordCacheAccess(
  apiType: string,
  cacheKey: string,
  wasHit: boolean
): Promise<boolean> {
  if (!supabase) {
    return false;
  }

  try {
    // Store access metadata for future predictions
    // This would be used to train the reuse prediction model
    const { error } = await supabase
      .from('ml_features')
      .upsert({
        entity_type: 'query',
        entity_id: `cache_access:${cacheKey}`,
        all_features: {
          api_type: apiType,
          cache_key: cacheKey,
          was_hit: wasHit,
          accessed_at: new Date().toISOString(),
        },
      }, {
        onConflict: 'entity_type,entity_id',
      });

    if (error) {
      console.error('[AdaptiveCache] Error recording access:', error.message);
      return false;
    }

    return true;
  } catch (error: any) {
    console.error('[AdaptiveCache] Error recording access:', error.message);
    return false;
  }
}

/**
 * Pre-warm cache for high-probability items
 */
export async function prewarmCache(
  apiType: string,
  items: Array<{ cacheKey: string; data: any; context?: any }>
): Promise<number> {
  let prewarmed = 0;

  for (const item of items) {
    const prediction = await predictCacheReuse(item.cacheKey, item.context);
    
    if (prediction && prediction.reuseProbability > 0.7) {
      const ttl = await getAdaptiveTTL(apiType, item.cacheKey, item.context);
      const ttlSeconds = Math.floor(ttl / 1000); // Convert ms to seconds
      
      const cacheOptions: CacheOptions = {
        apiType: apiType as 'openai' | 'tavily' | 'firecrawl',
        endpoint: 'prewarm',
        ttlSeconds: ttlSeconds || undefined,
      };
      
      await setCacheEntry(item.cacheKey, item.data, null, cacheOptions);
      prewarmed++;
    }
  }

  return prewarmed;
}
