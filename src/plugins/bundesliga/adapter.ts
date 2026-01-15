// Bundesliga Adapter - Hybrid: OpenLigaDB + API-Football
// OpenLigaDB: Tore, Karten, Scores (alle 15s)
// API-Football: Live-Minute (phasenbasiert: 10min normal, 1min kritisch)

import type { SportAdapter, ScoreChangeResult } from '../../adapters/SportAdapter';
import type { Game, BundesligaGame, CelebrationType } from '../../types/game';
import type { GameStatus, Team } from '../../types/base';
import type {
  SoccerClock,
  Goal,
  OpenLigaDBMatch,
  OpenLigaDBCurrentGroup,
  OpenLigaDBTeam,
  OpenLigaDBGoal,
  OpenLigaDBMatchResult,
} from '../../types/bundesliga';
import type { GameStats } from '../../types/stats';
import { API_ENDPOINTS } from '../../constants/api';
import { getBundesligaTeamColor, getBundesligaTeamAlternateColor } from '../../constants/bundesligaTeams';
import { fetchBundesligaLiveFixtures, type ApiFootballFixture } from '../../services/apiFootball';

interface MinuteState {
  lastApiMinute: number | null;
  lastApiTimestamp: number | null;
}

type GamePhase = 'NORMAL' | 'INJURY_TIME_1' | 'HALFTIME' | 'RESTART_2H' | 'INJURY_TIME_2';

export class BundesligaAdapter implements SportAdapter {
  sport = 'bundesliga' as const;

  // API-Football state
  private minuteStates = new Map<string, MinuteState>();
  private lastApiSync = 0;
  private apiCallCount = 0;

  // Polling intervals (in milliseconds)
  private readonly INTERVAL_NORMAL = 600000; // 10 minutes
  private readonly INTERVAL_CRITICAL = 60000; // 1 minute (injury time, restarts)

  /**
   * Determine the current phase of the match
   */
  private getPhase(game: BundesligaGame): GamePhase {
    if (game.status !== 'in_progress') {
      return 'NORMAL';
    }

    const minute = game.clock.matchMinute;

    // Injury time first half (45-50 min)
    if (minute >= 45 && minute < 50 && game.clock.period === 'first_half') {
      return 'INJURY_TIME_1';
    }

    // Halftime
    if (game.clock.period === 'halftime') {
      return 'HALFTIME';
    }

    // Second half restart (46-50 min) - critical for delayed restarts
    if (minute >= 46 && minute <= 50 && game.clock.period === 'second_half') {
      return 'RESTART_2H';
    }

    // Injury time second half (90+ min)
    if (minute >= 90 && game.clock.period === 'second_half') {
      return 'INJURY_TIME_2';
    }

    // Extra time injury time (DFB-Pokal)
    if (minute >= 105 && game.clock.period === 'extra_time') {
      return 'INJURY_TIME_2';
    }

    return 'NORMAL';
  }

  /**
   * Get required API-Football sync interval based on game phase
   */
  private getIntervalForPhase(phase: GamePhase): number {
    switch (phase) {
      case 'INJURY_TIME_1':
      case 'RESTART_2H':
      case 'INJURY_TIME_2':
        return this.INTERVAL_CRITICAL; // 1 minute
      case 'HALFTIME':
      case 'NORMAL':
      default:
        return this.INTERVAL_NORMAL; // 10 minutes
    }
  }

  /**
   * Check if we should sync with API-Football now
   */
  private shouldSyncApiFootball(games: BundesligaGame[]): boolean {
    // Find live games
    const liveGames = games.filter(g => g.status === 'in_progress');

    if (liveGames.length === 0) {
      return false; // No live games, no need to sync
    }

    // Determine most critical phase among all live games
    let minInterval = this.INTERVAL_NORMAL;
    for (const game of liveGames) {
      const phase = this.getPhase(game);
      const interval = this.getIntervalForPhase(phase);
      minInterval = Math.min(minInterval, interval);
    }

    // Check if enough time has passed since last sync
    const now = Date.now();
    const timeSinceLastSync = now - this.lastApiSync;

    return timeSinceLastSync >= minInterval;
  }

