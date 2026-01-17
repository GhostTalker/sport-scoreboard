# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Version:** 3.3.0

A modular multi-sport scoreboard application designed for iPad mini 6 and video wall displays. The app features a plugin-based architecture supporting multiple sports (NFL, Bundesliga, and more). It fetches real-time game data from various APIs, displays team logos, scores, game situations, and statistics with dynamic backgrounds.

**Stack**: React 18 + TypeScript + Vite (frontend), Express + Node.js (backend proxy), Tailwind CSS, Zustand (state management)

**Key Features:**
- Plugin-based architecture for easy sport additions
- Dual language support (German/English) with browser detection
- Real-time score updates with celebration videos
- Multi-view and single-view game modes
- Dynamic plugin management (enable/disable sports)
- Comprehensive settings with overlay-based UI

## Commands

### Development
```bash
npm install              # Install dependencies
npm run start           # Start both Vite dev server (5173) and Express proxy (3001) concurrently
npm run dev             # Start Vite dev server only (requires separate proxy)
npm run server          # Start Express proxy server only
```

### Production
```bash
npm run build           # Build for production (TypeScript compile + Vite build)
npm run start:prod      # Serve production build via Express on port 3001
npm run preview         # Preview production build via Vite
```

### Code Quality
```bash
npm run lint            # Run ESLint on all files
```

## Architecture Overview

### Frontend-Backend Data Flow

The application uses a **dual-server architecture**:

1. **Express Proxy Server** (`server/index.ts`, port 3001)
   - Acts as a proxy between the frontend and ESPN API
   - Implements server-side caching to reduce ESPN API calls (15s TTL for live data, 5m for schedules)
   - Handles CORS and provides API endpoints at `/api/*`
   - In production, also serves the built static files from `dist/`

2. **Vite Dev Server** (port 5173, development only)
   - Hot module replacement for fast development
   - Proxies API requests to Express server in dev mode

### State Management Architecture

The app uses **Zustand** for global state with three main stores:

1. **gameStore.ts** - Game data and selection
   - `currentGame`: Currently displayed game
   - `availableGames`: All games fetched from API
   - `manuallySelectedGameId`: Tracks user-selected game (prevents auto-override)
   - `previousScores`: For score change detection (triggers celebrations)
   - `gameStats`: Detailed statistics for current game

2. **settingsStore.ts** - User preferences
   - `favoriteTeam`: User's favorite team (default: Patriots, ID 17)
   - Auto-refresh settings

3. **uiStore.ts** - UI state
   - `currentView`: 'scoreboard' | 'stats' | 'settings'
   - `celebrationOverlay`: Controls video overlay visibility/type

### Data Flow Pattern

```
ESPN API → Express Proxy (with caching) → Frontend Service Layer → Zustand Store → React Components
```

**Key data flow concepts:**

- **Polling**: `useGameData` hook polls the API at different intervals based on game status (10s live, 1m scheduled, 5m final)
- **Manual Selection Priority**: When user manually selects a game via GameSelector, that game stays displayed even if a different game goes live
- **Auto-Live Detection**: If no manual selection, the app automatically shows the first live game, or first available game if none are live
- **Score Change Detection**: `useScoreChange` hook compares current scores with `previousScores` to trigger celebration videos

### API Layer

**Frontend** (`src/services/espnApi.ts`):
- `fetchScoreboard()`: Gets all current week games + automatically fetches upcoming weeks if no games found
- `fetchGameDetails(gameId)`: Gets detailed stats for a specific game
- Smart playoff week detection: Automatically determines Wild Card (week 1), Divisional (week 2), Championship (week 3), Super Bowl (week 5)

**Backend** (`server/services/espnProxy.ts`):
- Caches responses in-memory with configurable TTLs
- Proxies requests to `https://site.api.espn.com/apis/site/v2/sports/football/nfl`

**Routes** (`server/routes/api.ts`):
- `GET /api/scoreboard` - All games
- `GET /api/game/:gameId` - Single game details
- `GET /api/schedule?year=X&week=Y&seasonType=Z` - Specific week schedule
- `GET /api/health` - Health check + cache stats

### Component Architecture

