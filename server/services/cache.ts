/**
 * LRU Cache with Size Limits and Metrics
 *
 * Provides memory-safe caching with automatic eviction for long-running sessions.
 * Tracks hit/miss rates and memory usage for observability.
 */

import { LRUCache } from 'lru-cache';

// Force stdout for PM2
const log = (msg: string) => process.stdout.write(msg + '\n');

/**
 * Configuration for creating an LRU cache instance
 */
export interface CacheConfig {
  /** Name for logging and metrics (e.g., 'espn', 'openligadb') */
  name: string;
  /** Maximum memory size in bytes (default: 100MB) */
  maxSize?: number;
  /** Default TTL in milliseconds (can be overridden per-entry) */
  defaultTTL?: number;
}

/**
 * Metrics returned by getCacheStats()
 */
export interface CacheMetrics {
  /** Approximate memory usage in bytes */
  sizeBytes: number;
  /** Human-readable size (e.g., "45.2MB") */
  size: string;
  /** Number of entries in cache */
  entries: number;
  /** Cache hit rate (0.0 to 1.0) */
  hitRate: number;
  /** Total cache hits */
  hits: number;
  /** Total cache misses */
  misses: number;
  /** Maximum allowed size in bytes */
  maxSizeBytes: number;
  /** Human-readable max size */
  maxSize: string;
}

/**
 * Wrapper around LRUCache that adds metrics tracking and consistent interface
 */
export class MetricsCache<T = unknown> {
  private cache: LRUCache<string, T>;
  private name: string;
  private hits: number = 0;
  private misses: number = 0;
  private maxSizeBytes: number;

  constructor(config: CacheConfig) {
    this.name = config.name;
    // Default 100MB per cache, matching the PRD requirement
    this.maxSizeBytes = config.maxSize ?? 100 * 1024 * 1024;

    this.cache = new LRUCache<string, T>({
      // Use size-based eviction
      maxSize: this.maxSizeBytes,
      // Calculate size of each entry (key + serialized value)
      sizeCalculation: (value: T, key: string) => {
        return this.calculateEntrySize(value, key);
      },
      // TTL can be set per-entry, but we have a default
      ttl: config.defaultTTL ?? 60000, // 1 minute default
      // Allow stale entries to be returned while fetching fresh data
      allowStale: false,
      // Update age on get (true LRU behavior)
      updateAgeOnGet: true,
      // Dispose callback for logging evictions
      dispose: (value: T, key: string, reason: LRUCache.DisposeReason) => {
        if (reason === 'evict') {
          log(`[${this.name} Cache] Evicted: ${key} (LRU)`);
        }
      },
    });

    log(`[${this.name} Cache] Initialized with max size ${this.formatBytes(this.maxSizeBytes)}`);
  }

  /**
   * Calculate the approximate memory size of a cache entry
   */
  private calculateEntrySize(value: T, key: string): number {
    // Estimate size: key length + JSON stringified value length
    // This is an approximation - actual memory usage may vary
    const keySize = key.length * 2; // UTF-16 characters
    let valueSize: number;

    try {
      // JSON stringify gives us a reasonable approximation of the data size
      valueSize = JSON.stringify(value).length * 2;
    } catch {
      // Fallback for circular references or other issues
      valueSize = 1024; // Assume 1KB
    }

    // Add some overhead for object metadata
    return keySize + valueSize + 64;
  }

  /**
   * Format bytes to human-readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
  }

  /**
   * Get a value from cache
   * @param key Cache key
   * @returns Value if found and not expired, undefined otherwise
   */
  get(key: string): T | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      this.hits++;
      return value;
    }
    this.misses++;
    return undefined;
  }

  /**
   * Set a value in cache with optional custom TTL
   * @param key Cache key
   * @param value Value to cache
   * @param ttl Optional TTL in milliseconds (overrides default)
   */
  set(key: string, value: T, ttl?: number): void {
    this.cache.set(key, value, { ttl });
  }

  /**
   * Check if a key exists in cache (without updating LRU order)
   */
  has(key: string): boolean {
    return this.cache.has(key);
  }

  /**
   * Delete a specific key from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all entries from cache
   */
  clear(): void {
    this.cache.clear();
    log(`[${this.name} Cache] Cleared`);
  }

  /**
   * Reset hit/miss counters (useful for periodic metric snapshots)
   */
  resetMetrics(): void {
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get comprehensive cache statistics
   */
  getStats(): CacheMetrics {
    const totalRequests = this.hits + this.misses;
    const hitRate = totalRequests > 0 ? this.hits / totalRequests : 0;
    const sizeBytes = this.cache.calculatedSize || 0;

    return {
      sizeBytes,
      size: this.formatBytes(sizeBytes),
      entries: this.cache.size,
      hitRate: Math.round(hitRate * 100) / 100, // Round to 2 decimal places
      hits: this.hits,
      misses: this.misses,
      maxSizeBytes: this.maxSizeBytes,
      maxSize: this.formatBytes(this.maxSizeBytes),
    };
  }

  /**
   * Get all keys in cache (for debugging)
   */
  keys(): string[] {
    return Array.from(this.cache.keys());
  }
}

/**
 * Create a new metrics-enabled LRU cache
 */
export function createCache<T = unknown>(config: CacheConfig): MetricsCache<T> {
  return new MetricsCache<T>(config);
}
