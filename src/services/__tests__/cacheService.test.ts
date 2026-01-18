/**
 * Cache Service Tests
 *
 * Tests Track 2 offline/stale data features:
 * - localStorage caching for offline fallback
 * - Cache expiry (24h scoreboard, 1h game details)
 * - X-Cache-Status header parsing
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  saveScoreboardToCache,
  getScoreboardFromCache,
  getScoreboardCacheTimestamp,
  saveGameDetailsToCache,
  getGameDetailsFromCache,
  clearCache,
  parseCacheHeaders,
  getLastSuccessfulFetchTime,
} from '../cacheService';
import type { Game } from '../../types/game';

// Mock game data
const mockGame: Game = {
  id: 'game123',
  date: '2026-01-17T18:00:00Z',
  homeTeam: {
    id: '17',
    name: 'New England Patriots',
    abbreviation: 'NE',
    logo: 'https://example.com/ne.png',
    score: 24,
    record: { wins: 10, losses: 7, ties: 0 },
    color: '#002244',
  },
  awayTeam: {
    id: '3',
    name: 'Buffalo Bills',
    abbreviation: 'BUF',
    logo: 'https://example.com/buf.png',
    score: 21,
    record: { wins: 12, losses: 5, ties: 0 },
    color: '#00338D',
  },
  status: 'final',
  clock: '0:00',
  quarter: 4,
  season: 2025,
  week: 18,
  seasonType: 2,
  seasonName: 'Regular Season',
};

describe('CacheService - Scoreboard Caching', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should save scoreboard to localStorage', () => {
    const games = [mockGame];
    saveScoreboardToCache(games, 'nfl');

    const cached = localStorage.getItem('scoreboard_cache');
    expect(cached).toBeTruthy();

    const parsed = JSON.parse(cached!);
    expect(parsed.games).toHaveLength(1);
    expect(parsed.sport).toBe('nfl');
    expect(parsed.timestamp).toBeGreaterThan(0);
  });

  it('should retrieve scoreboard from cache', () => {
    const games = [mockGame];
    saveScoreboardToCache(games, 'nfl');

    const retrieved = getScoreboardFromCache('nfl');
    expect(retrieved).toHaveLength(1);
    expect(retrieved![0].id).toBe('game123');
  });

  it('should return null if sport does not match', () => {
    const games = [mockGame];
    saveScoreboardToCache(games, 'nfl');

    const retrieved = getScoreboardFromCache('bundesliga');
    expect(retrieved).toBeNull();
  });

  it('should return null if cache expired (>24 hours)', () => {
    vi.useFakeTimers();

    const games = [mockGame];
    saveScoreboardToCache(games, 'nfl');

    // Advance time by 25 hours
    vi.advanceTimersByTime(25 * 60 * 60 * 1000);

    const retrieved = getScoreboardFromCache('nfl');
    expect(retrieved).toBeNull();

    vi.useRealTimers();
  });

  it('should return cached data if within 24 hours', () => {
    vi.useFakeTimers();

    const games = [mockGame];
    saveScoreboardToCache(games, 'nfl');

    // Advance time by 23 hours (still valid)
    vi.advanceTimersByTime(23 * 60 * 60 * 1000);

    const retrieved = getScoreboardFromCache('nfl');
    expect(retrieved).toHaveLength(1);
    expect(retrieved![0].id).toBe('game123');

    vi.useRealTimers();
  });

  it('should get cache timestamp', () => {
    const games = [mockGame];
    saveScoreboardToCache(games, 'nfl');

    const timestamp = getScoreboardCacheTimestamp();
    expect(timestamp).toBeInstanceOf(Date);
    expect(timestamp!.getTime()).toBeLessThanOrEqual(Date.now());
  });

  it('should return null timestamp if no cache', () => {
    const timestamp = getScoreboardCacheTimestamp();
    expect(timestamp).toBeNull();
  });
});

describe('CacheService - Game Details Caching', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should save game details to localStorage', () => {
    saveGameDetailsToCache('game123', mockGame, null);

    const cached = localStorage.getItem('game_details_cache');
    expect(cached).toBeTruthy();

    const parsed = JSON.parse(cached!);
    expect(parsed.game123).toBeDefined();
    expect(parsed.game123.gameId).toBe('game123');
  });

  it('should retrieve game details from cache', () => {
    saveGameDetailsToCache('game123', mockGame, null);

    const retrieved = getGameDetailsFromCache('game123');
    expect(retrieved).toBeDefined();
    expect(retrieved!.game.id).toBe('game123');
    expect(retrieved!.stats).toBeNull();
  });

  it('should return null if game not in cache', () => {
    const retrieved = getGameDetailsFromCache('nonexistent');
    expect(retrieved).toBeNull();
  });

  it('should return null if cache expired (>1 hour)', () => {
    vi.useFakeTimers();

    saveGameDetailsToCache('game123', mockGame, null);

    // Advance time by 2 hours
    vi.advanceTimersByTime(2 * 60 * 60 * 1000);

    const retrieved = getGameDetailsFromCache('game123');
    expect(retrieved).toBeNull();

    vi.useRealTimers();
  });

  it('should keep only last 10 games to prevent bloat', () => {
    let currentTime = 1000000;
    vi.spyOn(Date, 'now').mockImplementation(() => currentTime);

    // Add 12 games with incrementing timestamps
    for (let i = 1; i <= 12; i++) {
      const game = { ...mockGame, id: `game${i}` };
      saveGameDetailsToCache(`game${i}`, game, null);
      currentTime += 1000; // Increment time by 1 second for each game
    }

    const cached = localStorage.getItem('game_details_cache');
    const parsed = JSON.parse(cached!);
    const keys = Object.keys(parsed);

    // Should only have 10 entries
    expect(keys).toHaveLength(10);

    // Should have kept the newest ones (game3-game12)
    expect(parsed.game3).toBeDefined();
    expect(parsed.game12).toBeDefined();

    // Should have evicted oldest (game1, game2)
    expect(parsed.game1).toBeUndefined();
    expect(parsed.game2).toBeUndefined();

    vi.restoreAllMocks();
  });
});

describe('CacheService - Cache Metadata', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should track last successful fetch time', () => {
    const games = [mockGame];
    saveScoreboardToCache(games, 'nfl');

    const lastFetch = getLastSuccessfulFetchTime();
    expect(lastFetch).toBeInstanceOf(Date);
    expect(lastFetch!.getTime()).toBeLessThanOrEqual(Date.now());
  });

  it('should return null if no successful fetch', () => {
    const lastFetch = getLastSuccessfulFetchTime();
    expect(lastFetch).toBeNull();
  });

  it('should update metadata on each save', () => {
    vi.useFakeTimers();

    saveScoreboardToCache([mockGame], 'nfl');
    const firstFetch = getLastSuccessfulFetchTime();

    vi.advanceTimersByTime(5000); // 5 seconds

    saveScoreboardToCache([mockGame], 'nfl');
    const secondFetch = getLastSuccessfulFetchTime();

    expect(secondFetch!.getTime()).toBeGreaterThan(firstFetch!.getTime());

    vi.useRealTimers();
  });
});

describe('CacheService - Cache Headers Parsing', () => {
  it('should parse stale cache status', () => {
    const headers = new Headers({
      'X-Cache-Status': 'stale',
      'X-Cache-Age': '120',
      'X-API-Error': 'Network timeout',
    });

    const mockResponse = { headers } as Response;
    const info = parseCacheHeaders(mockResponse);

    expect(info.isStale).toBe(true);
    expect(info.cacheAge).toBe(120);
    expect(info.apiError).toBe('Network timeout');
  });

  it('should parse fresh cache status', () => {
    const headers = new Headers({
      'X-Cache-Status': 'fresh',
    });

    const mockResponse = { headers } as Response;
    const info = parseCacheHeaders(mockResponse);

    expect(info.isStale).toBe(false);
    expect(info.cacheAge).toBeNull();
    expect(info.apiError).toBeNull();
  });

  it('should handle missing headers', () => {
    const headers = new Headers();
    const mockResponse = { headers } as Response;
    const info = parseCacheHeaders(mockResponse);

    expect(info.isStale).toBe(false);
    expect(info.cacheAge).toBeNull();
    expect(info.apiError).toBeNull();
  });
});

describe('CacheService - Clear Cache', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should clear all cached data', () => {
    // Add data
    saveScoreboardToCache([mockGame], 'nfl');
    saveGameDetailsToCache('game123', mockGame, null);

    expect(localStorage.getItem('scoreboard_cache')).toBeTruthy();
    expect(localStorage.getItem('game_details_cache')).toBeTruthy();

    // Clear
    clearCache();

    expect(localStorage.getItem('scoreboard_cache')).toBeNull();
    expect(localStorage.getItem('game_details_cache')).toBeNull();
    expect(localStorage.getItem('cache_metadata')).toBeNull();
  });
});

describe('CacheService - Error Handling', () => {
  it('should handle localStorage quota exceeded', () => {
    // Mock localStorage to throw quota exceeded error
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = vi.fn(() => {
      throw new Error('QuotaExceededError');
    });

    // Should not throw, just log warning
    expect(() => saveScoreboardToCache([mockGame], 'nfl')).not.toThrow();

    // Restore
    localStorage.setItem = originalSetItem;
  });

  it('should handle corrupted cache data', () => {
    // Set invalid JSON
    localStorage.setItem('scoreboard_cache', 'invalid-json{');

    // Should return null instead of throwing
    const result = getScoreboardFromCache('nfl');
    expect(result).toBeNull();
  });

  it('should handle missing timestamp in cache', () => {
    // Set cache without timestamp
    localStorage.setItem('scoreboard_cache', JSON.stringify({
      games: [mockGame],
      sport: 'nfl',
      // Missing timestamp
    }));

    // Should handle gracefully
    const result = getScoreboardFromCache('nfl');
    // Will fail age check since timestamp is undefined/0
    expect(result).toBeNull();
  });
});