```
App.tsx (root)
├── SwipeContainer (handles swipe gestures)
│   ├── MainScoreboard (main view)
│   │   ├── TeamDisplay (home/away teams)
│   │   ├── GameSituation (down, distance, possession)
│   │   └── Dynamic background based on game type
│   ├── StatsPanel (team statistics)
│   │   └── TeamStats (passing, rushing, etc.)
│   └── SettingsPanel (user preferences)
│       ├── GameSelector (switch between games)
│       └── DebugControls
└── VideoOverlay (celebration videos)
```

### Key Hooks

- **useGameData**: Main data-fetching hook with polling logic
- **useScoreChange**: Detects score changes and triggers celebration overlays
- **useKeyboardNavigation**: Arrow keys to switch views/games
- **useSwipe**: Touch gesture handling for iPad

### Type System

Core types are defined in `src/types/`:
- `game.ts`: Game, Team, GameStatus, GameSituation, ScoreEvent
- `stats.ts`: GameStats, TeamStats, PlayerStats
- `settings.ts`: Settings interface

## Important Implementation Details

### Dynamic Backgrounds

Game backgrounds are determined by `seasonName` from ESPN API:
- **SUPER BOWL**: Gold/champagne gradient with confetti animation
- **CONFERENCE CHAMPIONSHIP**: Silver/platinum with particles
- **DIVISIONAL ROUND**: Blue gradient with particles
- **WILD CARD**: Blue gradient with particles
- **GAME DAY** (regular season): Professional blue
- **Live games**: Red pulsating energy overlay
- **Final games**: Dimmed/desaturated overlay

### Title Graphics

Custom PNG graphics (`public/title/`) replace text titles:
- `superbowl.png` - Gold glow effect
- `conference.png` - Silver glow effect
- `divisional.png` - Divisional Round graphic
- `wildcard.png` - Wild Card graphic
- `gameday.png` - Regular Season default

Graphics are mapped via `src/constants/titleGraphics.ts` based on `seasonName`.

### Manual vs Auto Game Selection

This is a critical pattern in the codebase:

1. When user clicks a game in GameSelector, `selectGame()` is called which sets `manuallySelectedGameId`
2. The polling logic in `useGameData` checks `manuallySelectedGameId` and ONLY updates if the incoming game matches that ID
3. This prevents the app from auto-switching away from user's choice when another game goes live
4. User can clear manual selection to return to auto-live behavior

### Score Change Detection

The app triggers celebration videos when scores increase:
1. `previousScores` is stored in gameStore
2. `useScoreChange` compares current scores with previous
3. Point differential determines score type (TD=6/7/8, FG=3, Safety=2)
4. Video overlay is shown via `uiStore.celebrationOverlay`
5. Videos auto-hide after playback completes

### German Localization

The app uses German date/time formatting:
- Date format: DD.MM.YYYY
- Time format: 24-hour clock
- Implemented via browser's `Intl.DateTimeFormat` with locale 'de-DE'

## Resilience & Error Handling (v3.3.0+)

### Backend Resilience

**Exponential Backoff & Circuit Breaker** (`server/services/espnProxy.ts`):
- Retry failed ESPN API requests with increasing delays: 2s -> 5s -> 15s -> 60s
- Circuit breaker opens after 3 consecutive failures
- Stale cache fallback: 5 minutes for live data, 1 hour for schedules
- Circuit breaker states:
  - `CLOSED` - Normal operation, requests pass through
  - `OPEN` - Blocking all requests, returning cached data
  - `HALF_OPEN` - Testing recovery with single request

**LRU Cache** (`server/services/cache.ts`):
- 100MB limit per service (ESPN, OpenLigaDB)
- Automatic eviction of least recently used entries
- Metrics tracking: `size`, `entries`, `hitRate`, `hits`, `misses`
- Cache keys include query parameters for proper isolation

**Request Timeout**:
- 10-second timeout on all external API requests
- AbortController for request cancellation
- Methods: `cancelRequest(requestId)`, `cancelAllRequests()`
- Prevents memory leaks from abandoned fetch operations

**Graceful Shutdown**:
- SIGTERM/SIGINT signal handling for PM2 and Docker
- 5-second graceful shutdown window
- Active requests complete before process exit
- Prevents connection reset errors during deployment

