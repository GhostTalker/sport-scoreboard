// Base Soccer Adapter for OpenLigaDB-based sports (Bundesliga, UEFA, WorldCup, Euro)
// Provides shared functionality to eliminate 1000+ lines of code duplication

import type { SportAdapter, ScoreChangeResult } from './SportAdapter';
import type { Game, CelebrationType } from '../types/game';
import type { GameStatus, Team } from '../types/base';
import type { SoccerClock, Goal } from '../types/bundesliga';
import type { GameStats } from '../types/stats';
import { getBestLogoUrl } from '../utils/logoFallback';

/**
 * OpenLigaDB Match interface (common structure across all soccer leagues)
 */
export interface OpenLigaDBMatchBase {
  matchID: number;
  matchDateTime: string;
  matchDateTimeUTC: string;
  matchIsFinished: boolean;
  lastUpdateDateTime: string;
  team1: {
    teamId: number;
    teamName: string;
    shortName: string;
    teamIconUrl: string;
  };
  team2: {
    teamId: number;
    teamName: string;
    shortName: string;
    teamIconUrl: string;
  };
  matchResults?: Array<{
    resultTypeID: number; // 1=halftime, 2=final
    pointsTeam1: number;
    pointsTeam2: number;
  }>;
  goals?: Array<{
    goalID: number;
    matchMinute: number;
    goalGetterName: string;
    scoreTeam1: number;
    scoreTeam2: number;
    isPenalty?: boolean;
    isOwnGoal?: boolean;
  }>;
  group: {
    groupName: string;
    groupOrderID: number;
  };
  location?: {
    locationCity?: string;
    locationStadium?: string;
  };
}

/**
 * Abstract base class for all soccer-based sports using OpenLigaDB API
 * Eliminates code duplication across Bundesliga, UEFA, WorldCup, and Euro adapters
 */
export abstract class BaseSoccerAdapter implements SportAdapter {
  // Abstract properties that child classes must provide
  abstract readonly sport: string;
  abstract readonly teamColors: Record<number, string>;
  abstract readonly defaultColor: string;
  abstract readonly canHaveExtraTime: boolean;

  // Abstract methods that child classes must implement
  abstract fetchScoreboard(): Promise<Game[]>;
  abstract fetchGameDetails(gameId: string): Promise<{ game: Game; stats: GameStats | null }>;
  abstract getCompetitionName(game: Game): string;

  /**
   * Detect score changes and return celebration type
   * Shared logic across all soccer sports
   */
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

    // Access goals from game (works for all soccer game types)
    const goals = (game as any).goals || [];

    // Determine which team scored
    if (homeDiff > 0) {
      const latestGoal = goals[goals.length - 1];
      return {
        type: this.getGoalVideoType(latestGoal),
        team: 'home',
      };
    } else if (awayDiff > 0) {
      const latestGoal = goals[goals.length - 1];
      return {
        type: this.getGoalVideoType(latestGoal),
        team: 'away',
      };
    }

