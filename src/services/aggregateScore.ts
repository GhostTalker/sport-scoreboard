// UEFA Aggregate Score Service
// Calculates aggregate scores for 2-leg knockout matches

import type { Game, UEFAGame } from '../types/game';
import type { AggregateScore } from '../types/uefa';

/**
 * Rounds that have 2-leg matches in UEFA Champions League
 * Final is single match, League Phase is league format
 */
const TWO_LEG_ROUNDS = [
  'Round of 16',
  'Quarter-finals',
  'Semi-finals',
  // Playoff round (new format 2024/25+)
  'Playoff',
  'Playoffs',
];

/**
 * Check if a round uses 2-leg format
 */
export function isTwoLegRound(round?: string): boolean {
  if (!round) return false;
  return TWO_LEG_ROUNDS.some(
    (r) => round.toLowerCase().includes(r.toLowerCase())
  );
}

/**
 * Find the matching leg for a given UEFA knockout game
 * Matches by: same teams, same round, different dates
 */
export function findMatchingLeg(
  currentGame: UEFAGame,
  allGames: Game[]
): UEFAGame | null {
  if (!isTwoLegRound(currentGame.round)) {
    return null;
  }

  const uefaGames = allGames.filter(
    (g): g is UEFAGame => g.sport === 'uefa' && g.id !== currentGame.id
  );

  // Find game with same teams (swapped home/away) and same round
  const matchingLeg = uefaGames.find((game) => {
    // Same round
    if (game.round !== currentGame.round) return false;

    // Teams are swapped (home becomes away, away becomes home)
    const teamsMatch =
      (game.homeTeam.id === currentGame.awayTeam.id &&
        game.awayTeam.id === currentGame.homeTeam.id);

    return teamsMatch;
  });

  return matchingLeg || null;
}

/**
 * Determine which leg is the first leg based on date
 * Returns 1 if currentGame is first leg, 2 if second leg
 */
export function determineLegNumber(
  currentGame: UEFAGame,
  otherLeg: UEFAGame
): 1 | 2 {
  const currentDate = new Date(currentGame.startTime || '').getTime();
  const otherDate = new Date(otherLeg.startTime || '').getTime();

  // Earlier date is first leg
  return currentDate <= otherDate ? 1 : 2;
}

/**
 * Calculate aggregate score for a UEFA knockout game
 *
 * @param currentGame The current game being displayed
 * @param allGames All available UEFA games (to find matching leg)
 * @returns AggregateScore object or null if not a 2-leg round
 */
export function calculateAggregateScore(
  currentGame: UEFAGame,
  allGames: Game[]
): AggregateScore | null {
  // Only calculate for knockout rounds with 2-leg format
  if (!isTwoLegRound(currentGame.round)) {
    return null;
  }

  const otherLeg = findMatchingLeg(currentGame, allGames);
  const currentLeg = otherLeg ? determineLegNumber(currentGame, otherLeg) : 1;

  // Current game scores
  const currentHomeScore = currentGame.homeTeam.score;
  const currentAwayScore = currentGame.awayTeam.score;

  // If no other leg found, this might be the first leg (second not scheduled yet)
  // or data is incomplete
  if (!otherLeg) {
    return {
      homeTotal: currentHomeScore,
      awayTotal: currentAwayScore,
      firstLeg: {
        home: currentHomeScore,
        away: currentAwayScore,
      },
      secondLeg: null,
      currentLeg: 1,
      winner: 'tbd',
    };
  }

  // Other leg scores (from perspective of OTHER leg's home team)
  // We need to flip these to match current game's perspective
  const otherHomeScore = otherLeg.homeTeam.score; // This is current game's AWAY team
  const otherAwayScore = otherLeg.awayTeam.score; // This is current game's HOME team

  // Calculate totals from current game's home team perspective
  let homeTotal: number;
  let awayTotal: number;
  let firstLeg: { home: number; away: number };
  let secondLeg: { home: number; away: number };

  if (currentLeg === 1) {
    // Current game is first leg
    // First leg: current game scores
    // Second leg: other leg scores (flipped because teams swap venues)
    firstLeg = {
      home: currentHomeScore,
      away: currentAwayScore,
    };
    secondLeg = {
      home: otherAwayScore, // Current home team playing away
      away: otherHomeScore, // Current away team playing home
    };

    // Total: home team = first leg home + second leg away goals
    // Total: away team = first leg away + second leg home goals
    homeTotal = currentHomeScore + otherAwayScore;
    awayTotal = currentAwayScore + otherHomeScore;
  } else {
    // Current game is second leg
    // First leg: other leg scores (flipped)
    // Second leg: current game scores
    firstLeg = {
      home: otherAwayScore, // Current home team was away
      away: otherHomeScore, // Current away team was home
    };
    secondLeg = {
      home: currentHomeScore,
      away: currentAwayScore,
    };

    // Total: home team = second leg home + first leg away goals
    // Total: away team = second leg away + first leg home goals
    homeTotal = currentHomeScore + otherAwayScore;
    awayTotal = currentAwayScore + otherHomeScore;
  }

  // Determine winner (only if both legs are finished)
  let winner: 'home' | 'away' | 'tbd' = 'tbd';
  const bothLegsFinished =
    currentGame.status === 'final' && otherLeg.status === 'final';

  if (bothLegsFinished) {
    if (homeTotal > awayTotal) {
      winner = 'home';
    } else if (awayTotal > homeTotal) {
      winner = 'away';
    } else {
      // Aggregate tie - away goals rule was abolished in 2021/22
      // Now goes to extra time/penalties in second leg
      // For display purposes, mark as 'tbd' if tie on aggregate
      winner = 'tbd';
    }
  }

  // Calculate away goals (for historical reference or if needed)
  // Home team's away goals = goals in second leg (when playing away)
  // Away team's away goals = goals in first leg (when playing away)
  const awayGoals = currentLeg === 1
    ? {
        home: otherAwayScore, // Home team playing away in 2nd leg
        away: currentAwayScore, // Away team playing away in 1st leg
      }
    : {
        home: otherAwayScore, // Home team played away in 1st leg (which is other leg)
        away: currentAwayScore, // Away team playing away in 2nd leg (current)
      };

  return {
    homeTotal,
    awayTotal,
    firstLeg,
    secondLeg,
    currentLeg,
    otherLegId: otherLeg.id,
    winner,
    awayGoals,
  };
}

/**
 * Get a formatted string representation of the aggregate score
 * @example "4-3 on aggregate"
 */
export function formatAggregateScore(aggregate: AggregateScore): string {
  return `${aggregate.homeTotal}-${aggregate.awayTotal}`;
}

/**
 * Get leg description in German
 */
export function getLegDescription(leg: 1 | 2, language: 'de' | 'en' = 'de'): string {
  if (language === 'de') {
    return leg === 1 ? 'Hinspiel' : 'Rückspiel';
  }
  return leg === 1 ? '1st Leg' : '2nd Leg';
}

/**
 * Check if aggregate score shows the tie is decided
 * Returns true if aggregate is not tied
 */
export function isAggregateDecided(aggregate: AggregateScore): boolean {
  if (!aggregate.secondLeg) return false;
  return aggregate.homeTotal !== aggregate.awayTotal;
}

/**
 * Get winner team name for display
 */
export function getAggregateWinnerDisplay(
  aggregate: AggregateScore,
  homeTeamName: string,
  awayTeamName: string
): string | null {
  if (aggregate.winner === 'home') {
    return homeTeamName;
  }
  if (aggregate.winner === 'away') {
    return awayTeamName;
  }
  return null;
}
