/**
 * OpenLigaDB API Proxy with LRU Caching and Stale Data Fallback
 *
 * Provides memory-safe caching with automatic eviction and metrics.
 * Prevents memory leaks during long-running sessions (12h+ party marathons).
 *
 * Now includes:
 * - Stale data fallback when API is down
 * - FetchResult pattern for frontend cache awareness (like ESPN proxy)
 * - Error reporting for StaleDataBanner display
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

/**
 * Enhanced fetch result with metadata about cache status
 * Frontend can use this to show "last updated X mins ago" banners
 */
export interface FetchResult<T = unknown> {
  data: T;
  fromCache: boolean;
  cacheAge?: number;  // Age in milliseconds if from cache
  error?: string;     // Error message if we returned cached data due to API failure
}

export const CacheKeys = {
  CURRENT_GROUP: (league: string) => `bl_current_group_${league}`,
  MATCHDAY: (league: string, season: string, matchday: number) => `bl_matchday_${league}_${season}_${matchday}`,
  MATCH: (matchId: string) => `bl_match_${matchId}`,
} as const;

class OpenLigaDBProxy {
  private cache: MetricsCache<CacheEntry>;

  // TTL for cache entries when fresh (API working normally)
  private readonly TTL = {
    currentGroup: 300000,  // 5 minutes for current matchday info
    matchday: 15000,       // 15 seconds for live matchday data
    match: 15000,          // 15 seconds for single match
  };

  // Extended TTL for serving stale data when API is down
  private readonly STALE_TTL = {
    currentGroup: 3600000,  // 1 hour for current matchday info
    matchday: 300000,       // 5 minutes stale data acceptable
    match: 300000,          // 5 minutes
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
      // Entry expired - don't delete (keep for stale fallback), just return null
      return null;
    }

