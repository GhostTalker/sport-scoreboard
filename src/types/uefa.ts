// UEFA Champions League specific types

import { BaseGame } from './base';
import { SoccerClock, Goal, Card } from './bundesliga';

// Re-export OpenLigaDB types as they're shared between Bundesliga and UEFA
export type {
  OpenLigaDBTeam,
  OpenLigaDBMatchResult,
  OpenLigaDBGoal,
  OpenLigaDBLocation,
  OpenLigaDBGroup,
  OpenLigaDBMatch,
  OpenLigaDBCurrentGroup,
} from './bundesliga';

export interface UEFAGame extends BaseGame {
  sport: 'uefa';
  competition: 'champions-league';
  clock: SoccerClock;
  matchday: number; // Round/Matchday in Champions League
  round?: string; // "Group Stage", "Round of 16", "Quarter-finals", "Semi-finals", "Final"
  goals: Goal[];
  halftimeScore?: { home: number; away: number };
  cards?: Card[];
  // Aggregate score for knockout 2-leg matches
  aggregate?: AggregateScore;
}

/**
 * Aggregate score for UEFA knockout rounds with 2-leg matches
 * Combines scores from both legs (home and away)
 */
export interface AggregateScore {
  /** Total goals scored by the team that was "home" in this leg */
  homeTotal: number;
  /** Total goals scored by the team that was "away" in this leg */
  awayTotal: number;
  /** First leg score (perspective: this game's home team) */
  firstLeg: {
    home: number;
    away: number;
  };
  /** Second leg score (perspective: this game's home team) */
  secondLeg: {
    home: number;
    away: number;
  } | null; // null if 2nd leg not played yet
  /** Which leg is the current game (1 or 2) */
  currentLeg: 1 | 2;
  /** Game ID of the other leg */
  otherLegId?: string;
  /** Winner determination */
  winner?: 'home' | 'away' | 'tbd';
  /** Away goals count for tiebreaker (if applicable - rule removed 2021/22) */
  awayGoals?: {
    home: number; // Away goals by this game's home team (scored in away leg)
    away: number; // Away goals by this game's away team (scored in this leg if home)
  };
}

export type UEFACelebrationType =
  | 'goal'
  | 'penalty'
  | 'own_goal'
  | 'red_card'
  | 'yellow_red_card';
