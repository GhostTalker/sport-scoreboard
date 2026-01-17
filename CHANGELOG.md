# Changelog

All notable changes to the Sport-Scoreboard project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.3.0] - 2026-01-17

### Added - Backend Resilience
- **Exponential Backoff Retry Logic** for ESPN API requests
  - Retry delays: 2s -> 5s -> 15s -> 60s
  - Configurable max retries and delay multiplier
  - Prevents thundering herd during API recovery
- **Circuit Breaker Pattern** for external API calls
  - Opens after 3 consecutive failures
  - 30-second cooldown before half-open state
  - Automatic recovery testing with single request
  - States: CLOSED (normal), OPEN (blocking), HALF_OPEN (testing)
- **Request Timeout Configuration** (10s default)
  - AbortController for request cancellation
  - `cancelRequest(requestId)` method for individual cancellation
  - `cancelAllRequests()` method for bulk cancellation
  - Prevents memory leaks from abandoned fetches
- **Graceful Shutdown Handler** for zero-downtime deployments
  - SIGTERM/SIGINT signal handling
  - 5-second graceful shutdown window
  - Active requests complete before process exit
  - PM2 and Docker compatible
- **LRU Cache with Size Limits** (`server/services/cache.ts`)
  - 100MB limit per service (ESPN, OpenLigaDB)
  - Automatic eviction of least recently used entries
  - Cache metrics: size, entries, hitRate, hits, misses
- **Enhanced Health Endpoints**
  - `GET /api/health` - Full status with cache metrics and circuit breaker state
  - `GET /api/health/live` - Simple liveness probe (200 OK)
  - `GET /api/health/ready` - Readiness check (503 if degraded)
- **Admin Endpoints** for manual intervention
  - `POST /api/admin/reset-circuit` - Manually reset circuit breaker
  - `POST /api/admin/clear-cache?service=espn` - Clear service cache
  - `POST /api/admin/cancel-requests` - Cancel all active requests

### Added - Frontend Resilience
- **Offline Mode with Stale Data Fallback** (`src/services/cacheService.ts`)
  - LocalStorage cache persistence
  - 24-hour TTL for scoreboard data
  - 1-hour TTL for game details
  - Automatic fallback on API errors
- **Stale Data Warning Banner**
  - Orange banner with "Using cached data from X seconds ago"
  - Auto-retry every 30 seconds in background
  - Green checkmark animation on recovery
- **Skeleton Loading Screens** (`src/components/LoadingSkeleton.tsx`)
  - MainScoreboard skeleton with shimmer effect
  - GameCard skeleton for MultiView
  - StatsPanel skeleton for statistics view
  - Instant skeleton display instead of blank screen
- **Fixed setTimeout Cleanup** in useScoreChange hook
  - Proper cleanup on component unmount
  - Active timeout tracking with Set
  - Cleanup on game change to prevent stale timeouts

### Changed
- ESPN proxy now uses LRU cache instead of unbounded Map
- API errors show cached data instead of blank screen
- Cache store (`src/stores/cacheStore.ts`) manages frontend cache state

### Technical
- **Dependencies Added:**
  - `lru-cache@^10.x` for memory-bounded caching
- **New Files:**
  - `server/services/cache.ts` - LRU cache service with metrics
  - `src/stores/cacheStore.ts` - Frontend cache state management
  - `src/services/cacheService.ts` - LocalStorage cache persistence
  - `src/components/LoadingSkeleton.tsx` - Skeleton loading components

---

## [3.2.1] - 2026-01-17

### Security
- **CORS Restriction** - Limited to LAN origins only (10.1.0.51, localhost, 127.0.0.1)
- **API Rate Limiting** - Added express-rate-limit (100 requests per 15 minutes per IP)
- **Non-Root Deployment** - Created dedicated `scoreboard-app` user for production deployment

### Added
- **Feedback Button** - Added to settings menu with mailto: link including app context (version, sport, browser)
- **Error Boundary Component** - Graceful error handling with user-friendly fallback UI and recovery options
- **PM2 Log Rotation** - Configured pm2-logrotate module (10MB max file size, 7-day retention)

### Changed
- **Deployment User** - Production deployment now uses `scoreboard-app` user instead of root
- **CORS Policy** - Restricted from wildcard (*) to private network origins only
- **SSH Configuration** - Updated deployment credentials to use non-root user

### Technical
- New dependency: `express-rate-limit` for API protection
- PM2 module: `pm2-logrotate` installed and configured on production server
- Enhanced security posture for private network deployment

## [3.2.0] - 2026-01-15

