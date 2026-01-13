/**
 * Simple cache utility for API responses
 * Provides fallback data when API calls fail
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class SimpleCache {
  private cache: Map<string, CacheEntry<any>> = new Map();

  /**
   * Get cached data if available and not expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cache entry
   */
  set<T>(key: string, data: T, ttlMs: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    });
  }

  /**
   * Clear cache entry
   */
  clear(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clearAll(): void {
    this.cache.clear();
  }
}

// Singleton instance
export const cache = new SimpleCache();

/**
 * Cache keys
 */
export const CacheKeys = {
  signals: (userId: string) => `signals:${userId}`,
  events: (userId: string, query?: string) => `events:${userId}:${query || 'all'}`,
  eventDetail: (eventId: string) => `event:${eventId}`,
  recommendations: (userId: string) => `recommendations:${userId}`,
  alerts: (userId: string) => `alerts:${userId}`,
  analysis: (userId: string) => `analysis:${userId}`,
} as const;
