// UEFA Champions League Adapter
// Uses OpenLigaDB API for match data
// Note: UEFA CL typically doesn't provide real-time minute updates, estimated based on kickoff time

import { BaseSoccerAdapter, type OpenLigaDBMatchBase } from '../../adapters/BaseSoccerAdapter';
import type { Game, UEFAGame } from '../../types/game';
import type {
  OpenLigaDBMatch,
  OpenLigaDBCurrentGroup,
} from '../../types/uefa';
import type { GameStats } from '../../types/stats';
import { API_ENDPOINTS } from '../../constants/api';

// UEFA-specific team colors (primary colors for major European clubs)
// OpenLigaDB Team IDs for UEFA Champions League (ucl2025)
// NOTE: These IDs are different from Bundesliga IDs!
const UEFA_TEAM_COLORS: Record<number, string> = {
  // German Clubs
  7: 'FDD835', // Borussia Dortmund - Yellow
  40: 'DC143C', // FC Bayern München - Red
  6: 'E32221', // Bayer 04 Leverkusen - Red
  91: 'E1000F', // Eintracht Frankfurt - Red

  // English Clubs
  370: 'EF0107', // FC Liverpool - Red
  364: '034694', // Chelsea FC - Blue
  354: 'EF0107', // Arsenal FC - Red
  4244: '6CABDD', // Manchester City - Sky Blue
  452: '132257', // Tottenham Hotspur - Navy Blue
  1075: '241F20', // Newcastle United - Black

  // Spanish Clubs
  382: 'FEBE10', // Villarreal CF - Yellow
  356: 'A50044', // FC Barcelona - Blaugrana
  355: 'CE3524', // Atlético Madrid - Red
  1135: 'EE2523', // Athletic Bilbao - Red/White

  // Italian Clubs
  733: '0068A8', // Inter Mailand - Blue/Black
  369: '000000', // Juventus Turin - Black/White
  1160: '1E90FF', // SSC Neapel - Blue
  1807: '003D7C', // Atalanta Bergamo - Blue

  // French Clubs
  2281: '004170', // Paris St. Germain - Blue

  // Dutch/Belgian Clubs
  376: 'D30E22', // PSV Eindhoven - Red/White
  1210: '005BAA', // FC Brügge - Blue/Black
  4825: '0033A0', // Union Saint-Gilloise - Blue/Yellow

  // Portuguese Clubs
  1816: 'E30613', // Benfica Lissabon - Red
  4604: '006638', // Sporting CP - Green

  // Turkish Clubs
  2554: 'FFC519', // Galatasaray Istanbul - Yellow/Red

  // Other
  453: '0047AB', // FC Kopenhagen - Blue
  436: 'EF3340', // Olympiakos Piräus - Red
  4458: '8B0000', // Qarabag FK - Dark Red
  5707: 'FFD700', // FK Bodö/Glimt - Yellow
  7081: '0066CC', // Paphos FC - Blue
};

export class UEFAAdapter extends BaseSoccerAdapter {
  readonly sport = 'uefa' as const;
  readonly teamColors = UEFA_TEAM_COLORS;
  readonly defaultColor = '0066CC'; // UEFA blue
  readonly canHaveExtraTime = true; // Champions League has extra time in knockout rounds

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

  getCompetitionName(game: Game): string {
    const uefaGame = game as UEFAGame;
    return uefaGame.round || 'UEFA Champions League';
  }

  /**
   * Transform OpenLigaDB match to UEFA-specific game format
   * Uses base transformation and adds UEFA-specific fields
   */
  private transformMatch(oldbMatch: OpenLigaDBMatch): UEFAGame {
    // Get base game data from parent class
    const baseGame = this.transformMatchBase(oldbMatch as OpenLigaDBMatchBase);

    // Extract halftime score
    const halftimeResult = oldbMatch.matchResults?.find(
      (r) => r.resultTypeID === 1
    );

    // Determine round from group name
    const round = this.determineRound(oldbMatch.group.groupName);

    // Build UEFA-specific game object
    return {
      ...baseGame,
      sport: 'uefa',
      competition: 'champions-league',
      matchday: oldbMatch.group.groupOrderID,
      round,
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
   * Determine UEFA-specific round name from German group name
   */
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
}
