// Bundesliga-specific types

import { BaseGame } from './base';

export interface BundesligaGame extends BaseGame {
  sport: 'bundesliga';
  competition: 'bundesliga' | 'dfb-pokal';
  clock: SoccerClock;
  matchday: number;
  goals: Goal[];
  halftimeScore?: { home: number; away: number };
  cards?: Card[];
}

export interface SoccerClock {
  matchMinute: number;
  period: 'first_half' | 'second_half' | 'halftime' | 'extra_time';
  displayValue: string; // "45'", "90+3'"
}

export interface Goal {
  goalId: number;
  minute: number;
  scorerName: string;
  scorerTeam: 'home' | 'away';
  isPenalty: boolean;
  isOwnGoal: boolean;
  scoreAfter: { home: number; away: number };
}

export interface Card {
  minute: number;
  playerName: string;
  team: 'home' | 'away';
  type: 'yellow' | 'yellow-red' | 'red';
}

export type BundesligaCelebrationType =
  | 'goal'
  | 'penalty'
  | 'own_goal'
  | 'red_card'
  | 'yellow_red_card';
