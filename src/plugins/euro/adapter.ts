// UEFA Euro 2020 Adapter
// Uses OpenLigaDB API for tournament match data
// Note: Euro matches typically don't provide real-time minute updates, estimated based on kickoff time

import { BaseSoccerAdapter, type OpenLigaDBMatchBase } from '../../adapters/BaseSoccerAdapter';
import type { Game, TournamentGame } from '../../types/game';
import type { TournamentMatch } from '../../types/tournament';
import type { GameStats } from '../../types/stats';
import { API_ENDPOINTS } from '../../constants/api';

// UEFA Euro team colors (placeholder - will be populated with actual team colors)
const EURO_TEAM_COLORS: Record<number, string> = {
  // Will be populated with actual team IDs from OpenLigaDB em20 data
  // Example placeholder colors for major teams
};

export class EuroAdapter extends BaseSoccerAdapter {
  readonly sport = 'euro' as const;
  readonly teamColors = EURO_TEAM_COLORS;
  readonly defaultColor = '0066CC'; // Default blue
  readonly canHaveExtraTime = true; // Euro has extra time in knockout rounds

  async fetchScoreboard(): Promise<Game[]> {
    try {
      // UEFA Euro 2020 (held in 2021)
      const season = 2020;
      const leagueCode = 'em20';

      const allGames: Game[] = [];

      // Fetch Euro games
      try {
        const euroGroupResponse = await fetch(`${API_ENDPOINTS.bundesligaCurrentGroup}?league=${leagueCode}`);
        if (euroGroupResponse.ok) {
          const euroGroup: { groupOrderID: number } = await euroGroupResponse.json();
          const euroMatchesResponse = await fetch(
            `${API_ENDPOINTS.bundesligaMatchday(euroGroup.groupOrderID)}?season=${season}&league=${leagueCode}`
          );
          if (euroMatchesResponse.ok) {
            const euroMatches: TournamentMatch[] = await euroMatchesResponse.json();
            allGames.push(...euroMatches.map((match) => this.transformMatch(match)));
          }
        }
      } catch (err) {
        console.warn('Error fetching UEFA Euro games:', err);
      }

      return allGames;
    } catch (error) {
      console.error('Error fetching Euro scoreboard:', error);
      throw error;
    }
  }

  async fetchGameDetails(gameId: string): Promise<{ game: Game; stats: GameStats | null }> {
    try {
      const response = await fetch(API_ENDPOINTS.bundesligaMatch(gameId));
      if (!response.ok) {
        throw new Error(`OpenLigaDB error: ${response.statusText}`);
      }
      const match: TournamentMatch = await response.json();

      // OpenLigaDB doesn't provide detailed stats
      return {
        game: this.transformMatch(match),
        stats: null,
      };
    } catch (error) {
      console.error('Error fetching Euro game details:', error);
      throw error;
    }
  }

  getCompetitionName(game: Game): string {
    const tournamentGame = game as TournamentGame;
    return tournamentGame.round || 'UEFA Europameisterschaft 2020';
  }

  /**
   * Transform OpenLigaDB tournament match to Euro-specific game format
   * Uses base transformation and adds tournament-specific fields
   */
  private transformMatch(oldbMatch: TournamentMatch): TournamentGame {
    // Get base game data from parent class
    const baseGame = this.transformMatchBase(oldbMatch as OpenLigaDBMatchBase);

    // Extract halftime score
    const halftimeResult = oldbMatch.matchResults?.find(
      (r) => r.resultTypeID === 1
    );

    // Determine round and round type
    const { round, roundType, group } = this.determineRound(oldbMatch.group.groupName);

    // Build tournament-specific game object
    return {
      ...baseGame,
      sport: 'euro',
      competition: 'uefa-euro',
      round,
      roundType,
      group,
      goals: (oldbMatch.goals || []).map((g) => ({
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
      })),
      halftimeScore: halftimeResult
        ? {
            home: halftimeResult.pointsTeam1,
            away: halftimeResult.pointsTeam2,
          }
        : undefined,
      lastUpdate: oldbMatch.lastUpdateDateTime,
    };
  }

  /**
   * Determine tournament round from German group name
   * Returns round name, type, and group (if applicable)
   */
  private determineRound(groupName: string): {
    round: string;
    roundType: TournamentGame['roundType'];
    group?: string;
  } {
    // Group phase examples: "Gruppenphase 1", "Gruppe A", "Gruppe B"
    if (groupName.toLowerCase().includes('gruppenphase') || groupName.toLowerCase().includes('gruppe')) {
      // Extract group letter if present
      const groupMatch = groupName.match(/Gruppe ([A-Z])/i);
      return {
        round: groupName,
        roundType: 'group',
        group: groupMatch ? `Gruppe ${groupMatch[1].toUpperCase()}` : undefined,
      };
    }

    // Knockout rounds
    const roundMap: Record<string, { round: string; roundType: TournamentGame['roundType'] }> = {
      'Achtelfinale': { round: 'Achtelfinale', roundType: 'round_of_16' },
      'Viertelfinale': { round: 'Viertelfinale', roundType: 'quarter_finals' },
      'Halbfinale': { round: 'Halbfinale', roundType: 'semi_finals' },
      'Finale': { round: 'Finale', roundType: 'final' },
    };

    for (const [german, data] of Object.entries(roundMap)) {
      if (groupName.toLowerCase().includes(german.toLowerCase())) {
        return { ...data, group: undefined };
      }
    }

    // Default to group phase if unknown
    return { round: groupName, roundType: 'group', group: undefined };
  }
}
