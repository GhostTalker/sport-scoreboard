// NFL Adapter - Wraps ESPN API and NFL-specific logic

import type { SportAdapter, ScoreChangeResult } from '../../adapters/SportAdapter';
import type { Game, NFLGame, CelebrationType } from '../../types/game';
import type { GameStats } from '../../types/stats';
import { fetchScoreboard as fetchNFLScoreboard, fetchGameDetails as fetchNFLGameDetails } from '../../services/espnApi';

export class NFLAdapter implements SportAdapter {
  sport = 'nfl' as const;

  async fetchScoreboard(signal?: AbortSignal): Promise<Game[]> {
    // RACE CONDITION FIX: Pass abort signal to ESPN API
    // Signal will abort request if sport switches during fetch
    return fetchNFLScoreboard(signal);
  }

  async fetchGameDetails(gameId: string, signal?: AbortSignal): Promise<{ game: Game; stats: GameStats | null }> {
    const result = await fetchNFLGameDetails(gameId, signal);
    return result || { game: null as any, stats: null };
  }

  detectScoreChange(
    prevHome: number,
    prevAway: number,
    newHome: number,
    newAway: number,
    _game: Game
  ): ScoreChangeResult | null {
    const homeDiff = newHome - prevHome;
    const awayDiff = newAway - prevAway;

    // No score change
    if (homeDiff === 0 && awayDiff === 0) {
      return null;
    }

    // Only one team can score at a time
    if (homeDiff > 0 && awayDiff === 0) {
      return this.analyzeScore(homeDiff, 'home');
    }

    if (awayDiff > 0 && homeDiff === 0) {
      return this.analyzeScore(awayDiff, 'away');
    }

    // Edge case: both scores changed (shouldn't happen, but handle it)
    console.warn('Both scores changed simultaneously - possible missed update');

    // Prioritize the larger change
    if (homeDiff >= awayDiff) {
      return this.analyzeScore(homeDiff, 'home');
    }
    return this.analyzeScore(awayDiff, 'away');
  }

  private analyzeScore(diff: number, team: 'home' | 'away'): ScoreChangeResult | null {
    const video = this.getVideoType(diff);
    if (!video) return null;

    return {
      type: video,
      team,
    };
  }

  private getVideoType(diff: number): CelebrationType | null {
    // Touchdown scenarios: 6, 7, 8 points
    if (diff >= 6) {
      return 'touchdown';
    }

    // Field goal: 3 points
    if (diff === 3) {
      return 'fieldgoal';
    }

    // Safety: 2 points (defensive score)
    if (diff === 2) {
      return 'safety';
    }

    // Extra Point (1 point) - no video
    return null;
  }

  getPeriodName(period: number): string {
    switch (period) {
      case 1:
        return '1st';
      case 2:
        return '2nd';
      case 3:
        return '3rd';
      case 4:
        return '4th';
      case 5:
        return 'OT';
      default:
        return period > 5 ? `OT${period - 4}` : '';
    }
  }

  getCompetitionName(game: Game): string {
    const nflGame = game as NFLGame;
    return nflGame.seasonName || 'NFL';
  }

  getCelebrationTypes(): CelebrationType[] {
    return ['touchdown', 'fieldgoal', 'interception', 'sack', 'fumble', 'safety'];
  }
}
