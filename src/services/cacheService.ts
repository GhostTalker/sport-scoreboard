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

// Cache keys for localStorage
const CACHE_KEYS = {
  SCOREBOARD: 'scoreboard_cache',
  GAME_DETAILS: 'game_details_cache',
  CACHE_METADATA: 'cache_metadata',
} as const;

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
 * Save scoreboard data to localStorage
 */
export function saveScoreboardToCache(games: Game[], sport: string): void {
  try {
    const cacheData: CachedScoreboard = {
      games,
      timestamp: Date.now(),
      sport,
    };
    localStorage.setItem(CACHE_KEYS.SCOREBOARD, JSON.stringify(cacheData));
    updateCacheMetadata();
  } catch (error) {
    console.warn('[CacheService] Failed to save scoreboard to cache:', error);
  }
}

/**
 * Get cached scoreboard data from localStorage
 */
export function getScoreboardFromCache(sport: string): Game[] | null {
  try {
    const cached = localStorage.getItem(CACHE_KEYS.SCOREBOARD);
    if (!cached) return null;

    const data: CachedScoreboard = JSON.parse(cached);

    // Only return if it's the same sport
    if (data.sport !== sport) return null;

    // Validate timestamp exists and is a valid number
    if (!data.timestamp || typeof data.timestamp !== 'number') {
      localStorage.removeItem(CACHE_KEYS.SCOREBOARD);
      return null;
    }

    // Check if cache is not too old (max 24 hours)
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    if (Date.now() - data.timestamp > maxAge) {
      localStorage.removeItem(CACHE_KEYS.SCOREBOARD);
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
export function getScoreboardCacheTimestamp(): Date | null {
  try {
    const cached = localStorage.getItem(CACHE_KEYS.SCOREBOARD);
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
  stats: GameStats | null
): void {
  try {
    // Store as a map of gameId -> details
    const existingCache = localStorage.getItem(CACHE_KEYS.GAME_DETAILS);
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
      localStorage.setItem(CACHE_KEYS.GAME_DETAILS, JSON.stringify(trimmed));
    } else {
      localStorage.setItem(CACHE_KEYS.GAME_DETAILS, JSON.stringify(cacheMap));
    }

    updateCacheMetadata();
  } catch (error) {
    console.warn('[CacheService] Failed to save game details to cache:', error);
  }
}

/**
 * Get cached game details from localStorage
 */
export function getGameDetailsFromCache(
  gameId: string
): { game: Game; stats: GameStats | null } | null {
  try {
    const cached = localStorage.getItem(CACHE_KEYS.GAME_DETAILS);
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
function updateCacheMetadata(): void {
  try {
    const metadata: CacheMetadata = {
      lastSuccessfulFetch: Date.now(),
      version: '1.0',
    };
    localStorage.setItem(CACHE_KEYS.CACHE_METADATA, JSON.stringify(metadata));
  } catch {
    // Ignore metadata errors
  }
}

/**
 * Get last successful fetch timestamp
 */
export function getLastSuccessfulFetchTime(): Date | null {
  try {
    const cached = localStorage.getItem(CACHE_KEYS.CACHE_METADATA);
    if (!cached) return null;

    const metadata: CacheMetadata = JSON.parse(cached);
    return new Date(metadata.lastSuccessfulFetch);
  } catch {
    return null;
  }
}

/**
 * Clear all cached data
 */
export function clearCache(): void {
  try {
    localStorage.removeItem(CACHE_KEYS.SCOREBOARD);
    localStorage.removeItem(CACHE_KEYS.GAME_DETAILS);
    localStorage.removeItem(CACHE_KEYS.CACHE_METADATA);
  } catch (error) {
    console.warn('[CacheService] Failed to clear cache:', error);
  }
}