  /**
   * Sync with API-Football to get accurate live minutes (BATCH)
   */
  private async syncApiFootball(): Promise<void> {
    try {
      const fixtures = await fetchBundesligaLiveFixtures();
      const now = Date.now();

      console.log(`⚽ API-Football sync: ${fixtures.length} live fixtures`);

      for (const fixture of fixtures) {
        const gameId = fixture.fixture.id.toString();
        const minute = fixture.fixture.status.elapsed;

        if (minute !== null) {
          this.minuteStates.set(gameId, {
            lastApiMinute: minute,
            lastApiTimestamp: now,
          });
        }
      }

      this.lastApiSync = now;
      this.apiCallCount++;

      console.log(`✅ API-Football synced: ${this.apiCallCount} requests today`);
    } catch (error) {
      console.error('❌ API-Football sync failed:', error);
    }
  }

  async fetchScoreboard(): Promise<Game[]> {
    try {
      // Calculate season year
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1; // 1-12
      const season = currentMonth >= 8 ? currentYear : currentYear - 1;

      const allGames: Game[] = [];

      // Fetch Bundesliga games
      try {
        const blGroupResponse = await fetch(API_ENDPOINTS.bundesligaCurrentGroup);
        if (blGroupResponse.ok) {
          const blGroup: OpenLigaDBCurrentGroup = await blGroupResponse.json();
          const blMatchesResponse = await fetch(
            `${API_ENDPOINTS.bundesligaMatchday(blGroup.groupOrderID)}?season=${season}&league=bl1`
          );
          if (blMatchesResponse.ok) {
            const blMatches: OpenLigaDBMatch[] = await blMatchesResponse.json();
            allGames.push(...blMatches.map((match) => this.transformMatch(match)));
          }
        }
      } catch (err) {
        console.warn('Error fetching Bundesliga games:', err);
      }

      // Fetch DFB-Pokal games
      try {
        const dfbGroupResponse = await fetch(`${API_ENDPOINTS.bundesligaCurrentGroup}?league=dfb`);
        if (dfbGroupResponse.ok) {
          const dfbGroup: OpenLigaDBCurrentGroup = await dfbGroupResponse.json();
          const dfbMatchesResponse = await fetch(
            `${API_ENDPOINTS.bundesligaMatchday(dfbGroup.groupOrderID)}?season=${season}&league=dfb`
          );
          if (dfbMatchesResponse.ok) {
            const dfbMatches: OpenLigaDBMatch[] = await dfbMatchesResponse.json();
            allGames.push(...dfbMatches.map((match) => this.transformMatch(match)));
          }
        }
      } catch (err) {
        console.warn('Error fetching DFB-Pokal games:', err);
      }

      // Sync with API-Football if needed (phase-based polling)
      const bundesligaGames = allGames as BundesligaGame[];
      if (this.shouldSyncApiFootball(bundesligaGames)) {
        await this.syncApiFootball();
      }

      return allGames;
    } catch (error) {
      console.error('Error fetching scoreboard:', error);
      throw error;
    }
  }

  async fetchGameDetails(gameId: string): Promise<{ game: Game; stats: GameStats | null }> {
    try {
      const response = await fetch(API_ENDPOINTS.bundesligaMatch(gameId));
      if (!response.ok) {
        throw new Error(`OpenLigaDB error: ${response.statusText}`);
      }
      const match: OpenLigaDBMatch = await response.json();

      // OpenLigaDB doesn't provide detailed stats like ESPN
      // Return game data only, stats are null
      return {
        game: this.transformMatch(match),
        stats: null,
      };
    } catch (error) {
      console.error('Error fetching Bundesliga game details:', error);
      throw error;
    }
  }

  detectScoreChange(
    prevHome: number,
    prevAway: number,
    newHome: number,
    newAway: number,
    game: Game
  ): ScoreChangeResult | null {
    const homeDiff = newHome - prevHome;
    const awayDiff = newAway - prevAway;

    // No score change
    if (homeDiff === 0 && awayDiff === 0) {
      return null;
    }

    const bundesligaGame = game as BundesligaGame;

    // Determine which team scored
    if (homeDiff > 0) {
      const latestGoal = bundesligaGame.goals[bundesligaGame.goals.length - 1];
      return {
        type: this.getGoalVideoType(latestGoal),
        team: 'home',
      };
    } else if (awayDiff > 0) {
      const latestGoal = bundesligaGame.goals[bundesligaGame.goals.length - 1];
      return {
        type: this.getGoalVideoType(latestGoal),
        team: 'away',
      };
    }

    return null;
  }

