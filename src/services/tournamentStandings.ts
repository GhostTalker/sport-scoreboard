// Tournament Group Standings Service
// Calculates group tables from tournament match results (World Cup, Euro)

import type { Game, TournamentGame, GroupTable, GroupTableEntry } from '../types/game';

/**
 * Calculate tournament group standings from match results
 * Works for FIFA World Cup and UEFA Euro tournaments
 */
export function calculateTournamentGroupStandings(games: Game[]): GroupTable[] {
  // Filter only tournament games (World Cup or Euro)
  const tournamentGames = games.filter(
    (g) => g.sport === 'worldcup' || g.sport === 'euro'
  ) as TournamentGame[];

  // Only consider group stage games
  const groupGames = tournamentGames.filter((g) => g.roundType === 'group' && g.group);

  // Group games by their group name
  const gamesByGroup = new Map<string, TournamentGame[]>();
  groupGames.forEach((game) => {
    const groupName = game.group || 'Unknown';
    if (!gamesByGroup.has(groupName)) {
      gamesByGroup.set(groupName, []);
    }
    gamesByGroup.get(groupName)!.push(game);
  });

  // Build group tables
  const groupTables: GroupTable[] = [];

  gamesByGroup.forEach((games, groupName) => {
    const teamMap = new Map<string, GroupTableEntry>();

    // Initialize teams from all games in this group
    games.forEach((game) => {
      [game.homeTeam, game.awayTeam].forEach((team) => {
        if (!teamMap.has(team.id)) {
          teamMap.set(team.id, {
            position: 0,
            teamId: parseInt(team.id) || 0,
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

    // Calculate stats from finished and in-progress games
    const scoredGames = games.filter(
      (g) => g.status === 'final' || g.status === 'in_progress'
    );

    scoredGames.forEach((game) => {
      const homeEntry = teamMap.get(game.homeTeam.id);
      const awayEntry = teamMap.get(game.awayTeam.id);

      if (!homeEntry || !awayEntry) return;

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
    const teams = Array.from(teamMap.values());
    teams.sort((a, b) => {
      // Sort by points (descending)
      if (b.points !== a.points) {
        return b.points - a.points;
      }
      // Then by goal difference
      if (b.goalDifference !== a.goalDifference) {
        return b.goalDifference - a.goalDifference;
      }
      // Then by goals scored
      if (b.goalsFor !== a.goalsFor) {
        return b.goalsFor - a.goalsFor;
      }
      // Alphabetically by name as tiebreaker
      return a.teamName.localeCompare(b.teamName);
    });

    // Assign positions
    teams.forEach((entry, index) => {
      entry.position = index + 1;
    });

    groupTables.push({
      groupName,
      teams,
    });
  });

  // Sort groups alphabetically (Gruppe A, Gruppe B, etc.)
  groupTables.sort((a, b) => a.groupName.localeCompare(b.groupName));

  return groupTables;
}

/**
 * Get the group table for a specific group
 */
export function getGroupTable(
  groupTables: GroupTable[],
  groupName: string
): GroupTable | undefined {
  return groupTables.find((g) => g.groupName === groupName);
}

/**
 * Get position zone for tournament group standings
 * Top 2 teams advance to Round of 16
 */
export function getTournamentGroupPositionZone(position: number): {
  zone: 'qualified' | 'eliminated';
  color: string;
  label: string;
} {
  if (position <= 2) {
    return { zone: 'qualified', color: '#10B981', label: 'Achtelfinale' };
  }
  return { zone: 'eliminated', color: '#EF4444', label: 'Ausgeschieden' };
}

/**
 * Determine tournament name based on sport type
 */
export function getTournamentName(sport: 'worldcup' | 'euro'): string {
  if (sport === 'worldcup') {
    return 'FIFA WM';
  }
  return 'UEFA EM';
}