### Added
- **UEFA Champions League Plugin** - Full support for European football
  - OpenLigaDB integration for Champions League matches
  - Round detection: Group Stage, Round of 16, Quarter-finals, Semi-finals, Final
  - Title graphics for all tournament rounds
  - Icon: uefa-logo.png, Logo: Logo_UEFA.png
  - Same celebration types as Bundesliga (goal, penalty, own goal, cards)
- **Hybrid API System for Bundesliga** - Intelligent dual-API approach for accurate live minutes
  - Primary: OpenLigaDB (15s polling) for goals, cards, events
  - Secondary: API-Football (optional, 100 req/day free tier) for live match minutes
  - Smart phase-based polling: 10min normal, 1min critical (injury time, restarts)
  - Fixes issues with delayed kickoffs, interruptions, and injury time variations
  - Falls back to estimation without API key (still functional)

### Changed
- Bundesliga polling interval optimized to 15 seconds (respects OpenLigaDB 1000/hour limit)
- UEFA Champions League uses same 15s polling interval as Bundesliga
- Updated README with comprehensive Bundesliga API setup guide

### Technical
- New service: `src/services/apiFootball.ts` for batch live fixture requests
- Enhanced BundesligaAdapter with phase detection and hybrid clock calculation
- Sport-specific polling intervals in useGameData hook
- New types: `UEFAGame`, `UEFACelebrationType` in `src/types/uefa.ts`
- Extended Game type union: `NFLGame | BundesligaGame | UEFAGame`
- Added `.env.example` for API-Football key configuration
- Competition type extended: added 'champions-league'

## [3.1.1] - 2026-01-14

### Changed
- Updated plugin logos in settings menu (Logo_NFL.png, Logo_Bundesliga.png)
- Updated favicon to professional scoreboard icon
- Sport selection logos updated (nfl-logo.png, bundesliga-logo.png)

### Removed
- Duplicate adapter files (nflAdapter.ts, bundesligaAdapter.ts, index.ts)
- Unused SettingsSidebar component
- 530 lines of redundant code

### Technical
- Fixed all 'any' type usage with proper TypeScript interfaces
- Added comprehensive OpenLigaDB API type definitions
- Improved type safety in settings migration handler
- Added deprecation comment to scoreDetector.ts
- Code review and cleanup completed

## [3.1.0] - 2026-01-14

### Added
- Horizontal tab menu for settings (Plugins, Videos, Sound, Language, Debug)
- Sound settings overlay with volume control
- Generic sport favicon (replaced NFL-specific icon)
- Version numbering in package.json

### Changed
- Settings UI redesign: moved sidebar buttons to horizontal tab menu above content
- All special settings now accessible via overlay pattern
- Sound button opens overlay instead of inline toggle
- Improved visual consistency across all settings overlays

### Fixed
- Sidebar positioning improved (closer to main content)

## [3.0.0] - 2026-01-13

### Added
- Complete plugin system architecture
- Plugin registry with lazy loading
- Dynamic plugin management (enable/disable plugins)
- Dual language support (German/English)
- i18n translation system
- Language selector in settings
- Browser language auto-detection
- Plugin management overlay
- Celebration videos overlay
- Debug controls overlay
- Sport tabs showing only enabled plugins

### Changed
- Refactored settings panel with tab-based navigation
- Competition selector color changed from green to blue
- Logo files consolidated to `/logos` folder
- Plugin manifests updated with correct logo paths (Logo_NFL.png, Logo_Bundesliga.png)

### Technical
- Upgraded to plugin-based architecture
- Settings store version 13 (with language support)
- Celebration settings for NFL and Bundesliga plugins
- Type-safe plugin system with TypeScript

## [2.0.x] - Previous Versions

### Features
- NFL and Bundesliga support
- Real-time score updates
- Celebration videos for game events
- Multi-view and single-view modes
- Game selector
- Settings panel with debug controls
- iPad-optimized display

---

## Version History Summary

- **v3.3.0** - Backend & frontend resilience: exponential backoff, circuit breaker, LRU cache, offline mode, skeleton loading
- **v3.2.1** - Security hardening: CORS restriction, rate limiting, non-root deployment, error boundary
- **v3.2.0** - UEFA Champions League plugin, hybrid API system for Bundesliga
- **v3.1.1** - Code cleanup, logo updates, type safety improvements (-530 lines)
- **v3.1.0** - UI redesign with horizontal tab menu, sound overlay, generic favicon
- **v3.0.0** - Plugin system, internationalization, settings redesign
- **v2.0.x** - Dual-sport support (NFL + Bundesliga), celebration videos
- **v1.0.0** - Initial NFL scoreboard implementation
