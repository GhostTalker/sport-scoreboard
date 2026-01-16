// UEFA Champions League Adapter
// Uses OpenLigaDB API for match data
// Note: UEFA CL typically doesn't provide real-time minute updates, estimated based on kickoff time

import type { SportAdapter, ScoreChangeResult } from '../../adapters/SportAdapter';
import type { Game, UEFAGame, CelebrationType } from '../../types/game';
import type { GameStatus, Team } from '../../types/base';
import type { SoccerClock, Goal } from '../../types/bundesliga';
import type {
  OpenLigaDBMatch,
  OpenLigaDBCurrentGroup,
  OpenLigaDBTeam,
  OpenLigaDBGoal,
  OpenLigaDBMatchResult,
} from '../../types/uefa';
import type { GameStats } from '../../types/stats';
import { API_ENDPOINTS } from '../../constants/api';

// UEFA-specific team colors (primary colors for major European clubs)
// OpenLigaDB Team IDs mapped to hex colors
const UEFA_TEAM_COLORS: Record<number, string> = {
  // German Clubs
  40: 'FDD835', // Borussia Dortmund - Yellow
  9: 'DC143C', // FC Bayern München - Red
  81: 'E32221', // Bayer 04 Leverkusen - Red
  91: 'E1000F', // Eintracht Frankfurt - Red
  95: 'FFED00', // VfB Stuttgart - Yellow

  // English Clubs
  34: 'EF0107', // Liverpool FC - Red
  35: '003399', // Chelsea FC - Blue
  328: '7F0000', // Arsenal FC - Red
  329: '6CABDD', // Manchester City - Sky Blue
  384: '034694', // Aston Villa - Claret Blue

  // Spanish Clubs
  418: 'FEBE10', // Villarreal CF - Yellow
  720: 'FFFFFF', // Real Madrid - White
  131: 'A50044', // FC Barcelona - Blaugrana
  982: 'CE3524', // Atlético Madrid - Red/White

  // Italian Clubs
  5: '0068A8', // Inter Mailand - Blue/Black
  583: '000000', // Juventus Turin - Black/White
  398: 'FD1F00', // AC Mailand - Red/Black

  // French Clubs
  1851: '004170', // Paris Saint-Germain - Blue

  // Dutch Clubs
  6928: 'D30E22', // PSV Eindhoven - Red/White

  // Portuguese Clubs
  2448: 'E30613', // Benfica Lissabon - Red

  // Other
  7574: '00529F', // FC Kopenhagen - Blue
};

export class UEFAAdapter implements SportAdapter {
  sport = 'uefa' as const;

