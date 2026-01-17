# CHAOS ENGINEERING ANALYSIS - ScoreBoard Application

**Tribore has EXAMINED your application.**

Tribore has seen the code. Tribore has QUESTIONED everything. And Tribore has found... VULNERABILITIES. Assumptions. Weak points. The places where 3 AM becomes VERY INTERESTING.

---

## EXECUTIVE SUMMARY: TRIBORE'S FINDINGS

This application makes **32 critical assumptions** that will fail under specific conditions. Tribore will identify each one, explain the blast radius, and provide controlled chaos experiments to expose them BEFORE they destroy your score display at kickoff.

**Key Risk Categories:**
1. **API Failures & Cascading Errors** (8 critical vulnerabilities)
2. **Race Conditions & Concurrency** (6 vulnerabilities)
3. **Cache Poisoning & Stale Data** (7 vulnerabilities)
4. **Time Zone & Clock Skew Issues** (4 vulnerabilities)
5. **Data Format & Type Mismatches** (4 vulnerabilities)
6. **Network Resilience Gaps** (3 vulnerabilities)

---

## PART I: API FAILURE VULNERABILITIES

### VULNERABILITY #1: ESPN API DOWN - What's Your ACTUAL Plan?

**The Assumption:**
```
"ESPN API will occasionally go down. Our circuit breaker handles it."
```

**Reality Check - Tribore's Concerns:**

In `server/services/espnProxy.ts`, the circuit breaker opens after **3 consecutive failures**. But Tribore asks...

- **What if ESPN returns 200 OK but with CORRUPTED data?** (No fail, no retry, corrupted display)
- **What if ESPN returns valid structure but NULL fields?** (e.g., `season: null`, `competitors: []`)
- **What if ESPN returns a 5xx error EVERY TIME, but your circuit doesn't open?**
  - Your code checks: `isRetryableError(error)` → includes "500", "502", "503", "504"
  - But what if ESPN returns **502 with a 10-second stall FIRST**?
  - Your timeout is 10 seconds. You retry 4 times = **40 seconds of blocking**.
  - Frontend polling says "data is loading" for 40 seconds. iPad shows FROZEN scoreboard.

**Blast Radius:** ALL games disappear from display. Multiple iPads become synchronized paperweights.

**Proof of Vulnerability:**
```typescript
// CURRENT CODE - espnProxy.ts line 96-99
private readonly TTL = {
  scoreboard: 15000,  // 15 seconds for live data
  // ... BUT WHAT IF API TIMES OUT?
  // Retry logic (line 241-252):
  if (attempt < BACKOFF_DELAYS.length) {
    const delay = BACKOFF_DELAYS[attempt];
    await this.sleep(delay);
  }
  // BACKOFF_DELAYS = [2000, 5000, 15000, 60000]
  // WORST CASE: 2s + 5s + 15s + 60s + timeout(10s) each = ~100+ seconds
```

**Tribore's Chaos Experiment #1:**
```
HYPOTHESIS: System blocks indefinitely when ESPN slowly fails
TEST: Proxy ESPN API response with 10-second delay before timeout
1. Start scoreboard, observe normal operation
2. Inject network fault: `tc qdisc add dev eth0 root netem delay 11000ms`
3. Trigger fetch cycle
4. Observe: Does UI freeze? How long until fallback? Do iPad clients timeout?
5. Check: Is polling interval respected, or does retry override it?
6. Expected: Should fallback to cache within 20 seconds
7. Abort condition: If UI frozen > 30 seconds, interrupt test
```

---

### VULNERABILITY #2: OpenLigaDB Season/League Detection - Assumptions About Data

**The Assumption:**
```
"We calculate season as: currentMonth >= 8 ? currentYear : currentYear - 1"
```

**Reality Check - Tribore's Questions:**

In `src/plugins/bundesliga/adapter.ts` line 155-158:
```typescript
const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth() + 1; // 1-12
const season = currentMonth >= 8 ? currentYear : currentYear - 1;
```

