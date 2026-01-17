/**
 * LRU Cache Tests
 *
 * Tests Track 2 cache features:
 * - LRU eviction when exceeding 100MB
 * - Hit/Miss tracking
 * - Memory metrics calculation
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { createCache, MetricsCache } from '../cache';

describe('MetricsCache - LRU Eviction', () => {
  let cache: MetricsCache;

  // Size calculation: key.length * 2 + JSON.stringify(value).length * 2 + 64
  // For 'key1' + 'x'.repeat(100): 8 + (102 * 2) + 64 = 276 bytes per entry
  // Using 1000 bytes max size allows ~3 entries before eviction

  beforeEach(() => {
    cache = createCache({
      name: 'test-cache',
      maxSize: 1000, // ~1KB for easier testing (allows ~3 small entries)
      defaultTTL: 60000,
    });
  });

  it('should evict oldest entries when exceeding maxSize', () => {
    // Each entry: key (8 bytes) + value (~204 bytes after stringify*2) + 64 overhead = ~276 bytes
    // With 1000 byte limit, 3 entries fit, 4th triggers eviction
    const smallData = 'x'.repeat(100);

    cache.set('key1', smallData); // ~276 bytes, total: ~276
    cache.set('key2', smallData); // ~276 bytes, total: ~552
    cache.set('key3', smallData); // ~276 bytes, total: ~828
    cache.set('key4', smallData); // ~276 bytes, exceeds 1000, evicts key1

    // key1 should be evicted (oldest)
    expect(cache.has('key1')).toBe(false);
    expect(cache.has('key2')).toBe(true);
    expect(cache.has('key3')).toBe(true);
    expect(cache.has('key4')).toBe(true);
  });

  it('should track cache size in bytes', () => {
    const data = { test: 'data' };
    cache.set('key1', data);

    const stats = cache.getStats();
    expect(stats.sizeBytes).toBeGreaterThan(0);
    // Format: "123B", "1.5KB", "2.3MB" - note 'B' alone is valid for small sizes
    expect(stats.size).toMatch(/\d+(\.\d+)?(B|KB|MB)/);
  });

  it('should respect LRU order (least recently used evicted first)', () => {
    // Each entry ~276 bytes, need to fit 2 and evict on 3rd
    const cache2 = createCache({
      name: 'test-cache-lru',
      maxSize: 600, // Fits 2 entries, 3rd triggers eviction
      defaultTTL: 60000,
    });
    const data = 'x'.repeat(100);

    cache2.set('key1', data);
    cache2.set('key2', data);

    // Access key1 (makes it more recently used)
    cache2.get('key1');

    // Add key3, should evict key2 (least recently used)
    cache2.set('key3', data);

    expect(cache2.has('key1')).toBe(true);
    expect(cache2.has('key2')).toBe(false); // Evicted
    expect(cache2.has('key3')).toBe(true);
  });

  it('should update LRU order on get() when updateAgeOnGet is true', () => {
    // Each entry ~276 bytes, need to fit 2 and evict on 3rd
    const cache2 = createCache({
      name: 'test-cache-lru',
      maxSize: 600, // Fits 2 entries, 3rd triggers eviction
      defaultTTL: 60000,
    });
    const data = 'x'.repeat(100);

    cache2.set('key1', data);
    cache2.set('key2', data);

    // Get key1 (updates its age)
    cache2.get('key1');

    // Add key3 - should evict key2 (oldest)
    cache2.set('key3', data);

    expect(cache2.has('key1')).toBe(true);
    expect(cache2.has('key2')).toBe(false);
    expect(cache2.has('key3')).toBe(true);
  });
});

describe('MetricsCache - Hit/Miss Tracking', () => {
  let cache: MetricsCache;

  beforeEach(() => {
    cache = createCache({
      name: 'test-cache',
      maxSize: 100 * 1024 * 1024, // 100MB
      defaultTTL: 60000,
    });
  });

  it('should track cache hits', () => {
    cache.set('key1', 'value1');

    cache.get('key1'); // Hit
    cache.get('key1'); // Hit

    const stats = cache.getStats();
    expect(stats.hits).toBe(2);
    expect(stats.misses).toBe(0);
    expect(stats.hitRate).toBe(1.0); // 100%
  });

  it('should track cache misses', () => {
    cache.get('nonexistent'); // Miss
    cache.get('another-miss'); // Miss

    const stats = cache.getStats();
    expect(stats.hits).toBe(0);
    expect(stats.misses).toBe(2);
    expect(stats.hitRate).toBe(0); // 0%
  });

  it('should calculate correct hit rate', () => {
    cache.set('key1', 'value1');

    cache.get('key1'); // Hit
    cache.get('miss1'); // Miss
    cache.get('key1'); // Hit
    cache.get('miss2'); // Miss

    const stats = cache.getStats();
    expect(stats.hits).toBe(2);
    expect(stats.misses).toBe(2);
    expect(stats.hitRate).toBe(0.5); // 50%
  });

  it('should reset metrics', () => {
    cache.set('key1', 'value1');
    cache.get('key1'); // Hit
    cache.get('miss'); // Miss

    cache.resetMetrics();

    const stats = cache.getStats();
    expect(stats.hits).toBe(0);
    expect(stats.misses).toBe(0);
  });
});

describe('MetricsCache - Metrics Calculation', () => {
  let cache: MetricsCache;

  beforeEach(() => {
    cache = createCache({
      name: 'test-cache',
      maxSize: 100 * 1024 * 1024,
      defaultTTL: 60000,
    });
  });

  it('should report correct number of entries', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.set('key3', 'value3');

    const stats = cache.getStats();
    expect(stats.entries).toBe(3);
  });

  it('should format bytes correctly', () => {
    // Small size (bytes)
    cache.set('small', 'x');
    let stats = cache.getStats();
    expect(stats.size).toMatch(/\d+B/);

    // Medium size (KB)
    cache.clear();
    cache.set('medium', 'x'.repeat(2000));
    stats = cache.getStats();
    expect(stats.size).toMatch(/\d+\.\d+KB/);

    // Large size (MB) - test with larger cache
    cache.clear();
    const largeCacheData = { data: 'x'.repeat(1024 * 1024) };
    cache.set('large', largeCacheData);
    stats = cache.getStats();
    expect(stats.size).toMatch(/\d+\.\d+MB/);
  });

  it('should include max size in stats', () => {
    const stats = cache.getStats();
    expect(stats.maxSizeBytes).toBe(100 * 1024 * 1024);
    expect(stats.maxSize).toBe('100.0MB');
  });

  it('should calculate entry size including key', () => {
    const shortKey = 'a';
    const longKey = 'a'.repeat(1000);
    const value = 'test';

    cache.set(shortKey, value);
    const size1 = cache.getStats().sizeBytes;

    cache.clear();
    cache.set(longKey, value);
    const size2 = cache.getStats().sizeBytes;

    // Longer key should result in larger size
    expect(size2).toBeGreaterThan(size1);
  });
});

describe('MetricsCache - TTL Support', () => {
  // Note: lru-cache v11 uses performance.now() internally for TTL tracking.
  // The global vitest config uses fake timers, but performance.now is not faked.
  // We need to use real timers for these tests to work correctly.

  beforeEach(() => {
    vi.useRealTimers();
  });

  afterEach(() => {
    vi.useFakeTimers();
  });

  it('should expire entries after TTL', async () => {
    const cache = createCache({
      name: 'test-cache',
      maxSize: 100 * 1024 * 1024,
      defaultTTL: 50, // 50ms TTL for fast testing
    });

    cache.set('key1', 'value1');

    // Should exist initially
    expect(cache.get('key1')).toBe('value1');

    // Wait for TTL to expire
    await new Promise((resolve) => setTimeout(resolve, 60));

    // Should be expired
    expect(cache.get('key1')).toBeUndefined();
  });

  it('should support custom TTL per entry', async () => {
    const cache = createCache({
      name: 'test-cache',
      maxSize: 100 * 1024 * 1024,
      defaultTTL: 5000, // Default 5 seconds
    });

    // Set one entry with very short TTL and one with the default
    cache.set('short', 'value1', 30); // 30ms TTL (custom)
    cache.set('default', 'value2'); // Uses default 5s TTL

    // Both exist initially
    expect(cache.get('short')).toBe('value1');
    expect(cache.get('default')).toBe('value2');

    // Wait 60ms - short should expire, default should still be valid
    await new Promise((resolve) => setTimeout(resolve, 60));
    expect(cache.get('short')).toBeUndefined();
    expect(cache.get('default')).toBe('value2'); // Still valid (5s TTL)
  });
});

describe('MetricsCache - Operations', () => {
  let cache: MetricsCache;

  beforeEach(() => {
    cache = createCache({
      name: 'test-cache',
      maxSize: 100 * 1024 * 1024,
      defaultTTL: 60000,
    });
  });

  it('should support has() check without updating LRU', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');

    // has() should not count as hit/miss
    const initialStats = cache.getStats();
    expect(cache.has('key1')).toBe(true);
    expect(cache.has('nonexistent')).toBe(false);

    // Stats should not change (has doesn't count as get)
    const afterStats = cache.getStats();
    expect(afterStats.hits).toBe(initialStats.hits);
    expect(afterStats.misses).toBe(initialStats.misses);
  });

  it('should support delete operation', () => {
    cache.set('key1', 'value1');
    expect(cache.has('key1')).toBe(true);

    const deleted = cache.delete('key1');
    expect(deleted).toBe(true);
    expect(cache.has('key1')).toBe(false);

    // Deleting non-existent key returns false
    expect(cache.delete('nonexistent')).toBe(false);
  });

  it('should support clear operation', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.set('key3', 'value3');

    expect(cache.getStats().entries).toBe(3);

    cache.clear();

    expect(cache.getStats().entries).toBe(0);
    expect(cache.has('key1')).toBe(false);
    expect(cache.has('key2')).toBe(false);
    expect(cache.has('key3')).toBe(false);
  });

  it('should support keys() operation', () => {
    cache.set('key1', 'value1');
    cache.set('key2', 'value2');
    cache.set('key3', 'value3');

    const keys = cache.keys();
    expect(keys).toContain('key1');
    expect(keys).toContain('key2');
    expect(keys).toContain('key3');
    expect(keys.length).toBe(3);
  });
});

describe('MetricsCache - Edge Cases', () => {
  it('should handle circular reference in size calculation', () => {
    const cache = createCache({
      name: 'test-cache',
      maxSize: 100 * 1024 * 1024,
      defaultTTL: 60000,
    });

    // Create circular reference
    const circular: Record<string, unknown> = { a: 1 };
    circular.self = circular;

    // Should not throw, falls back to 1KB estimate
    expect(() => cache.set('circular', circular)).not.toThrow();

    const stats = cache.getStats();
    expect(stats.entries).toBe(1);
    expect(stats.sizeBytes).toBeGreaterThan(0);
  });

  it('should handle very large values', () => {
    const cache = createCache({
      name: 'test-cache',
      maxSize: 50 * 1024 * 1024, // 50MB to accommodate size calculation overhead
      defaultTTL: 60000,
    });

    // Create 2MB value (after *2 in size calc = ~4MB, plus overhead)
    // Size calculation: key*2 + JSON.stringify(value)*2 + 64
    // ~4MB + 64 bytes overhead, well within 50MB limit
    const largeValue = { data: 'x'.repeat(2 * 1024 * 1024) };

    cache.set('large', largeValue);

    const stats = cache.getStats();
    expect(stats.entries).toBe(1);
    // After stringify and *2, size should be > 4MB
    expect(stats.sizeBytes).toBeGreaterThan(4 * 1024 * 1024);
  });

  it('should handle empty cache gracefully', () => {
    const cache = createCache({
      name: 'test-cache',
      maxSize: 100 * 1024 * 1024,
      defaultTTL: 60000,
    });

    const stats = cache.getStats();
    expect(stats.entries).toBe(0);
    expect(stats.sizeBytes).toBe(0);
    expect(stats.hitRate).toBe(0);
    expect(stats.hits).toBe(0);
    expect(stats.misses).toBe(0);
  });
});
