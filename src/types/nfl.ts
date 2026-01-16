// NFL-specific types

import { BaseGame } from './base';

export interface NFLGame extends BaseGame {
  sport: 'nfl';
  competition: 'nfl';
  clock: GameClock;
  situation?: GameSituation;
  seasonType?: number; // 1=pre, 2=regular, 3=post
  week?: number;
  seasonName?: string; // "Wild Card", "Divisional", "Conference", "Super Bowl"
}

export interface GameClock {
  displayValue: string; // "8:45"
  period: number; // 1-4, 5+ for OT
  periodName: string; // "1st", "2nd", "3rd", "4th", "OT"
}

export interface GameSituation {
  down: number;
  distance: number;
  yardLine: number;
  possession: string; // Team ID
  possessionText?: string; // "PHI 35", "SF 20", "50" (midfield)
  isRedZone: boolean;
  shortDownDistanceText?: string; // "1st & 10", "Kickoff", "PAT", etc.
  lastPlayType?: string; // "Kickoff", "Two-minute warning", "Punt", etc.
}

export type NFLCelebrationType =
  | 'touchdown'
  | 'fieldgoal'
  | 'interception'
  | 'sack'
  | 'fumble'
  | 'safety';

export interface ScoreEvent {
  team: 'home' | 'away';
  type: ScoreType;
  points: number;
  video: NFLCelebrationType | null;
}

export type ScoreType =
  | 'TOUCHDOWN'           // +6
  | 'TOUCHDOWN_PAT'       // +7
  | 'TOUCHDOWN_2PT'       // +8
  | 'FIELD_GOAL'          // +3
  | 'SAFETY'              // +2
  | 'EXTRA_POINT'         // +1
  | 'TWO_POINT_CONVERSION';

// Play-by-play types
export interface Play {
  id: string;
  sequenceNumber: number;
  type: PlayType;
  text: string;
  team?: 'home' | 'away';
  clock?: string;
  period?: number;
  scoringPlay?: boolean;
}

export interface PlayType {
  id: string;
  text: string;
}

// ESPN Play Type IDs
export const PLAY_TYPE_IDS = {
  PASSING_TOUCHDOWN: '67',
  RUSHING_TOUCHDOWN: '68',
  FIELD_GOAL_GOOD: '59',
  INTERCEPTION: '26',
  SACK: '7',
  FUMBLE: '36',
  FUMBLE_RECOVERY: '30',
  BLOCKED_PUNT: '17',
  SAFETY: '20',
  PENALTY: '8',
} as const;

// Map play type IDs to celebration videos
export const PLAY_TYPE_TO_VIDEO: Record<string, NFLCelebrationType> = {
  [PLAY_TYPE_IDS.PASSING_TOUCHDOWN]: 'touchdown',
  [PLAY_TYPE_IDS.RUSHING_TOUCHDOWN]: 'touchdown',
  [PLAY_TYPE_IDS.FIELD_GOAL_GOOD]: 'fieldgoal',
  [PLAY_TYPE_IDS.INTERCEPTION]: 'interception',
  [PLAY_TYPE_IDS.SACK]: 'sack',
  [PLAY_TYPE_IDS.FUMBLE]: 'fumble',
  [PLAY_TYPE_IDS.FUMBLE_RECOVERY]: 'fumble',
  [PLAY_TYPE_IDS.BLOCKED_PUNT]: 'fumble', // Use fumble video for blocked punts
  [PLAY_TYPE_IDS.SAFETY]: 'safety',
};

// NFL Playoff Bracket Types
export type PlayoffRound = 'wild_card' | 'divisional' | 'conference' | 'super_bowl';

export interface PlayoffTeam {
  id: string;
  name: string;
  abbreviation: string;
  logo: string;
  color: string;
  seed?: number; // 1-7
  score?: number;
}

export interface PlayoffMatchup {
  id: string;
  round: PlayoffRound;
  conference: 'AFC' | 'NFC' | 'CHAMPIONSHIP'; // CHAMPIONSHIP for Super Bowl
  homeTeam: PlayoffTeam | null;
  awayTeam: PlayoffTeam | null;
  winner?: 'home' | 'away';
  status: 'scheduled' | 'in_progress' | 'final';
  startTime?: string;
  venue?: string;
}

export interface PlayoffBracket {
  season: number;
  week: number;
  currentRound: PlayoffRound;
  afc: {
    wildCard: PlayoffMatchup[];     // 3 games (2v7, 3v6, 4v5)
    divisional: PlayoffMatchup[];   // 2 games
    conference: PlayoffMatchup | null;  // 1 game
  };
  nfc: {
    wildCard: PlayoffMatchup[];     // 3 games (2v7, 3v6, 4v5)
    divisional: PlayoffMatchup[];   // 2 games
    conference: PlayoffMatchup | null;  // 1 game
  };
  superBowl: PlayoffMatchup | null;
}
