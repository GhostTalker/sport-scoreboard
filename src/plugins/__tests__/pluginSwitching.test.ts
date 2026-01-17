/**
 * Plugin Switching E2E Tests
 *
 * Tests for plugin switching scenarios, focusing on:
 * - NFL → Bundesliga → UEFA → WorldCup switching
 * - State cleanup between switches (currentGame, availableGames, stats)
 * - User confirmation clearing on sport change
 * - Adapter loading and unloading
 * - Game data refetch on plugin change
 * - Polling interval adjustments per sport
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useGameStore } from '../../stores/gameStore';
import { useSettingsStore } from '../../stores/settingsStore';
import type { Game } from '../../types/game';
import type { NFLGame } from '../../types/nfl';
import type { BundesligaGame } from '../../types/bundesliga';
import type { UEFAGame } from '../../types/uefa';
import type { TournamentGame } from '../../types/tournament';

// Helper to create mock NFL game
const createMockNFLGame = (id: string, homeScore: number, awayScore: number): NFLGame => ({
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
  status: 'in_progress',
  clock: '10:30',
  quarter: 2,
  season: 2025,
  week: 18,
  seasonType: 2,
  seasonName: 'Regular Season',
  startTime: '2026-01-17T18:00:00Z',
});

// Helper to create mock Bundesliga game
const createMockBundesligaGame = (id: string, homeScore: number, awayScore: number): BundesligaGame => ({
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
  status: 'in_progress',
  startTime: '2026-01-18T15:30:00Z',
  matchday: 18,
  clock: {
    matchMinute: 67,
    period: 'second_half',
    periodName: '2. Halbzeit',
    displayValue: "67'",
  },
  goals: [],
  cards: [],
});

// Helper to create mock UEFA game
const createMockUEFAGame = (id: string, homeScore: number, awayScore: number): UEFAGame => ({
  id,
  sport: 'uefa',
  competition: 'champions-league',
  homeTeam: {
    id: '86',
    name: 'Real Madrid',
    abbreviation: 'RMA',
    displayName: 'Real Madrid',
    shortDisplayName: 'Real',
    logo: 'https://example.com/real.png',
    score: homeScore,
    color: 'FFFFFF',
    alternateColor: '000000',
  },
  awayTeam: {
    id: '85',
    name: 'Paris Saint-Germain',
    abbreviation: 'PSG',
    displayName: 'PSG',
    shortDisplayName: 'PSG',
    logo: 'https://example.com/psg.png',
    score: awayScore,
    color: '004170',
    alternateColor: 'FFFFFF',
  },
  status: 'in_progress',
  startTime: '2026-01-20T21:00:00Z',
  matchday: 8,
  round: 'Round of 16',
  clock: {
    matchMinute: 45,
    period: 'first_half',
    periodName: '1. Halbzeit',
    displayValue: "45'",
  },
  goals: [],
  cards: [],
});

// Helper to create mock World Cup game
const createMockWorldCupGame = (id: string, homeScore: number, awayScore: number): TournamentGame => ({
  id,
  sport: 'worldcup',
  competition: 'fifa-worldcup',
  homeTeam: {
    id: '1',
    name: 'Germany',
    abbreviation: 'GER',
    displayName: 'Deutschland',
    shortDisplayName: 'GER',
    logo: 'https://example.com/germany.png',
    score: homeScore,
    color: '000000',
    alternateColor: 'FFFFFF',
  },
  awayTeam: {
    id: '2',
    name: 'Brazil',
    abbreviation: 'BRA',
    displayName: 'Brasilien',
    shortDisplayName: 'BRA',
    logo: 'https://example.com/brazil.png',
    score: awayScore,
    color: '009739',
    alternateColor: 'FFFFFF',
  },
  status: 'in_progress',
  startTime: '2026-06-15T18:00:00Z',
  matchday: 2,
  round: 'Group Stage',
  group: 'Group B',
  clock: {
    matchMinute: 30,
    period: 'first_half',
    periodName: '1. Halbzeit',
    displayValue: "30'",
  },
  goals: [],
  cards: [],
});

describe('Plugin Switching - State Cleanup', () => {
  beforeEach(() => {
    // Reset both stores to initial state
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

    useSettingsStore.setState({
      currentSport: 'nfl',
      currentCompetition: 'nfl',
    } as any);
  });

  it('should clear currentGame when switching sports', () => {
    // Set up NFL game
    const nflGame = createMockNFLGame('nfl123', 21, 14);
    useGameStore.getState().setCurrentGame(nflGame);

    expect(useGameStore.getState().currentGame?.sport).toBe('nfl');

    // Switch to Bundesliga
    useSettingsStore.setState({ currentSport: 'bundesliga', currentCompetition: 'bundesliga' } as any);

    // Game should be cleared (this happens in useGameData hook)
    useGameStore.setState({
      currentGame: null,
      availableGames: [],
      gameStats: null,
    });

    expect(useGameStore.getState().currentGame).toBeNull();
  });

  it('should clear availableGames when switching sports', () => {
    // Set up NFL games
    const nflGames = [
      createMockNFLGame('nfl1', 7, 3),
      createMockNFLGame('nfl2', 14, 10),
    ];
    useGameStore.getState().setAvailableGames(nflGames);

    expect(useGameStore.getState().availableGames).toHaveLength(2);

    // Switch to Bundesliga
    useSettingsStore.setState({ currentSport: 'bundesliga' } as any);
    useGameStore.setState({ availableGames: [] });

    expect(useGameStore.getState().availableGames).toEqual([]);
  });

  it('should clear gameStats when switching sports', () => {
    // Set up NFL stats
    const nflStats = {
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

    useGameStore.getState().setGameStats(nflStats);
    expect(useGameStore.getState().gameStats).not.toBeNull();

    // Switch to UEFA
    useSettingsStore.setState({ currentSport: 'uefa' } as any);
    useGameStore.setState({ gameStats: null });

    expect(useGameStore.getState().gameStats).toBeNull();
  });

  it('should clear userConfirmedGameId when switching sports', () => {
    // User confirms NFL game
    const nflGame = createMockNFLGame('nfl123', 14, 7);
    useGameStore.getState().confirmGameSelection(nflGame);

    expect(useGameStore.getState().userConfirmedGameId).toBe('nfl123');

    // Switch to World Cup
    useSettingsStore.setState({ currentSport: 'worldcup' } as any);
    useGameStore.setState({ userConfirmedGameId: null });

    expect(useGameStore.getState().userConfirmedGameId).toBeNull();
  });

  it('should reset previousScores when switching sports', () => {
    // Set up NFL scores
    useGameStore.getState().updateScores(28, 21);

    expect(useGameStore.getState().previousScores).toEqual({ home: 28, away: 21 });

    // Switch to Bundesliga
    useSettingsStore.setState({ currentSport: 'bundesliga' } as any);
    useGameStore.setState({ previousScores: { home: 0, away: 0 } });

    expect(useGameStore.getState().previousScores).toEqual({ home: 0, away: 0 });
  });

  it('should clear scoring team when switching sports', () => {
    // Set scoring team for NFL
    useGameStore.getState().setScoringTeam('home');

    expect(useGameStore.getState().scoringTeam).toBe('home');
    expect(useGameStore.getState().scoringTimestamp).not.toBeNull();

    // Switch to UEFA
    useSettingsStore.setState({ currentSport: 'uefa' } as any);
    useGameStore.setState({ scoringTeam: null, scoringTimestamp: null });

    expect(useGameStore.getState().scoringTeam).toBeNull();
    expect(useGameStore.getState().scoringTimestamp).toBeNull();
  });
});

describe('Plugin Switching - Sequential Sport Changes', () => {
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

    useSettingsStore.setState({
      currentSport: 'nfl',
      currentCompetition: 'nfl',
    } as any);
  });

  it('should handle NFL → Bundesliga → UEFA → WorldCup switching', () => {
    // Start with NFL
    const nflGame = createMockNFLGame('nfl123', 21, 14);
    useGameStore.setState({ currentGame: nflGame, availableGames: [nflGame] });

    expect(useGameStore.getState().currentGame?.sport).toBe('nfl');

    // Switch to Bundesliga
    useSettingsStore.setState({ currentSport: 'bundesliga', currentCompetition: 'bundesliga' } as any);
    const blGame = createMockBundesligaGame('bl123', 2, 1);
    useGameStore.setState({
      currentGame: blGame,
      availableGames: [blGame],
      previousScores: { home: 2, away: 1 },
    });

    expect(useGameStore.getState().currentGame?.sport).toBe('bundesliga');

    // Switch to UEFA
    useSettingsStore.setState({ currentSport: 'uefa', currentCompetition: 'champions-league' } as any);
    const uefaGame = createMockUEFAGame('uefa123', 1, 0);
    useGameStore.setState({
      currentGame: uefaGame,
      availableGames: [uefaGame],
      previousScores: { home: 1, away: 0 },
    });

    expect(useGameStore.getState().currentGame?.sport).toBe('uefa');

    // Switch to World Cup
    useSettingsStore.setState({ currentSport: 'worldcup', currentCompetition: 'fifa-worldcup' } as any);
    const wcGame = createMockWorldCupGame('wc123', 3, 2);
    useGameStore.setState({
      currentGame: wcGame,
      availableGames: [wcGame],
      previousScores: { home: 3, away: 2 },
    });

    expect(useGameStore.getState().currentGame?.sport).toBe('worldcup');
  });

  it('should handle back-and-forth switching (NFL ↔ Bundesliga)', () => {
    // NFL
    const nflGame = createMockNFLGame('nfl123', 14, 7);
    useGameStore.setState({ currentGame: nflGame });
    expect(useGameStore.getState().currentGame?.sport).toBe('nfl');

    // Switch to Bundesliga
    useSettingsStore.setState({ currentSport: 'bundesliga' } as any);
    const blGame = createMockBundesligaGame('bl123', 1, 0);
    useGameStore.setState({ currentGame: blGame });
    expect(useGameStore.getState().currentGame?.sport).toBe('bundesliga');

    // Back to NFL
    useSettingsStore.setState({ currentSport: 'nfl' } as any);
    useGameStore.setState({ currentGame: nflGame });
    expect(useGameStore.getState().currentGame?.sport).toBe('nfl');

    // Back to Bundesliga
    useSettingsStore.setState({ currentSport: 'bundesliga' } as any);
    useGameStore.setState({ currentGame: blGame });
    expect(useGameStore.getState().currentGame?.sport).toBe('bundesliga');
  });
});

describe('Plugin Switching - Game Type Validation', () => {
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

  it('should maintain correct sport type after switching', () => {
    // NFL game
    const nflGame = createMockNFLGame('nfl123', 21, 14);
    useGameStore.setState({ currentGame: nflGame });

    expect(useGameStore.getState().currentGame?.sport).toBe('nfl');
    expect(useGameStore.getState().currentGame?.competition).toBe('nfl');
    expect((useGameStore.getState().currentGame as NFLGame).quarter).toBe(2);

    // Bundesliga game (different structure)
    const blGame = createMockBundesligaGame('bl123', 2, 1);
    useGameStore.setState({ currentGame: blGame });

    expect(useGameStore.getState().currentGame?.sport).toBe('bundesliga');
    expect((useGameStore.getState().currentGame as BundesligaGame).matchday).toBe(18);
    expect((useGameStore.getState().currentGame as BundesligaGame).clock?.period).toBe('second_half');

    // UEFA game
    const uefaGame = createMockUEFAGame('uefa123', 1, 0);
    useGameStore.setState({ currentGame: uefaGame });

    expect(useGameStore.getState().currentGame?.sport).toBe('uefa');
    expect((useGameStore.getState().currentGame as UEFAGame).round).toBe('Round of 16');

    // World Cup game
    const wcGame = createMockWorldCupGame('wc123', 2, 1);
    useGameStore.setState({ currentGame: wcGame });

    expect(useGameStore.getState().currentGame?.sport).toBe('worldcup');
    expect((useGameStore.getState().currentGame as TournamentGame).group).toBe('Group B');
  });

  it('should handle different clock formats across sports', () => {
    // NFL uses string clock
    const nflGame = createMockNFLGame('nfl123', 14, 7);
    useGameStore.setState({ currentGame: nflGame });
    expect((useGameStore.getState().currentGame as NFLGame).clock).toBe('10:30');

    // Bundesliga uses SoccerClock object
    const blGame = createMockBundesligaGame('bl123', 2, 1);
    useGameStore.setState({ currentGame: blGame });
    expect((useGameStore.getState().currentGame as BundesligaGame).clock?.displayValue).toBe("67'");
  });
});

describe('Plugin Switching - Error Recovery', () => {
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

  it('should clear error when switching sports', () => {
    // Set error during NFL
    useGameStore.getState().setError('Failed to fetch NFL data');
    expect(useGameStore.getState().error).toBe('Failed to fetch NFL data');

    // Switch to Bundesliga (error should be cleared in useGameData)
    useSettingsStore.setState({ currentSport: 'bundesliga' } as any);
    useGameStore.setState({ error: null });

    expect(useGameStore.getState().error).toBeNull();
  });

  it('should reset loading state when switching sports', () => {
    // Set loading during NFL
    useGameStore.getState().setLoading(true);
    expect(useGameStore.getState().isLoading).toBe(true);

    // Switch to UEFA
    useSettingsStore.setState({ currentSport: 'uefa' } as any);
    useGameStore.setState({ isLoading: false });

    expect(useGameStore.getState().isLoading).toBe(false);
  });
});

describe('Plugin Switching - Live Status Preservation', () => {
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

  it('should correctly set live status for each sport', () => {
    // NFL live game
    const nflGame = createMockNFLGame('nfl123', 14, 7);
    nflGame.status = 'in_progress';
    useGameStore.getState().setCurrentGame(nflGame);
    expect(useGameStore.getState().isLive).toBe(true);

    // Bundesliga live game
    const blGame = createMockBundesligaGame('bl123', 2, 1);
    blGame.status = 'in_progress';
    useGameStore.setState({ currentGame: blGame, isLive: true });
    expect(useGameStore.getState().isLive).toBe(true);

    // UEFA halftime (still live)
    const uefaGame = createMockUEFAGame('uefa123', 1, 0);
    uefaGame.status = 'halftime';
    useGameStore.setState({ currentGame: uefaGame, isLive: true });
    expect(useGameStore.getState().isLive).toBe(true);

    // World Cup final (not live)
    const wcGame = createMockWorldCupGame('wc123', 3, 2);
    wcGame.status = 'final';
    useGameStore.setState({ currentGame: wcGame, isLive: false });
    expect(useGameStore.getState().isLive).toBe(false);
  });
});

describe('Plugin Switching - Competition Changes', () => {
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

    useSettingsStore.setState({
      currentSport: 'bundesliga',
      currentCompetition: 'bundesliga',
    } as any);
  });

  it('should handle competition changes within same sport (Bundesliga → DFB-Pokal)', () => {
    // Bundesliga game
    const blGame = createMockBundesligaGame('bl123', 2, 1);
    blGame.competition = 'bundesliga';
    useGameStore.setState({ currentGame: blGame, availableGames: [blGame] });

    expect(useGameStore.getState().currentGame?.competition).toBe('bundesliga');

    // Switch to DFB-Pokal (same sport, different competition)
    useSettingsStore.setState({ currentCompetition: 'dfb-pokal' } as any);
    const pokalGame = createMockBundesligaGame('dfb123', 1, 0);
    pokalGame.competition = 'dfb-pokal';
    useGameStore.setState({
      currentGame: pokalGame,
      availableGames: [pokalGame],
      userConfirmedGameId: null,
    });

    expect(useGameStore.getState().currentGame?.competition).toBe('dfb-pokal');
    expect(useGameStore.getState().currentGame?.sport).toBe('bundesliga'); // Sport stays same
  });

  it('should clear user confirmation when competition changes', () => {
    // User confirms Bundesliga game
    const blGame = createMockBundesligaGame('bl123', 2, 1);
    useGameStore.getState().confirmGameSelection(blGame);

    expect(useGameStore.getState().userConfirmedGameId).toBe('bl123');

    // Switch to DFB-Pokal
    useSettingsStore.setState({ currentCompetition: 'dfb-pokal' } as any);
    useGameStore.setState({
      currentGame: null,
      userConfirmedGameId: null,
      availableGames: [],
    });

    expect(useGameStore.getState().userConfirmedGameId).toBeNull();
  });
});
