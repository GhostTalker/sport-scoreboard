// Bundesliga Table Service
// Fetches league table and calculates live standings based on current match results

import type { OpenLigaDBTableEntry, LiveTableEntry } from '../types/bundesliga';
import type { Game } from '../types/game';
import { API_ENDPOINTS } from '../constants/api';

/**
 * Fetch the current Bundesliga table from OpenLigaDB
 */
export async function fetchBundesligaTable(season: number = 2024): Promise<OpenLigaDBTableEntry[]> {
  try {
    // OpenLigaDB expects season as path parameter, not query parameter
    // Format: /getbltable/bl1/2024
    const response = await fetch(`${API_ENDPOINTS.bundesligaTable}/${season}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch table: ${response.statusText}`);
    }
    const table: OpenLigaDBTableEntry[] = await response.json();
    return table;
  } catch (error) {
    console.error('Error fetching Bundesliga table:', error);
    throw error;
  }
}

/**
 * Calculate live table based on current match results
 * Takes the official table and applies live/upcoming match results
 */
export function calculateLiveTable(
  officialTable: OpenLigaDBTableEntry[],
  currentGames: Game[]
): LiveTableEntry[] {
  // Create a map for quick team lookup
  const tableMap = new Map<number, OpenLigaDBTableEntry>();
  officialTable.forEach((entry) => {
    tableMap.set(entry.teamInfoId, entry);
  });

  // Calculate live points and goal difference changes
  const liveAdjustments = new Map<
    number,
    { pointsChange: number; goalsForChange: number; goalsAgainstChange: number }
  >();

  // Process each current game
  currentGames.forEach((game) => {
    const homeTeamId = parseInt(game.homeTeam.id);
    const awayTeamId = parseInt(game.awayTeam.id);
    const homeScore = game.homeTeam.score;
    const awayScore = game.awayTeam.score;

    // Only consider games that are in progress or finished (not scheduled)
    if (game.status === 'scheduled') {
      return;
    }

    // Initialize adjustments if not present
    if (!liveAdjustments.has(homeTeamId)) {
      liveAdjustments.set(homeTeamId, { pointsChange: 0, goalsForChange: 0, goalsAgainstChange: 0 });
    }
    if (!liveAdjustments.has(awayTeamId)) {
      liveAdjustments.set(awayTeamId, { pointsChange: 0, goalsForChange: 0, goalsAgainstChange: 0 });
    }

    const homeAdj = liveAdjustments.get(homeTeamId)!;
    const awayAdj = liveAdjustments.get(awayTeamId)!;

    // Calculate points based on current score
    if (homeScore > awayScore) {
      homeAdj.pointsChange += 3; // Win
      awayAdj.pointsChange += 0; // Loss
    } else if (homeScore < awayScore) {
      homeAdj.pointsChange += 0; // Loss
      awayAdj.pointsChange += 3; // Win
    } else {
      homeAdj.pointsChange += 1; // Draw
      awayAdj.pointsChange += 1; // Draw
    }

    // Update goal differences
    homeAdj.goalsForChange += homeScore;
    homeAdj.goalsAgainstChange += awayScore;
    awayAdj.goalsForChange += awayScore;
    awayAdj.goalsAgainstChange += homeScore;
  });

  // Build live table entries
  const liveTable: LiveTableEntry[] = officialTable.map((entry, index) => {
    const adj = liveAdjustments.get(entry.teamInfoId) || {
      pointsChange: 0,
      goalsForChange: 0,
      goalsAgainstChange: 0,
    };

    const livePoints = entry.points + adj.pointsChange;
    const liveGoalsFor = entry.goals + adj.goalsForChange;
    const liveGoalsAgainst = entry.opponentGoals + adj.goalsAgainstChange;
    const liveGoalDiff = liveGoalsFor - liveGoalsAgainst;

    return {
      position: index + 1, // Will be recalculated after sorting
      previousPosition: index + 1,
      teamId: entry.teamInfoId,
      teamName: entry.teamName,
      shortName: entry.shortName,
      teamIconUrl: entry.teamIconUrl,
      points: entry.points,
      livePoints,
      played: entry.matches,
      won: entry.won,
      draw: entry.draw,
      lost: entry.lost,
      goalsFor: entry.goals,
      goalsAgainst: entry.opponentGoals,
      goalDifference: entry.goalDiff,
      liveGoalDifference: liveGoalDiff,
    };
  });

  // Sort by live points, then goal difference, then goals scored
  liveTable.sort((a, b) => {
    if (b.livePoints !== a.livePoints) {
      return b.livePoints - a.livePoints;
    }
    if (b.liveGoalDifference !== a.liveGoalDifference) {
      return b.liveGoalDifference - a.liveGoalDifference;
    }
    return b.goalsFor - a.goalsFor;
  });

  // Update positions after sorting
  liveTable.forEach((entry, index) => {
    entry.position = index + 1;
  });

  return liveTable;
}

/**
 * Get position zone (Champions League, Europa League, Relegation, etc.)
 */
export function getPositionZone(position: number): {
  zone: 'ucl' | 'uel' | 'uecl' | 'relegation' | 'safe';
  color: string;
  label: string;
} {
  if (position <= 4) {
    return { zone: 'ucl', color: '#0066CC', label: 'Champions League' };
  }
  if (position === 5) {
    return { zone: 'uel', color: '#FF6600', label: 'Europa League' };
  }
  if (position === 6) {
    return { zone: 'uecl', color: '#00CC66', label: 'Europa Conference League' };
  }
  if (position === 16) {
    return { zone: 'relegation', color: '#FFAA00', label: 'Relegation' };
  }
  if (position >= 17) {
    return { zone: 'relegation', color: '#CC0000', label: 'Abstieg' };
  }
  return { zone: 'safe', color: 'transparent', label: '' };
}
