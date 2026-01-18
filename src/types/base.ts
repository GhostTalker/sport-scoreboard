// Sport-agnostic base types for multi-sport support

// SportType is now auto-generated from plugin definitions
// Import from config/plugins.ts for type-safe, plugin-driven SportType
import type { SportType as PluginSportType } from '../config/plugins';
export type SportType = PluginSportType;

export type CompetitionType = 'nfl' | 'bundesliga' | 'dfb-pokal' | 'champions-league' | 'fifa-worldcup' | 'uefa-euro' | null;

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
