/**
 * Cache Service - Handles localStorage caching and stale data detection
 *
 * This service:
 * - Caches API responses to localStorage for offline/stale data fallback
 * - Parses X-Cache-* headers from the backend to detect stale responses
 * - Provides methods to save and retrieve cached data
 */

import type { Game } from '../types/game';
import type { GameStats } from '../types/stats';

// Cache key generators - sport-specific to prevent data mixing
const getCacheKey = {
  scoreboard: (sport: string) => `scoreboard_cache_${sport}`,
  gameDetails: (sport: string) => `game_details_cache_${sport}`,
  metadata: (sport: string) => `cache_metadata_${sport}`,
} as const;

// Legacy keys to clean up (from pre-3.2.0 versions)
const LEGACY_CACHE_KEYS = [
  'scoreboard_cache',
  'game_details_cache',
  'cache_metadata',
] as const;

// Cache data structures
interface CachedScoreboard {
  games: Game[];
  timestamp: number;
  sport: string;
}

interface CachedGameDetails {
  gameId: string;
  game: Game;
  stats: GameStats | null;
  timestamp: number;
}

interface CacheMetadata {
  lastSuccessfulFetch: number;
  version: string;
}

// Response metadata from backend headers
export interface ResponseCacheInfo {
  isStale: boolean;
  cacheAge: number | null;
  apiError: string | null;
}

/**
 * Parse X-Cache-* headers from the backend response
 */
export function parseCacheHeaders(response: Response): ResponseCacheInfo {
  const cacheStatus = response.headers.get('X-Cache-Status');
  const cacheAgeHeader = response.headers.get('X-Cache-Age');
  const apiError = response.headers.get('X-API-Error');

  return {
    isStale: cacheStatus === 'stale',
    cacheAge: cacheAgeHeader ? parseInt(cacheAgeHeader, 10) : null,
    apiError: apiError || null,
  };
}

/**
 * Clean up legacy cache keys from pre-3.2.0 versions
 * Called once on app initialization
 */
export function cleanupLegacyCache(): void {
  try {
    let cleaned = false;
    for (const key of LEGACY_CACHE_KEYS) {
      if (localStorage.getItem(key) !== null) {
        localStorage.removeItem(key);
        cleaned = true;
      }
    }
    if (cleaned) {
      console.log('[CacheService] Cleaned up legacy cache keys');
    }
  } catch (error) {
    console.warn('[CacheService] Failed to cleanup legacy cache:', error);
  }
}

/**
 * Save scoreboard data to localStorage
 */
export function saveScoreboardToCache(games: Game[], sport: string): void {
  try {
    const cacheData: CachedScoreboard = {
      games,
      timestamp: Date.now(),
      sport,
    };
    localStorage.setItem(getCacheKey.scoreboard(sport), JSON.stringify(cacheData));
    updateCacheMetadata(sport);
  } catch (error) {
    console.warn('[CacheService] Failed to save scoreboard to cache:', error);
  }
}

/**
 * Get cached scoreboard data from localStorage
 */
export function getScoreboardFromCache(sport: string): Game[] | null {
  try {
    const cacheKey = getCacheKey.scoreboard(sport);
    const cached = localStorage.getItem(cacheKey);
    if (!cached) return null;

    const data: CachedScoreboard = JSON.parse(cached);

    // Validate sport matches (defensive check)
    if (data.sport !== sport) {
      localStorage.removeItem(cacheKey);
      return null;
    }

    // Validate timestamp exists and is a valid number
    if (!data.timestamp || typeof data.timestamp !== 'number') {
      localStorage.removeItem(cacheKey);
      return null;
    }

    // Check if cache is not too old (max 24 hours)
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    if (Date.now() - data.timestamp > maxAge) {
      localStorage.removeItem(cacheKey);
      return null;
    }

    return data.games;
  } catch (error) {
    console.warn('[CacheService] Failed to read scoreboard from cache:', error);
    return null;
  }
}

/**
 * Get cache timestamp for scoreboard
 */