**Health Endpoints**:
- `GET /api/health` - Full status with cache metrics and circuit breaker state
  ```json
  {
    "status": "healthy",
    "uptime": 43200,
    "memory": { "used": "145MB", "limit": "500MB" },
    "cache": { "espn": { "size": "45MB", "entries": 127, "hitRate": 0.87 } },
    "circuitBreaker": { "state": "CLOSED", "failures": 0 }
  }
  ```
- `GET /api/health/live` - Simple liveness probe (200 OK)
- `GET /api/health/ready` - Readiness check (returns 503 if degraded)

**Admin Endpoints** (for emergency use):
- `POST /api/admin/reset-circuit` - Manually reset circuit breaker
- `POST /api/admin/clear-cache?service=espn` - Clear ESPN cache
- `POST /api/admin/clear-cache?service=openligadb` - Clear OpenLigaDB cache
- `POST /api/admin/cancel-requests` - Cancel all active requests

### Frontend Resilience

**Offline Mode** (`src/services/cacheService.ts`):
- LocalStorage cache persistence for API responses
- TTL configuration: 24 hours for scoreboard, 1 hour for game details
- Automatic fallback to cached data on API errors
- Background retry every 30 seconds until success
- Green checkmark animation on recovery

**Stale Data Banner**:
- Orange warning banner when showing cached data
- Displays "Using cached data from X seconds ago"
- Auto-dismisses when fresh data is retrieved
- Encourages user awareness without blocking functionality

**Loading States** (`src/components/LoadingSkeleton.tsx`):
- Skeleton screens for MainScoreboard, GameCard, StatsPanel
- Shimmer animation for smooth visual feedback
- Instant skeleton display instead of blank screen
- Prevents layout shift when data loads

**Memory Leak Prevention** (`src/hooks/useScoreChange.ts`):
- Proper setTimeout cleanup on component unmount
- Active timeout tracking with Set data structure
- Cleanup on game change to prevent stale celebration timeouts
- Prevents memory accumulation during long viewing sessions

## Development Guidelines

### When Adding New Features

1. **New API endpoint**: Add to `server/routes/api.ts` + corresponding proxy method in `espnProxy.ts`
2. **New state**: Determine which store (game, settings, or ui) and add action methods
3. **New component**: Follow existing component structure (TeamDisplay is a good reference)
4. **New celebration type**: Add video to `public/videos/` and update `src/constants/videos.ts`

### TypeScript Patterns

- Use explicit types, avoid `any`
- Define interfaces in `src/types/`
- Use type guards for ESPN API response parsing (see `espnApi.ts`)
- Prefer type inference for function return types when obvious

### Styling Patterns

- Tailwind utility classes (no custom CSS unless absolutely necessary)
- Responsive breakpoints: Mobile-first, but primarily designed for iPad landscape (1024x768)
- Color scheme: Dark slate background (`bg-slate-900`), white text
- Team colors: Use team's primary color for accents (from `src/constants/teams.ts`)

### Vite Configuration

- Path alias: `@/` maps to `src/` (configured in `vite.config.ts`)
- Dev server runs on all interfaces (`host: true`) for iPad network access
- Production build outputs to `dist/`

## Deployment

The app is designed to run on a Linux server:

1. Clone repo to server (e.g., `/srv/GhostGit/nfl-scoreboard`)
2. `npm install && npm run build`
3. `NODE_ENV=production npm run start:prod`
4. Access via `http://<server-ip>:3001` from iPad/browser

### SSH Deployment Credentials

**IMPORTANT**: When deploying to the production server, use these SSH credentials:

- **User**: `scoreboard-app` (dedicated deployment user - never use root)
- **Host**: `10.1.0.51`
- **SSH Key**: `C:\Users\Pit\OneDrive\Dokumente\Security\SSH Keys\MadClusterNet\id_rsa`

**Deployment Command**:
```bash
ssh -i "C:\Users\Pit\OneDrive\Dokumente\Security\SSH Keys\MadClusterNet\id_rsa" scoreboard-app@10.1.0.51 "cd /srv/GhostGit/nfl-scoreboard && ./deploy.sh"
```

For persistent deployment, use PM2:
```bash
pm2 start npm --name "nfl-scoreboard" -- run start:prod
pm2 startup
pm2 save
```

### Server User Setup (One-Time)

If the `scoreboard-app` user doesn't exist, create it as root:

