// Sport-agnostic base types for multi-sport support

export type SportType = 'nfl' | 'bundesliga';
export type CompetitionType = 'nfl' | 'bundesliga' | 'dfb-pokal';

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

export interface BaseGame {
  id: string;
  sport: SportType;
  competition: CompetitionType;
  homeTeam: Team;
  awayTeam: Team;
  status: GameStatus;
  startTime?: string;
  venue?: string;
  broadcast?: string;
  lastUpdate?: string;
}

export type GameStatus =
  | 'scheduled'    // Not started
  | 'in_progress'  // Live
  | 'halftime'     // Halftime
  | 'end_period'   // End of quarter/period
  | 'final'        // Game over
  | 'postponed'    // Postponed
  | 'delayed';     // Delayed
