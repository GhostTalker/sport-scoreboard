// Polymorphic game type - union of sport-specific game types

import { NFLGame, NFLCelebrationType } from './nfl';
import { BundesligaGame, BundesligaCelebrationType } from './bundesliga';
import { UEFAGame, UEFACelebrationType } from './uefa';
import { TournamentGame } from './tournament';

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
export type {
  UEFAGame,
  UEFACelebrationType,
  AggregateScore
} from './uefa';
export type {
  TournamentGame,
  BracketMatch,
  GroupTableEntry,
  GroupTable,
  TournamentStats
} from './tournament';

// Re-export constants
export { PLAY_TYPE_IDS, PLAY_TYPE_TO_VIDEO } from './nfl';

// Polymorphic Game type - discriminated union
export type Game = NFLGame | BundesligaGame | UEFAGame | TournamentGame;

// Union of all celebration types
export type CelebrationType = NFLCelebrationType | BundesligaCelebrationType | UEFACelebrationType;

// Type guards for runtime type checking
export function isNFLGame(game: Game): game is NFLGame {
  return game.sport === 'nfl';
}

export function isBundesligaGame(game: Game): game is BundesligaGame {
  return game.sport === 'bundesliga';
}

export function isUEFAGame(game: Game): game is UEFAGame {
  return game.sport === 'uefa';
}

export function isWorldCupGame(game: Game): game is TournamentGame {
  return game.sport === 'worldcup';
}

export function isEuroGame(game: Game): game is TournamentGame {
  return game.sport === 'euro';
}

export function isTournamentGame(game: Game): game is TournamentGame {
  return game.sport === 'worldcup' || game.sport === 'euro';
}

// Type guard for celebration types
export function isNFLCelebration(type: CelebrationType): type is NFLCelebrationType {
  return ['touchdown', 'fieldgoal', 'interception', 'sack', 'fumble', 'safety'].includes(type);
}

export function isBundesligaCelebration(type: CelebrationType): type is BundesligaCelebrationType {
  return ['goal', 'penalty', 'own_goal', 'red_card', 'yellow_red_card'].includes(type);
}

export function isUEFACelebration(type: CelebrationType): type is UEFACelebrationType {
  return ['goal', 'penalty', 'own_goal', 'red_card', 'yellow_red_card'].includes(type);
}
