/**
 * OpenLigaDB API Proxy with LRU Caching
 *
 * Provides memory-safe caching with automatic eviction and metrics.
 * Prevents memory leaks during long-running sessions (12h+ party marathons).
 */

import { createCache, MetricsCache, CacheMetrics } from './cache';

const OPENLIGADB_BASE_URL = 'https://api.openligadb.de';

// Force stdout for PM2
const log = (msg: string) => process.stdout.write(msg + '\n');

/**
 * Cache entry wrapping data with timestamp for TTL-based invalidation
 */
interface CacheEntry {
  data: unknown;
  timestamp: number;
}

export const CacheKeys = {
  CURRENT_GROUP: (league: string) => `bl_current_group_${league}`,
  MATCHDAY: (league: string, season: string, matchday: number) => `bl_matchday_${league}_${season}_${matchday}`,
  MATCH: (matchId: string) => `bl_match_${matchId}`,
} as const;

class OpenLigaDBProxy {
  private cache: MetricsCache<CacheEntry>;
  private readonly TTL = {
    currentGroup: 300000,  // 5 minutes for current matchday info
    matchday: 15000,       // 15 seconds for live matchday data
    match: 15000,          // 15 seconds for single match
  };

  constructor() {
    // Initialize LRU cache with 100MB limit
    this.cache = createCache<CacheEntry>({
      name: 'OpenLigaDB',
      maxSize: 100 * 1024 * 1024, // 100MB
      defaultTTL: this.TTL.matchday,
    });
  }

  private async fetch(url: string): Promise<unknown> {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'NFL-Scoreboard/2.0',
      },
    });

    if (!response.ok) {
      throw new Error(`OpenLigaDB API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get cached data if valid (not expired based on TTL)
   * Uses the LRU cache but adds custom TTL validation
   */
  private getCached(key: string, ttl: number): unknown | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const age = Date.now() - entry.timestamp;
    if (age > ttl) {
      // Entry expired - delete and return null
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Store data in cache with timestamp
   * TTL is set generously in LRU cache; we do our own TTL validation in getCached
   */
  private setCache(key: string, data: unknown, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    }, ttl * 2); // Set LRU TTL to 2x our TTL for safety margin
  }

  /**
   * Fetch current matchday group for a league
   * @param league - 'bl1' for Bundesliga, 'dfb' for DFB-Pokal
   */
  async fetchCurrentGroup(league: string = 'bl1'): Promise<unknown> {
    const cacheKey = CacheKeys.CURRENT_GROUP(league);
    const cached = this.getCached(cacheKey, this.TTL.currentGroup);
    if (cached) {
      log(`[Cache HIT] ${league} current group`);
      return cached;
    }

    log(`[Cache MISS] Fetching ${league} current group from OpenLigaDB...`);
    const start = Date.now();
    const data = await this.fetch(`${OPENLIGADB_BASE_URL}/getcurrentgroup/${league}`);
    const duration = Date.now() - start;
    log(`[OpenLigaDB API] ${league} current group fetched in ${duration}ms`);
    this.setCache(cacheKey, data, this.TTL.currentGroup);
    return data;
  }

  /**
   * Fetch all matches for a specific matchday
   * @param league - 'bl1' for Bundesliga, 'dfb' for DFB-Pokal
   * @param season - Season year (e.g., '2024')
   * @param matchday - Matchday number
   */
  async fetchMatchday(league: string, season: string, matchday: number): Promise<unknown> {
    const cacheKey = CacheKeys.MATCHDAY(league, season, matchday);
    const cached = this.getCached(cacheKey, this.TTL.matchday);
    if (cached) {
      log(`[Cache HIT] ${league} matchday ${matchday}`);
      return cached;
    }

    log(`[Cache MISS] Fetching ${league} matchday ${matchday} from OpenLigaDB...`);
    const start = Date.now();
    const data = await this.fetch(
      `${OPENLIGADB_BASE_URL}/getmatchdata/${league}/${season}/${matchday}`
    );
    const duration = Date.now() - start;
    log(`[OpenLigaDB API] ${league} matchday ${matchday} fetched in ${duration}ms`);
    this.setCache(cacheKey, data, this.TTL.matchday);
    return data;
  }

  /**
   * Fetch single match details
   * @param matchId - OpenLigaDB match ID
   */
  async fetchMatch(matchId: string): Promise<unknown> {
    const cacheKey = CacheKeys.MATCH(matchId);
    const cached = this.getCached(cacheKey, this.TTL.match);
    if (cached) {
      log(`[Cache HIT] Match ${matchId}`);
      return cached;
    }

    log(`[Cache MISS] Fetching match ${matchId} from OpenLigaDB...`);
    const start = Date.now();
    const data = await this.fetch(`${OPENLIGADB_BASE_URL}/getmatchdata/${matchId}`);
    const duration = Date.now() - start;
    log(`[OpenLigaDB API] Match ${matchId} fetched in ${duration}ms`);
    this.setCache(cacheKey, data, this.TTL.match);
    return data;
  }

  /**
   * Get comprehensive cache statistics for health endpoint
   */
  getCacheStats(): CacheMetrics {
    return this.cache.getStats();
  }

  /**
   * Legacy method for backward compatibility - returns simplified stats
   */
  getLegacyCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.getStats().entries,
      keys: this.cache.keys(),
    };
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const openligadbProxy = new OpenLigaDBProxy();
