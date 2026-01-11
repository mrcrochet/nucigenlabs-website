/**
 * Tavily Unified Service
 * 
 * Centralized service for all Tavily API calls with:
 * - Query deduplication (same query = cache)
 * - Request pooling (batch similar queries)
 * - Priority management (personalized > context > news)
 * - Intelligent caching
 */

import { tavily } from '@tavily/core';
import { withCache, CacheOptions } from './cache-service';
import { logApiCall } from './api-metrics';
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../../.env') });

const tavilyApiKey = process.env.TAVILY_API_KEY;

if (!tavilyApiKey) {
  throw new Error('TAVILY_API_KEY is required');
}

const tavilyClient = tavily({ apiKey: tavilyApiKey });

export type TavilyQueryType = 'news' | 'personalized' | 'context' | 'live';
export type TavilyPriority = 'high' | 'medium' | 'low';

export interface TavilySearchOptions {
  searchDepth?: 'basic' | 'advanced';
  maxResults?: number;
  includeAnswer?: boolean;
  includeRawContent?: boolean;
  includeImages?: boolean;
  days?: number; // Filter by days (e.g., 7 for last 7 days)
  minScore?: number; // Minimum relevance score (0-1)
}

export interface TavilyArticle {
  title: string;
  url: string;
  content?: string;
  publishedDate?: string;
  score?: number;
  author?: string;
}

export interface TavilySearchResult {
  articles: TavilyArticle[];
  answer?: string; // AI-generated answer if includeAnswer=true
  query: string;
  cached: boolean;
}

// Query pool for deduplication
const queryPool = new Map<string, {
  result: TavilySearchResult;
  timestamp: number;
  priority: TavilyPriority;
}>();

// Cache TTL based on query type
const CACHE_TTL: Record<TavilyQueryType, number> = {
  news: 7 * 24 * 60 * 60, // 7 days (news freshness matters)
  personalized: 24 * 60 * 60, // 1 day (user-specific)
  context: 30 * 24 * 60 * 60, // 30 days (historical context doesn't change much)
  live: 60 * 60, // 1 hour (live search needs freshness)
};

/**
 * Normalize query for deduplication
 */
function normalizeQuery(query: string): string {
  return query
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, ''); // Remove special characters
}

/**
 * Get priority for query type
 */
function getPriority(queryType: TavilyQueryType): TavilyPriority {
  switch (queryType) {
    case 'personalized':
      return 'high';
    case 'live':
      return 'high';
    case 'context':
      return 'medium';
    case 'news':
      return 'low';
    default:
      return 'medium';
  }
}

/**
 * Search Tavily with caching and deduplication
 */
export async function searchTavily(
  query: string,
  queryType: TavilyQueryType = 'news',
  options: TavilySearchOptions = {}
): Promise<TavilySearchResult> {
  const startTime = Date.now();
  const normalizedQuery = normalizeQuery(query);
  const priority = getPriority(queryType);

  // Check in-memory query pool first (for same-session deduplication)
  const poolKey = `${normalizedQuery}:${queryType}`;
  const pooledResult = queryPool.get(poolKey);
  
  if (pooledResult && Date.now() - pooledResult.timestamp < CACHE_TTL[queryType] * 1000) {
    // Return pooled result (very fast, no API call)
    const latencyMs = Date.now() - startTime;
    
    await logApiCall({
      apiType: 'tavily',
      apiEndpoint: 'search',
      featureName: queryType,
      requestHash: normalizedQuery.substring(0, 16),
      cacheKey: poolKey,
      wasCached: true,
      success: true,
      latencyMs,
      wasRateLimited: false,
      retryCount: 0,
    });

    return {
      ...pooledResult.result,
      cached: true,
    };
  }

  // Use cache service for persistent caching
  const cacheOptions: CacheOptions = {
    apiType: 'tavily',
    endpoint: 'search',
    ttlSeconds: CACHE_TTL[queryType],
  };

  const defaultOptions: TavilySearchOptions = {
    searchDepth: 'advanced',
    maxResults: options.maxResults || 50,
    includeAnswer: options.includeAnswer || false,
    includeRawContent: options.includeRawContent ?? true,
    includeImages: false,
  };

  const searchOptions = { ...defaultOptions, ...options };

  try {
    const cacheResult = await withCache(
      cacheOptions,
      { query: normalizedQuery, queryType, options: searchOptions },
      async () => {
        // Actual Tavily API call
        const response = await tavilyClient.search(query, {
          searchDepth: searchOptions.searchDepth || 'advanced',
          maxResults: searchOptions.maxResults || 50,
          includeAnswer: searchOptions.includeAnswer || false,
          includeRawContent: searchOptions.includeRawContent ?? true,
          includeImages: searchOptions.includeImages || false,
        });

        // Filter and process results
        let articles: TavilyArticle[] = (response.results || []).map((result: any) => ({
          title: result.title || '',
          url: result.url || '',
          content: result.content || result.rawContent || '',
          publishedDate: result.publishedDate || new Date().toISOString(),
          score: result.score || 0.5,
          author: result.author || null,
        }));

        // Filter by relevance score
        if (searchOptions.minScore !== undefined) {
          articles = articles.filter(a => (a.score || 0) >= searchOptions.minScore!);
        } else {
          articles = articles.filter(a => (a.score || 0) >= 0.5); // Default filter
        }

        // Filter by date if specified
        if (searchOptions.days) {
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - searchOptions.days);
          
          articles = articles.filter(a => {
            if (!a.publishedDate) return true; // Include if no date
            const pubDate = new Date(a.publishedDate);
            return pubDate >= cutoffDate;
          });
        } else if (queryType === 'news' || queryType === 'live') {
          // Default: last 7 days for news and live
          const cutoffDate = new Date();
          cutoffDate.setDate(cutoffDate.getDate() - 7);
          
          articles = articles.filter(a => {
            if (!a.publishedDate) return true;
            const pubDate = new Date(a.publishedDate);
            return pubDate >= cutoffDate;
          });
        }

        // Filter valid articles
        articles = articles.filter(a => a.title && a.url);

        return {
          data: {
            articles,
            answer: response.answer,
            query: normalizedQuery,
            cached: false,
          },
          metadata: {
            totalResults: response.results?.length || 0,
            filteredResults: articles.length,
            queryType,
            options: searchOptions,
          },
        };
      }
    );

    const latencyMs = Date.now() - startTime;

    // Store in query pool for fast access
    queryPool.set(poolKey, {
      result: cacheResult.data,
      timestamp: Date.now(),
      priority,
    });

    // Clean old entries from pool (keep last 1000)
    if (queryPool.size > 1000) {
      const entries = Array.from(queryPool.entries())
        .sort((a, b) => b[1].timestamp - a[1].timestamp)
        .slice(0, 1000);
      queryPool.clear();
      entries.forEach(([key, value]) => queryPool.set(key, value));
    }

    // Log API call
    await logApiCall({
      apiType: 'tavily',
      apiEndpoint: 'search',
      featureName: queryType,
      requestHash: normalizedQuery.substring(0, 16),
      cacheKey: poolKey,
      wasCached: cacheResult.cached,
      success: true,
      latencyMs,
      wasRateLimited: false,
      retryCount: 0,
    });

    return cacheResult.data;
  } catch (error: any) {
    const latencyMs = Date.now() - startTime;
    
    await logApiCall({
      apiType: 'tavily',
      apiEndpoint: 'search',
      featureName: queryType,
      requestHash: normalizedQuery.substring(0, 16),
      wasCached: false,
      success: false,
      latencyMs,
      errorMessage: error.message,
      errorCode: error.code,
      wasRateLimited: error.message?.includes('rate limit') || false,
      retryCount: 0,
    });

    throw error;
  }
}

