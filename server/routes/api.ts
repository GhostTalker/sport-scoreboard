/**
 * API Routes for Sports Scoreboard
 *
 * Provides endpoints for:
 * - NFL data (via ESPN proxy with resilience features)
 * - Bundesliga data (via OpenLigaDB proxy)
 * - Health checks with detailed circuit breaker status
 * - Admin endpoints for manual intervention
 */

import { Router, Response } from 'express';
import { espnProxy, FetchResult } from '../services/espnProxy';
import { openligadbProxy } from '../services/openligadbProxy';

// Force stdout/stderr for PM2
const logError = (msg: string, ...args: unknown[]) => {
  process.stderr.write(msg + ' ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') + '\n');
};

// Track server start time for uptime calculation
const serverStartTime = Date.now();

export const apiRouter = Router();

// ═══════════════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════════════

/**
 * Handle FetchResult and set appropriate headers for frontend
 * Adds X-Cache-Status and X-Cache-Age headers so frontend can show
 * "Last updated X mins ago" banners when serving stale data
 */
function handleFetchResult(res: Response, result: FetchResult): void {
  // Add cache metadata headers for frontend awareness
  res.set('X-Cache-Status', result.fromCache ? 'HIT' : 'MISS');

  if (result.cacheAge !== undefined && result.cacheAge > 0) {
    res.set('X-Cache-Age', String(Math.round(result.cacheAge / 1000))); // Age in seconds
  }

  if (result.error) {
    // We're serving stale data due to API error - include error info
    res.set('X-API-Error', result.error);
  }

  res.json(result.data);
}

/**
 * Format uptime seconds to human-readable string
 */
function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(' ');
}

// ═══════════════════════════════════════════════════════════════════════
// NFL Endpoints (ESPN Proxy with Resilience)
// ═══════════════════════════════════════════════════════════════════════