  private getGoalVideoType(goal?: Goal): CelebrationType {
    if (!goal) return 'goal';

    if (goal.isPenalty) return 'penalty';
    if (goal.isOwnGoal) return 'own_goal';
    return 'goal';
  }

  getPeriodName(period: string): string {
    switch (period) {
      case 'first_half':
        return '1. Halbzeit';
      case 'second_half':
        return '2. Halbzeit';
      case 'halftime':
        return 'Halbzeit';
      case 'extra_time':
        return 'Verlängerung';
      default:
        return '';
    }
  }

  getCompetitionName(game: Game): string {
    const bundesligaGame = game as BundesligaGame;
    return bundesligaGame.competition === 'bundesliga' ? 'Bundesliga' : 'DFB-Pokal';
  }

  getCelebrationTypes(): CelebrationType[] {
    return ['goal', 'penalty', 'own_goal', 'red_card', 'yellow_red_card'];
  }

  // Transform OpenLigaDB match to our Game format
  private transformMatch(oldbMatch: OpenLigaDBMatch): BundesligaGame {
    // Extract halftime and final scores
    const halftimeResult = oldbMatch.matchResults?.find(
      (r: OpenLigaDBMatchResult) => r.resultTypeID === 1
    );
    const finalResult = oldbMatch.matchResults?.find(
      (r: OpenLigaDBMatchResult) => r.resultTypeID === 2
    );

    // Determine status
    const status = this.determineGameStatus(oldbMatch);

    // Transform goals
    const goals: Goal[] = (oldbMatch.goals || []).map((g: OpenLigaDBGoal) => ({
      goalId: g.goalID,
      minute: g.matchMinute,
      scorerName: g.goalGetterName,
      scorerTeam: g.scoreTeam1 > (g.scoreTeam2 || 0) ? 'home' : 'away',
      isPenalty: g.isPenalty || false,
      isOwnGoal: g.isOwnGoal || false,
      scoreAfter: {
        home: g.scoreTeam1,
        away: g.scoreTeam2,
      },
    }));

    return {
      id: oldbMatch.matchID.toString(),
      sport: 'bundesliga',
      competition: oldbMatch.leagueShortcut === 'dfb' ? 'dfb-pokal' : 'bundesliga',
      homeTeam: this.transformTeam(oldbMatch.team1, finalResult?.pointsTeam1 || 0),
      awayTeam: this.transformTeam(oldbMatch.team2, finalResult?.pointsTeam2 || 0),
      status,
      startTime: oldbMatch.matchDateTimeUTC,
      venue: oldbMatch.location?.locationCity || undefined,
      clock: this.buildClock(oldbMatch, goals),
      matchday: oldbMatch.group.groupOrderID,
      goals,
      halftimeScore: halftimeResult
        ? {
            home: halftimeResult.pointsTeam1,
            away: halftimeResult.pointsTeam2,
          }
        : undefined,
      lastUpdate: oldbMatch.lastUpdateDateTime,
    };
  }

  private determineGameStatus(match: OpenLigaDBMatch): GameStatus {
    if (match.matchIsFinished) {
      return 'final';
    }

    const now = Date.now();
    const kickoff = new Date(match.matchDateTime).getTime();
    const elapsed = now - kickoff;
    const elapsedMinutes = elapsed / 60000;

    // Check for postponed/cancelled games:
    // - Kickoff time has passed (by more than 2 hours for a typical game duration)
    // - No match results (empty array or missing)
    // - No goals scored
    // - Game not marked as finished
    // This indicates the game likely didn't take place as scheduled
    const hasMatchResults = match.matchResults && match.matchResults.length > 0;
    const hasGoals = match.goals && match.goals.length > 0;
    const TWO_HOURS_IN_MINUTES = 120;

    if (elapsedMinutes >= TWO_HOURS_IN_MINUTES && !hasMatchResults && !hasGoals && !match.matchIsFinished) {
      // Additional check: if lastUpdateDateTime is very old (more than 24 hours before kickoff),
      // this further confirms the game data is stale/postponed
      if (match.lastUpdateDateTime) {
        const lastUpdate = new Date(match.lastUpdateDateTime).getTime();
        const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
        if (kickoff - lastUpdate > TWENTY_FOUR_HOURS_MS) {
          return 'postponed';
        }
      }
      // Even without the old lastUpdate check, no results after 2+ hours = postponed
      return 'postponed';
    }

    if (elapsedMinutes < 0) {
      return 'scheduled';
    }

    if (elapsedMinutes >= 45 && elapsedMinutes < 60) {
      return 'halftime';
    }

    if (elapsedMinutes >= 0) {
      return 'in_progress';
    }

    return 'scheduled';
  }

