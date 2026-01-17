/**
 * ESPN API Proxy with LRU Caching, Exponential Backoff & Circuit Breaker
 *
 * Production-grade resilience features:
 * - LRU cache with size limits (100MB) for memory safety
 * - Exponential backoff retry (2s -> 5s -> 15s -> 60s)
 * - Circuit breaker (opens after 3 consecutive failures)
 * - Request timeout (10 seconds)
 * - Stale cache fallback when API is down
 * - Request cancellation support (AbortController)
 */

import { createCache, MetricsCache, CacheMetrics } from './cache';

const ESPN_BASE_URL = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl';

// Force stdout for PM2
const log = (msg: string) => process.stdout.write(msg + '\n');

// ═══════════════════════════════════════════════════════════════════════
// Type Definitions
// ═══════════════════════════════════════════════════════════════════════

/**
 * Cache entry wrapping data with timestamp for TTL-based invalidation
 */
interface CacheEntry {
  data: unknown;
  timestamp: number;
  lastSuccessfulFetch?: number; // When we last got fresh data from API
}

/**
 * Circuit breaker states:
 * - CLOSED: Normal operation, requests go through
 * - OPEN: Too many failures, requests blocked (returns cached data)
 * - HALF_OPEN: Testing if service recovered, allow one request through
 */