  async fetchScoreboard(): Promise<Game[]> {
    try {
      // Calculate season year
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1; // 1-12
      // UEFA season starts in September
      const season = currentMonth >= 9 ? currentYear : currentYear - 1;

      // Calculate league code for OpenLigaDB (e.g., ucl2025 for 2025/26 season)
      const leagueCode = `ucl${season}`;

      const allGames: Game[] = [];

      // Fetch UEFA Champions League games
      try {
        const uefaGroupResponse = await fetch(`${API_ENDPOINTS.bundesligaCurrentGroup}?league=${leagueCode}`);
        if (uefaGroupResponse.ok) {
          const uefaGroup: OpenLigaDBCurrentGroup = await uefaGroupResponse.json();
          const uefaMatchesResponse = await fetch(
            `${API_ENDPOINTS.bundesligaMatchday(uefaGroup.groupOrderID)}?season=${season}&league=${leagueCode}`
          );
          if (uefaMatchesResponse.ok) {
            const uefaMatches: OpenLigaDBMatch[] = await uefaMatchesResponse.json();
            allGames.push(...uefaMatches.map((match) => this.transformMatch(match)));
          }
        }
      } catch (err) {
        console.warn('Error fetching UEFA Champions League games:', err);
      }

      return allGames;
    } catch (error) {
      console.error('Error fetching UEFA scoreboard:', error);
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

      // OpenLigaDB doesn't provide detailed stats
      return {
        game: this.transformMatch(match),
        stats: null,
      };
    } catch (error) {
      console.error('Error fetching UEFA game details:', error);
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

    const uefaGame = game as UEFAGame;

    // Determine which team scored
    if (homeDiff > 0) {
      const latestGoal = uefaGame.goals[uefaGame.goals.length - 1];
      return {
        type: this.getGoalVideoType(latestGoal),
        team: 'home',
      };
    } else if (awayDiff > 0) {
      const latestGoal = uefaGame.goals[uefaGame.goals.length - 1];
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
    const uefaGame = game as UEFAGame;
    return uefaGame.round || 'UEFA Champions League';
  }

  getCelebrationTypes(): CelebrationType[] {
    return ['goal', 'penalty', 'own_goal', 'red_card', 'yellow_red_card'];
  }

  // Transform OpenLigaDB match to our Game format
  private transformMatch(oldbMatch: OpenLigaDBMatch): UEFAGame {
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

    // Determine round from group name
    const round = this.determineRound(oldbMatch.group.groupName);

    return {
      id: oldbMatch.matchID.toString(),
      sport: 'uefa',
      competition: 'champions-league',
      homeTeam: this.transformTeam(oldbMatch.team1, finalResult?.pointsTeam1 || 0),
      awayTeam: this.transformTeam(oldbMatch.team2, finalResult?.pointsTeam2 || 0),
      status,
      startTime: oldbMatch.matchDateTimeUTC,
      venue: oldbMatch.location?.locationStadium || oldbMatch.location?.locationCity || undefined,
      clock: this.buildClock(oldbMatch, goals),
      matchday: oldbMatch.group.groupOrderID,
      round,
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

  private determineRound(groupName: string): string {
    // Group name examples: "Ligaphase", "Gruppenphase", "Achtelfinale", "Viertelfinale", "Halbfinale", "Finale"
    const roundMap: Record<string, string> = {
      'Ligaphase': 'League Phase', // New format 2024/25+
      'Gruppenphase': 'Group Stage',
      'Achtelfinale': 'Round of 16',
      'Viertelfinale': 'Quarter-finals',
      'Halbfinale': 'Semi-finals',
      'Finale': 'Final',
    };

    for (const [german, english] of Object.entries(roundMap)) {
      if (groupName.toLowerCase().includes(german.toLowerCase())) {
        return english;
      }
    }

    return groupName; // Return original if no match
  }

  private determineGameStatus(match: OpenLigaDBMatch): GameStatus {
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

  private buildClock(match: OpenLigaDBMatch, goals: Goal[]): SoccerClock {
    const now = Date.now();
    const kickoff = new Date(match.matchDateTime).getTime();
    const elapsedMs = now - kickoff;
    const elapsedMinutes = Math.floor(elapsedMs / 60000);

    // UEFA Champions League can have extra time
    const canHaveExtraTime = true;

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
      if (latestGoalMinute !== null && latestGoalMinute > 90 && canHaveExtraTime) {
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
          canHaveExtraTime
        );

        if (estimatedCurrentMinute > matchMinute) {
          matchMinute = estimatedCurrentMinute;
        }
      } else {
        matchMinute = this.estimateCurrentMinute(elapsedMinutes, 0, canHaveExtraTime);
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
      } else if (canHaveExtraTime && matchMinute > 90) {
        period = 'extra_time';
      } else {
        period = 'second_half';
      }
    }

    const displayValue = this.buildDisplayValue(matchMinute, period, canHaveExtraTime);

    return {
      matchMinute,
      period,
      periodName: this.getPeriodName(period),
      displayValue,
    };
  }

  private estimateCurrentMinute(
    elapsedMinutes: number,
    minMinute: number,
    canHaveExtraTime: boolean
  ): number {
    let estimatedMinute: number;

    if (elapsedMinutes <= 45) {
      estimatedMinute = elapsedMinutes;
    } else if (elapsedMinutes <= 62) {
      estimatedMinute = 45;
    } else if (elapsedMinutes <= 107) {
      estimatedMinute = 45 + (elapsedMinutes - 62);
    } else if (canHaveExtraTime && elapsedMinutes <= 140) {
      estimatedMinute = 90 + (elapsedMinutes - 107);
    } else {
      estimatedMinute = canHaveExtraTime ? Math.min(elapsedMinutes - 20, 120) : 90;
    }

    return Math.max(minMinute, Math.max(0, estimatedMinute));
  }

  private buildDisplayValue(
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

  private transformTeam(team: OpenLigaDBTeam, score: number): Team {
    let logo = team.teamIconUrl;

    // Use team-specific colors if available
    const color = UEFA_TEAM_COLORS[team.teamId] || '#0066CC'; // Default UEFA blue
    const alternateColor = '#FFFFFF';

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