// GET /api/scoreboard - Get all current games
apiRouter.get('/scoreboard', async (_req, res) => {
  try {
    const result = await espnProxy.fetchScoreboard();
    handleFetchResult(res, result);
  } catch (error) {
    logError('[API Error] Scoreboard failed:', error instanceof Error ? error.message : error);
    if (error instanceof Error && error.stack) {
      logError('Stack trace:', error.stack);
    }
    res.status(500).json({
      error: 'Failed to fetch scoreboard',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/game/:gameId - Get detailed game data
apiRouter.get('/game/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    const result = await espnProxy.fetchGameDetails(gameId);
    handleFetchResult(res, result);
  } catch (error) {
    logError(`[API Error] Game ${req.params.gameId} failed:`, error instanceof Error ? error.message : error);
    if (error instanceof Error && error.stack) {
      logError('Stack trace:', error.stack);
    }
    res.status(500).json({
      error: 'Failed to fetch game details',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/plays/:gameId - Get play-by-play data (faster polling for live events)
apiRouter.get('/plays/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    const result = await espnProxy.fetchPlays(gameId);
    handleFetchResult(res, result);
  } catch (error) {
    logError(`[API Error] Plays ${req.params.gameId} failed:`, error instanceof Error ? error.message : error);
    res.status(500).json({
      error: 'Failed to fetch plays',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/schedule - Get schedule for specific week/season
apiRouter.get('/schedule', async (req, res) => {
  try {
    const { year, week, seasonType } = req.query;
    const result = await espnProxy.fetchSchedule(
      year ? parseInt(year as string) : undefined,
      week ? parseInt(week as string) : undefined,
      seasonType ? parseInt(seasonType as string) : undefined
    );
    handleFetchResult(res, result);
  } catch (error) {
    logError('[API Error] Schedule failed:', error instanceof Error ? error.message : error);
    if (error instanceof Error && error.stack) {
      logError('Stack trace:', error.stack);
    }
    res.status(500).json({
      error: 'Failed to fetch schedule',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/team/:teamId - Get team info
apiRouter.get('/team/:teamId', async (req, res) => {
  try {
    const { teamId } = req.params;
    const result = await espnProxy.fetchTeam(teamId);
    handleFetchResult(res, result);
  } catch (error) {
    logError('Error fetching team:', error);
    res.status(500).json({
      error: 'Failed to fetch team',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════
// Bundesliga Endpoints (OpenLigaDB)
// ═══════════════════════════════════════════════════════════════════════

// GET /api/bundesliga/current-group - Get current matchday info
apiRouter.get('/bundesliga/current-group', async (req, res) => {
  try {
    const { league = 'bl1' } = req.query;
    const data = await openligadbProxy.fetchCurrentGroup(league as string);
    res.json(data);
  } catch (error) {
    logError('[API Error] Bundesliga current group failed:', error instanceof Error ? error.message : error);
    if (error instanceof Error && error.stack) {
      logError('Stack trace:', error.stack);
    }
    res.status(500).json({
      error: 'Failed to fetch current matchday',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/bundesliga/matchday/:matchday - Get all matches for a matchday
apiRouter.get('/bundesliga/matchday/:matchday', async (req, res) => {
  try {
    const { matchday } = req.params;
    const { league = 'bl1', season } = req.query;

    // If season not provided, fetch current group first
    let seasonYear = season as string;
    if (!seasonYear) {
      const currentGroup = await openligadbProxy.fetchCurrentGroup(league as string) as { GroupYear?: string };
      seasonYear = currentGroup.GroupYear || new Date().getFullYear().toString();
    }

    const data = await openligadbProxy.fetchMatchday(
      league as string,
      seasonYear,
      parseInt(matchday)
    );
    res.json(data);
  } catch (error) {
    logError(`[API Error] Bundesliga matchday ${req.params.matchday} failed:`, error instanceof Error ? error.message : error);
    if (error instanceof Error && error.stack) {
      logError('Stack trace:', error.stack);
    }
    res.status(500).json({
      error: 'Failed to fetch matchday',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/bundesliga/match/:matchId - Get single match details
apiRouter.get('/bundesliga/match/:matchId', async (req, res) => {
  try {
    const { matchId } = req.params;
    const data = await openligadbProxy.fetchMatch(matchId);
    res.json(data);
  } catch (error) {
    logError(`[API Error] Bundesliga match ${req.params.matchId} failed:`, error instanceof Error ? error.message : error);
    if (error instanceof Error && error.stack) {
      logError('Stack trace:', error.stack);
    }
    res.status(500).json({
      error: 'Failed to fetch match',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════
// Health & Status Endpoints
// ═══════════════════════════════════════════════════════════════════════

/**
 * GET /api/health - Comprehensive health check
 *
 * Returns:
 * - Overall status (healthy/degraded)
 * - Server uptime and memory usage
 * - Cache statistics for both services
 * - Circuit breaker status (ESPN)
 * - Active request count
 *
 * Status logic:
 * - "healthy": Everything working normally
 * - "degraded": ESPN circuit breaker is open (serving cached data)
 */
apiRouter.get('/health', (_req, res) => {
  // Calculate uptime in seconds
  const uptimeMs = Date.now() - serverStartTime;
  const uptimeSeconds = Math.floor(uptimeMs / 1000);

  // Get memory usage from Node.js process
  const memUsage = process.memoryUsage();
  const heapUsedMB = Math.round(memUsage.heapUsed / (1024 * 1024) * 10) / 10;
  const heapTotalMB = Math.round(memUsage.heapTotal / (1024 * 1024) * 10) / 10;
  const rssMB = Math.round(memUsage.rss / (1024 * 1024) * 10) / 10;

  // Get cache and circuit breaker statistics
  const espnStats = espnProxy.getCacheStats();
  const espnCircuit = espnProxy.getCircuitStatus();
  const openligadbStats = openligadbProxy.getCacheStats();

  // Determine overall status based on circuit breaker
  const status = espnCircuit.isHealthy ? 'healthy' : 'degraded';

  res.json({
    status,
    uptime: uptimeSeconds,
    uptimeFormatted: formatUptime(uptimeSeconds),
    memory: {
      used: `${heapUsedMB}MB`,
      total: `${heapTotalMB}MB`,
      rss: `${rssMB}MB`,
      usedBytes: memUsage.heapUsed,
      totalBytes: memUsage.heapTotal,
    },
    services: {
      espn: {
        status: espnCircuit.isHealthy ? 'healthy' : 'degraded',
        circuitBreaker: {
          state: espnCircuit.state,
          failureCount: espnCircuit.failureCount,
          nextRetryIn: espnCircuit.nextRetryIn
            ? `${Math.round(espnCircuit.nextRetryIn / 1000)}s`
            : undefined,
        },
        activeRequests: espnStats.activeRequests,
      },
      openligadb: {
        status: 'healthy', // OpenLigaDB doesn't have circuit breaker yet
      },
    },
    cache: {
      espn: {
        size: espnStats.size,
        sizeBytes: espnStats.sizeBytes,
        entries: espnStats.entries,
        hitRate: espnStats.hitRate,
        hits: espnStats.hits,
        misses: espnStats.misses,
        maxSize: espnStats.maxSize,
      },
      openligadb: {
        size: openligadbStats.size,
        sizeBytes: openligadbStats.sizeBytes,
        entries: openligadbStats.entries,
        hitRate: openligadbStats.hitRate,
        hits: openligadbStats.hits,
        misses: openligadbStats.misses,
        maxSize: openligadbStats.maxSize,
      },
    },
    lastUpdate: new Date().toISOString(),
  });
});

/**
 * GET /api/health/live - Quick liveness check (for Kubernetes/PM2)
 * Returns 200 if server is running
 * This is the most basic health check - just confirms the process is alive
 */
apiRouter.get('/health/live', (_req, res) => {
  res.status(200).json({
    status: 'alive',
    timestamp: Date.now(),
  });
});

/**
 * GET /api/health/ready - Readiness check (for Kubernetes/PM2)
 * Returns status based on whether server is ready to accept traffic
 *
 * Unlike /health/live, this considers service health:
 * - 200 "ready": All systems operational
 * - 200 "degraded": ESPN API having issues but still serving cached data
 */
apiRouter.get('/health/ready', (_req, res) => {
  const espnCircuit = espnProxy.getCircuitStatus();

  if (espnCircuit.isHealthy) {
    res.status(200).json({
      status: 'ready',
      timestamp: Date.now(),
    });
  } else {
    // Return 200 but indicate degraded mode
    // This allows traffic through while warning about degraded service
    res.status(200).json({
      status: 'degraded',
      reason: 'ESPN API circuit breaker is open - serving cached data',
      circuitState: espnCircuit.state,
      nextRetryIn: espnCircuit.nextRetryIn
        ? `${Math.round(espnCircuit.nextRetryIn / 1000)}s`
        : undefined,
      timestamp: Date.now(),
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════
// Admin Endpoints (for manual intervention during incidents)
// ═══════════════════════════════════════════════════════════════════════

/**
 * POST /api/admin/reset-circuit - Manually reset ESPN circuit breaker
 *
 * Use this if you know ESPN is back online but the circuit breaker
 * hasn't auto-recovered yet (e.g., after a long outage)
 */
apiRouter.post('/admin/reset-circuit', (_req, res) => {
  espnProxy.resetCircuitBreaker();
  res.json({
    success: true,
    message: 'ESPN circuit breaker has been reset to CLOSED',
    timestamp: new Date().toISOString(),
  });
});

/**
 * POST /api/admin/clear-cache - Clear cached data
 *
 * Query params:
 * - service: 'espn' | 'bundesliga' | undefined (all)
 *
 * Use with caution - will cause a burst of API requests as cache refills
 */
apiRouter.post('/admin/clear-cache', (req, res) => {
  const { service } = req.query;

  if (service === 'espn' || !service) {
    espnProxy.clearCache();
  }
  if (service === 'bundesliga' || !service) {
    openligadbProxy.clearCache();
  }

  res.json({
    success: true,
    message: service ? `${service} cache cleared` : 'All caches cleared',
    timestamp: new Date().toISOString(),
  });
});

/**
 * POST /api/admin/cancel-requests - Cancel all active ESPN API requests
 *
 * Use during emergencies to immediately stop all outgoing requests
 * (e.g., if ESPN is causing timeouts that block shutdown)
 */
apiRouter.post('/admin/cancel-requests', (_req, res) => {
  espnProxy.cancelAllRequests();
  res.json({
    success: true,
    message: 'All active ESPN requests have been cancelled',
    timestamp: new Date().toISOString(),
  });
});
