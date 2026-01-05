export interface Team {
  id: string;
  name: string;
  abbreviation: string;
  displayName: string;
  shortDisplayName: string;
  logo: string;
  color: string;
  alternateColor: string;
  score: number;
}

export interface GameSituation {
  down: number;
  distance: number;
  yardLine: number;
  possession: string; // Team ID
  isRedZone: boolean;
}

export interface GameClock {
  displayValue: string; // "8:45"
  period: number; // 1-4, 5+ for OT
  periodName: string; // "1st", "2nd", "3rd", "4th", "OT"
}

export interface Game {
  id: string;
  status: GameStatus;
  homeTeam: Team;
  awayTeam: Team;
  clock: GameClock;
  situation?: GameSituation;
  venue?: string;
  broadcast?: string;
  startTime?: string;
}

export type GameStatus = 
  | 'scheduled'    // Not started
  | 'in_progress'  // Live
  | 'halftime'     // Halftime
  | 'end_period'   // End of quarter
  | 'final'        // Game over
  | 'postponed'    // Postponed
  | 'delayed';     // Delayed

export interface ScoreEvent {
  team: 'home' | 'away';
  type: ScoreType;
  points: number;
  video: 'touchdown' | 'fieldgoal' | null;
}

export type ScoreType = 
  | 'TOUCHDOWN'           // +6
  | 'TOUCHDOWN_PAT'       // +7
  | 'TOUCHDOWN_2PT'       // +8
  | 'FIELD_GOAL'          // +3
  | 'SAFETY'              // +2
  | 'EXTRA_POINT'         // +1
  | 'TWO_POINT_CONVERSION';
