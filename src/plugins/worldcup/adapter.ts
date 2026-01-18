// FIFA World Cup 2026 Adapter
// Uses OpenLigaDB API for tournament match data
// Note: World Cup matches typically don't provide real-time minute updates, estimated based on kickoff time

import { BaseSoccerAdapter, type OpenLigaDBMatchBase } from '../../adapters/BaseSoccerAdapter';
import type { Game, TournamentGame } from '../../types/game';
import type { TournamentMatch } from '../../types/tournament';
import type { GameStats } from '../../types/stats';
import { API_ENDPOINTS } from '../../constants/api';

// FIFA World Cup team colors (placeholder - will be populated with actual team colors)
const WORLDCUP_TEAM_COLORS: Record<number, string> = {
  // Will be populated with actual team IDs from OpenLigaDB wm26 data
  // Example placeholder colors for major teams
};

export class WorldCupAdapter extends BaseSoccerAdapter {
  readonly sport = 'worldcup' as const;
  readonly teamColors = WORLDCUP_TEAM_COLORS;
  readonly defaultColor = '0066CC'; // Default blue
  readonly canHaveExtraTime = true; // World Cup has extra time in knockout rounds

  async fetchScoreboard(_signal?: AbortSignal): Promise<Game[]> {
    this.setRecoveryState(true);

    try {
      // FIFA World Cup 2026
      const season = 2026;
      const leagueCode = 'wm26';

      const allGames: Game[] = [];
      let hasStaleData = false;
      let staleError: string | null = null;
      let staleCacheAge: number | null = null;

      // Fetch World Cup games
      try {
        const wcGroupResponse = await fetch(`${API_ENDPOINTS.bundesligaCurrentGroup}?league=${leagueCode}`);
        const wcGroupCacheInfo = this.parseCacheHeaders(wcGroupResponse);

        if (wcGroupCacheInfo.isStale) {
          hasStaleData = true;
          staleError = wcGroupCacheInfo.apiError;
          staleCacheAge = wcGroupCacheInfo.cacheAge;
        }

        if (wcGroupResponse.ok) {
          const wcGroup: { groupOrderID: number } = await wcGroupResponse.json();
          const wcMatchesResponse = await fetch(
            `${API_ENDPOINTS.bundesligaMatchday(wcGroup.groupOrderID)}?season=${season}&league=${leagueCode}`
          );

          const wcMatchesCacheInfo = this.parseCacheHeaders(wcMatchesResponse);
          if (wcMatchesCacheInfo.isStale) {
            hasStaleData = true;
            staleError = wcMatchesCacheInfo.apiError || staleError;
            staleCacheAge = wcMatchesCacheInfo.cacheAge || staleCacheAge;
          }

          if (wcMatchesResponse.ok) {
            const wcMatches: TournamentMatch[] = await wcMatchesResponse.json();
            allGames.push(...wcMatches.map((match) => this.transformMatch(match)));
          }
        }
      } catch (err) {
        console.warn('Error fetching FIFA World Cup games:', err);
        hasStaleData = true;
        staleError = err instanceof Error ? err.message : 'Unknown error';
      }

      // Update cache status
      if (hasStaleData) {
        this.setCacheStale(staleError, staleCacheAge);
      } else {
        this.setCacheFresh(allGames);
      }

      this.setRecoveryState(false);
      return allGames;
    } catch (error) {
      return this.handleFetchError(error, 'World Cup');
    }
  }

  async fetchGameDetails(gameId: string, _signal?: AbortSignal): Promise<{ game: Game; stats: GameStats | null }> {
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
      console.error('Error fetching World Cup game details:', error);
      throw error;
    }
  }

  getCompetitionName(game: Game): string {
    const tournamentGame = game as TournamentGame;
    return tournamentGame.round || 'FIFA Weltmeisterschaft 2026';
  }

  /**
   * Transform OpenLigaDB tournament match to World Cup-specific game format
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
      sport: 'worldcup',
      competition: 'fifa-worldcup',
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