```bash
# SSH as root (one-time setup only)
ssh -i "<path-to-ssh-key>" root@10.1.0.51

# Create dedicated deployment user
useradd -m -s /bin/bash scoreboard-app
usermod -aG sudo scoreboard-app

# Set up SSH access
mkdir -p /home/scoreboard-app/.ssh
cp /root/.ssh/authorized_keys /home/scoreboard-app/.ssh/
chown -R scoreboard-app:scoreboard-app /home/scoreboard-app/.ssh
chmod 700 /home/scoreboard-app/.ssh
chmod 600 /home/scoreboard-app/.ssh/authorized_keys

# Transfer app ownership
chown -R scoreboard-app:scoreboard-app /srv/GhostGit/nfl-scoreboard

# Optional: Disable root SSH login (recommended)
# Edit /etc/ssh/sshd_config: PermitRootLogin no
# Then: systemctl restart sshd
```

## Security (v3.2.1+)

The application implements several security measures for private network deployment:

### CORS Configuration

CORS is restricted to trusted LAN origins only. Configure in `server/index.ts`:

```typescript
const allowedOrigins = [
  'http://localhost:5173',      // Vite dev server
  'http://localhost:3001',      // Production local
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3001',
  'http://10.1.0.51:3001',      // Production server
];
```

**When changing server IP**: Update `allowedOrigins` array, rebuild, and restart.

### API Rate Limiting

All `/api/*` routes are protected by rate limiting:
- **Window**: 15 minutes
- **Max Requests**: 100 per IP per window
- **Response**: 429 Too Many Requests when exceeded

Implemented via `express-rate-limit` middleware in `server/index.ts`.

### Non-Root Deployment

The application runs under a dedicated `scoreboard-app` user:
- No root access required for operation
- Owns only the application directory
- PM2 runs as the same user

### PM2 Log Rotation

Logs are automatically rotated to prevent disk exhaustion:
- **Max size**: 10MB per file
- **Retention**: 7 days
- **Compression**: Enabled for rotated files

Configure via `pm2-logrotate` module.

## Common Pitfalls

1. **Cache issues on iPad**: Browser aggressively caches. Users may need hard refresh (CMD+Shift+R)
2. **Manual selection not respecting**: Check that `setCurrentGame()` in gameStore respects `manuallySelectedGameId`
3. **ESPN API rate limiting**: Use caching in espnProxy, don't poll too frequently
4. **Playoff detection**: ESPN API inconsistently provides `seasonName` - fallback logic in `getSeasonName()` determines round by week number
5. **CORS in development**: Express proxy must be running for frontend to access ESPN API
6. **CORS errors in production**: Ensure the client IP/origin is in `allowedOrigins` array in `server/index.ts`
7. **Rate limit (429) errors**: Normal polling (10-15s) stays within limits. If hitting limits, wait 15 minutes or check for runaway polling loops
8. **SSH connection refused**: Ensure you're using `scoreboard-app` user, not `root`. Check SSH key permissions (600)


## Version History

### v3.4.0 (2026-01-17) - NFL Playoff Bracket
**Interactive Playoff Bracket:**
- Mirrored AFC/NFC layout with Super Bowl in center
- Visual connection lines between rounds with conference colors (red/blue)
- Pulsing animations for current round games (4s smooth animation)
- Static glow effects for completed games
- Round progression validation: games pulse only when previous round is complete
- #1 seed BYE indication in Wild Card round
- Swipe navigation between Scoreboard ↔ Bracket ↔ Settings

**Smart Game State Management:**
- Wild Card: Always can pulse (first round)
- Divisional: Pulses only when all Wild Card games are final
- Championship: Pulses only when all Divisional games are final
- Super Bowl: Pulses only when both AFC & NFC Championships are final
- Finished games: Static glow in conference color (no animation)

**Performance Optimizations:**
- Initial bulk fetch of all playoff games (fetchAllPlayoffGames)
- Live updates for in-progress games only
- Finalized games cached to reduce API calls
- Bracket auto-refreshes when game status changes

**UI/UX Changes:**
- Removed "Bracket" button from Multi-Game View footer
- Access bracket via swipe gesture only
- Pixel-perfect connection line positioning with SVG viewBox
- Trophy image with golden glow in center

