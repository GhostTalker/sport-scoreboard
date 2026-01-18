# Resilience Architecture Guide

This document provides a comprehensive technical deep-dive into the resilience features implemented in Sport-Scoreboard v3.3.0. These features ensure the application remains functional during API failures, network issues, and extended viewing sessions.

## Table of Contents

- [Overview](#overview)
- [Exponential Backoff](#exponential-backoff)
- [Circuit Breaker Pattern](#circuit-breaker-pattern)
- [LRU Cache Implementation](#lru-cache-implementation)
- [Stale Data Strategy](#stale-data-strategy)
- [Request Timeout Management](#request-timeout-management)
- [Graceful Shutdown](#graceful-shutdown)
- [Frontend Resilience](#frontend-resilience)
- [Monitoring & Observability](#monitoring--observability)
- [Troubleshooting Guide](#troubleshooting-guide)
- [Best Practices](#best-practices)

---

## Overview

### Design Philosophy

The resilience architecture follows these principles:

1. **Fail gracefully** - Never show a blank screen; always display something meaningful
2. **Recover automatically** - Self-heal without manual intervention when possible
3. **Preserve user experience** - Stale data is better than no data during live events
4. **Bounded resources** - Memory and connections have explicit limits
5. **Observable** - Health endpoints expose internal state for monitoring

### Architecture Diagram

```
                                    +-----------------+
                                    |   ESPN API      |
                                    |   OpenLigaDB    |
                                    +-----------------+
                                           |
                                           v
+------------------+              +------------------+
|                  |              |                  |
|  Request Queue   |<------------>|  Circuit Breaker |
|  (AbortController)|             |  (State Machine) |
|                  |              |                  |
+------------------+              +------------------+
         |                                 |
         v                                 v
+------------------+              +------------------+
|                  |              |                  |
|  Retry Logic     |              |  LRU Cache       |
|  (Exp. Backoff)  |              |  (100MB limit)   |
|                  |              |                  |
+------------------+              +------------------+
         |                                 |
         +-----------------+---------------+
                           |
                           v
                  +------------------+
                  |                  |
                  |  Express Server  |
                  |  (Health, Admin) |
                  |                  |
                  +------------------+
                           |
                           v
                  +------------------+
                  |                  |
                  |  Frontend        |
                  |  (React + Zustand)|
                  |                  |
                  +------------------+
                           |
                           v
                  +------------------+
                  |                  |
                  |  LocalStorage    |
                  |  (24h cache)     |
                  |                  |
                  +------------------+
```

---

## Exponential Backoff

### How It Works

When an API request fails, instead of immediately retrying (which could overwhelm a recovering service), the system waits progressively longer between attempts:

```
Attempt 1: Wait 2 seconds
Attempt 2: Wait 5 seconds  (2s * 2.5)
Attempt 3: Wait 15 seconds (5s * 3)
Attempt 4: Wait 60 seconds (capped)
```

### Configuration

Located in `server/services/espnProxy.ts`:

```typescript
const RETRY_CONFIG = {
  maxRetries: 4,
  initialDelay: 2000,      // 2 seconds
  maxDelay: 60000,         // 60 seconds (cap)
  delayMultiplier: 2.5,    // Exponential factor
  jitter: 0.1              // 10% randomization
};
```

### Jitter

A small random variation (jitter) is added to prevent the "thundering herd" problem where multiple clients retry simultaneously:

```typescript
const jitter = delay * RETRY_CONFIG.jitter * Math.random();
const actualDelay = delay + jitter;
```

### When Retries Occur

Retries are triggered for:
- HTTP 5xx errors (server errors)
- Network timeouts
- Connection refused

Retries are NOT triggered for:
- HTTP 4xx errors (client errors)
- Successful responses with empty data
- Circuit breaker OPEN state

### Code Example

```typescript
async function fetchWithRetry(url: string): Promise<Response> {
  let lastError: Error;
  let delay = RETRY_CONFIG.initialDelay;

  for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(10000)
      });

      if (response.ok) {
        return response;
      }

      if (response.status >= 500) {
        throw new Error(`Server error: ${response.status}`);
      }

      // 4xx errors - don't retry
      return response;

    } catch (error) {
      lastError = error;

      if (attempt < RETRY_CONFIG.maxRetries) {
        const jitter = delay * RETRY_CONFIG.jitter * Math.random();
        await sleep(delay + jitter);
        delay = Math.min(delay * RETRY_CONFIG.delayMultiplier, RETRY_CONFIG.maxDelay);
      }
    }
  }

  throw lastError;
}
```

---

## Circuit Breaker Pattern

### Concept

The circuit breaker prevents cascading failures by "opening" when too many errors occur, stopping all requests to a failing service until it recovers.

### State Machine

```
        +--------+
        | CLOSED |  <-- Normal operation
        +--------+
             |
             | (3 consecutive failures)
             v
        +--------+
        |  OPEN  |  <-- All requests blocked
        +--------+
             |
             | (30 second cooldown)
             v
        +-----------+
        | HALF_OPEN |  <-- Testing recovery
        +-----------+
             |
      +------+------+
      |             |
   success       failure
      |             |
      v             v
  +--------+    +--------+
  | CLOSED |    |  OPEN  |
  +--------+    +--------+
```

### States Explained

| State | Behavior | Transition |
|-------|----------|------------|
| **CLOSED** | Normal operation. Requests pass through. Failures increment counter. | Opens after 3 consecutive failures |
| **OPEN** | All requests blocked. Returns cached data immediately. | Transitions to HALF_OPEN after 30s cooldown |
| **HALF_OPEN** | Allows single test request. If successful, closes. If fails, reopens. | Success -> CLOSED, Failure -> OPEN |

### Configuration

```typescript
const CIRCUIT_BREAKER_CONFIG = {
  failureThreshold: 3,    // Failures before opening
  cooldownMs: 30000,      // Time before testing recovery
  successThreshold: 1     // Successes needed to close
};
```

### Monitoring Circuit Breaker State

```bash
curl http://10.1.0.51:3001/api/health | jq '.circuitBreaker'
# {
#   "state": "CLOSED",
#   "failures": 0,
#   "lastFailure": null,
#   "openedAt": null
# }
```

### Manual Reset

If the circuit breaker is stuck open after the API recovers:

```bash
curl -X POST http://10.1.0.51:3001/api/admin/reset-circuit
```

---

## LRU Cache Implementation

### What is LRU?

LRU (Least Recently Used) is a cache eviction policy that removes the oldest unused entries when the cache reaches its size limit. This ensures frequently accessed data stays cached while rarely used data is evicted.

### Implementation Details

Located in `server/services/cache.ts`:

```typescript
import { LRUCache } from 'lru-cache';

const cache = new LRUCache<string, CacheEntry>({
  max: 1000,                    // Maximum entries
  maxSize: 100 * 1024 * 1024,   // 100MB in bytes
  sizeCalculation: (value) => {
    return JSON.stringify(value).length;
  },
  ttl: 15 * 1000,               // 15 seconds for live data
  allowStale: true,             // Return stale data during refresh
  updateAgeOnGet: true          // Reset TTL on access
});
```

### Cache Key Strategy

Cache keys include query parameters to ensure isolation:

```typescript
function getCacheKey(endpoint: string, params: Record<string, string>): string {
  const sortedParams = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&');
  return `${endpoint}?${sortedParams}`;
}

// Examples:
// "scoreboard?week=18&seasonType=2"
// "game?id=401547789"
// "schedule?year=2026&week=1"
```

### TTL Configuration

| Data Type | TTL | Stale TTL | Rationale |
|-----------|-----|-----------|-----------|
| Live game data | 15s | 5 min | Fresh data critical during games |
| Schedule data | 5 min | 1 hour | Changes infrequently |
| Game details | 30s | 10 min | Stats update periodically |

### Cache Metrics

The cache exposes metrics via `/api/health`:

```json
{
  "cache": {
    "espn": {
      "size": "45MB",
      "entries": 127,
      "hitRate": 0.87,
      "hits": 1523,
      "misses": 227
    }
  }
}
```

### Memory Management

The 100MB limit per service prevents unbounded growth:

```
Before v3.3.0:
  Map-based cache -> Unbounded growth -> Memory exhaustion after hours

After v3.3.0:
  LRU cache -> 100MB cap -> Automatic eviction -> Stable memory
```

---

## Stale Data Strategy

### The "Stale-While-Revalidate" Pattern

When cached data expires:
1. Immediately return the stale data to the user
2. Trigger a background refresh
3. Update the cache when fresh data arrives
4. Notify the user of the update

### Implementation Flow

```
User Request
     |
     v
+-------------+
| Check Cache |
+-------------+
     |
     +-- Cache HIT (fresh) --> Return data
     |
     +-- Cache HIT (stale) --> Return stale data
     |                              |
     |                              v
     |                     Trigger background refresh
     |
     +-- Cache MISS --> Fetch from API
                              |
                              v
                        Update cache
                              |
                              v
                        Return data
```

### Frontend Stale Banner

When showing stale data, users see:

```
+---------------------------------------------------+
|  Using cached data from 45 seconds ago            |
|  [Retrying in background...]                      |
+---------------------------------------------------+
```

The banner auto-dismisses with a green checkmark animation when fresh data arrives.

### LocalStorage Persistence

Frontend cache persists across page reloads:

```typescript
// src/services/cacheService.ts

interface CacheEntry {
  data: unknown;
  timestamp: number;
  ttl: number;
}

const CACHE_CONFIG = {
  scoreboard: { ttl: 24 * 60 * 60 * 1000 },  // 24 hours
  gameDetails: { ttl: 60 * 60 * 1000 }        // 1 hour
};

function saveToCache(key: string, data: unknown): void {
  const entry: CacheEntry = {
    data,
    timestamp: Date.now(),
    ttl: CACHE_CONFIG[key]?.ttl || 3600000
  };
  localStorage.setItem(`scoreboard_${key}`, JSON.stringify(entry));
}

function loadFromCache(key: string): unknown | null {
  const raw = localStorage.getItem(`scoreboard_${key}`);
  if (!raw) return null;

  const entry: CacheEntry = JSON.parse(raw);
  const age = Date.now() - entry.timestamp;

  if (age > entry.ttl) {
    // Stale but still usable
    return { data: entry.data, stale: true, age };
  }

  return { data: entry.data, stale: false, age: 0 };
}
```

---

## Request Timeout Management

### Why Timeouts Matter

Without timeouts:
- Slow API responses block the event loop
- Memory accumulates from pending promises
- Users see infinite loading spinners
- Application becomes unresponsive

### AbortController Implementation

```typescript
// server/services/espnProxy.ts

const activeRequests = new Map<string, AbortController>();

async function fetchWithTimeout(
  url: string,
  requestId: string
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  activeRequests.set(requestId, controller);

  try {
    const response = await fetch(url, {
      signal: controller.signal
    });
    return response;
  } finally {
    clearTimeout(timeoutId);
    activeRequests.delete(requestId);
  }
}

// Cancel a specific request
function cancelRequest(requestId: string): boolean {
  const controller = activeRequests.get(requestId);
  if (controller) {
    controller.abort();
    activeRequests.delete(requestId);
    return true;
  }
  return false;
}

// Cancel all active requests
function cancelAllRequests(): number {
  let cancelled = 0;
  for (const [id, controller] of activeRequests) {
    controller.abort();
    activeRequests.delete(id);
    cancelled++;
  }
  return cancelled;
}
```

### Timeout Configuration

| Operation | Timeout | Rationale |
|-----------|---------|-----------|
| ESPN API | 10s | Typical response is 200-500ms |
| OpenLigaDB | 10s | European API, higher latency |
| Health check | 5s | Should be fast |

---

## Graceful Shutdown

### Why Graceful Shutdown Matters

During deployments:
- Without: Connections reset, users see errors
- With: Active requests complete, then server stops

### Implementation

```typescript
// server/index.ts

const server = app.listen(PORT);

let isShuttingDown = false;

async function gracefulShutdown(signal: string): Promise<void> {
  console.log(`Received ${signal}. Starting graceful shutdown...`);

  if (isShuttingDown) return;
  isShuttingDown = true;

  // Stop accepting new connections
  server.close(() => {
    console.log('HTTP server closed');
  });

  // Cancel pending API requests
  const cancelled = cancelAllRequests();
  console.log(`Cancelled ${cancelled} pending requests`);

  // Wait for active requests (max 5 seconds)
  const shutdownTimeout = setTimeout(() => {
    console.log('Forcing shutdown after timeout');
    process.exit(1);
  }, 5000);

  // Wait for server to close
  await new Promise<void>(resolve => {
    server.on('close', () => {
      clearTimeout(shutdownTimeout);
      resolve();
    });
  });

  console.log('Graceful shutdown complete');
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
```

### PM2 Integration

PM2 sends SIGINT first, then SIGTERM after 1.6 seconds:

```javascript
// ecosystem.config.cjs
module.exports = {
  apps: [{
    name: 'nfl-scoreboard',
    script: 'npm',
    args: 'run start:prod',
    kill_timeout: 5000,       // Wait 5s before SIGKILL
    wait_ready: true,         // Wait for ready signal
    listen_timeout: 10000     // Max startup time
  }]
};
```

---

## Frontend Resilience

### Skeleton Loading

Instead of blank screens during loading:

```typescript
// src/components/LoadingSkeleton.tsx

export function MainScoreboardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex justify-between">
        {/* Team 1 skeleton */}
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 bg-slate-700 rounded-full" />
          <div className="w-32 h-6 bg-slate-700 rounded mt-4" />
        </div>

        {/* Score skeleton */}
        <div className="flex items-center">
          <div className="w-16 h-20 bg-slate-700 rounded" />
          <div className="w-8 h-8 bg-slate-700 rounded mx-4" />
          <div className="w-16 h-20 bg-slate-700 rounded" />
        </div>

        {/* Team 2 skeleton */}
        <div className="flex flex-col items-center">
          <div className="w-24 h-24 bg-slate-700 rounded-full" />
          <div className="w-32 h-6 bg-slate-700 rounded mt-4" />
        </div>
      </div>
    </div>
  );
}
```

### Memory Leak Prevention

Fixed setTimeout cleanup in useScoreChange:

```typescript
// src/hooks/useScoreChange.ts

export function useScoreChange(currentGame: Game | null) {
  const activeTimeouts = useRef<Set<NodeJS.Timeout>>(new Set());

  useEffect(() => {
    // Cleanup function runs on unmount or game change
    return () => {
      for (const timeout of activeTimeouts.current) {
        clearTimeout(timeout);
      }
      activeTimeouts.current.clear();
    };
  }, [currentGame?.id]);

  const triggerCelebration = useCallback((type: CelebrationType) => {
    // Clear any existing timeout
    for (const timeout of activeTimeouts.current) {
      clearTimeout(timeout);
    }
    activeTimeouts.current.clear();

    // Show celebration
    showCelebration(type);

    // Schedule hide
    const timeout = setTimeout(() => {
      hideCelebration();
      activeTimeouts.current.delete(timeout);
    }, 5000);

    activeTimeouts.current.add(timeout);
  }, []);

  // ... rest of hook
}
```

---

## Monitoring & Observability

### Health Endpoint Structure

```bash
GET /api/health
```

Response:
```json
{
  "status": "healthy",
  "uptime": 43200,
  "version": "3.3.0",
  "memory": {
    "used": "145MB",
    "limit": "500MB",
    "percentage": 29,
    "heapUsed": "98MB",
    "external": "12MB"
  },
  "cache": {
    "espn": {
      "size": "45MB",
      "entries": 127,
      "hitRate": 0.87,
      "hits": 1523,
      "misses": 227
    },
    "openligadb": {
      "size": "12MB",
      "entries": 34,
      "hitRate": 0.92,
      "hits": 892,
      "misses": 78
    }
  },
  "circuitBreaker": {
    "state": "CLOSED",
    "failures": 0,
    "lastFailure": null,
    "openedAt": null
  },
  "activeRequests": 2,
  "lastUpdate": "2026-01-17T18:45:23Z"
}
```

### Status Interpretation

| Status | HTTP Code | Meaning |
|--------|-----------|---------|
| `healthy` | 200 | All systems operational |
| `degraded` | 200 | Functional but circuit breaker is recovering |
| `unhealthy` | 503 | Circuit breaker OPEN, returning cached data only |

### Metrics for Alerting

| Metric | Warning Threshold | Critical Threshold |
|--------|-------------------|-------------------|
| Memory % | > 70% | > 90% |
| Cache hit rate | < 0.7 | < 0.5 |
| Circuit breaker | HALF_OPEN | OPEN |
| Active requests | > 20 | > 50 |

---

## Troubleshooting Guide

### Circuit Breaker Stuck Open

**Symptoms:**
- All API requests return cached data
- `/api/health` shows `circuitBreaker.state: "OPEN"`
- Fresh scores not updating

**Diagnosis:**
```bash
# Check circuit breaker state
curl http://10.1.0.51:3001/api/health | jq '.circuitBreaker'

# Check ESPN API directly
curl -I https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard
```

**Resolution:**
```bash
# If ESPN API is responding, reset circuit breaker
curl -X POST http://10.1.0.51:3001/api/admin/reset-circuit
```

### High Cache Miss Rate

**Symptoms:**
- `/api/health` shows `hitRate < 0.5`
- Slow response times
- High API request volume

**Diagnosis:**
```bash
# Check cache metrics
curl http://10.1.0.51:3001/api/health | jq '.cache'

# Check memory usage
curl http://10.1.0.51:3001/api/health | jq '.memory'
```

**Resolution:**
- If memory is low, cache may be evicting too aggressively
- Check if cache keys are varying unexpectedly (query params)
- Consider increasing `maxSize` in cache config

### Memory Growing Unbounded

**Symptoms:**
- Memory percentage keeps increasing
- Eventually hits PM2 restart threshold (500MB)

**Diagnosis:**
```bash
# Monitor memory over time
watch -n 60 'curl -s http://localhost:3001/api/health | jq ".memory"'

# Check for leaked timers
pm2 logs nfl-scoreboard | grep -i timeout
```

**Resolution:**
- Check for setTimeout leaks in browser console
- Verify LRU cache limits are working
- Restart server to clear accumulated state

### Stale Data Banner Not Dismissing

**Symptoms:**
- Orange "Using cached data" banner persists
- Retry attempts keep failing

**Diagnosis:**
```bash
# Check if API is actually responding
curl http://10.1.0.51:3001/api/scoreboard

# Check circuit breaker
curl http://10.1.0.51:3001/api/health | jq '.circuitBreaker'
```

**Resolution:**
- If circuit breaker is OPEN, wait for cooldown or reset manually
- Clear browser localStorage: `localStorage.clear()`
- Hard refresh the page (Cmd+Shift+R)

---

## Best Practices

### Zero-Downtime Deployment

1. **Deploy 24 hours before events** - Let the system stabilize
2. **Use PM2 reload** - Not restart, for zero-downtime
3. **Check health before party** - Run pre-party validation script
4. **Have rollback ready** - Keep previous version tagged

```bash
# Zero-downtime deployment
pm2 reload ecosystem.config.cjs

# Quick rollback if issues
git checkout v3.2.1
npm run build
pm2 reload ecosystem.config.cjs
```

### Memory Management

1. **Monitor regularly** - Set up UptimeRobot alerts
2. **Restart weekly** - Fresh state prevents accumulation
3. **Check leaks** - Use browser DevTools Memory tab
4. **Size appropriately** - 100MB cache is usually sufficient

### Error Recovery

1. **Let automatic recovery work** - Don't immediately intervene
2. **Wait for cooldown** - Circuit breaker needs 30s to test
3. **Check root cause** - Is it network, API, or application issue?
4. **Document incidents** - Note what failed and how it recovered

---

## Appendix: Configuration Reference

### Backend Configuration

| Setting | Location | Default | Description |
|---------|----------|---------|-------------|
| `maxRetries` | `espnProxy.ts` | 4 | Maximum retry attempts |
| `initialDelay` | `espnProxy.ts` | 2000ms | First retry delay |
| `maxDelay` | `espnProxy.ts` | 60000ms | Maximum retry delay |
| `failureThreshold` | `espnProxy.ts` | 3 | Failures before circuit opens |
| `cooldownMs` | `espnProxy.ts` | 30000ms | Circuit breaker cooldown |
| `cacheMaxSize` | `cache.ts` | 100MB | Maximum cache size per service |
| `requestTimeout` | `espnProxy.ts` | 10000ms | API request timeout |
| `shutdownTimeout` | `index.ts` | 5000ms | Graceful shutdown window |

### Frontend Configuration

| Setting | Location | Default | Description |
|---------|----------|---------|-------------|
| `scoreboardTTL` | `cacheService.ts` | 24h | LocalStorage cache TTL for scoreboard |
| `gameDetailsTTL` | `cacheService.ts` | 1h | LocalStorage cache TTL for game details |
| `retryInterval` | `useGameData.ts` | 30000ms | Background retry interval when using stale data |
| `celebrationTimeout` | `useScoreChange.ts` | 5000ms | Celebration video display duration |

---

**Last Updated:** 2026-01-17 (v3.3.0)