    return entry.data;
  }

  /**
   * Get stale cached data (for fallback when API is down)
   * Uses extended TTL to return older data when API fails
   */
  private getStaleCached(key: string, staleTtl: number): CacheEntry | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const age = Date.now() - entry.timestamp;
    if (age > staleTtl) {
      return null; // Even stale data is too old
    }

    return entry;
  }

  /**
   * Store data in cache with timestamp
   * TTL is set to STALE_TTL so entries remain available for fallback
   */
  private setCache(key: string, data: unknown, staleTtl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    }, staleTtl);
  }

  /**
   * Fetch current matchday group for a league (LEGACY - returns raw data)
   * @param league - 'bl1' for Bundesliga, 'dfb' for DFB-Pokal
   * @deprecated Use fetchCurrentGroupWithResult for cache awareness
   */
  async fetchCurrentGroup(league: string = 'bl1'): Promise<unknown> {
    const result = await this.fetchCurrentGroupWithResult(league);
    return result.data;
  }

  /**
   * Fetch current matchday group with FetchResult metadata
   * @param league - 'bl1' for Bundesliga, 'dfb' for DFB-Pokal, 'ucl2025' for UEFA CL, etc.
   */
  async fetchCurrentGroupWithResult(league: string = 'bl1'): Promise<FetchResult> {
    const cacheKey = CacheKeys.CURRENT_GROUP(league);

    // Check fresh cache first
    const cached = this.getCached(cacheKey, this.TTL.currentGroup);
    if (cached) {
      log(`[Cache HIT] ${league} current group`);
      return { data: cached, fromCache: true, cacheAge: 0 };
    }

    // Try to fetch from API
    try {
      log(`[Cache MISS] Fetching ${league} current group from OpenLigaDB...`);
      const start = Date.now();
      const data = await this.fetch(`${OPENLIGADB_BASE_URL}/getcurrentgroup/${league}`);
      const duration = Date.now() - start;
      log(`[OpenLigaDB API] ${league} current group fetched in ${duration}ms`);
      this.setCache(cacheKey, data, this.STALE_TTL.currentGroup);
      return { data, fromCache: false };
    } catch (error) {
      // API failed - try stale cache as fallback
      const staleEntry = this.getStaleCached(cacheKey, this.STALE_TTL.currentGroup);
      if (staleEntry) {
        const age = Date.now() - staleEntry.timestamp;
        log(`[Cache FALLBACK] ${league} current group - API error, serving ${Math.round(age / 1000)}s old data`);
        return {
          data: staleEntry.data,
          fromCache: true,
          cacheAge: age,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }

      // No cache available - re-throw the error
      throw error;
    }
  }

  /**
   * Fetch all matches for a specific matchday (LEGACY - returns raw data)
   * @deprecated Use fetchMatchdayWithResult for cache awareness
   */
  async fetchMatchday(league: string, season: string, matchday: number): Promise<unknown> {
    const result = await this.fetchMatchdayWithResult(league, season, matchday);
    return result.data;
  }

  /**
   * Fetch all matches for a specific matchday with FetchResult metadata
   * @param league - 'bl1' for Bundesliga, 'dfb' for DFB-Pokal, 'ucl2025' for UEFA CL, etc.
   * @param season - Season year (e.g., '2024')
   * @param matchday - Matchday number
   */
  async fetchMatchdayWithResult(league: string, season: string, matchday: number): Promise<FetchResult> {
    const cacheKey = CacheKeys.MATCHDAY(league, season, matchday);

    // Check fresh cache first
    const cached = this.getCached(cacheKey, this.TTL.matchday);
    if (cached) {
      log(`[Cache HIT] ${league} matchday ${matchday}`);
      return { data: cached, fromCache: true, cacheAge: 0 };
    }

    // Try to fetch from API
    try {
      log(`[Cache MISS] Fetching ${league} matchday ${matchday} from OpenLigaDB...`);
      const start = Date.now();
      const data = await this.fetch(
        `${OPENLIGADB_BASE_URL}/getmatchdata/${league}/${season}/${matchday}`
      );
      const duration = Date.now() - start;
      log(`[OpenLigaDB API] ${league} matchday ${matchday} fetched in ${duration}ms`);
      this.setCache(cacheKey, data, this.STALE_TTL.matchday);
      return { data, fromCache: false };
    } catch (error) {
      // API failed - try stale cache as fallback
      const staleEntry = this.getStaleCached(cacheKey, this.STALE_TTL.matchday);
      if (staleEntry) {
        const age = Date.now() - staleEntry.timestamp;
        log(`[Cache FALLBACK] ${league} matchday ${matchday} - API error, serving ${Math.round(age / 1000)}s old data`);
        return {
          data: staleEntry.data,
          fromCache: true,
          cacheAge: age,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }

      // No cache available - re-throw the error
      throw error;
    }
  }

  /**
   * Fetch single match details (LEGACY - returns raw data)
   * @deprecated Use fetchMatchWithResult for cache awareness
   */
  async fetchMatch(matchId: string): Promise<unknown> {
    const result = await this.fetchMatchWithResult(matchId);
    return result.data;
  }

  /**
   * Fetch single match details with FetchResult metadata
   * @param matchId - OpenLigaDB match ID
   */
  async fetchMatchWithResult(matchId: string): Promise<FetchResult> {
    const cacheKey = CacheKeys.MATCH(matchId);

    // Check fresh cache first
    const cached = this.getCached(cacheKey, this.TTL.match);
    if (cached) {
      log(`[Cache HIT] Match ${matchId}`);
      return { data: cached, fromCache: true, cacheAge: 0 };
    }

    // Try to fetch from API
    try {
      log(`[Cache MISS] Fetching match ${matchId} from OpenLigaDB...`);
      const start = Date.now();
      const data = await this.fetch(`${OPENLIGADB_BASE_URL}/getmatchdata/${matchId}`);
      const duration = Date.now() - start;
      log(`[OpenLigaDB API] Match ${matchId} fetched in ${duration}ms`);
      this.setCache(cacheKey, data, this.STALE_TTL.match);
      return { data, fromCache: false };
    } catch (error) {
      // API failed - try stale cache as fallback
      const staleEntry = this.getStaleCached(cacheKey, this.STALE_TTL.match);
      if (staleEntry) {
        const age = Date.now() - staleEntry.timestamp;
        log(`[Cache FALLBACK] Match ${matchId} - API error, serving ${Math.round(age / 1000)}s old data`);
        return {
          data: staleEntry.data,
          fromCache: true,
          cacheAge: age,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }

      // No cache available - re-throw the error
      throw error;
    }
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