  private buildClock(match: OpenLigaDBMatch, goals: Goal[]): SoccerClock {
    const now = Date.now();
    const kickoff = new Date(match.matchDateTime).getTime();
    const elapsedMs = now - kickoff;
    const elapsedMinutes = Math.floor(elapsedMs / 60000);

    // Check if this is DFB-Pokal (which can have extra time / Verlaengerung)
    const isDFBPokal = match.leagueShortcut === 'dfb';

    // Priority 1: API-Football minute (most accurate for live games)
    const gameId = match.matchID.toString();
    const minuteState = this.minuteStates.get(gameId);
    let apiMinute: number | null = null;

    if (minuteState && minuteState.lastApiMinute !== null && minuteState.lastApiTimestamp !== null) {
      // Calculate simulated minute based on API sync + elapsed time
      const elapsedSinceSync = (now - minuteState.lastApiTimestamp) / 60000;
      apiMinute = Math.floor(minuteState.lastApiMinute + elapsedSinceSync);
    }

    // Priority 2: Find the latest valid (non-null) goal minute from goals array
    // The API provides matchMinute in goals, which is accurate for goal times
    const validGoalMinutes = goals
      .map((g) => g.minute)
      .filter((m): m is number => m !== null && m !== undefined && !isNaN(m));
    const latestGoalMinute = validGoalMinutes.length > 0
      ? Math.max(...validGoalMinutes)
      : null;

    let period: SoccerClock['period'] = 'first_half';
    let matchMinute = 0;

    // FINISHED GAME
    if (match.matchIsFinished) {
      // For finished games, determine period based on final minute
      if (latestGoalMinute !== null && latestGoalMinute > 90 && isDFBPokal) {
        period = 'extra_time';
        matchMinute = latestGoalMinute;
      } else {
        period = 'second_half';
        matchMinute = latestGoalMinute !== null && latestGoalMinute > 90
          ? latestGoalMinute
          : 90;
      }
    }
    // GAME NOT STARTED YET
    else if (elapsedMinutes < 0) {
      period = 'first_half';
      matchMinute = 0;
    }
    // GAME IN PROGRESS - Priority: API-Football > Goal minute > Estimate
    else {
      // Priority 1: Use API-Football minute if available (most accurate)
      if (apiMinute !== null) {
        matchMinute = apiMinute;
      }
      // Priority 2: Use latest goal minute and estimate forward
      else if (latestGoalMinute !== null) {
        matchMinute = latestGoalMinute;

        // Estimate current time based on elapsed time since last goal
        // This helps show time progress between goals
        const estimatedCurrentMinute = this.estimateCurrentMinute(
          elapsedMinutes,
          latestGoalMinute,
          isDFBPokal
        );

        // Only use estimated time if it's greater than last goal minute
        // and still within reasonable bounds for the current period
        if (estimatedCurrentMinute > matchMinute) {
          matchMinute = estimatedCurrentMinute;
        }
      }
      // Priority 3: No API data or goals - estimate based on elapsed time
      else {
        matchMinute = this.estimateCurrentMinute(elapsedMinutes, 0, isDFBPokal);
      }

      // Determine period based on calculated match minute
      if (matchMinute <= 45) {
        // Check if we're in halftime based on elapsed time
        // First half + potential Nachspielzeit typically ends around 47-50 real minutes
        if (elapsedMinutes >= 47 && elapsedMinutes < 62) {
          period = 'halftime';
          matchMinute = 45;
        } else {
          period = 'first_half';
        }
      } else if (matchMinute <= 90) {
        period = 'second_half';
      } else if (isDFBPokal && matchMinute > 90) {
        period = 'extra_time';
      } else {
        // Bundesliga: we're in Nachspielzeit of second half
        period = 'second_half';
      }
    }

    // Build display value with proper Nachspielzeit notation
    const displayValue = this.buildDisplayValue(matchMinute, period, isDFBPokal);

    return {
      matchMinute,
      period,
      periodName: this.getPeriodName(period),
      displayValue,
    };
  }

