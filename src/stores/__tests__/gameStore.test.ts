/**
 * gameStore Tests
 *
 * Tests for the game store, focusing on:
 * - Manual vs auto-live game selection
 * - Score change tracking with previousScores
 * - User confirmation behavior
 * - State management for currentGame, availableGames, gameStats
 * - Scoring team tracking for glow effects
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from '../gameStore';
import type { Game } from '../../types/game';
import type { GameStats } from '../../types/stats';

// Helper to create mock NFL game
const createMockNFLGame = (
  id: string,
  homeScore: number,
  awayScore: number,
  status: 'scheduled' | 'in_progress' | 'halftime' | 'final' = 'scheduled'
): Game => ({
  id,
  sport: 'nfl',
  competition: 'nfl',
  date: '2026-01-17T18:00:00Z',
  homeTeam: {
    id: '17',
    name: 'Patriots',
    abbreviation: 'NE',
    displayName: 'New England Patriots',
    shortDisplayName: 'Patriots',
    logo: 'https://example.com/patriots.png',
    score: homeScore,
    record: { wins: 10, losses: 7, ties: 0 },
    color: '002244',
    alternateColor: 'FFFFFF',
  },
  awayTeam: {
    id: '3',
    name: 'Bills',
    abbreviation: 'BUF',
    displayName: 'Buffalo Bills',
    shortDisplayName: 'Bills',
    logo: 'https://example.com/bills.png',
    score: awayScore,
    record: { wins: 12, losses: 5, ties: 0 },
    color: '00338D',
    alternateColor: 'FFFFFF',
  },
  status,
  clock: '10:30',
  quarter: 2,
  season: 2025,
  week: 18,
  seasonType: 2,
  seasonName: 'Regular Season',
  startTime: '2026-01-17T18:00:00Z',
});

// Helper to create mock Bundesliga game
const createMockBundesligaGame = (
  id: string,
  homeScore: number,
  awayScore: number,
  status: 'scheduled' | 'in_progress' | 'halftime' | 'final' = 'scheduled'
): Game => ({
  id,
  sport: 'bundesliga',
  competition: 'bundesliga',
  homeTeam: {
    id: '7',
    name: 'Bayern München',
    abbreviation: 'FCB',
    displayName: 'Bayern München',
    shortDisplayName: 'Bayern',
    logo: 'https://example.com/bayern.png',
    score: homeScore,
    color: 'DC052D',
    alternateColor: 'FFFFFF',
  },
  awayTeam: {
    id: '9',
    name: 'Borussia Dortmund',
    abbreviation: 'BVB',
    displayName: 'Borussia Dortmund',
    shortDisplayName: 'Dortmund',
    logo: 'https://example.com/bvb.png',
    score: awayScore,
    color: 'FDE100',
    alternateColor: '000000',
  },
  status,
  startTime: '2026-01-18T15:30:00Z',
  matchday: 18,
  clock: {
    matchMinute: 45,
    period: 'first_half',
    periodName: '1. Halbzeit',
    displayValue: "45'",
  },
  goals: [],
  cards: [],
});

describe('gameStore - Initialization', () => {
  beforeEach(() => {
    // Reset store to initial state
    useGameStore.setState({
      currentGame: null,
      isLive: false,
      userConfirmedGameId: null,
      availableGames: [],
      previousScores: { home: 0, away: 0 },
      scoringTeam: null,
      scoringTimestamp: null,
      gameStats: null,
      isLoading: false,
      error: null,
    });
  });

  it('should initialize with default values', () => {
    const state = useGameStore.getState();

    expect(state.currentGame).toBeNull();
    expect(state.isLive).toBe(false);
    expect(state.userConfirmedGameId).toBeNull();
    expect(state.availableGames).toEqual([]);
    expect(state.previousScores).toEqual({ home: 0, away: 0 });
    expect(state.scoringTeam).toBeNull();
    expect(state.scoringTimestamp).toBeNull();
    expect(state.gameStats).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });
});

describe('gameStore - Manual Game Selection (confirmGameSelection)', () => {
  beforeEach(() => {
    useGameStore.setState({
      currentGame: null,
      isLive: false,
      userConfirmedGameId: null,
      availableGames: [],
      previousScores: { home: 0, away: 0 },
      scoringTeam: null,
      scoringTimestamp: null,
      gameStats: null,
      isLoading: false,
      error: null,
    });
  });

  it('should set game as confirmed when user manually selects it', () => {
    const game = createMockNFLGame('game123', 7, 14, 'in_progress');

    useGameStore.getState().confirmGameSelection(game);

    const state = useGameStore.getState();
    expect(state.currentGame).toEqual(game);
    expect(state.userConfirmedGameId).toBe('game123');
    expect(state.isLive).toBe(true);
    expect(state.previousScores).toEqual({ home: 7, away: 14 });
  });

  it('should clear scoring team on manual selection', () => {
    // Set up existing scoring state
    useGameStore.setState({
      scoringTeam: 'home',
      scoringTimestamp: 1234567890,
    });

    const game = createMockNFLGame('game123', 14, 7, 'in_progress');
    useGameStore.getState().confirmGameSelection(game);

    const state = useGameStore.getState();
    expect(state.scoringTeam).toBeNull();
    expect(state.scoringTimestamp).toBeNull();
  });

  it('should detect live status for in_progress games', () => {
    const game = createMockNFLGame('game123', 0, 0, 'in_progress');

    useGameStore.getState().confirmGameSelection(game);

    expect(useGameStore.getState().isLive).toBe(true);
  });

  it('should detect live status for halftime games', () => {
    const game = createMockNFLGame('game123', 14, 10, 'halftime');

    useGameStore.getState().confirmGameSelection(game);

    expect(useGameStore.getState().isLive).toBe(true);
  });

  it('should NOT mark scheduled game as live', () => {
    const game = createMockNFLGame('game123', 0, 0, 'scheduled');

    useGameStore.getState().confirmGameSelection(game);

    expect(useGameStore.getState().isLive).toBe(false);
  });

  it('should NOT mark final game as live', () => {
    const game = createMockNFLGame('game123', 27, 24, 'final');

    useGameStore.getState().confirmGameSelection(game);

    expect(useGameStore.getState().isLive).toBe(false);
  });
});

describe('gameStore - Auto Game Selection (setCurrentGame)', () => {
  beforeEach(() => {
    useGameStore.setState({
      currentGame: null,
      isLive: false,
      userConfirmedGameId: null,
      availableGames: [],
      previousScores: { home: 0, away: 0 },
      scoringTeam: null,
      scoringTimestamp: null,
      gameStats: null,
      isLoading: false,
      error: null,
    });
  });

  it('should update currentGame when no user confirmation exists', () => {
    const game = createMockNFLGame('game123', 7, 3, 'in_progress');

    useGameStore.getState().setCurrentGame(game);

    const state = useGameStore.getState();
    expect(state.currentGame).toEqual(game);
    expect(state.isLive).toBe(true);
  });

  it('should BLOCK auto-update when user confirmed a different game', () => {
    // User manually selected game123
    const userGame = createMockNFLGame('game123', 14, 7, 'in_progress');
    useGameStore.getState().confirmGameSelection(userGame);

    // Auto-update tries to switch to different game (should be blocked)
    const autoGame = createMockNFLGame('game456', 21, 17, 'in_progress');
    useGameStore.getState().setCurrentGame(autoGame);

    const state = useGameStore.getState();
    expect(state.currentGame).toEqual(userGame); // Still showing user's game
    expect(state.currentGame?.id).toBe('game123');
  });

  it('should ALLOW auto-update when user confirmed the SAME game', () => {
    // User manually selected game123
    const userGame = createMockNFLGame('game123', 14, 7, 'in_progress');
    useGameStore.getState().confirmGameSelection(userGame);

    // Auto-update for the same game (should be allowed)
    const updatedGame = createMockNFLGame('game123', 21, 7, 'in_progress');
    useGameStore.getState().setCurrentGame(updatedGame);

    const state = useGameStore.getState();
    expect(state.currentGame?.homeTeam.score).toBe(21); // Score updated
    expect(state.currentGame?.id).toBe('game123');
  });

  it('should NOT clear currentGame when user has confirmation', () => {
    // User manually selected game
    const userGame = createMockNFLGame('game123', 7, 3, 'in_progress');
    useGameStore.getState().confirmGameSelection(userGame);

    // Auto-update tries to clear (game ended, null passed)
    useGameStore.getState().setCurrentGame(null);

    const state = useGameStore.getState();
    expect(state.currentGame).toEqual(userGame); // Game still showing
  });

  it('should reset previousScores when switching to NEW game', () => {
    // Set up initial game
    const game1 = createMockNFLGame('game123', 14, 10, 'in_progress');
    useGameStore.getState().setCurrentGame(game1);

    expect(useGameStore.getState().previousScores).toEqual({ home: 14, away: 10 });

    // Switch to different game
    const game2 = createMockNFLGame('game456', 7, 3, 'in_progress');
    useGameStore.getState().setCurrentGame(game2);

    const state = useGameStore.getState();
    expect(state.previousScores).toEqual({ home: 7, away: 3 }); // Reset to new game's scores
  });

  it('should PRESERVE previousScores when updating SAME game', () => {
    // Initial game state
    const game1 = createMockNFLGame('game123', 14, 10, 'in_progress');
    useGameStore.getState().setCurrentGame(game1);

    // Manually update previousScores (simulating score tracking)
    useGameStore.setState({ previousScores: { home: 14, away: 10 } });

    // Same game updates with new score
    const game1Updated = createMockNFLGame('game123', 21, 10, 'in_progress');
    useGameStore.getState().setCurrentGame(game1Updated);

    const state = useGameStore.getState();
    expect(state.previousScores).toEqual({ home: 14, away: 10 }); // Preserved for diff detection
  });

  it('should clear scoring team when switching to NEW game', () => {
    // Initial game with scoring team
    const game1 = createMockNFLGame('game123', 14, 10, 'in_progress');
    useGameStore.setState({
      currentGame: game1,
      scoringTeam: 'home',
      scoringTimestamp: 1234567890,
    });

    // Switch to different game
    const game2 = createMockNFLGame('game456', 7, 3, 'in_progress');
    useGameStore.getState().setCurrentGame(game2);

    const state = useGameStore.getState();
    expect(state.scoringTeam).toBeNull();
    expect(state.scoringTimestamp).toBeNull();
  });

  it('should PRESERVE scoring team when updating SAME game', () => {
    // Initial game with scoring team
    const game1 = createMockNFLGame('game123', 14, 10, 'in_progress');
    useGameStore.setState({
      currentGame: game1,
      scoringTeam: 'home',
      scoringTimestamp: 1234567890,
    });

    // Same game updates
    const game1Updated = createMockNFLGame('game123', 21, 10, 'in_progress');
    useGameStore.getState().setCurrentGame(game1Updated);

    const state = useGameStore.getState();
    expect(state.scoringTeam).toBe('home'); // Preserved for glow effect
    expect(state.scoringTimestamp).toBe(1234567890);
  });
});

describe('gameStore - Score Tracking (updateScores)', () => {
  beforeEach(() => {
    useGameStore.setState({
      currentGame: null,
      isLive: false,
      userConfirmedGameId: null,
      availableGames: [],
      previousScores: { home: 0, away: 0 },
      scoringTeam: null,
      scoringTimestamp: null,
      gameStats: null,
      isLoading: false,
      error: null,
    });
  });

  it('should update previousScores when scores change', () => {
    useGameStore.getState().updateScores(14, 7);

    expect(useGameStore.getState().previousScores).toEqual({ home: 14, away: 7 });
  });

  it('should NOT update previousScores if scores are same', () => {
    useGameStore.setState({ previousScores: { home: 14, away: 7 } });

    // Try to set same scores
    useGameStore.getState().updateScores(14, 7);

    expect(useGameStore.getState().previousScores).toEqual({ home: 14, away: 7 });
  });

  it('should update home score only', () => {
    useGameStore.setState({ previousScores: { home: 7, away: 10 } });

    useGameStore.getState().updateScores(14, 10);

    expect(useGameStore.getState().previousScores).toEqual({ home: 14, away: 10 });
  });

  it('should update away score only', () => {
    useGameStore.setState({ previousScores: { home: 14, away: 7 } });

    useGameStore.getState().updateScores(14, 14);

    expect(useGameStore.getState().previousScores).toEqual({ home: 14, away: 14 });
  });
});

describe('gameStore - Scoring Team (setScoringTeam)', () => {
  beforeEach(() => {
    useGameStore.setState({
      currentGame: null,
      isLive: false,
      userConfirmedGameId: null,
      availableGames: [],
      previousScores: { home: 0, away: 0 },
      scoringTeam: null,
      scoringTimestamp: null,
      gameStats: null,
      isLoading: false,
      error: null,
    });
  });

  it('should set scoring team with timestamp', () => {
    const beforeTime = Date.now();
    useGameStore.getState().setScoringTeam('home');
    const afterTime = Date.now();

    const state = useGameStore.getState();
    expect(state.scoringTeam).toBe('home');
    expect(state.scoringTimestamp).toBeGreaterThanOrEqual(beforeTime);
    expect(state.scoringTimestamp).toBeLessThanOrEqual(afterTime);
  });

  it('should clear scoring team when set to null', () => {
    useGameStore.setState({
      scoringTeam: 'away',
      scoringTimestamp: 1234567890,
    });

    useGameStore.getState().setScoringTeam(null);

    const state = useGameStore.getState();
    expect(state.scoringTeam).toBeNull();
    expect(state.scoringTimestamp).toBeNull();
  });

  it('should update timestamp when switching teams', () => {
    useGameStore.setState({
      scoringTeam: 'home',
      scoringTimestamp: 1234567890,
    });

    const beforeTime = Date.now();
    useGameStore.getState().setScoringTeam('away');
    const afterTime = Date.now();

    const state = useGameStore.getState();
    expect(state.scoringTeam).toBe('away');
    expect(state.scoringTimestamp).toBeGreaterThanOrEqual(beforeTime);
    expect(state.scoringTimestamp).toBeLessThanOrEqual(afterTime);
    expect(state.scoringTimestamp).not.toBe(1234567890);
  });
});

describe('gameStore - Available Games', () => {
  beforeEach(() => {
    useGameStore.setState({
      currentGame: null,
      isLive: false,
      userConfirmedGameId: null,
      availableGames: [],
      previousScores: { home: 0, away: 0 },
      scoringTeam: null,
      scoringTimestamp: null,
      gameStats: null,
      isLoading: false,
      error: null,
    });
  });

  it('should set available games', () => {
    const games = [
      createMockNFLGame('game1', 7, 3, 'in_progress'),
      createMockNFLGame('game2', 14, 10, 'scheduled'),
      createMockNFLGame('game3', 21, 17, 'final'),
    ];

    useGameStore.getState().setAvailableGames(games);

    expect(useGameStore.getState().availableGames).toEqual(games);
  });

  it('should replace previous available games', () => {
    const games1 = [createMockNFLGame('game1', 7, 3, 'in_progress')];
    const games2 = [createMockNFLGame('game2', 14, 10, 'scheduled')];

    useGameStore.getState().setAvailableGames(games1);
    expect(useGameStore.getState().availableGames).toEqual(games1);

    useGameStore.getState().setAvailableGames(games2);
    expect(useGameStore.getState().availableGames).toEqual(games2);
  });
});

describe('gameStore - Game Stats', () => {
  beforeEach(() => {
    useGameStore.setState({
      currentGame: null,
      isLive: false,
      userConfirmedGameId: null,
      availableGames: [],
      previousScores: { home: 0, away: 0 },
      scoringTeam: null,
      scoringTimestamp: null,
      gameStats: null,
      isLoading: false,
      error: null,
    });
  });

  it('should set game stats', () => {
    const stats: GameStats = {
      homeTeamStats: {
        totalYards: 350,
        passingYards: 250,
        rushingYards: 100,
        turnovers: 1,
        timeOfPossession: '32:15',
      },
      awayTeamStats: {
        totalYards: 280,
        passingYards: 180,
        rushingYards: 100,
        turnovers: 2,
        timeOfPossession: '27:45',
      },
    };

    useGameStore.getState().setGameStats(stats);

    expect(useGameStore.getState().gameStats).toEqual(stats);
  });

  it('should clear game stats when set to null', () => {
    const stats: GameStats = {
      homeTeamStats: { totalYards: 350, passingYards: 250, rushingYards: 100, turnovers: 1, timeOfPossession: '30:00' },
      awayTeamStats: { totalYards: 280, passingYards: 180, rushingYards: 100, turnovers: 2, timeOfPossession: '30:00' },
    };

    useGameStore.getState().setGameStats(stats);
    expect(useGameStore.getState().gameStats).not.toBeNull();

    useGameStore.getState().setGameStats(null);
    expect(useGameStore.getState().gameStats).toBeNull();
  });
});

describe('gameStore - Loading and Error States', () => {
  beforeEach(() => {
    useGameStore.setState({
      currentGame: null,
      isLive: false,
      userConfirmedGameId: null,
      availableGames: [],
      previousScores: { home: 0, away: 0 },
      scoringTeam: null,
      scoringTimestamp: null,
      gameStats: null,
      isLoading: false,
      error: null,
    });
  });

  it('should set loading state', () => {
    useGameStore.getState().setLoading(true);
    expect(useGameStore.getState().isLoading).toBe(true);

    useGameStore.getState().setLoading(false);
    expect(useGameStore.getState().isLoading).toBe(false);
  });

  it('should set error message', () => {
    useGameStore.getState().setError('Failed to fetch game data');
    expect(useGameStore.getState().error).toBe('Failed to fetch game data');
  });

  it('should clear error when set to null', () => {
    useGameStore.setState({ error: 'Some error' });

    useGameStore.getState().setError(null);
    expect(useGameStore.getState().error).toBeNull();
  });
});

describe('gameStore - User Confirmation Clearing', () => {
  beforeEach(() => {
    useGameStore.setState({
      currentGame: null,
      isLive: false,
      userConfirmedGameId: null,
      availableGames: [],
      previousScores: { home: 0, away: 0 },
      scoringTeam: null,
      scoringTimestamp: null,
      gameStats: null,
      isLoading: false,
      error: null,
    });
  });

  it('should clear user confirmation', () => {
    useGameStore.setState({ userConfirmedGameId: 'game123' });

    useGameStore.getState().clearUserConfirmation();

    expect(useGameStore.getState().userConfirmedGameId).toBeNull();
  });

  it('should allow auto-updates after clearing confirmation', () => {
    // User confirms game
    const userGame = createMockNFLGame('game123', 7, 3, 'in_progress');
    useGameStore.getState().confirmGameSelection(userGame);

    // Auto-update is blocked
    const autoGame1 = createMockNFLGame('game456', 14, 10, 'in_progress');
    useGameStore.getState().setCurrentGame(autoGame1);
    expect(useGameStore.getState().currentGame?.id).toBe('game123'); // Still user's game

    // Clear confirmation
    useGameStore.getState().clearUserConfirmation();

    // Now auto-update should work
    useGameStore.getState().setCurrentGame(autoGame1);
    expect(useGameStore.getState().currentGame?.id).toBe('game456'); // Auto-update allowed
  });
});

describe('gameStore - Multi-Sport Support', () => {
  beforeEach(() => {
    useGameStore.setState({
      currentGame: null,
      isLive: false,
      userConfirmedGameId: null,
      availableGames: [],
      previousScores: { home: 0, away: 0 },
      scoringTeam: null,
      scoringTimestamp: null,
      gameStats: null,
      isLoading: false,
      error: null,
    });
  });

  it('should handle NFL games', () => {
    const nflGame = createMockNFLGame('nfl123', 21, 17, 'in_progress');

    useGameStore.getState().setCurrentGame(nflGame);

    const state = useGameStore.getState();
    expect(state.currentGame?.sport).toBe('nfl');
    expect(state.currentGame?.id).toBe('nfl123');
  });

  it('should handle Bundesliga games', () => {
    const blGame = createMockBundesligaGame('bl123', 2, 1, 'in_progress');

    useGameStore.getState().setCurrentGame(blGame);

    const state = useGameStore.getState();
    expect(state.currentGame?.sport).toBe('bundesliga');
    expect(state.currentGame?.id).toBe('bl123');
  });

  it('should track previousScores correctly across sports', () => {
    const nflGame = createMockNFLGame('nfl123', 28, 24, 'in_progress');
    useGameStore.getState().setCurrentGame(nflGame);
    expect(useGameStore.getState().previousScores).toEqual({ home: 28, away: 24 });

    const blGame = createMockBundesligaGame('bl123', 3, 1, 'in_progress');
    useGameStore.getState().setCurrentGame(blGame);
    expect(useGameStore.getState().previousScores).toEqual({ home: 3, away: 1 });
  });
});