**Technical Implementation:**
- New component: `src/components/bracket/NFLPlayoffBracket.tsx`
- CSS animations: `playoff-game-pulse-afc`, `playoff-game-pulse-nfc`, `superbowl-glow-pulse`
- Round completion detection logic for progressive animations
- Connection line coordinate system using ViewBox (952x620 total dimensions)

### v3.3.0 (2026-01-17) - Backend & Frontend Resilience
**Backend Resilience:**
- Exponential backoff retry logic for ESPN API (2s -> 5s -> 15s -> 60s)
- Circuit breaker pattern (opens after 3 failures, 30s cooldown)
- Request timeout configuration (10s default with AbortController)
- Graceful shutdown handler for zero-downtime deployments
- LRU cache with 100MB size limit per service
- Enhanced health endpoints (/api/health, /api/health/live, /api/health/ready)
- Admin endpoints for manual intervention

**Frontend Resilience:**
- Offline mode with stale data fallback via LocalStorage
- Stale data warning banner with auto-retry
- Skeleton loading screens with shimmer effects
- Fixed setTimeout cleanup in useScoreChange (memory leak prevention)

**New Files:**
- `server/services/cache.ts` - LRU cache service
- `src/stores/cacheStore.ts` - Frontend cache state
- `src/services/cacheService.ts` - LocalStorage persistence
- `src/components/LoadingSkeleton.tsx` - Skeleton components

### v3.2.1 (2026-01-17) - Security Hardening & Error Handling
**Security Improvements:**
- Restricted CORS to LAN origins only (10.1.0.51, localhost, 127.0.0.1)
- Added API rate limiting (100 requests per 15 minutes per IP)
- Created non-root deployment user (`scoreboard-app`)

**New Features:**
- Feedback button in settings (mailto: link with app context)
- Error boundary component for graceful error handling
- PM2 log rotation (10MB max, 7-day retention)

**Documentation:**
- Created DEPLOYMENT.md with comprehensive deployment guide
- Created docs/SECURITY.md with security configuration details
- Updated all documentation for v3.2.1 release

### v3.2.0 (2026-01-15) - UEFA Champions League & Hybrid API
**New Plugin:**
- UEFA Champions League plugin with full round detection
- OpenLigaDB integration for Champions League matches

**Bundesliga Enhancement:**
- Hybrid API system (OpenLigaDB + API-Football)
- Accurate live minutes for running matches
- Smart phase-based polling to stay within API limits

### v3.1.1 (2026-01-14) - Code Cleanup & Logo Updates
**Code Quality Improvements:**
- Fixed all 'any' type usage with proper TypeScript interfaces
- Added comprehensive OpenLigaDB API type definitions
- Improved type safety in settings migration handler
- Removed 530 lines of redundant code (duplicate adapters, unused components)

**Visual Updates:**
- Updated plugin logos in settings menu (Logo_NFL.png, Logo_Bundesliga.png)
- Updated favicon to professional scoreboard icon
- Sport selection logos updated (nfl-logo.png, bundesliga-logo.png)

### v3.1.0 (2026-01-14) - UI Redesign & Sound Overlay
**Major UI improvements:**
- Horizontal tab menu for settings (replaced vertical sidebar)
- Sound settings overlay with volume control
- Generic sport favicon (no longer NFL-specific)
- All settings now use consistent overlay pattern

**Settings Menu Tabs:**
1. **Plugins** - Enable/disable sport plugins
2. **Videos** - Configure celebration videos
3. **Sound** - Audio settings with volume slider
4. **Language** - Switch between German/English
5. **Debug** - Debug controls and simulation tools

### v3.0.0 (2026-01-13) - Plugin System & Internationalization
**Plugin Architecture:**
- Plugin system with registry and lazy loading
- Dynamic plugin management (enable/disable in settings)
- Type-safe plugin definitions in `src/config/plugins.ts`

**Internationalization:**
- Dual language support (German/English)
- Browser language auto-detection

**Available Plugins:**
- NFL
- Bundesliga

### v2.0.x - Dual-Sport Support
- Added Bundesliga support alongside NFL
- Celebration videos for both sports
- Manual game selection
- Multi-view mode with filters

### v1.0.0 - Initial Release
- NFL scoreboard with ESPN API integration
- Real-time score updates
- iPad-optimized display
- Dynamic backgrounds based on game type

---

For detailed changes, see [CHANGELOG.md](./CHANGELOG.md)