type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface CircuitBreakerState {
  state: CircuitState;
  failureCount: number;
  lastFailureTime: number;
  nextRetryTime: number;
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

// ═══════════════════════════════════════════════════════════════════════
// Configuration Constants
// ═══════════════════════════════════════════════════════════════════════

// Exponential backoff delays (in ms): 2s -> 5s -> 15s -> 60s
const BACKOFF_DELAYS = [2000, 5000, 15000, 60000];

// Circuit breaker opens after this many consecutive failures
const CIRCUIT_BREAKER_THRESHOLD = 3;

// Time to wait before attempting to close circuit (testing if service recovered)
const CIRCUIT_RESET_TIMEOUT = 30000; // 30 seconds

// Request timeout - abort if ESPN takes longer than this
const REQUEST_TIMEOUT_MS = 10000; // 10 seconds

// ═══════════════════════════════════════════════════════════════════════
// Cache Keys
// ═══════════════════════════════════════════════════════════════════════

export const CacheKeys = {
  SCOREBOARD: 'scoreboard',
  GAME: (id: string) => `game_${id}`,
  PLAYS: (id: string) => `plays_${id}`,
  SCHEDULE: (year: number, week: number, type: number) => `schedule_${year}_${week}_${type}`,
  TEAM: (id: string) => `team_${id}`,
} as const;

// ═══════════════════════════════════════════════════════════════════════
// ESPN Proxy Class
// ═══════════════════════════════════════════════════════════════════════

class ESPNProxy {
  private cache: MetricsCache<CacheEntry>;

  // TTL for cache entries when fresh (API working normally)
  private readonly TTL = {
    scoreboard: 15000,  // 15 seconds for live data
    game: 15000,        // 15 seconds for game details
    plays: 10000,       // 10 seconds for play-by-play (more frequent)
    schedule: 300000,   // 5 minutes for schedule
    team: 3600000,      // 1 hour for team info
  };

  // Extended TTL for serving stale data when API is down
  // We'll serve cached data up to this age when circuit is open
  private readonly STALE_TTL = {
    scoreboard: 300000,   // 5 minutes stale data acceptable
    game: 300000,         // 5 minutes
    plays: 300000,        // 5 minutes
    schedule: 3600000,    // 1 hour (schedule rarely changes)
    team: 86400000,       // 24 hours (team info very stable)
  };

  // Circuit breaker state for monitoring ESPN API health
  private circuitBreaker: CircuitBreakerState = {
    state: 'CLOSED',
    failureCount: 0,
    lastFailureTime: 0,
    nextRetryTime: 0,
  };

  // Track in-flight requests to support cancellation
  private activeControllers: Map<string, AbortController> = new Map();

  constructor() {
    // Initialize LRU cache with 100MB limit
    this.cache = createCache<CacheEntry>({
      name: 'ESPN',
      maxSize: 100 * 1024 * 1024, // 100MB
      defaultTTL: this.TTL.scoreboard,
    });
  }

  // ─────────────────────────────────────────────────────────────────────
  // Core Fetch with Timeout and Retry Logic
  // ─────────────────────────────────────────────────────────────────────

  /**
   * Fetch from ESPN API with timeout support
   * Aborts automatically after REQUEST_TIMEOUT_MS (10 seconds)
   *
   * @param url - ESPN API URL to fetch
   * @param signal - Optional AbortSignal for external cancellation
   * @returns Parsed JSON response
   * @throws Error if request fails or times out
   */
  private async fetchWithTimeout(url: string, signal?: AbortSignal): Promise<unknown> {
    // Create timeout controller - we'll race against the request
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => {
      timeoutController.abort();
    }, REQUEST_TIMEOUT_MS);

    // If we have an external signal, abort on either timeout or external
    const effectiveSignal = signal || timeoutController.signal;

    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'NFL-Scoreboard/3.0',
        },
        signal: effectiveSignal,
      });

      if (!response.ok) {
        throw new Error(`ESPN API error: ${response.status} ${response.statusText}`);
      }

      return response.json();
    } catch (error) {
      // Enhance timeout errors with clearer message
      if (error instanceof Error && error.name === 'AbortError') {
        if (!signal?.aborted) {
          throw new Error(`ESPN API timeout after ${REQUEST_TIMEOUT_MS}ms`);
        }
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Fetch with exponential backoff retry logic
   * This is the heart of our resilience system - it retries failed requests
   * with increasing delays: 2s -> 5s -> 15s -> 60s
   *
   * @param url - ESPN API URL to fetch
   * @param requestKey - Unique key for this request (used for cancellation tracking)
   * @returns Fetched data
   * @throws Error after all retries exhausted
   */
  private async fetchWithRetry(url: string, requestKey: string): Promise<unknown> {
    // Check circuit breaker state before attempting request
    if (this.isCircuitOpen()) {
      throw new Error('Circuit breaker is OPEN - ESPN API appears to be down');
    }

    // Cancel any existing request with the same key (prevent duplicates)
    this.cancelRequest(requestKey);

    // Create new controller for this request
    const controller = new AbortController();
    this.activeControllers.set(requestKey, controller);

    let lastError: Error | null = null;

    try {
      // Attempt request with retries (initial attempt + BACKOFF_DELAYS.length retries)
      for (let attempt = 0; attempt <= BACKOFF_DELAYS.length; attempt++) {
        try {
          // Check if we've been cancelled
          if (controller.signal.aborted) {
            throw new Error('Request cancelled');
          }

          const data = await this.fetchWithTimeout(url, controller.signal);

          // Success! Reset circuit breaker
          this.onRequestSuccess();

          return data;
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));

          // Don't retry if cancelled externally
          if (controller.signal.aborted || lastError.message === 'Request cancelled') {
            throw lastError;
          }

          // Check if this is a retryable error (network issues, 5xx errors)
          const isRetryable = this.isRetryableError(lastError);

          if (!isRetryable) {
            // Non-retryable error (4xx, parsing error) - fail immediately
            log(`[ESPN API] Non-retryable error: ${lastError.message}`);
            throw lastError;
          }

          // If we have more retries, wait with exponential backoff
          if (attempt < BACKOFF_DELAYS.length) {
            const delay = BACKOFF_DELAYS[attempt];
            log(`[ESPN API] Retry ${attempt + 1}/${BACKOFF_DELAYS.length} after ${delay}ms - Error: ${lastError.message}`);

            // Wait with backoff delay (can still be cancelled during wait)
            await this.sleep(delay);

            // Check cancellation after sleep
            if (controller.signal.aborted) {
              throw new Error('Request cancelled during backoff');
            }
          }
        }
      }

      // All retries exhausted - record failure for circuit breaker
      this.onRequestFailure();
      throw lastError || new Error('All retries exhausted');

    } finally {
      // Clean up controller
      this.activeControllers.delete(requestKey);
    }
  }

  /**
   * Check if an error is retryable (should we try again?)
   * We retry on network errors and 5xx server errors
   * We don't retry on 4xx client errors or parsing errors
   */
  private isRetryableError(error: Error): boolean {
    const message = error.message.toLowerCase();

    // Network errors are retryable
    if (message.includes('network') ||
        message.includes('timeout') ||
        message.includes('econnreset') ||
        message.includes('econnrefused') ||
        message.includes('enotfound') ||
        message.includes('socket') ||
        message.includes('epipe')) {
      return true;
    }

    // 5xx server errors are retryable
    if (message.includes('500') ||
        message.includes('502') ||
        message.includes('503') ||
        message.includes('504')) {
      return true;
    }

    // "Service unavailable" is retryable
    if (message.includes('service unavailable')) {
      return true;
    }

    // 4xx errors are NOT retryable (client error)
    if (message.includes('400') ||
        message.includes('401') ||
        message.includes('403') ||
        message.includes('404')) {
      return false;
    }

    // Default: retry unknown errors (better safe than sorry)
    return true;
  }

  // ─────────────────────────────────────────────────────────────────────
  // Circuit Breaker Logic
  // ─────────────────────────────────────────────────────────────────────

  /**
   * Check if circuit breaker is currently blocking requests
   * When OPEN, we return cached data instead of hitting the API
   */
  private isCircuitOpen(): boolean {
    const { state, nextRetryTime } = this.circuitBreaker;

    if (state === 'CLOSED') {
      return false;
    }

    if (state === 'OPEN') {
      // Check if it's time to try again (move to HALF_OPEN)
      if (Date.now() >= nextRetryTime) {
        log('[Circuit Breaker] Moving to HALF_OPEN state - testing if ESPN is back');
        this.circuitBreaker.state = 'HALF_OPEN';
        return false;
      }
      return true;
    }

    // HALF_OPEN state - allow request through to test
    return false;
  }

  /**
   * Called when a request succeeds - reset circuit breaker
   */
  private onRequestSuccess(): void {
    if (this.circuitBreaker.state !== 'CLOSED') {
      log('[Circuit Breaker] ESPN API recovered - circuit CLOSED');
    }

    this.circuitBreaker = {
      state: 'CLOSED',
      failureCount: 0,
      lastFailureTime: 0,
      nextRetryTime: 0,
    };
  }

  /**
   * Called when a request fails - update circuit breaker state
   */
  private onRequestFailure(): void {
    const now = Date.now();
    this.circuitBreaker.failureCount++;
    this.circuitBreaker.lastFailureTime = now;

    if (this.circuitBreaker.failureCount >= CIRCUIT_BREAKER_THRESHOLD) {
      // Too many failures - open the circuit
      this.circuitBreaker.state = 'OPEN';
      this.circuitBreaker.nextRetryTime = now + CIRCUIT_RESET_TIMEOUT;

      log(`[Circuit Breaker] OPEN after ${this.circuitBreaker.failureCount} failures - will retry at ${new Date(this.circuitBreaker.nextRetryTime).toISOString()}`);
    } else if (this.circuitBreaker.state === 'HALF_OPEN') {
      // Failed during test - back to OPEN
      this.circuitBreaker.state = 'OPEN';
      this.circuitBreaker.nextRetryTime = now + CIRCUIT_RESET_TIMEOUT;

      log('[Circuit Breaker] Failed during HALF_OPEN test - back to OPEN');
    }
  }

  // ─────────────────────────────────────────────────────────────────────
  // Cache Management (with Stale Data Support)
  // ─────────────────────────────────────────────────────────────────────

  /**
   * Get cached data if available and not expired
   * @param key - Cache key
   * @param ttl - Time-to-live in milliseconds
   * @returns Cached data or null if not found/expired
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
   * Get stale cached data (for fallback when API is down)
   * Uses extended TTL to return older data when circuit is open
   *
   * @param key - Cache key
   * @param staleTtl - Maximum age we'll accept for stale data
   * @returns Cache entry with age info, or null if too old/not found
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
   * TTL is set to STALE_TTL in LRU cache so entries remain available for fallback.
   * We do our own TTL validation in getCached for fresh vs stale checks.
   */
  private setCache(key: string, data: unknown, staleTtl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      lastSuccessfulFetch: Date.now(),
    }, staleTtl); // Use stale TTL so cache entries survive for fallback
  }

  // ─────────────────────────────────────────────────────────────────────
  // Request Cancellation (for sport switching & cleanup)
  // ─────────────────────────────────────────────────────────────────────

  /**
   * Cancel an active request by key
   * Used when switching sports or when a new request supersedes an old one
   */
  cancelRequest(requestKey: string): void {
    const controller = this.activeControllers.get(requestKey);
    if (controller) {
      controller.abort();
      this.activeControllers.delete(requestKey);
      log(`[ESPN API] Cancelled request: ${requestKey}`);
    }
  }

  /**
   * Cancel all active ESPN API requests
   * Used during graceful shutdown or when switching away from NFL
   */
  cancelAllRequests(): void {
    if (this.activeControllers.size === 0) return;

    log(`[ESPN API] Cancelling ${this.activeControllers.size} active request(s)`);
    for (const [key, controller] of this.activeControllers.entries()) {
      controller.abort();
      log(`[ESPN API] Cancelled: ${key}`);
    }
    this.activeControllers.clear();
  }

  // ─────────────────────────────────────────────────────────────────────
  // Utility Methods
  // ─────────────────────────────────────────────────────────────────────

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // ─────────────────────────────────────────────────────────────────────
  // Public API Methods (with resilience built-in)
  // ─────────────────────────────────────────────────────────────────────

  /**
   * Fetch scoreboard data with full resilience features
   * Returns cached data if API is down, with metadata about cache age
   */
  async fetchScoreboard(): Promise<FetchResult> {
    const cacheKey = CacheKeys.SCOREBOARD;
    const requestKey = 'scoreboard';

    // Check fresh cache first (fast path)
    const cached = this.getCached(cacheKey, this.TTL.scoreboard);
    if (cached) {
      log('[Cache HIT] Scoreboard');
      return { data: cached, fromCache: true, cacheAge: 0 };
    }

    // If circuit is open, try stale cache before failing
    if (this.isCircuitOpen()) {
      const staleEntry = this.getStaleCached(cacheKey, this.STALE_TTL.scoreboard);
      if (staleEntry) {
        const age = Date.now() - staleEntry.timestamp;
        log(`[Cache STALE] Scoreboard - circuit open, serving ${Math.round(age / 1000)}s old data`);
        return {
          data: staleEntry.data,
          fromCache: true,
          cacheAge: age,
          error: 'ESPN API unavailable - showing cached data',
        };
      }
    }

    // Try to fetch from API with retry logic
    try {
      log('[Cache MISS] Fetching scoreboard from ESPN...');
      const start = Date.now();
      const data = await this.fetchWithRetry(`${ESPN_BASE_URL}/scoreboard`, requestKey);
      const duration = Date.now() - start;
      log(`[ESPN API] Scoreboard fetched in ${duration}ms`);
      this.setCache(cacheKey, data, this.STALE_TTL.scoreboard);
      return { data, fromCache: false };
    } catch (error) {
      // API failed - try to return stale cache as fallback
      const staleEntry = this.getStaleCached(cacheKey, this.STALE_TTL.scoreboard);
      if (staleEntry) {
        const age = Date.now() - staleEntry.timestamp;
        log(`[Cache FALLBACK] Scoreboard - API error, serving ${Math.round(age / 1000)}s old data`);
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
   * Fetch game details with full resilience features
   */
  async fetchGameDetails(gameId: string): Promise<FetchResult> {
    const cacheKey = CacheKeys.GAME(gameId);
    const requestKey = `game_${gameId}`;

    const cached = this.getCached(cacheKey, this.TTL.game);
    if (cached) {
      log(`[Cache HIT] Game ${gameId}`);
      return { data: cached, fromCache: true, cacheAge: 0 };
    }

    if (this.isCircuitOpen()) {
      const staleEntry = this.getStaleCached(cacheKey, this.STALE_TTL.game);
      if (staleEntry) {
        const age = Date.now() - staleEntry.timestamp;
        log(`[Cache STALE] Game ${gameId} - circuit open, serving ${Math.round(age / 1000)}s old data`);
        return {
          data: staleEntry.data,
          fromCache: true,
          cacheAge: age,
          error: 'ESPN API unavailable - showing cached data',
        };
      }
    }

    try {
      log(`[Cache MISS] Fetching game ${gameId} from ESPN...`);
      const start = Date.now();
      const data = await this.fetchWithRetry(`${ESPN_BASE_URL}/summary?event=${gameId}`, requestKey);
      const duration = Date.now() - start;
      log(`[ESPN API] Game ${gameId} fetched in ${duration}ms`);
      this.setCache(cacheKey, data, this.STALE_TTL.game);
      return { data, fromCache: false };
    } catch (error) {
      const staleEntry = this.getStaleCached(cacheKey, this.STALE_TTL.game);
      if (staleEntry) {
        const age = Date.now() - staleEntry.timestamp;
        log(`[Cache FALLBACK] Game ${gameId} - API error, serving ${Math.round(age / 1000)}s old data`);
        return {
          data: staleEntry.data,
          fromCache: true,
          cacheAge: age,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
      throw error;
    }
  }

  /**
   * Fetch play-by-play data with full resilience features
   */
  async fetchPlays(gameId: string): Promise<FetchResult> {
    const cacheKey = CacheKeys.PLAYS(gameId);
    const requestKey = `plays_${gameId}`;

    const cached = this.getCached(cacheKey, this.TTL.plays);
    if (cached) {
      log(`[Cache HIT] Plays ${gameId}`);
      return { data: cached, fromCache: true, cacheAge: 0 };
    }

    if (this.isCircuitOpen()) {
      const staleEntry = this.getStaleCached(cacheKey, this.STALE_TTL.plays);
      if (staleEntry) {
        const age = Date.now() - staleEntry.timestamp;
        log(`[Cache STALE] Plays ${gameId} - circuit open, serving ${Math.round(age / 1000)}s old data`);
        return {
          data: staleEntry.data,
          fromCache: true,
          cacheAge: age,
          error: 'ESPN API unavailable - showing cached data',
        };
      }
    }

    try {
      log(`[Cache MISS] Fetching plays ${gameId} from ESPN...`);
      const start = Date.now();
      const rawData = await this.fetchWithRetry(`${ESPN_BASE_URL}/summary?event=${gameId}`, requestKey) as Record<string, unknown>;
      const duration = Date.now() - start;
      log(`[ESPN API] Plays ${gameId} fetched in ${duration}ms`);

      // Extract just the plays data to reduce payload size
      const situation = rawData.situation as Record<string, unknown> | undefined;
      const playsData = {
        drives: rawData.drives || [],
        plays: rawData.plays || [],
        scoringPlays: rawData.scoringPlays || [],
        lastPlay: situation?.lastPlay || null,
        situation: rawData.situation || null,
      };

      this.setCache(cacheKey, playsData, this.STALE_TTL.plays);
      return { data: playsData, fromCache: false };
    } catch (error) {
      const staleEntry = this.getStaleCached(cacheKey, this.STALE_TTL.plays);
      if (staleEntry) {
        const age = Date.now() - staleEntry.timestamp;
        log(`[Cache FALLBACK] Plays ${gameId} - API error, serving ${Math.round(age / 1000)}s old data`);
        return {
          data: staleEntry.data,
          fromCache: true,
          cacheAge: age,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
      throw error;
    }
  }

  /**
   * Fetch schedule for a specific week
   */
  async fetchSchedule(
    year?: number,
    week?: number,
    seasonType?: number
  ): Promise<FetchResult> {
    const currentYear = year || new Date().getFullYear();
    const currentWeek = week || 1;
    const currentType = seasonType || 2; // Regular season

    const cacheKey = CacheKeys.SCHEDULE(currentYear, currentWeek, currentType);
    const requestKey = `schedule_${currentYear}_${currentWeek}_${currentType}`;

    const cached = this.getCached(cacheKey, this.TTL.schedule);
    if (cached) {
      log(`[Cache HIT] Schedule ${currentYear}/${currentWeek}`);
      return { data: cached, fromCache: true, cacheAge: 0 };
    }

    if (this.isCircuitOpen()) {
      const staleEntry = this.getStaleCached(cacheKey, this.STALE_TTL.schedule);
      if (staleEntry) {
        const age = Date.now() - staleEntry.timestamp;
        log(`[Cache STALE] Schedule ${currentYear}/${currentWeek} - circuit open, serving ${Math.round(age / 1000)}s old data`);
        return {
          data: staleEntry.data,
          fromCache: true,
          cacheAge: age,
          error: 'ESPN API unavailable - showing cached data',
        };
      }
    }

    try {
      log(`[Cache MISS] Fetching schedule from ESPN...`);
      const url = `${ESPN_BASE_URL}/scoreboard?dates=${currentYear}&seasontype=${currentType}&week=${currentWeek}`;
      const data = await this.fetchWithRetry(url, requestKey);
      this.setCache(cacheKey, data, this.STALE_TTL.schedule);
      return { data, fromCache: false };
    } catch (error) {
      const staleEntry = this.getStaleCached(cacheKey, this.STALE_TTL.schedule);
      if (staleEntry) {
        const age = Date.now() - staleEntry.timestamp;
        log(`[Cache FALLBACK] Schedule ${currentYear}/${currentWeek} - API error, serving ${Math.round(age / 1000)}s old data`);
        return {
          data: staleEntry.data,
          fromCache: true,
          cacheAge: age,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
      throw error;
    }
  }

  /**
   * Fetch team info
   */
  async fetchTeam(teamId: string): Promise<FetchResult> {
    const cacheKey = CacheKeys.TEAM(teamId);
    const requestKey = `team_${teamId}`;

    const cached = this.getCached(cacheKey, this.TTL.team);
    if (cached) {
      log(`[Cache HIT] Team ${teamId}`);
      return { data: cached, fromCache: true, cacheAge: 0 };
    }

    if (this.isCircuitOpen()) {
      const staleEntry = this.getStaleCached(cacheKey, this.STALE_TTL.team);
      if (staleEntry) {
        const age = Date.now() - staleEntry.timestamp;
        log(`[Cache STALE] Team ${teamId} - circuit open, serving ${Math.round(age / 1000)}s old data`);
        return {
          data: staleEntry.data,
          fromCache: true,
          cacheAge: age,
          error: 'ESPN API unavailable - showing cached data',
        };
      }
    }

    try {
      log(`[Cache MISS] Fetching team ${teamId} from ESPN...`);
      const data = await this.fetchWithRetry(`${ESPN_BASE_URL}/teams/${teamId}`, requestKey);
      this.setCache(cacheKey, data, this.STALE_TTL.team);
      return { data, fromCache: false };
    } catch (error) {
      const staleEntry = this.getStaleCached(cacheKey, this.STALE_TTL.team);
      if (staleEntry) {
        const age = Date.now() - staleEntry.timestamp;
        log(`[Cache FALLBACK] Team ${teamId} - API error, serving ${Math.round(age / 1000)}s old data`);
        return {
          data: staleEntry.data,
          fromCache: true,
          cacheAge: age,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
      throw error;
    }
  }

  // ─────────────────────────────────────────────────────────────────────
  // Status & Management Methods
  // ─────────────────────────────────────────────────────────────────────

  /**
   * Get comprehensive cache statistics for health endpoint
   */
  getCacheStats(): CacheMetrics & {
    circuitBreaker: CircuitBreakerState;
    activeRequests: number;
  } {
    return {
      ...this.cache.getStats(),
      circuitBreaker: { ...this.circuitBreaker },
      activeRequests: this.activeControllers.size,
    };
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

  /**
   * Get circuit breaker status (for health checks and frontend)
   */
  getCircuitStatus(): {
    state: CircuitState;
    isHealthy: boolean;
    failureCount: number;
    nextRetryIn?: number;
  } {
    const { state, failureCount, nextRetryTime } = this.circuitBreaker;
    return {
      state,
      isHealthy: state === 'CLOSED',
      failureCount,
      nextRetryIn: state === 'OPEN' ? Math.max(0, nextRetryTime - Date.now()) : undefined,
    };
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Reset circuit breaker (for manual recovery via admin endpoint)
   */
  resetCircuitBreaker(): void {
    this.circuitBreaker = {
      state: 'CLOSED',
      failureCount: 0,
      lastFailureTime: 0,
      nextRetryTime: 0,
    };
    log('[Circuit Breaker] Manually reset to CLOSED');
  }
}

export const espnProxy = new ESPNProxy();
