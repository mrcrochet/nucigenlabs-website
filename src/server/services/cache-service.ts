/**
 * Cache Service
 * 
 * Intelligent caching system for all APIs with different strategies per API type.
 * Reduces redundant API calls and costs while maintaining data freshness.
 */

import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing required environment variables: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export type ApiType = 'openai' | 'tavily' | 'firecrawl';
export type CacheStrategy = 'permanent' | 'ttl' | 'versioned';

export interface CacheOptions {
  apiType: ApiType;
  endpoint: string;
  ttlSeconds?: number; // Time-to-live in seconds (null = permanent)
  cacheVersion?: number; // For schema versioning
  forceRefresh?: boolean; // Force cache refresh even if entry exists
}

export interface CacheResult<T> {
  cached: boolean;
  data: T;
  metadata?: any;
}

/**
 * Generate cache key from API type, endpoint, and request parameters
 */
export function generateCacheKey(
  apiType: ApiType,
  endpoint: string,
  requestData: any
): string {
  const requestHash = createHash('sha256')
    .update(JSON.stringify(requestData))
    .digest('hex')
    .substring(0, 16);
  
  return `${apiType}:${endpoint}:${requestHash}`;
}

/**
 * Generate request hash for quick lookup
 */
export function generateRequestHash(requestData: any): string {
  return createHash('sha256')
    .update(JSON.stringify(requestData))
    .digest('hex');
}

/**
 * Get cache entry
 */
export async function getCacheEntry<T>(
  cacheKey: string,
  options: CacheOptions
): Promise<CacheResult<T> | null> {
  try {
    const { data, error } = await supabase
      .from('api_cache')
      .select('*')
      .eq('cache_key', cacheKey)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') {
      console.error('[Cache] Error fetching cache entry:', error);
      return null;
    }

    if (!data) {
      return null;
    }

    // Check expiration
    if (data.expires_at) {
      const expiresAt = new Date(data.expires_at);
      if (expiresAt < new Date()) {
        // Expired, delete and return null
        await supabase
          .from('api_cache')
          .delete()
          .eq('cache_key', cacheKey);
        return null;
      }
    }

    // Check version
    if (options.cacheVersion && data.cache_version !== options.cacheVersion) {
      // Version mismatch, invalidate cache
      await supabase
        .from('api_cache')
        .delete()
        .eq('cache_key', cacheKey);
      return null;
    }

    // Increment hit count
    await supabase.rpc('increment_api_cache_hit', {
      cache_key_param: cacheKey,
    });

    return {
      cached: true,
      data: data.response_data as T,
      metadata: data.response_metadata,
    };
  } catch (error: any) {
    console.error('[Cache] Error getting cache entry:', error);
    return null;
  }
}

/**
 * Set cache entry
 */
export async function setCacheEntry<T>(
  cacheKey: string,
  data: T,
  metadata: any,
  options: CacheOptions
): Promise<void> {
  try {
    const requestHash = generateRequestHash({ apiType: options.apiType, endpoint: options.endpoint, data });
    
    let expiresAt: Date | null = null;
    if (options.ttlSeconds) {
      expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + options.ttlSeconds);
    }

    const cacheEntry = {
      cache_key: cacheKey,
      api_type: options.apiType,
      api_endpoint: options.endpoint,
      request_hash: requestHash,
      response_data: data as any,
      response_metadata: metadata || null,
      ttl_seconds: options.ttlSeconds || null,
      expires_at: expiresAt?.toISOString() || null,
      cache_version: options.cacheVersion || 1,
    };

    const { error } = await supabase
      .from('api_cache')
      .upsert(cacheEntry, {
        onConflict: 'cache_key',
      });

    if (error) {
      console.error('[Cache] Error setting cache entry:', error);
    }
  } catch (error: any) {
    console.error('[Cache] Error setting cache entry:', error);
  }
}

/**
 * Cache wrapper with automatic key generation and strategy selection
 */