  /**
   * Estimate current match minute based on real elapsed time
   * Accounts for halftime break (~15 min)
   */
  private estimateCurrentMinute(
    elapsedMinutes: number,
    minMinute: number,
    isDFBPokal: boolean
  ): number {
    let estimatedMinute: number;

    if (elapsedMinutes <= 45) {
      // First half: direct mapping
      estimatedMinute = elapsedMinutes;
    } else if (elapsedMinutes <= 62) {
      // Likely halftime (45 min + ~2-5 min Nachspielzeit + 15 min break)
      // Return 45 as we're in halftime
      estimatedMinute = 45;
    } else if (elapsedMinutes <= 107) {
      // Second half: subtract ~17 minutes (halftime break + first half Nachspielzeit)
      // 62 real minutes = 45 match minutes (start of 2nd half)
      // 107 real minutes = 90 match minutes (end of regular time)
      estimatedMinute = 45 + (elapsedMinutes - 62);
    } else if (isDFBPokal && elapsedMinutes <= 140) {
      // DFB-Pokal extra time: after ~107 real minutes
      // Extra time has two 15-minute halves with a short break
      estimatedMinute = 90 + (elapsedMinutes - 107);
    } else {
      // Very late in game - likely Nachspielzeit or finished
      estimatedMinute = isDFBPokal ? Math.min(elapsedMinutes - 20, 120) : 90;
    }

    // Never return less than the minimum known minute (from goals)
    return Math.max(minMinute, Math.max(0, estimatedMinute));
  }

  /**
   * Build the display string with proper Nachspielzeit notation
   * Examples: "45'", "45+3'", "90'", "90+5'", "105+2'" (DFB-Pokal)
   */
  private buildDisplayValue(
    matchMinute: number,
    period: SoccerClock['period'],
    isDFBPokal: boolean
  ): string {
    // Halftime shows "45'"
    if (period === 'halftime') {
      return "45'";
    }

    // First half: max 45, then Nachspielzeit
    if (period === 'first_half') {
      if (matchMinute > 45) {
        const extra = matchMinute - 45;
        return `45+${extra}'`;
      }
      return `${Math.min(matchMinute, 45)}'`;
    }

    // Second half: 46-90, then Nachspielzeit
    if (period === 'second_half') {
      if (matchMinute > 90) {
        const extra = matchMinute - 90;
        return `90+${extra}'`;
      }
      return `${Math.max(45, Math.min(matchMinute, 90))}'`;
    }

    // Extra time (DFB-Pokal only): 91-105, then 105+X, then 106-120, then 120+X
    if (period === 'extra_time' && isDFBPokal) {
      if (matchMinute <= 105) {
        return `${matchMinute}'`;
      } else if (matchMinute <= 120) {
        // Second extra time half
        return `${matchMinute}'`;
      } else {
        // Extra time Nachspielzeit
        const extra = matchMinute - 120;
        return `120+${extra}'`;
      }
    }

    // Fallback
    return `${matchMinute}'`;
  }

  private transformTeam(team: OpenLigaDBTeam, score: number): Team {
    // Override logos for teams with better quality or transparency issues
    let logo = team.teamIconUrl;

    // St. Pauli - use local logo
    if (team.teamId === 98) {
      logo = '/logos/st-pauli.png';
    }

    // Union Berlin - use local logo
    if (team.teamId === 80) {
      logo = '/logos/union.png';
    }

    return {
      id: team.teamId.toString(),
      name: team.teamName,
      abbreviation: team.shortName,
      displayName: team.teamName,
      shortDisplayName: team.shortName,
      logo,
      color: getBundesligaTeamColor(team.teamId),
      alternateColor: getBundesligaTeamAlternateColor(team.teamId),
      score,
    };
  }
}
