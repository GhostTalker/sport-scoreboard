# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Version:** 3.1.1

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

- **User**: `root`
- **Host**: `10.1.0.51`
- **SSH Key**: `C:\Users\Pit\OneDrive\Dokumente\Security\SSH Keys\MadClusterNet\id_rsa`

**Deployment Command**:
```bash
ssh -i "C:\Users\Pit\OneDrive\Dokumente\Security\SSH Keys\MadClusterNet\id_rsa" root@10.1.0.51 "cd /srv/GhostGit/nfl-scoreboard && ./deploy.sh"
```

For persistent deployment, use PM2:
```bash
pm2 start npm --name "nfl-scoreboard" -- run start:prod
pm2 startup
pm2 save
```

## Common Pitfalls

1. **Cache issues on iPad**: Browser aggressively caches. Users may need hard refresh (CMD+Shift+R)
2. **Manual selection not respecting**: Check that `setCurrentGame()` in gameStore respects `manuallySelectedGameId`
3. **ESPN API rate limiting**: Use caching in espnProxy, don't poll too frequently
4. **Playoff detection**: ESPN API inconsistently provides `seasonName` - fallback logic in `getSeasonName()` determines round by week number
5. **CORS in development**: Express proxy must be running for frontend to access ESPN API


## Version History

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
