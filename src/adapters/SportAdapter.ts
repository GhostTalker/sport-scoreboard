// Sport Adapter Interface - Abstraction layer for different sports

import type { Game, CelebrationType } from '../types/game';
import type { GameStats } from '../types/stats';
import type { SportType } from '../types/base';

export interface ScoreChangeResult {
  type: CelebrationType;
  team: 'home' | 'away';
}

export interface SportAdapter {
  sport: SportType;

  // API integration
  fetchScoreboard(): Promise<Game[]>;
  fetchGameDetails(gameId: string): Promise<{ game: Game; stats: GameStats | null }>;

  // Score detection
  detectScoreChange(
    prevHome: number,
    prevAway: number,
    newHome: number,
    newAway: number,
    game: Game
  ): ScoreChangeResult | null;

  // Display helpers
  getPeriodName(period: number | string): string;
  getCompetitionName(game: Game): string;

  // Celebration types
  getCelebrationTypes(): CelebrationType[];
}
