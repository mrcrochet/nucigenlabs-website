/**
 * Client-side Cache Utility
 * 
 * Simple in-memory cache with TTL for client-side data
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class ClientCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private maxSize: number = 100; // Maximum number of entries

  /**
   * Get cached data
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }
    
    // Check if expired
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data as T;
  }

  /**
   * Set cached data
   */
  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Check if key exists and is valid
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) {
      return false;
    }
    
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  /**
   * Delete cached data
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Clean expired entries
   */
  clean(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Singleton instance
export const clientCache = new ClientCache();

// Clean expired entries every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(() => {
    clientCache.clean();
  }, 5 * 60 * 1000);
}

/**
 * Cache key generators
 */
export const cacheKeys = {
  userPreferences: (userId: string) => `user-preferences-${userId}`,
  signals: (filters: string) => `signals-${filters}`,
  events: (filters: string) => `events-${filters}`,
  searchResults: (query: string) => `search-${query}`,
  marketData: (symbol: string) => `market-${symbol}`,
  alphaSignal: (symbol: string) => `alpha-${symbol}`,
};

/**
 * Hook-like function to use cache with fetch
 */
export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 5 * 60 * 1000
): Promise<T> {
  // Check cache first
  const cached = clientCache.get<T>(key);
  if (cached !== null) {
    return cached;
  }
  
  // Fetch and cache
  const data = await fetcher();
  clientCache.set(key, data, ttl);
  
  return data;
}