export async function withCache<T>(
  options: CacheOptions,
  requestData: any,
  fetchFunction: () => Promise<{ data: T; metadata?: any }>
): Promise<CacheResult<T>> {
  // Generate cache key
  const cacheKey = generateCacheKey(options.apiType, options.endpoint, requestData);

  // Check cache first (unless force refresh)
  if (!options.forceRefresh) {
    const cached = await getCacheEntry<T>(cacheKey, options);
    if (cached) {
      return cached;
    }
  }

  // Fetch fresh data
  const { data, metadata } = await fetchFunction();

  // Determine TTL based on API type and strategy
  // Use adaptive cache for intelligent TTL prediction
  let ttlSeconds = options.ttlSeconds;
  if (!ttlSeconds) {
    try {
      const { getAdaptiveTTL } = await import('../optimization/adaptive-cache.js');
      const adaptiveTTL = await getAdaptiveTTL(
        options.apiType,
        cacheKey,
        requestData.context // Pass context if available
      );
      ttlSeconds = adaptiveTTL ? Math.floor(adaptiveTTL / 1000) : null; // Convert ms to seconds
    } catch (error: any) {
      console.warn('[Cache] Adaptive TTL failed, using default:', error.message);
      // Fallback to default TTLs
      switch (options.apiType) {
        case 'openai':
          ttlSeconds = null; // Permanent
          break;
        case 'tavily':
          ttlSeconds = 7 * 24 * 60 * 60; // 7 days
          break;
        case 'firecrawl':
          ttlSeconds = null; // Permanent
          break;
      }
    }
  }

  // Store in cache
  await setCacheEntry(cacheKey, data, metadata, {
    ...options,
    ttlSeconds,
  });

  return {
    cached: false,
    data,
    metadata,
  };
}

/**
 * Invalidate cache entries matching criteria
 */
export async function invalidateCache(
  apiType?: ApiType,
  endpoint?: string,
  requestHash?: string
): Promise<number> {
  try {
    let query = supabase.from('api_cache').delete();

    if (apiType) {
      query = query.eq('api_type', apiType);
    }
    if (endpoint) {
      query = query.eq('api_endpoint', endpoint);
    }
    if (requestHash) {
      query = query.eq('request_hash', requestHash);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Cache] Error invalidating cache:', error);
      return 0;
    }

    return data?.length || 0;
  } catch (error: any) {
    console.error('[Cache] Error invalidating cache:', error);
    return 0;
  }
}

/**
 * Clean expired cache entries
 */
export async function cleanupExpiredCache(): Promise<number> {
  try {
    const { data, error } = await supabase.rpc('cleanup_expired_api_cache');

    if (error) {
      console.error('[Cache] Error cleaning expired cache:', error);
      return 0;
    }

    return data || 0;
  } catch (error: any) {
    console.error('[Cache] Error cleaning expired cache:', error);
    return 0;
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(apiType?: ApiType): Promise<{
  totalEntries: number;
  totalHits: number;
  hitRate: number;
  avgHitsPerEntry: number;
}> {
  try {
    let query = supabase
      .from('api_cache')
      .select('hit_count');

    if (apiType) {
      query = query.eq('api_type', apiType);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[Cache] Error getting cache stats:', error);
      return {
        totalEntries: 0,
        totalHits: 0,
        hitRate: 0,
        avgHitsPerEntry: 0,
      };
    }

    const entries = data || [];
    const totalEntries = entries.length;
    const totalHits = entries.reduce((sum, entry) => sum + (entry.hit_count || 0), 0);
    const avgHitsPerEntry = totalEntries > 0 ? totalHits / totalEntries : 0;
    
    // Hit rate is approximate (we don't track misses separately here)
    const hitRate = totalHits > 0 ? Math.min(1, totalHits / (totalHits + totalEntries)) : 0;

    return {
      totalEntries,
      totalHits,
      hitRate,
      avgHitsPerEntry,
    };
  } catch (error: any) {
    console.error('[Cache] Error getting cache stats:', error);
    return {
      totalEntries: 0,
      totalHits: 0,
      hitRate: 0,
      avgHitsPerEntry: 0,
    };
  }
}
