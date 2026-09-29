/**
 * Server-Side LRU (Least Recently Used) Cache
 * 
 * Spec:
 * - Max: 500 cache entries
 * - TTL: 10 minutes (600,000 ms) default
 * - Thread-safe within Node.js event loop
 * - Automatic eviction on capacity overflow & TTL expiry
 * - Pattern / prefix invalidation for administrative mutations
 * - Stats tracking (hits, misses, evictions, size)
 */

export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  lastAccessed: number;
}

export interface LRUCacheOptions {
  max?: number;
  defaultTtlMs?: number;
}

export class ServerLRUCache {
  private max: number;
  private defaultTtlMs: number;
  private cache: Map<string, CacheEntry<any>>;
  private hits: number = 0;
  private misses: number = 0;
  private evictions: number = 0;

  constructor(options: LRUCacheOptions = {}) {
    this.max = options.max ?? 500;
    this.defaultTtlMs = options.defaultTtlMs ?? 10 * 60 * 1000; // 10 minutes default
    this.cache = new Map();
  }

  /**
   * Retrieve an item from the cache.
   * Updates its recency (LRU behavior) and checks TTL.
   */
  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return undefined;
    }

    const now = Date.now();
    // Check expiration
    if (now > entry.expiresAt) {
      this.cache.delete(key);
      this.misses++;
      return undefined;
    }

    // Refresh LRU recency by re-inserting at the end of the Map
    this.cache.delete(key);
    entry.lastAccessed = now;
    this.cache.set(key, entry);

    this.hits++;
    return entry.value as T;
  }

  /**
   * Store an item in the cache.
   * Evicts the least recently used item if max capacity is exceeded.
   */
  set<T>(key: string, value: T, ttlMs?: number): void {
    const now = Date.now();
    const effectiveTtl = ttlMs ?? this.defaultTtlMs;

    // If key already exists, delete it first to update position
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.max) {
      // Evict oldest (first item in Map iteration order)
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
        this.evictions++;
      }
    }

    this.cache.set(key, {
      value,
      expiresAt: now + effectiveTtl,
      lastAccessed: now,
    });
  }

  /**
   * Check if a valid, non-expired key exists in cache without modifying LRU order
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  /**
   * Invalidate a single cache key
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Invalidate all keys matching a prefix (e.g. 'services:', 'announcements:')
   */
  invalidatePrefix(prefix: string): number {
    let count = 0;
    for (const key of Array.from(this.cache.keys())) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * Invalidate all keys matching a regular expression
   */
  invalidatePattern(regex: RegExp): number {
    let count = 0;
    for (const key of Array.from(this.cache.keys())) {
      if (regex.test(key)) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Cache wrapper helper: Returns cached data or fetches, caches, and returns.
   */
  async wrap<T>(key: string, fetcher: () => Promise<T>, ttlMs?: number): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    const fresh = await fetcher();
    this.set<T>(key, fresh, ttlMs);
    return fresh;
  }

  /**
   * Retrieve performance and usage statistics
   */
  getStats(): {
    size: number;
    max: number;
    hits: number;
    misses: number;
    evictions: number;
    hitRatio: number;
    keys: string[];
  } {
    const totalRequests = this.hits + this.misses;
    return {
      size: this.cache.size,
      max: this.max,
      hits: this.hits,
      misses: this.misses,
      evictions: this.evictions,
      hitRatio: totalRequests > 0 ? Number((this.hits / totalRequests).toFixed(3)) : 0,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Global server-side singleton LRU cache instance
export const serverLruCache = new ServerLRUCache({
  max: 500,
  defaultTtlMs: 10 * 60 * 1000, // 10 minutes
});

// Cache key builders for consistent scoping
export const CacheKeys = {
  publicServices: () => 'services:public:active',
  serviceDetail: (id: string) => `services:detail:${id}`,
  allServicesAdmin: () => 'services:admin:all',
  publicAnnouncements: (limit: number) => `announcements:public:${limit}`,
  publicEvents: (limit: number) => `events:public:${limit}`,
  publicOfficials: () => 'officials:public',
  siteSettings: () => 'settings:site:public',
};
