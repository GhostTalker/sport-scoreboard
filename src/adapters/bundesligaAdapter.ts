// Bundesliga Adapter - Wraps OpenLigaDB API and Bundesliga-specific logic

import type { SportAdapter, ScoreChangeResult } from './SportAdapter';
import type { Game, BundesligaGame, CelebrationType } from '../types/game';
import type { GameStatus, Team } from '../types/base';
import type { SoccerClock, Goal } from '../types/bundesliga';
import type { GameStats } from '../types/stats';
import { API_ENDPOINTS } from '../constants/api';
import { getBundesligaTeamColor, getBundesligaTeamAlternateColor } from '../constants/bundesligaTeams';

export class BundesligaAdapter implements SportAdapter {
  sport = 'bundesliga' as const;

  async fetchScoreboard(): Promise<Game[]> {
    try {
      // Fetch current matchday for Bundesliga
      const currentGroupResponse = await fetch(API_ENDPOINTS.bundesligaCurrentGroup);
      if (!currentGroupResponse.ok) {
        throw new Error(`OpenLigaDB error: ${currentGroupResponse.statusText}`);
      }
      const currentGroup = await currentGroupResponse.json();

      // Fetch all matches for current matchday
      const matchesResponse = await fetch(
        API_ENDPOINTS.bundesligaMatchday(currentGroup.GroupOrderID)
      );
      if (!matchesResponse.ok) {
        throw new Error(`OpenLigaDB error: ${matchesResponse.statusText}`);
      }
      const matches = await matchesResponse.json();

      return matches.map((match: any) => this.transformMatch(match));
    } catch (error) {
      console.error('Error fetching Bundesliga scoreboard:', error);
      throw error;
    }
  }

  async fetchGameDetails(gameId: string): Promise<{ game: Game; stats: GameStats | null }> {
    try {
      const response = await fetch(API_ENDPOINTS.bundesligaMatch(gameId));
      if (!response.ok) {
        throw new Error(`OpenLigaDB error: ${response.statusText}`);
      }
      const match = await response.json();

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
  private transformMatch(oldbMatch: any): BundesligaGame {
    // Extract halftime and final scores
    const halftimeResult = oldbMatch.MatchResults?.find((r: any) => r.ResultTypeID === 1);
    const finalResult = oldbMatch.MatchResults?.find((r: any) => r.ResultTypeID === 2);

    // Determine status
    const status = this.determineGameStatus(oldbMatch);

    // Transform goals
    const goals: Goal[] = (oldbMatch.Goals || []).map((g: any) => ({
      goalId: g.GoalID,
      minute: g.MatchMinute,
      scorerName: g.GoalGetterName,
      scorerTeam: g.ScoreTeam1 > (g.ScoreTeam2 || 0) ? 'home' : 'away',
      isPenalty: g.IsPenalty || false,
      isOwnGoal: g.IsOwnGoal || false,
      scoreAfter: {
        home: g.ScoreTeam1,
        away: g.ScoreTeam2,
      },
    }));

    return {
      id: oldbMatch.MatchID.toString(),
      sport: 'bundesliga',
      competition: oldbMatch.LeagueShortcut === 'dfb' ? 'dfb-pokal' : 'bundesliga',
      homeTeam: this.transformTeam(oldbMatch.Team1, finalResult?.PointsTeam1 || 0),
      awayTeam: this.transformTeam(oldbMatch.Team2, finalResult?.PointsTeam2 || 0),
      status,
      startTime: oldbMatch.MatchDateTimeUTC,
      venue: oldbMatch.Location?.LocationCity || undefined,
      clock: this.buildClock(oldbMatch, goals),
      matchday: oldbMatch.Group.GroupOrderID,
      goals,
      halftimeScore: halftimeResult
        ? {
            home: halftimeResult.PointsTeam1,
            away: halftimeResult.PointsTeam2,
          }
        : undefined,
      lastUpdate: oldbMatch.LastUpdateDateTime,
    };
  }

  private determineGameStatus(match: any): GameStatus {
    if (match.MatchIsFinished) {
      return 'final';
    }

    const now = Date.now();
    const kickoff = new Date(match.MatchDateTime).getTime();
    const elapsed = now - kickoff;
    const elapsedMinutes = elapsed / 60000;

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

  private buildClock(match: any, goals: Goal[]): SoccerClock {
    const now = Date.now();
    const kickoff = new Date(match.MatchDateTime).getTime();
    const elapsedMs = now - kickoff;
    const elapsedMinutes = Math.floor(elapsedMs / 60000);

    let period: SoccerClock['period'] = 'first_half';
    let matchMinute = 0;

    if (match.MatchIsFinished) {
      period = 'second_half';
      matchMinute = 90;
    } else if (elapsedMinutes < 45) {
      period = 'first_half';
      matchMinute = Math.max(0, Math.min(elapsedMinutes, 45));
    } else if (elapsedMinutes < 60) {
      period = 'halftime';
      matchMinute = 45;
    } else if (elapsedMinutes < 105) {
      period = 'second_half';
      matchMinute = Math.min(elapsedMinutes - 15, 90);
    } else {
      period = 'extra_time';
      matchMinute = elapsedMinutes - 15;
    }

    // Use latest goal minute if more accurate
    if (goals.length > 0) {
      const latestGoal = goals[goals.length - 1];
      matchMinute = Math.max(matchMinute, latestGoal.minute);
    }

    return {
      matchMinute,
      period,
      displayValue: `${matchMinute}'`,
    };
  }

  private transformTeam(team: any, score: number): Team {
    return {
      id: team.TeamId.toString(),
      name: team.TeamName,
      abbreviation: team.ShortName,
      displayName: team.TeamName,
      shortDisplayName: team.ShortName,
      logo: team.TeamIconUrl,
      color: getBundesligaTeamColor(team.TeamId),
      alternateColor: getBundesligaTeamAlternateColor(team.TeamId),
      score,
    };
  }
}