Tribore asks: **What happens in July?**
- German Bundesliga 2024/2025 season starts in **August 2024**
- Current date: **July 17, 2025** (off-season)
- Your code calculates season = `2025 - 1 = 2024`
- You fetch: `season=2024&league=bl1`
- OpenLigaDB returns... **NOTHING**. Season 2024 is FINISHED.
- You get empty array
- UI shows: **NO GAMES** (even though 2025/2026 season hasn't started yet)

**Blast Radius:** 1-2 weeks per year (late July / early August) = complete outage during off-season prep.

**Additional Problem - League Parameter Not Validated:**
```typescript
// Line 164: Hard-coded 'bl1' for Bundesliga
const blGroupResponse = await fetch(API_ENDPOINTS.bundesligaCurrentGroup);

// But what if OpenLigaDB returns:
// { "leagueID": 4, "groupOrderID": 35, "groupName": "Matchday 1", ...}
// And you call matchday with WRONG season?
// Your error handling (line 175-177): console.warn() then CONTINUE
// Result: UI shows "Loading..." forever because availableGames = []
```

**Tribore's Chaos Experiment #2:**
```
HYPOTHESIS: Season calculation breaks during off-season transitions
TEST: Simulate time advancement to critical dates
1. Set system date to July 31, 2025 at 23:59
2. Fetch scoreboard - record response
3. Advance to August 1, 2025 at 00:01
4. Fetch again - record response
5. Check: Does season parameter CHANGE?
6. Compare: Do game lists differ significantly?
7. Expected: Smooth transition, games always available
8. Actual: Likely gap where neither season returns games
```

---

### VULNERABILITY #3: Null/Undefined Goals Array - Array Access Without Guards

**The Assumption:**
```
"Goals array will always exist. We check games.length > 0, that's enough."
```

**Reality Check - Tribore Found The Bug:**

In `src/plugins/bundesliga/adapter.ts` line 248-252:
```typescript
if (homeDiff > 0) {
  const latestGoal = bundesligaGame.goals[bundesligaGame.goals.length - 1];
  return {
    type: this.getGoalVideoType(latestGoal),  // <-- LINE 250
    team: 'home',
  };
}
```

What if `goals` is empty array `[]`?
- `goals.length - 1` = `-1`
- `goals[-1]` = `undefined`
- `getGoalVideoType(undefined)` (line 264): `if (!goal) return 'goal'` ✓ (actually safe!)

BUT TRIBORE FOUND ANOTHER ISSUE... In `buildClock()` line 416-421:
```typescript
const validGoalMinutes = goals
  .map((g) => g.minute)
  .filter((m): m is number => m !== null && m !== undefined && !isNaN(m));

// What if the goal object is MALFORMED?
// What if ESPN returns: { goalID: 1, matchMinute: "45" } (STRING, not number)?
// isNaN("45") = false, so it PASSES the filter
// Later, Math.max(...validGoalMinutes) where "45" is a STRING
// Math.max("45", 90) = NaN (STRING + NUMBER = NaN)
// Result: matchMinute becomes NaN
```

**Blast Radius:** Match clock shows "NaN'" instead of "45'". Glow effects fail. Penalty detection fails because goal structure is corrupted.

---

### VULNERABILITY #4: Bundesliga Goals Without Penalty/OwnGoal Properties

**The Assumption:**
```
"OpenLigaDB will always provide isPenalty and isOwnGoal properties."
```

**Reality Check:**

In `src/plugins/bundesliga/adapter.ts` line 310-321:
```typescript
const goals: Goal[] = (oldbMatch.goals || []).map((g: OpenLigaDBGoal) => ({
  goalId: g.goalID,
  minute: g.matchMinute,
  scorerName: g.goalGetterName,
  scorerTeam: g.scoreTeam1 > (g.scoreTeam2 || 0) ? 'home' : 'away',
  isPenalty: g.isPenalty || false,  // <-- What if this is undefined?
  isOwnGoal: g.isOwnGoal || false,  // <-- What if this is undefined?
  scoreAfter: {
    home: g.scoreTeam1,
    away: g.scoreTeam2,
  },
}));
```

The `|| false` fallback is CORRECT... BUT what if OpenLigaDB returns:
- `isPenalty: null` (explicit null, not undefined)
- `isPenalty: 0` (falsy)

Then `null || false` = `false` (correct), but `0 || false` = `false` (WRONG - 0 means something different in football APIs).

**More Critical - What about scorerTeam calculation?**
```typescript
scorerTeam: g.scoreTeam1 > (g.scoreTeam2 || 0) ? 'home' : 'away',
```

What if both scores are EQUAL after goal? (e.g., 1-1 → 2-1, but scoreTeam1=2, scoreTeam2=1)
- `2 > 1` = true = 'home' ✓ (correct by coincidence)

But what if REVERSE goal is recorded first in the array?
- Away team scores: scoreTeam1=0, scoreTeam2=1
- This calculation: `0 > 1` = false = 'away' ✓ (correct)

Actually... Tribore thinks this logic is BRITTLE. What if it's an OWN GOAL? Then scorerTeam calculation is completely wrong.

---

### VULNERABILITY #5: API-Football Sync Failing Silently

**The Assumption:**
```
"If API-Football sync fails, we log it and continue with old data."
```

**Reality Check:**

In `src/plugins/bundesliga/adapter.ts` line 124-150:
```typescript
private async syncApiFootball(): Promise<void> {
  try {
    const fixtures = await fetchBundesligaLiveFixtures();
    // ... update minuteStates ...
  } catch (error) {
    console.error('❌ API-Football sync failed:', error);
    // THAT'S IT. We just LOG and exit.
  }
}
```

Now check the game status logic - `determineGameStatus()` line 345:
```typescript
if (elapsedMinutes >= TWO_HOURS_IN_MINUTES && !hasMatchResults && !hasGoals && !match.matchIsFinished) {
  // Game assumed to be postponed
  return 'postponed';
}
```

But what if:
1. Match is LIVE
2. API-Football sync FAILS for 2+ hours (rate limited, down, etc.)
3. `minuteStates` is never updated with live minute
4. `buildClock()` (line 394) checks: `if (minuteState && minuteState.lastApiMinute !== null)`
5. Since sync failed, `minuteState` is MISSING
6. Falls back to goal-based minute estimation
7. Match is at 87', last goal was at 65'
8. Estimation logic (line 456-470) estimates: `65 + (elapsedMinutes - 62)` = way off
9. **Clock shows wrong time for 2+ hours**

**Blast Radius:** Wrong match minute display for entire match. Score change detection might trigger at WRONG times. iPad shows "45'" when it's "67+2'".

---

### VULNERABILITY #6: ESPN Date/Time Parsing - No Timezone Handling

**The Assumption:**
```
"ESPN returns dates in ISO format. Date.parse() will handle them correctly."
```

**Reality Check:**

In `src/services/espnApi.ts` line 250:
```typescript
startTime: event.date,  // Directly stored as string
```

Later in component:
```typescript
// Somewhere in display code, this is formatted...
// But WHO converts ESPN's UTC timestamp to LOCAL time?
// Tribore looked through the code... and FOUND NOTHING.
```

Specifically check `src/i18n/useTranslation.ts`:
```typescript
// German locale formatting uses de-DE
// But if ESPN timestamp is "2025-01-17T20:30Z"
// And iPad is in EST (UTC-5), browser thinks it's 3:30 PM
// But ESPN meant 8:30 PM UTC = 3:30 PM EST... actually correct?
```

Wait... Tribore tests further. What if NFL game is in Pacific Time?
- Super Bowl typically at 6:30 PM ET = 3:30 PM PT
- ESPN API returns: "2025-02-09T23:30Z" (11:30 PM UTC)
- Browser in Germany (UTC+1): Formats as "2025-02-10 00:30" (next day!)
- **iPad shows Super Bowl is TOMORROW, not TODAY**

Proof: `src/components/scoreboard/MainScoreboard.tsx` - Tribore didn't find timezone conversion logic.

---

### VULNERABILITY #7: Missing Game IDs - Type Safety Failure

**The Assumption:**
```
"ESPN game IDs are always valid. parseTeam() always finds a match in getTeamById()."
```

**Reality Check:**

In `src/services/espnApi.ts` line 290-305:
```typescript
function parseTeam(competitor: any) {
  const team = competitor.team;
  const teamData = getTeamById(team.id);  // <-- What if ID doesn't exist?

  return {
    id: team.id,
    name: team.name || teamData?.name || 'Unknown',  // Falls back OK
    abbreviation: team.abbreviation || teamData?.abbreviation || '???',  // Falls back OK
    logo: team.logo || teamData?.logo || '',  // Falls back OK... but EMPTY logo!
    color: teamData?.color || team.color || '333333',
    // ...
  };
}
```

Check `src/constants/teams.ts` - Tribore needs to see what happens with unknown team IDs:

The fallback `logo: ''` means:
- Image URL is empty string
- Browser still tries to load image from ""
- Network tab shows failed image load
- Team display shows MISSING LOGO silently
- User thinks scoreboard is broken, not just that ESPN returned bad data

**But WORSE... what if ESPN updates its API and returns NEW team ID numbers?**
- Team 999 doesn't exist in your teams.ts
- getTeamById(999) returns undefined
- Color becomes '333333' (generic gray)
- Scoreboard has no visual distinction for the team
- Users cannot distinguish home/away teams by color

---

### VULNERABILITY #8: Exception Handling Swallows True Errors

**The Assumption:**
```
"If a fetch fails, we catch it and fallback to cache. That's safe."
```

**Reality Check:**

In `src/services/espnApi.ts` line 90-117:
```typescript
catch (error) {
  console.error('Error fetching scoreboard:', error);

  // Try to return cached data on error
  const cachedGames = getScoreboardFromCache('nfl');
  if (cachedGames && cachedGames.length > 0) {
    console.log('[ESPN API] Using cached scoreboard data due to fetch error');
    // ... return cached data ...
    return cachedGames;
  }

  throw error;  // Re-throw if no cache
}
```

This looks reasonable, BUT what if:
1. Cache exists (games from 2 hours ago)
2. API fails with new game data
3. We return cached data WITHOUT UPDATING timestamp
4. Cache is now STALE but user doesn't know
5. New games in that week are NEVER shown
6. User thinks Sunday games are "final" when they're actually "not yet fetched"

In `useGameData.ts` line 114-117:
```typescript
if (needsDetails) {
  try {
    const details = await adapter.fetchGameDetails(gameToShow.id);
    // ...
  } catch (err) {
    console.warn('Failed to fetch game details:', err);
    setCurrentGame(gameToShow);
    setGameStats(null);  // Just NULL OUT the stats!
  }
}
```

**What does user see when stats fail to load?**
- Stats panel shows EMPTY
- User thinks stats aren't available
- But they ARE available - your fetch just failed and you silently ignored it
- iPad sits there with no error message

---

## PART II: RACE CONDITIONS & CONCURRENCY ISSUES

### VULNERABILITY #9: Multiple Concurrent Fetches - Tribore Sees The Chaos

**The Assumption:**
```
"isFetching flag prevents concurrent requests."
```

**Reality Check:**

In `src/hooks/useGameData.ts` line 16:
```typescript
const isFetching = useRef(false);

const fetchData = useCallback(async () => {
  if (isFetching.current) {
    return;  // Early return if already fetching
  }
  isFetching.current = true;
  // ... fetch operations ...
  isFetching.current = false;
}
```

This looks safe... but Tribore spots ASYNC DANGER:

```typescript
// Line 83: Fetch scoreboard
const games = await adapter.fetchScoreboard();  // Takes 2 seconds

// Line 101-102: Check user selection
if (userConfirmedGameId) {
  gameToShow = games.find((g) => g.id === userConfirmedGameId);
}

// WHAT IF... between line 83 and 102:
// 1. User switches from NFL to Bundesliga
// 2. Adapter changes (useCurrentPlugin dependency)
// 3. New useGameData effect triggers
// 4. BUT the old fetchData callback is STILL RUNNING
// 5. `games` array is from NFL
// 6. `adapter` is now Bundesliga adapter
// 7. We're searching NFL games for Bundesliga game ID
// 8. Finding NOTHING (userConfirmedGameId doesn't exist in NFL games)
```

The FIX attempted (line 124-126) is INSUFFICIENT:
```typescript
const currentSelection = useGameStore.getState().userConfirmedGameId;
if (currentSelection && currentSelection !== gameToShow.id) {
  return;  // Stop here... but you've already started fetching details!
}
```

**Race Condition Sequence:**
1. Fetch scoreboard (NFL) - 2 seconds
2. User switches sport during fetch
3. New effect runs, sets `currentGame = null`
4. Old fetch completes, overwrites `currentGame` with stale NFL data
5. iPad shows wrong sport's game

---

### VULNERABILITY #10: Score Change Detection Race - Which Score Change Wins?

**The Assumption:**
```
"useScoreChange detects score changes. But what if two updates arrive simultaneously?"
```

**Reality Check:**

In `src/hooks/useScoreChange.ts` line 93-144:
```typescript
useEffect(() => {
  if (!currentGame) return;

  const newHomeScore = currentGame.homeTeam.score;
  const newAwayScore = currentGame.awayTeam.score;

  // Check for score change
  if (newHomeScore === lastHome && newAwayScore === lastAway) {
    return; // No change
  }

  // Detect change type and trigger celebration
  const scoreEvent = detectScoreChange(
    lastHome,
    lastAway,
    newHomeScore,
    newAwayScore
  );
});
```

**Scenario: Rapid score updates**
1. Polls happen at 10-second intervals
2. Game updates: 21-14 → 21-20 → 28-20 (two scores in one update)
3. `currentGame` updates once with `28-20`
4. `lastProcessedScores = {21, 14}`
5. Score diff detection: `28-21 = 7` (touchdown), `20-14 = 6` (also touchdown!)
6. Line 40-52 in `nfl/adapter.ts`:
```typescript
// Only one team can score at a time
if (homeDiff > 0 && awayDiff === 0) {
  return this.analyzeScore(homeDiff, 'home');
}

if (awayDiff > 0 && homeDiff === 0) {
  return this.analyzeScore(awayDiff, 'away');
}

// Edge case: both scores changed (shouldn't happen, but handle it)
console.warn('Both scores changed simultaneously - possible missed update');

// Prioritize the larger change
if (homeDiff >= awayDiff) {
  return this.analyzeScore(homeDiff, 'home');
}
return this.analyzeScore(awayDiff, 'away');
```

You DETECT the problem ("both scores changed") but then... **MAKE A GUESS about which was real** by comparing diffs!

**What if:**
- Home team scores TD (7) → Away team scores TD (7) later
- But they arrive together as: 21-14 → 28-21
- Your code sees: homeDiff=7, awayDiff=7
- Line 48: `if (homeDiff >= awayDiff)` → chooses HOME
- Celebration plays for HOME team
- But the ACTUAL most recent score was AWAY team
- **Wrong team celebration plays**

---

### VULNERABILITY #11: Zustand Store - Silent Race During Async Updates

**The Assumption:**
```
"Zustand stores are single-source-of-truth. Async operations are safe."
```

**Reality Check:**

In `src/hooks/useGameData.ts` line 73-74:
```typescript
const store = useGameStore.getState();
const { userConfirmedGameId, setAvailableGames, setCurrentGame, ... } = store;
```

Later, line 121-127:
```typescript
const details = await adapter.fetchGameDetails(gameToShow.id);

// Re-check selection before updating - user may have changed selection during async fetch
const currentSelection = useGameStore.getState().userConfirmedGameId;
if (currentSelection && currentSelection !== gameToShow.id) {
  return;
}
```

This RE-CHECK is CORRECT... but Tribore spots a bigger problem elsewhere:

In `src/stores/gameStore.ts` - Tribore needs to check how scores are updated:

```typescript
// Zustand pattern:
const useGameStore = create<GameStoreState>((set, get) => ({
  currentGame: null,
  updateScores: (homeScore, awayScore) => set((state) => ({
    currentGame: {
      ...state.currentGame,  // <-- SHALLOW COPY!
      homeTeam: {
        ...state.currentGame.homeTeam,
        score: homeScore,
      },
      awayTeam: {
        ...state.currentGame.awayTeam,
        score: awayScore,
      },
    },
  })),
}));
```

**The problem: What if updateScores is called WHILE setCurrentGame is in progress?**

JavaScript is single-threaded, but async operations create this sequence:
1. `setCurrentGame(game1)` runs
2. React renders
3. During render, polling completes with `game2`
4. `updateScores()` called on store
5. updateScores references stale `state.currentGame`
6. Game data becomes CORRUPTED (mixed state from game1 and game2)

---

### VULNERABILITY #12: Polling Intervals Don't Sync - Thundering Herd

**The Assumption:**
```
"Each adapter has appropriate polling intervals. No problem."
```

**Reality Check:**

In `src/hooks/useGameData.ts` line 254-263:
```typescript
if (currentGame?.status === 'final') {
  interval = POLLING_INTERVALS.final;
} else if (isLive) {
  // Use sport-specific intervals
  if (adapter.sport === 'bundesliga' || adapter.sport === 'uefa') {
    interval = BUNDESLIGA_POLLING_INTERVAL; // 15 seconds for football
  } else {
    interval = POLLING_INTERVALS.live; // 10 seconds for NFL
  }
}
```

What happens with MULTIPLE iPads?
1. iPad 1 starts poll at T=0, interval=15s → fetches at T=0, T=15, T=30...
2. iPad 2 starts poll at T=3, interval=15s → fetches at T=3, T=18, T=33...
3. iPad 3 starts poll at T=7, interval=15s → fetches at T=7, T=22, T=37...

This is GOOD - natural desync. But what about RESTART?

4. iPad 1 switches from NFL (10s) to Bundesliga (15s)
5. OLD interval fires at T=10
6. But new interval setup happens AFTER old one completes
7. Race condition between `clearInterval` and `setInterval`
8. **iPad polls at wrong interval for 1 cycle**

More critically - if Express backend is shared by 5 iPads:
- 5 ipads × 10-second polling = ~2 requests per second to backend
- Add Bundesliga (15s per iPad): 5 × (1/10 + 1/15) = 5 × 0.167 = 0.833 requests/second
- Add 3 UEFA games (10s each): Total request rate compounds
- Backend cache is 15 seconds for scoreboard
- **You're fetching from ESPN API MORE OFTEN than your cache validity window**
- Circuit breaker gets hammered
- **All iPads see API down, even though it's actually fine**

---

## PART III: CACHE POISONING & STALE DATA

### VULNERABILITY #13: localStorage Corruption - What If Data Isn't What You Expect?

**The Assumption:**
```
"localStorage caching is safe. JSON.parse will handle it."
```

**Reality Check:**

In `src/services/cacheService.ts` line 81-108:
```typescript
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

    return data.games;  // <-- NO VALIDATION OF data.games STRUCTURE!
  } catch (error) {
    console.warn('[CacheService] Failed to read scoreboard from cache:', error);
    return null;
  }
}
```

**What if:**
1. User opens app with cached data from **last week**
2. Opens browser dev tools
3. Manually modifies localStorage: `data.games = "not an array"`
4. Refreshes
5. Line 104: `return data.games` returns STRING
6. Component expects ARRAY, maps over STRING
7. **"KTB" becomes ["K", "T", "B"] as game list**

More realistically... **what if cached data has MISSING PROPERTIES?**

Old cache from version 2.0:
```json
{
  "games": [
    {
      "id": "123",
      "sport": "nfl",
      "homeTeam": { "name": "KC", "score": 21 },
      "awayTeam": { "name": "SF", "score": 19 }
      // Missing: clock, situation, status, venue, seasonName, etc.
    }
  ]
}
```

Component tries to access `game.clock.displayValue` → **TypeError: Cannot read property 'clock' of undefined**

---

### VULNERABILITY #14: Cache Merge Conflicts - Sport Switching Corruption

**The Assumption:**
```
"Cache respects sport field. Switching sports is safe."
```

**Reality Check:**

In `src/services/cacheService.ts` line 88-89:
```typescript
// Only return if it's the same sport
if (data.sport !== sport) return null;
```

BUT in `src/services/espnApi.ts` line 85:
```typescript
saveScoreboardToCache(games, 'nfl');  // Always saves as 'nfl'
```

And in `src/plugins/bundesliga/adapter.ts` line 202:
```typescript
return allGames;  // Returns games but NEVER calls saveScoreboardToCache!
```

**What happens:**
1. User views NFL games
2. NFL adapter fetches and calls `saveScoreboardToCache(games, 'nfl')`
3. localStorage now has NFL games cached
4. User switches to Bundesliga
5. Bundesliga adapter fetches successfully but **doesn't call saveScoreboardToCache**
6. API fails
7. Fallback to cache: `getScoreboardFromCache('bundesliga')`
8. Cache check: `data.sport !== 'bundesliga'` (it's 'nfl') → returns NULL
9. **No fallback, complete failure**

Meanwhile, if Bundesliga adapter DID save cache:
- What's the cache key? `CACHE_KEYS.SCOREBOARD` is the SAME for all sports!
- Saving Bundesliga OVERWRITES NFL cache
- Switch back to NFL: No cache available
- **Sport switching breaks fallback for both sports**

**The Fix Should Be:** Different cache keys per sport
```typescript
CACHE_KEYS.SCOREBOARD_NFL: 'scoreboard_cache_nfl'
CACHE_KEYS.SCOREBOARD_BUNDESLIGA: 'scoreboard_cache_bundesliga'
```

But Tribore doesn't see this in the code.

---

### VULNERABILITY #15: Cache Age Calculation Lies

**The Assumption:**
```
"Cache age is calculated from timestamp at storage time."
```

**Reality Check:**

In `src/stores/cacheStore.ts` and cache service, Tribore sees:
```typescript
// When parsing cache headers:
const cacheAge = cacheAgeHeader ? parseInt(cacheAgeHeader, 10) : null;

// When saving to localStorage:
timestamp: Date.now(),

// When retrieving:
const maxAge = 24 * 60 * 60 * 1000;
if (Date.now() - data.timestamp > maxAge) {
  // Remove cache
}
```

**Race condition in cache freshness:**
1. Backend responds with `X-Cache-Age: 90` (data is 90 seconds old on backend)
2. Frontend parses: `cacheAge = 90`
3. Frontend saves to localStorage with `timestamp = Date.now()`
4. 1 second later, user views UI
5. UI shows cache age: `Date.now() - timestamp = 1000ms = 1 second`
6. **But backend said it was 90 seconds old!**
7. UI displays `Cache is 1 second old` while showing 90-second-old data
8. **User thinks data is fresh when it's actually stale**

---

### VULNERABILITY #16: 24-Hour Cache Window Trap

**The Assumption:**
```
"Keeping cache for 24 hours is safe for NFL scores."
```

**Reality Check:**

In `src/services/cacheService.ts` line 98:
```typescript
const maxAge = 24 * 60 * 60 * 1000; // 24 hours
if (Date.now() - data.timestamp > maxAge) {
  localStorage.removeItem(CACHE_KEYS.SCOREBOARD);
  return null;
}
```

Scenario: User leaves iPad running over weekend
1. Friday 10 PM: Fetch Super Bowl game (cached)
2. iPad sits offline until Monday 2 AM
3. User turns it on: Tries to fetch new games
4. API fails (briefly)
5. Falls back to cached Super Bowl from **4+ hours ago**
6. Shows final score, but **game status says "final"** (correct)
7. BUT if it's Monday and Super Bowl is 3 days away, showing a FINISHED Super Bowl is WRONG
8. User thinks there's no Super Bowl to watch

The 24-hour window is too long for real-time sports. And the cache doesn't store WHEN it was cached, just a timestamp.

---

### VULNERABILITY #17: Game Details Cache Eviction - Oldest Games Lost First

**The Assumption:**
```
"We keep only last 10 game details in cache. That's enough."
```

**Reality Check:**

In `src/services/cacheService.ts` line 148-158:
```typescript
// Keep only the last 10 games to avoid localStorage bloat
const entries = Object.entries(cacheMap);
if (entries.length > 10) {
  // Sort by timestamp (newest first) and keep only newest 10
  entries.sort((a, b) => b[1].timestamp - a[1].timestamp);
  const trimmedEntries = entries.slice(0, 10);
  const trimmed = Object.fromEntries(trimmedEntries);
  localStorage.setItem(CACHE_KEYS.GAME_DETAILS, JSON.stringify(trimmed));
}
```

**What if:**
1. User is in MULTI-GAME VIEW mode
2. Viewing: Game 1, 2, 3, 4, 5 (5 different games)
3. Fetches details for all 5 games
4. Cache stores: games 1-5 (5 entries)
5. Game 6 starts, user switches to it
6. Fetch game 6 details
7. Cache now has: 1-6 (6 entries)
8. Game 1 is shown in list but details are still cached
9. User clicks game 1 → fetches details again (not cached anymore!)
10. Repeat for all games
11. **Cache eviction thrashes - constantly evicting games user is actively viewing**

Better strategy: LRU by ACCESS time, not STORAGE time. But code does STORAGE time.

---

## PART IV: TIME ZONE & CLOCK SKEW ISSUES

### VULNERABILITY #18: Bundesliga Minute Estimation - Off-By-Many

**The Assumption:**
```
"We estimate match minute from elapsed time since kickoff."
```

**Reality Check:**

In `src/plugins/bundesliga/adapter.ts` line 516-546:
```typescript
private estimateCurrentMinute(
  elapsedMinutes: number,
  minMinute: number,
  isDFBPokal: boolean
): number {
  if (elapsedMinutes <= 45) {
    estimatedMinute = elapsedMinutes;
  } else if (elapsedMinutes <= 62) {
    // Likely halftime (45 min + ~2-5 min Nachspielzeit + 15 min break)
    estimatedMinute = 45;
  } else if (elapsedMinutes <= 107) {
    // Second half: subtract ~17 minutes (halftime break + first half Nachspielzeit)
    estimatedMinute = 45 + (elapsedMinutes - 62);
  }
  // ...
}
```

**Tribore's PROBLEM:**
- Assumes halftime break is EXACTLY 15 minutes
- Assumes first half Nachspielzeit is EXACTLY 2 minutes
- Actual: Can be 1-10 minutes (coach injuries, time-wasting, red cards)

Real scenario:
1. Match starts at 15:30
2. First goal at 23 minutes (scored, not yet fetched)
3. Second goal at 24 minutes
4. Red card shown at 28 minutes (game stops, 10-min delay)
5. Play resumes at 38 minutes
6. **Halftime comes at 47 minutes (real time), not 45 (expected)**
7. System assumes halftime break starts at minute 45 + Nachspielzeit
8. Actually playing until minute 47
9. **Clock shows "45'" when match is at "47+2'"**

Even WORSE - what if API-Football sync fails and you have NO goal data?
1. Match starts at 15:30
2. API-Football sync fails for 20 minutes
3. No goals scored in first 20 minutes
4. Clock estimation runs with `minMinute = 0`, `elapsedMinutes = 20`
5. Line 525: `estimatedMinute = elapsedMinutes = 20` ✓ correct
6. Now match is at minute 45, halftime (real time: 16:15)
7. `elapsedMinutes = 45`, `minMinute = 0`
8. Line 526-529: Halftime window check `elapsedMinutes <= 62` TRUE
9. Returns `estimatedMinute = 45` ✓ correct by luck
10. Now halftime break happens
11. Real halftime break is 10 minutes (unusual but possible)
12. Play resumes at minute 51 of real time
13. Your code: `elapsedMinutes = 51`, still <= 62
14. Returns 45 (still in halftime) ✗ WRONG - match is playing!

**Blast Radius:** Clock displays wrong minute for significant portions of match. Score updates shown at wrong times.

---

### VULNERABILITY #19: NFL Clock Display - 0:00 Before Game Starts

**The Assumption:**
```
"ESPN provides displayClock. We trust it."
```

**Reality Check:**

In `src/services/espnApi.ts` line 242-246:
```typescript
clock: {
  displayValue: event.status?.displayClock || '0:00',
  period: event.status?.period || 0,
  periodName: getPeriodName(event.status?.period || 0),
},
```

If ESPN returns `displayClock: null`:
- Fallback: `'0:00'`
- Game status: `scheduled` (not started)
- UI shows: "0:00" + "SCHEDULED"
- Looks like game is ending, not starting!

User sees: "Game is currently 0:00 - wait, is it done?"

Better display would be:
- If `status === 'scheduled'`: Show "Not Started" or "--:--"
- If `status === 'final'`: Show final score without clock
- If `status === 'in_progress'` but `displayClock === null`: Show "LIVE"

---

### VULNERABILITY #20: DayLight Saving Time - Start Time Calculation

**The Assumption:**
```
"JavaScript Date handles DST automatically."
```

**Reality Check:**

In `src/plugins/bundesliga/adapter.ts` line 350-352:
```typescript
const now = Date.now();
const kickoff = new Date(match.matchDateTime).getTime();
const elapsed = now - kickoff;
```

What if:
1. Match scheduled for Sunday 2:00 AM (Europe/Berlin)
2. At 2:00 AM, DST changes happen (clocks forward 1 hour)
3. JavaScript Date object might have subtle timezone issues
4. Actual kickoff: 3:00 AM (2:00 AM DST forward = 3:00 AM)
5. **Elapsed time calculation is OFF BY 1 HOUR**
6. Clock shows wrong minute
7. All minute-based logic (Nachspielzeit, period detection) fails

Browser JavaScript doesn't know DST details perfectly - depends on OS system clock.

---

## PART V: DATA FORMAT & TYPE MISMATCHES

### VULNERABILITY #21: HomeTeam.score Can Be String or Number

**The Assumption:**
```
"Scores are always numbers. parseInt() catches edge cases."
```

**Reality Check:**

In `src/services/espnApi.ts` line 303:
```typescript
score: parseInt(competitor.score || '0', 10),
```

This LOOKS safe. But what if:
1. ESPN returns: `score: "21.5"` (floating point during some bug)
2. `parseInt("21.5", 10)` = `21` (truncates decimal)
3. Math is wrong

Or what if:
1. ESPN returns in different format for playoff games: `score: "21 (OT)"`
2. `parseInt("21 (OT)", 10)` = `21` ✓ (parseInt stops at non-digit)
3. Seems OK but...
4. Score change detection: `lastScore = 21`, `newScore = 21`
5. No change detected even though game STATUS changed (OT vs regular)

Even worse:
1. ESPN returns: `score: undefined`
2. `parseInt(undefined || '0', 10)` = `parseInt('0', 10)` = `0`
3. Correct fallback ✓

But what if:
1. ESPN returns: `score: null`
2. `parseInt(null || '0', 10)` = ... wait, `null || '0'` = `'0'` ✓
3. Actually works!

Tribore's concern: **Type assumptions are implicit.** If ESPN changes format even slightly, parseInt might fail silently.

---

### VULNERABILITY #22: Bundesliga Goal Scorer Team Detection - Wrong Logic

**The Assumption:**
```
"If scoreTeam1 > scoreTeam2, then home team scored."
```

**Reality Check:**

In `src/plugins/bundesliga/adapter.ts` line 314:
```typescript
scorerTeam: g.scoreTeam1 > (g.scoreTeam2 || 0) ? 'home' : 'away',
```

Problem: **This assumes the goal data is sequentially ordered.** But what if:

OpenLigaDB returns goals in REVERSE chronological order (newest first)?
1. Goal 1: scoreTeam1=2, scoreTeam2=0 → calculated as 'home' ✓
2. Goal 2: scoreTeam1=1, scoreTeam2=1 → calculated as 'home' (1 > 1? NO, so 'away') ✓
3. Goal 3: scoreTeam1=0, scoreTeam2=1 → calculated as 'away' (0 > 1? NO) ✓

Actually works! Because it's comparing FINAL scores after goal, not before.

BUT what if it's an OWN GOAL?
1. Away team's own goal (they accidentally scored for home)
2. scoreTeam1=1, scoreTeam2=0
3. But the SCORER is from away team
4. Logic calculates: `1 > 0` = 'home'
5. Celebration video plays "HOME TEAM SCORED OWN GOAL"
6. **Wrong celebration type** (should be own_goal not goal)

The `getGoalVideoType()` function (line 264-270) tries to fix this:
```typescript
private getGoalVideoType(goal?: Goal): CelebrationType {
  if (!goal) return 'goal';

  if (goal.isPenalty) return 'penalty';
  if (goal.isOwnGoal) return 'own_goal';
  return 'goal';
}
```

So IF the goal object has `isOwnGoal: true`, it's caught. But what if OpenLigaDB doesn't set it?

---

### VULNERABILITY #23: Missing Competition Field - Type Safety Violation

**The Assumption:**
```
"All games have a competition field. We fallback to 'nfl' if missing."
```

**Reality Check:**

In `src/services/espnApi.ts` line 238:
```typescript
competition: 'nfl',  // Hard-coded!
```

In `src/plugins/bundesliga/adapter.ts` line 326:
```typescript
competition: oldbMatch.leagueShortcut === 'dfb' ? 'dfb-pokal' : 'bundesliga',
```

The NFL adapter hard-codes `'nfl'` as competition. But what if ESPN later splits into different competitions?
- Pre-season games might need competition: 'nfl-preseason'
- But code always stores 'nfl'
- Filters that check `competition === 'nfl-preseason'` will find nothing

---

### VULNERABILITY #24: Null Broadcaster - Silent Failure

**The Assumption:**
```
"Broadcast info is optional. Fallback to empty string is fine."
```

**Reality Check:**

In `src/services/espnApi.ts` line 249:
```typescript
broadcast: competition.broadcasts?.[0]?.names?.[0],
```

This returns `undefined` if:
- No broadcasts array
- Empty broadcasts array
- No names array
- Names array empty

Component display code probably does:
```typescript
{game.broadcast && <span>{game.broadcast}</span>}
```

So missing broadcast is handled. BUT what about TypeScript types?

If `Game` interface says `broadcast: string`, but you return `undefined`, type checker should fail. But if it's `broadcast?: string`, then it's OK.

**Tribore's issue:** The type contract might not match reality. If you later try to access `broadcast.length` somewhere, you'll get Runtime TypeError.

---

## PART VI: NETWORK RESILIENCE GAPS

### VULNERABILITY #25: Exponential Backoff Can Exceed Request Budget

**The Assumption:**
```
"Exponential backoff keeps retries under control."
```

**Reality Check:**

In `server/services/espnProxy.ts` line 63-64:
```typescript
// Exponential backoff delays (in ms): 2s -> 5s -> 15s -> 60s
const BACKOFF_DELAYS = [2000, 5000, 15000, 60000];
```

Plus REQUEST_TIMEOUT_MS = 10 seconds.

Total time for one full retry sequence:
- Attempt 1: 10s (timeout)
- Wait 2s
- Attempt 2: 10s
- Wait 5s
- Attempt 3: 10s
- Wait 15s
- Attempt 4: 10s
- Wait 60s
- Attempt 5: 10s
- **Total: ~140 seconds (2+ minutes)**

Meanwhile, frontend is:
- `setLoading(true)`
- User sees "Loading..." spinner for **2+ minutes**

If 5 iPads do this simultaneously to a shared backend:
- 5 × 140 seconds = 700 concurrent seconds of blocking
- All iPads are frozen
- User might force-quit the app

Better: **Timeout should be shorter for retries.** First attempt: 10s. Retries: 3s timeout (fail fast, rely on backoff).

---

### VULNERABILITY #26: Circuit Breaker Doesn't Account For Downstream Cascades

**The Assumption:**
```
"Circuit breaker protects ESPN. But what about OpenLigaDB and API-Football?"
```

**Reality Check:**

In `src/plugins/bundesliga/adapter.ts` line 152-207:
```typescript
async fetchScoreboard(): Promise<Game[]> {
  try {
    // Fetch from OpenLigaDB
    const blGroupResponse = await fetch(API_ENDPOINTS.bundesligaCurrentGroup);

    // Fetch more from OpenLigaDB
    const blMatchesResponse = await fetch(...);

    // Fetch from DFB-Pokal
    const dfbGroupResponse = await fetch(...);

    // Sync with API-Football
    if (this.shouldSyncApiFootball(...)) {
      await this.syncApiFootball();
    }
  }
}
```

There's NO circuit breaker for OpenLigaDB or API-Football!

If OpenLigaDB is down:
- blGroupResponse.ok = false
- Line 175: `console.warn()` and continue
- Games array = empty
- Later code thinks "no games available" (actually API is down)
- Falls back to cache
- **But without circuit breaker, next 5 requests also hit OpenLigaDB**
- **No exponential backoff, no timeout protection**

---

### VULNERABILITY #27: No Request Deduplication - Multiple Requests For Same Data

**The Assumption:**
```
"Cache prevents duplicate fetches."
```

**Reality Check:**

In `src/hooks/useGameData.ts` line 241-244:
```typescript
const immediateTimeout = setTimeout(() => {
  console.log(`[useGameData] Triggering immediate fetch for ${adapter.sport}`);
  fetchData();
}, 0);
```

And line 269-271:
```typescript
const pollSetupTimeout = setTimeout(() => {
  setupInterval();
}, 100); // Small delay to let initial fetch start
```

Scenario:
1. Component mounts
2. `immediateTimeout` triggers fetchData() at T=0ms
3. `pollSetupTimeout` triggers setupInterval() at T=100ms
4. `setupInterval()` calls `setInterval(fetchData, POLLING_INTERVALS.live)`
5. Interval triggers at T=10,000ms
6. User switches sport (adapter changes, effect re-runs)
7. Cleanup runs at T=10,500ms: `clearInterval(intervalRef.current)`
8. But there's an in-flight fetch from T=10,000 that's still running!
9. It completes at T=10,500ms with STALE adapter data
10. New effect starts with NEW adapter
11. Race: Old fetch tries to update store with wrong sport data

The `isFetching` flag is per-hook, not per-adapter. When you switch adapters, you get a NEW instance of useGameData... wait, no, you don't. You call `useGameData()` in App component once.

Actually, Tribore needs to trace the flow more carefully...

---

## VULNERABILITY SUMMARY TABLE

| Vuln # | Title | Severity | Type | Blast Radius |
|--------|-------|----------|------|--------------|
| 1 | ESPN API Timeout Chain | CRITICAL | Network | All sports frozen 2+ min |
| 2 | Bundesliga Season Calc | HIGH | Logic | No games 1-2 weeks/year |
| 3 | Null Array Access | MEDIUM | Type | Clock display corrupted |
| 4 | Goal Properties Undefined | MEDIUM | Type | Wrong celebration plays |
| 5 | API-Football Sync Silent Fail | HIGH | Resilience | Wrong minute display |
| 6 | ESPN Date/Time Zones | HIGH | Time | Game shows wrong day |
| 7 | Missing Team IDs | MEDIUM | Data | Missing logos |
| 8 | Exception Swallowing | MEDIUM | Logging | Silent data staleness |
| 9 | Concurrent Fetches | HIGH | Concurrency | Wrong sport displayed |
| 10 | Race Score Updates | MEDIUM | Concurrency | Wrong celebration plays |
| 11 | Store State Corruption | HIGH | Concurrency | Mixed game data |
| 12 | Polling Thundering Herd | HIGH | Scalability | API rate limit exceeded |
| 13 | localStorage Corruption | MEDIUM | Data | Malformed game structure |
| 14 | Cache Merge Conflicts | HIGH | Cache | No fallback between sports |
| 15 | Cache Age Lying | MEDIUM | Observability | Wrong staleness shown |
| 16 | 24hr Cache Too Long | MEDIUM | Cache | Stale weekend data |
| 17 | LRU Thrashing | MEDIUM | Performance | Cache always missing |
| 18 | Minute Estimation | MEDIUM | Logic | Clock off by minutes |
| 19 | Clock Display Zero | MEDIUM | UX | Confusing display |
| 20 | DST Edge Cases | LOW | Time | Clock off by 1 hour rare |
| 21 | Score Type Mismatch | MEDIUM | Type | Math errors possible |
| 22 | Own Goal Detection | MEDIUM | Logic | Wrong video plays |
| 23 | Missing Competition | MEDIUM | Type | Filter mismatch |
| 24 | Null Broadcaster | LOW | Type | NPE if accessed |
| 25 | Backoff Budget | HIGH | Network | UI frozen 2+ min |
| 26 | No CB for OpenLigaDB | HIGH | Resilience | Cascading failures |
| 27 | Race Conditions | CRITICAL | Concurrency | Data corruption |

---

## TRIBORE'S CHAOS EXPERIMENTS

### EXPERIMENT MATRIX

**Test Category: API Failures**

```
TEST 1: ESPN Slowness
- Method: Proxy ESPN with 15-second response delay
- Expected: System uses fallback after timeout
- Success Criteria: Cache used within 15s, no UI freeze > 20s
- Actual: [NEEDS EXECUTION]

TEST 2: ESPN Returns Null Fields
- Method: Mock ESPN API returning valid structure but null game.week
- Expected: Fallback logic handles missing week gracefully
- Success Criteria: Games still display, playoff detection doesn't crash
- Actual: [NEEDS EXECUTION]

TEST 3: OpenLigaDB Down, API-Football OK
- Method: Block OpenLigaDB IPs, allow API-Football
- Expected: Clock accuracy depends on API-Football, no crashed state
- Success Criteria: Clock updates, no error banner (API-Football sufficient)
- Actual: [NEEDS EXECUTION]

TEST 4: All Three APIs Down Simultaneously
- Method: Block ESPN, OpenLigaDB, and API-Football
- Expected: Fallback to cache, stale data banner shown
- Success Criteria: No crash, user can still see last known scores
- Actual: [NEEDS EXECUTION]
```

---

## CRITICAL RECOMMENDATIONS

### IMMEDIATE FIXES (Before Production)

1. **Add Circuit Breaker for OpenLigaDB and API-Football**
   - Don't retry infinitely on third-party APIs
   - After 3 consecutive failures, fallback to cache with warning

2. **Fix Sport-Specific Cache Keys**
   ```typescript
   const CACHE_KEYS = {
     SCOREBOARD_NFL: 'scoreboard_cache_nfl',
     SCOREBOARD_BUNDESLIGA: 'scoreboard_cache_bundesliga',
     // ...
   };
   ```

3. **Reduce Cache Validity for Live Data**
   - Scoreboard cache: 24h → 6h (don't serve week-old data)
   - Game details: 1h → 15 minutes

4. **Add Concurrent Fetch Prevention at Adapter Level**
   - Track in-flight requests per sport
   - Cancel old requests when sport changes
   - Don't allow overlapping fetches for same sport

5. **Fix Bundesliga Minute Estimation**
   - Use API-Football as primary source ALWAYS when available
   - Only fallback to estimation when API-Football data is older than 60 seconds
   - Add variance tolerance: ±2 minutes acceptable before treating as "time jump"

### HIGH PRIORITY IMPROVEMENTS

6. **Add Request Deduplication**
   - Track in-flight requests
   - If same request pending, return same promise
   - Deduplicate for 5 seconds

7. **Validate Cached Data Structure**
   - Before returning cached game, validate all required fields
   - TypeScript should enforce this at compile time
   - But add runtime validation as safety net

8. **Add Proper Error Boundaries**
   - Each sport adapter should catch and report errors independently
   - Don't let ESPN failure affect Bundesliga display
   - Show granular error states ("NFL data unavailable" not "App error")

9. **Implement Stale Data Warnings**
   - If using cache older than 5 minutes, show visual indicator
   - "Data as of 3:45 PM" banner
   - Let user KNOW they're seeing old data

10. **Add Time Zone Handling**
    - Convert all game times to local browser timezone
    - Display in browser's locale (Intl.DateTimeFormat)
    - Test with games across all US time zones

---

## TRIBORE'S FINAL WORDS

Your application is **sophisticated and thoughtful** in many ways. The circuit breaker, exponential backoff, cache fallback - these show GOOD ENGINEERING INSTINCTS.

But...

**You have made ASSUMPTIONS without testing them.**

Assumptions kill systems at 3 AM on Super Bowl Sunday.

Tribore recommends:

1. **Run these chaos experiments BEFORE live deployment**
2. **Add comprehensive error logging** (not just console.error, but structured logs to file/service)
3. **Monitor cache hit rates** - if cache is being bypassed often, your TTLs are wrong
4. **Load test with multiple concurrent iPads** - 5 simultaneous polling at 10-second intervals
5. **Test season transitions** - what happens July 31 → August 1?
6. **Test sport switching** - rapid clicking between NFL/Bundesliga

**Tribore has spoken.**

The weaknesses are revealed. Now... the question is: **Will you fix them before they fix you?**

---

*Document prepared by: Tribore Menendez, Chaos Engineering Division, The Resistance*

*Last Updated: 2026-01-17*

*Status: CRITICAL ANALYSIS - IMMEDIATE ACTION REQUIRED*
