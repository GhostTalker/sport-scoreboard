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
  periodName?: string; // "1. Halbzeit", "2. Halbzeit", "Halbzeit", "Verlängerung"
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

// OpenLigaDB API Response Types
// These types represent the raw data returned from the OpenLigaDB API

export interface OpenLigaDBTeam {
  teamId: number;
  teamName: string;
  shortName: string;
  teamIconUrl: string;
  teamGroupName?: string;
}

export interface OpenLigaDBMatchResult {
  resultID: number;
  resultName: string;
  pointsTeam1: number;
  pointsTeam2: number;
  resultOrderID: number;
  resultTypeID: number; // 1 = halftime, 2 = final
  resultDescription?: string;
}

export interface OpenLigaDBGoal {
  goalID: number;
  scoreTeam1: number;
  scoreTeam2: number;
  matchMinute: number;
  goalGetterID: number;
  goalGetterName: string;
  isPenalty: boolean;
  isOwnGoal: boolean;
  isOvertime: boolean;
  comment?: string;
}

export interface OpenLigaDBLocation {
  locationID: number;
  locationCity: string;
  locationStadium: string;
}

export interface OpenLigaDBGroup {
  groupName: string;
  groupOrderID: number;
  groupID: number;
}

export interface OpenLigaDBMatch {
  matchID: number;
  matchDateTime: string;
  matchDateTimeUTC: string;
  timeZoneID: string;
  leagueId: number;
  leagueName: string;
  leagueSeason: number;
  leagueShortcut: string;
  matchDay: number;
  group: OpenLigaDBGroup;
  team1: OpenLigaDBTeam;
  team2: OpenLigaDBTeam;
  lastUpdateDateTime: string;
  matchIsFinished: boolean;
  matchResults: OpenLigaDBMatchResult[];
  goals: OpenLigaDBGoal[];
  location: OpenLigaDBLocation | null;
  numberOfViewers?: number;
}

export interface OpenLigaDBCurrentGroup {
  groupOrderID: number;
  groupName: string;
  groupID: number;
}