/**
 * Batch search multiple queries with deduplication
 */
export async function batchSearchTavily(
  queries: Array<{ query: string; type: TavilyQueryType; options?: TavilySearchOptions }>,
  options: { parallelize?: boolean } = {}
): Promise<TavilySearchResult[]> {
  const { parallelize = true } = options;

  // Deduplicate queries
  const uniqueQueries = new Map<string, typeof queries[0]>();
  for (const q of queries) {
    const key = `${normalizeQuery(q.query)}:${q.type}`;
    if (!uniqueQueries.has(key)) {
      uniqueQueries.set(key, q);
    }
  }

  const queriesToProcess = Array.from(uniqueQueries.values());

  if (parallelize) {
    // Process in parallel (limited by api-optimizer)
    const { maximizeApiUsage } = await import('../utils/api-optimizer');
    
    const { results, errors } = await maximizeApiUsage(
      queriesToProcess,
      async (q) => {
        return await searchTavily(q.query, q.type, q.options);
      },
      'tavily'
    );

    if (errors.length > 0) {
      console.warn(`[TavilyUnified] ${errors.length} queries failed`);
    }

    return results;
  } else {
    // Sequential processing
    const results: TavilySearchResult[] = [];
    for (const q of queriesToProcess) {
      try {
        const result = await searchTavily(q.query, q.type, q.options);
        results.push(result);
      } catch (error: any) {
        console.error(`[TavilyUnified] Error searching "${q.query}":`, error);
        // Continue with other queries
      }
    }
    return results;
  }
}

/**
 * Search for news (generic queries)
 */
export async function searchNews(
  query: string,
  options?: TavilySearchOptions
): Promise<TavilySearchResult> {
  return await searchTavily(query, 'news', {
    days: 7,
    minScore: 0.5,
    ...options,
  });
}

/**
 * Search personalized (user-specific queries)
 */
export async function searchPersonalized(
  query: string,
  userId: string,
  options?: TavilySearchOptions
): Promise<TavilySearchResult> {
  return await searchTavily(query, 'personalized', {
    days: 7,
    minScore: 0.5,
    ...options,
  });
}

/**
 * Enrich context (historical/background queries)
 */
export async function enrichContext(
  query: string,
  options?: TavilySearchOptions
): Promise<TavilySearchResult> {
  return await searchTavily(query, 'context', {
    days: 30, // Historical context can be older
    minScore: 0.4, // Lower threshold for context
    includeAnswer: true, // Context benefits from AI summary
    ...options,
  });
}

/**
 * Live search (real-time queries)
 */
export async function searchLive(
  query: string,
  options?: TavilySearchOptions
): Promise<TavilySearchResult> {
  return await searchTavily(query, 'live', {
    days: 1, // Live search is very recent
    minScore: 0.6, // Higher threshold for live
    includeAnswer: true,
    ...options,
  });
}

/**
 * Clear query pool (useful for testing or memory management)
 */
export function clearQueryPool(): void {
  queryPool.clear();
}

/**
 * Get query pool stats
 */
export function getQueryPoolStats(): {
  size: number;
  oldestEntry: number | null;
  newestEntry: number | null;
} {
  if (queryPool.size === 0) {
    return { size: 0, oldestEntry: null, newestEntry: null };
  }

  const timestamps = Array.from(queryPool.values()).map(v => v.timestamp);
  return {
    size: queryPool.size,
    oldestEntry: Math.min(...timestamps),
    newestEntry: Math.max(...timestamps),
  };
}
