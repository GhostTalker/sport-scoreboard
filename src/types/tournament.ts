// Tournament-specific types for FIFA World Cup and UEFA Euro
import { BaseGame } from './base';
import type { SoccerClock, Goal } from './bundesliga';

export interface TournamentGame extends BaseGame {
  sport: 'worldcup' | 'euro';
  competition: 'fifa-worldcup' | 'uefa-euro';
  clock: SoccerClock;
  round: string; // "Gruppenphase 1", "Achtelfinale", "Finale"
  roundType: 'group' | 'round_of_16' | 'quarter_finals' | 'semi_finals' | 'final';
  group?: string; // "Gruppe A", "Gruppe B" (only for group stage)
  goals: Goal[];
  halftimeScore?: { home: number; away: number };
}

// OpenLigaDB Tournament API Types
export interface TournamentTeam {
  teamId: number;
  teamName: string;
  shortName: string;
  teamIconUrl: string;
  teamGroupName?: string | null;
}

export interface TournamentMatch {
  matchID: number;
  matchDateTime: string;
  matchDateTimeUTC: string;
  timeZoneID: string;
  leagueId: number;
  leagueName: string;
  leagueSeason: number;
  leagueShortcut: string;
  group: {
    groupName: string;
    groupOrderID: number;
    groupID: number;
  };
  team1: TournamentTeam;
  team2: TournamentTeam;
  lastUpdateDateTime: string;
  matchIsFinished: boolean;
  matchResults: Array<{
    resultID: number;
    resultName: string;
    pointsTeam1: number;
    pointsTeam2: number;
    resultOrderID: number;
    resultTypeID: number;
  }>;
  goals: Array<{
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
  }>;
  location: {
    locationID: number;
    locationCity: string;
    locationStadium: string;
  } | null;
  numberOfViewers?: number;
}

// Tournament Bracket (K.O. Phase)
export interface BracketMatch {
  matchId: string;
  round: 'round_of_16' | 'quarter_finals' | 'semi_finals' | 'final';
  homeTeam: {
    id: string;
    name: string;
    shortName: string;
    logo: string;
    score: number;
  } | null; // null if TBD
  awayTeam: {
    id: string;
    name: string;
    shortName: string;
    logo: string;
    score: number;
  } | null; // null if TBD
  status: 'scheduled' | 'in_progress' | 'final';
  startTime: string;
  winner?: 'home' | 'away';
}

// Group Stage Table
export interface GroupTableEntry {
  position: number;
  teamId: number;
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

export interface GroupTable {
  groupName: string; // "Gruppe A"
  teams: GroupTableEntry[];
}

// Tournament Stats (for Stats Panel)
export interface TournamentStats {
  phase: 'group' | 'knockout';
  groupTables?: GroupTable[]; // Only for group phase
  bracket?: BracketMatch[]; // Only for knockout phase
}
