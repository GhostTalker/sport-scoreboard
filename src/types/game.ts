// Polymorphic game type - union of sport-specific game types

import { NFLGame, NFLCelebrationType } from './nfl';
import { BundesligaGame, BundesligaCelebrationType } from './bundesliga';

// Re-export commonly used types for backwards compatibility
export type { Team, GameStatus, SportType, CompetitionType } from './base';
export type {
  NFLGame,
  GameClock,
  GameSituation,
  NFLCelebrationType,
  ScoreEvent,
  ScoreType,
  Play,
  PlayType
} from './nfl';
export type {
  BundesligaGame,
  SoccerClock,
  Goal,
  Card,
  BundesligaCelebrationType
} from './bundesliga';

// Re-export constants
export { PLAY_TYPE_IDS, PLAY_TYPE_TO_VIDEO } from './nfl';

// Polymorphic Game type - discriminated union
export type Game = NFLGame | BundesligaGame;

// Union of all celebration types
export type CelebrationType = NFLCelebrationType | BundesligaCelebrationType;

// Type guards for runtime type checking
export function isNFLGame(game: Game): game is NFLGame {
  return game.sport === 'nfl';
}

export function isBundesligaGame(game: Game): game is BundesligaGame {
  return game.sport === 'bundesliga';
}

// Type guard for celebration types
export function isNFLCelebration(type: CelebrationType): type is NFLCelebrationType {
  return ['touchdown', 'fieldgoal', 'interception', 'sack', 'fumble', 'safety'].includes(type);
}

export function isBundesligaCelebration(type: CelebrationType): type is BundesligaCelebrationType {
  return ['goal', 'penalty', 'own_goal', 'red_card', 'yellow_red_card'].includes(type);
}