    return null;
  }

  /**
   * Get celebration video type based on goal characteristics
   */
  protected getGoalVideoType(goal?: Goal): CelebrationType {
    if (!goal) return 'goal';

    if (goal.isPenalty) return 'penalty';
    if (goal.isOwnGoal) return 'own_goal';
    return 'goal';
  }

  /**
   * Get German period name for display
   */
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

  /**
   * Get list of supported celebration types
   */
  getCelebrationTypes(): CelebrationType[] {
    return ['goal', 'penalty', 'own_goal', 'red_card', 'yellow_red_card'];
  }

  /**
   * Transform OpenLigaDB match to base Game structure
   * Child classes can extend this for sport-specific fields
   * Returns a partial game object that child classes complete with sport-specific fields
   */
  protected transformMatchBase(oldbMatch: OpenLigaDBMatchBase): {
    id: string;
    sport: string;
    competition: string;
    homeTeam: Team;
    awayTeam: Team;
    status: GameStatus;
    startTime: string;
    venue?: string;
    clock: SoccerClock;
  } {
    // Extract final scores for team transformation
    const finalResult = oldbMatch.matchResults?.find(
      (r) => r.resultTypeID === 2
    );

    // Determine status
    const status = this.determineGameStatus(oldbMatch);

    // Transform goals (child classes will use this data)
    const goals: Goal[] = (oldbMatch.goals || []).map((g) => ({
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

    // Build base game object
    return {
      id: oldbMatch.matchID.toString(),
      sport: this.sport,
      competition: this.sport, // Will be overridden by child
      homeTeam: this.transformTeam(oldbMatch.team1, finalResult?.pointsTeam1 || 0),
      awayTeam: this.transformTeam(oldbMatch.team2, finalResult?.pointsTeam2 || 0),
      status,
      startTime: oldbMatch.matchDateTimeUTC,
      venue: oldbMatch.location?.locationStadium || oldbMatch.location?.locationCity || undefined,
      clock: this.buildClock(oldbMatch, goals),
    };
  }

  /**
   * Determine game status based on OpenLigaDB match data
   * Handles finished, scheduled, in_progress, halftime, and postponed
   */
  protected determineGameStatus(match: OpenLigaDBMatchBase): GameStatus {
    if (match.matchIsFinished) {
      return 'final';
    }

    const now = Date.now();
    const kickoff = new Date(match.matchDateTime).getTime();
    const elapsed = now - kickoff;
    const elapsedMinutes = elapsed / 60000;

    // Check for postponed/cancelled games
    const hasMatchResults = match.matchResults && match.matchResults.length > 0;
    const hasGoals = match.goals && match.goals.length > 0;
    const TWO_HOURS_IN_MINUTES = 120;

    if (elapsedMinutes >= TWO_HOURS_IN_MINUTES && !hasMatchResults && !hasGoals && !match.matchIsFinished) {
      if (match.lastUpdateDateTime) {
        const lastUpdate = new Date(match.lastUpdateDateTime).getTime();
        const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
        if (kickoff - lastUpdate > TWENTY_FOUR_HOURS_MS) {
          return 'postponed';
        }
      }
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

  /**
   * Build soccer clock with period, match minute, and display value
   * Estimates current minute based on elapsed time and goal timestamps
   */
  protected buildClock(match: OpenLigaDBMatchBase, goals: Goal[]): SoccerClock {
    const now = Date.now();
    const kickoff = new Date(match.matchDateTime).getTime();
    const elapsedMs = now - kickoff;
    const elapsedMinutes = Math.floor(elapsedMs / 60000);

    // Find the latest valid goal minute
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
      if (latestGoalMinute !== null && latestGoalMinute > 90 && this.canHaveExtraTime) {
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
    // GAME IN PROGRESS - Use goal-based time first, then estimate
    else {
      if (latestGoalMinute !== null) {
        matchMinute = latestGoalMinute;

        const estimatedCurrentMinute = this.estimateCurrentMinute(
          elapsedMinutes,
          latestGoalMinute,
          this.canHaveExtraTime
        );

        if (estimatedCurrentMinute > matchMinute) {
          matchMinute = estimatedCurrentMinute;
        }
      } else {
        matchMinute = this.estimateCurrentMinute(elapsedMinutes, 0, this.canHaveExtraTime);
      }

      // Determine period based on calculated match minute
      if (matchMinute <= 45) {
        if (elapsedMinutes >= 47 && elapsedMinutes < 62) {
          period = 'halftime';
          matchMinute = 45;
        } else {
          period = 'first_half';
        }
      } else if (matchMinute <= 90) {
        period = 'second_half';
      } else if (this.canHaveExtraTime && matchMinute > 90) {
        period = 'extra_time';
      } else {
        period = 'second_half';
      }
    }

    const displayValue = this.buildDisplayValue(matchMinute, period, this.canHaveExtraTime);

    return {
      matchMinute,
      period,
      periodName: this.getPeriodName(period),
      displayValue,
    };
  }

  /**
   * Estimate current minute based on elapsed real-time
   * Accounts for halftime break (15 min) and extra time breaks
   */
  protected estimateCurrentMinute(
    elapsedMinutes: number,
    minMinute: number,
    canHaveExtraTime: boolean
  ): number {
    let estimatedMinute: number;

    if (elapsedMinutes <= 45) {
      // First half
      estimatedMinute = elapsedMinutes;
    } else if (elapsedMinutes <= 62) {
      // Halftime (15 min break)
      estimatedMinute = 45;
    } else if (elapsedMinutes <= 107) {
      // Second half
      estimatedMinute = 45 + (elapsedMinutes - 62);
    } else if (canHaveExtraTime && elapsedMinutes <= 140) {
      // Extra time
      estimatedMinute = 90 + (elapsedMinutes - 107);
    } else {
      // Beyond normal time
      estimatedMinute = canHaveExtraTime ? Math.min(elapsedMinutes - 20, 120) : 90;
    }

    return Math.max(minMinute, Math.max(0, estimatedMinute));
  }

  /**
   * Build display value for clock (e.g., "45'", "45+3'", "90+2'")
   */
  protected buildDisplayValue(
    matchMinute: number,
    period: SoccerClock['period'],
    canHaveExtraTime: boolean
  ): string {
    if (period === 'halftime') {
      return "45'";
    }

    if (period === 'first_half') {
      if (matchMinute > 45) {
        const extra = matchMinute - 45;
        return `45+${extra}'`;
      }
      return `${Math.min(matchMinute, 45)}'`;
    }

    if (period === 'second_half') {
      if (matchMinute > 90) {
        const extra = matchMinute - 90;
        return `90+${extra}'`;
      }
      return `${Math.max(45, Math.min(matchMinute, 90))}'`;
    }

    if (period === 'extra_time' && canHaveExtraTime) {
      if (matchMinute <= 105) {
        return `${matchMinute}'`;
      } else if (matchMinute <= 120) {
        return `${matchMinute}'`;
      } else {
        const extra = matchMinute - 120;
        return `120+${extra}'`;
      }
    }

    return `${matchMinute}'`;
  }

  /**
   * Transform OpenLigaDB team to our Team format
   * Uses sport-specific team colors and logo fallback
   */
  protected transformTeam(
    team: { teamId: number; teamName: string; shortName: string; teamIconUrl: string },
    score: number
  ): Team {
    // Use fallback for better logo quality (Wikimedia Commons)
    const logo = getBestLogoUrl(team.teamIconUrl, team.teamName);

    // Use team-specific colors if available
    const color = this.teamColors[team.teamId] || this.defaultColor;
    const alternateColor = 'FFFFFF';

    return {
      id: team.teamId.toString(),
      name: team.teamName,
      abbreviation: team.shortName,
      displayName: team.teamName,
      shortDisplayName: team.shortName,
      logo,
      color,
      alternateColor,
      score,
    };
  }
}