export function getScoreboardCacheTimestamp(sport: string): Date | null {
  try {
    const cached = localStorage.getItem(getCacheKey.scoreboard(sport));
    if (!cached) return null;

    const data: CachedScoreboard = JSON.parse(cached);
    return new Date(data.timestamp);
  } catch {
    return null;
  }
}

/**
 * Save game details to localStorage
 */
export function saveGameDetailsToCache(
  gameId: string,
  game: Game,
  stats: GameStats | null,
  sport: string
): void {
  try {
    const cacheKey = getCacheKey.gameDetails(sport);
    // Store as a map of gameId -> details
    const existingCache = localStorage.getItem(cacheKey);
    const cacheMap: Record<string, CachedGameDetails> = existingCache
      ? JSON.parse(existingCache)
      : {};

    cacheMap[gameId] = {
      gameId,
      game,
      stats,
      timestamp: Date.now(),
    };

    // Keep only the last 10 games to avoid localStorage bloat
    const entries = Object.entries(cacheMap);
    if (entries.length > 10) {
      // Sort by timestamp (newest first) and keep only newest 10
      entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
      const trimmedEntries = entries.slice(0, 10);
      const trimmed = Object.fromEntries(trimmedEntries);
      localStorage.setItem(cacheKey, JSON.stringify(trimmed));
    } else {
      localStorage.setItem(cacheKey, JSON.stringify(cacheMap));
    }

    updateCacheMetadata(sport);
  } catch (error) {
    console.warn('[CacheService] Failed to save game details to cache:', error);
  }
}

/**
 * Get cached game details from localStorage
 */
export function getGameDetailsFromCache(
  gameId: string,
  sport: string
): { game: Game; stats: GameStats | null } | null {
  try {
    const cached = localStorage.getItem(getCacheKey.gameDetails(sport));
    if (!cached) return null;

    const cacheMap: Record<string, CachedGameDetails> = JSON.parse(cached);
    const gameCache = cacheMap[gameId];

    if (!gameCache) return null;

    // Check if cache is not too old (max 1 hour for game details)
    const maxAge = 60 * 60 * 1000; // 1 hour
    if (Date.now() - gameCache.timestamp > maxAge) {
      return null;
    }

    return { game: gameCache.game, stats: gameCache.stats };
  } catch (error) {
    console.warn('[CacheService] Failed to read game details from cache:', error);
    return null;
  }
}

/**
 * Update cache metadata
 */
function updateCacheMetadata(sport: string): void {
  try {
    const metadata: CacheMetadata = {
      lastSuccessfulFetch: Date.now(),
      version: '2.0', // Updated for sport-specific cache keys
    };
    localStorage.setItem(getCacheKey.metadata(sport), JSON.stringify(metadata));
  } catch {
    // Ignore metadata errors
  }
}

/**
 * Get last successful fetch timestamp
 */
export function getLastSuccessfulFetchTime(sport: string): Date | null {
  try {
    const cached = localStorage.getItem(getCacheKey.metadata(sport));
    if (!cached) return null;

    const metadata: CacheMetadata = JSON.parse(cached);
    return new Date(metadata.lastSuccessfulFetch);
  } catch {
    return null;
  }
}

/**
 * Clear cached data for a specific sport
 */
export function clearCache(sport: string): void {
  try {
    localStorage.removeItem(getCacheKey.scoreboard(sport));
    localStorage.removeItem(getCacheKey.gameDetails(sport));
    localStorage.removeItem(getCacheKey.metadata(sport));
  } catch (error) {
    console.warn('[CacheService] Failed to clear cache:', error);
  }
}

/**
 * Clear all cached data for all sports
 */
export function clearAllCaches(): void {
  try {
    // Known sports
    const sports = ['nfl', 'bundesliga', 'uefa'];
    for (const sport of sports) {
      clearCache(sport);
    }
    // Also clean up any legacy keys
    cleanupLegacyCache();
  } catch (error) {
    console.warn('[CacheService] Failed to clear all caches:', error);
  }
}
