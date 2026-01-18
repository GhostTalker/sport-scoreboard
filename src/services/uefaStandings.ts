// UEFA Champions League Standings Service
// Calculates league table from match results (similar to Bundesliga LiveTable)

import type { Game, UEFAGame } from '../types/game';

export interface UEFATableEntry {
  position: number;
  teamId: string;
  teamName: string;
  shortName: string;
  teamIconUrl: string;
  played: number;
  won: number;
  draw: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

/**
 * Calculate UEFA Champions League standings from match results
 * Works for League Phase format (2024/25 onwards)
 */
export function calculateUEFAStandings(games: Game[]): UEFATableEntry[] {
  const uefaGames = games.filter((g) => g.sport === 'uefa') as UEFAGame[];

  // Only calculate for finished and in-progress games
  const relevantGames = uefaGames.filter(
    (g) => g.status === 'final' || g.status === 'in_progress'
  );

  // Build team map
  const teamMap = new Map<string, UEFATableEntry>();

  // Initialize teams from all games
  relevantGames.forEach((game) => {
    [game.homeTeam, game.awayTeam].forEach((team) => {
      if (!teamMap.has(team.id)) {
        teamMap.set(team.id, {
          position: 0,
          teamId: team.id,
          teamName: team.name,
          shortName: team.abbreviation,
          teamIconUrl: team.logo,
          played: 0,
          won: 0,
          draw: 0,
          lost: 0,
          goalsFor: 0,
          goalsAgainst: 0,
          goalDifference: 0,
          points: 0,
        });
      }
    });
  });

  // Calculate stats from finished games
  relevantGames.filter((g) => g.status === 'final').forEach((game) => {
    const homeEntry = teamMap.get(game.homeTeam.id)!;
    const awayEntry = teamMap.get(game.awayTeam.id)!;

    homeEntry.played++;
    awayEntry.played++;

    homeEntry.goalsFor += game.homeTeam.score;
    homeEntry.goalsAgainst += game.awayTeam.score;
    awayEntry.goalsFor += game.awayTeam.score;
    awayEntry.goalsAgainst += game.homeTeam.score;

    if (game.homeTeam.score > game.awayTeam.score) {
      // Home win
      homeEntry.won++;
      homeEntry.points += 3;
      awayEntry.lost++;
    } else if (game.homeTeam.score < game.awayTeam.score) {
      // Away win
      awayEntry.won++;
      awayEntry.points += 3;
      homeEntry.lost++;
    } else {
      // Draw
      homeEntry.draw++;
      awayEntry.draw++;
      homeEntry.points += 1;
      awayEntry.points += 1;
    }
  });

  // Calculate goal difference
  teamMap.forEach((entry) => {
    entry.goalDifference = entry.goalsFor - entry.goalsAgainst;
  });

  // Convert to array and sort
  const standings = Array.from(teamMap.values());
  standings.sort((a, b) => {
    // Sort by points (descending)
    if (b.points !== a.points) {
      return b.points - a.points;
    }
    // Then by goal difference
    if (b.goalDifference !== a.goalDifference) {
      return b.goalDifference - a.goalDifference;
    }
    // Then by goals scored
    return b.goalsFor - a.goalsFor;
  });

  // Assign positions
  standings.forEach((entry, index) => {
    entry.position = index + 1;
  });

  return standings;
}

/**
 * Get position zone for UEFA Champions League
 * Based on new League Phase format (2024/25+)
 */
export function getUEFAPositionZone(position: number): {
  zone: 'direct' | 'playoff' | 'eliminated';
  color: string;
  label: string;
} {
  if (position <= 8) {
    return { zone: 'direct', color: '#10B981', label: 'Achtelfinale (Direkt)' };
  }
  if (position <= 24) {
    return { zone: 'playoff', color: '#3B82F6', label: 'Playoff (Platz 9-24)' };
  }
  return { zone: 'eliminated', color: '#EF4444', label: 'Ausgeschieden' };
}
