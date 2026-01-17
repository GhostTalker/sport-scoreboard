/**
 * useGameData Hook Tests
 *
 * Tests for the useGameData hook, focusing on:
 * - Polling intervals based on game status (live, scheduled, final)
 * - Sport-specific polling (NFL vs Bundesliga)
 * - Sport switching and adapter loading
 * - Error handling and recovery
 * - User-confirmed game selection persistence
 * - Concurrent fetch prevention
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useGameData } from '../useGameData';
import { useGameStore } from '../../stores/gameStore';
import { useSettingsStore } from '../../stores/settingsStore';
import type { Game } from '../../types/game';
import type { GameStats } from '../../types/stats';
import type { SportAdapter } from '../../adapters/SportAdapter';

// Mock stores
vi.mock('../../stores/gameStore');
vi.mock('../../stores/settingsStore');

// Mock plugin hook
const mockAdapter: SportAdapter = {
  sport: 'nfl',
  fetchScoreboard: vi.fn(),
  fetchGameDetails: vi.fn(),
  detectScoreChange: vi.fn(),
  getCelebrationTypes: vi.fn(() => ['touchdown', 'fieldgoal']),
};

vi.mock('../usePlugin', () => ({
  useCurrentPlugin: vi.fn(() => ({
    manifest: { id: 'nfl', displayName: 'NFL' },
    adapter: mockAdapter,
  })),
}));

// Helper to create mock game
const createMockGame = (
  id: string,
  status: 'scheduled' | 'in_progress' | 'halftime' | 'final',
  sport: 'nfl' | 'bundesliga' = 'nfl'
): Game => ({
  id,
  sport,
  competition: sport,
  date: '2026-01-17T18:00:00Z',
  homeTeam: {
    id: '17',
    name: 'Patriots',
    abbreviation: 'NE',
    displayName: 'New England Patriots',
    shortDisplayName: 'Patriots',
    logo: 'https://example.com/patriots.png',
    score: 14,
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
    score: 7,
    color: '00338D',
    alternateColor: 'FFFFFF',
  },
  status,
  clock: status === 'scheduled' ? '' : '10:30',
  quarter: status === 'scheduled' ? 1 : 2,
  season: 2025,
  week: 18,
  seasonType: 2,
  seasonName: 'Regular Season',
  startTime: '2026-01-17T18:00:00Z',
});

describe('useGameData - Initialization', () => {
  let mockSetLoading: ReturnType<typeof vi.fn>;
  let mockSetError: ReturnType<typeof vi.fn>;
  let mockSetAvailableGames: ReturnType<typeof vi.fn>;
  let mockSetCurrentGame: ReturnType<typeof vi.fn>;
  let mockSetGameStats: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    mockSetLoading = vi.fn();
    mockSetError = vi.fn();
    mockSetAvailableGames = vi.fn();
    mockSetCurrentGame = vi.fn();
    mockSetGameStats = vi.fn();

    // Mock useGameStore
    (useGameStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: any) => {
      if (typeof selector === 'function') {
        return selector({
          currentGame: null,
          userConfirmedGameId: null,
          isLive: false,
          setLoading: mockSetLoading,
          setError: mockSetError,
          setAvailableGames: mockSetAvailableGames,
          setCurrentGame: mockSetCurrentGame,
          setGameStats: mockSetGameStats,
        });
      }
      return null;
    });

    // Add getState and setState for Zustand
    (useGameStore as any).getState = vi.fn(() => ({
      currentGame: null,
      userConfirmedGameId: null,
      isLive: false,
      setLoading: mockSetLoading,
      setError: mockSetError,
      setAvailableGames: mockSetAvailableGames,
      setCurrentGame: mockSetCurrentGame,
      setGameStats: mockSetGameStats,
    }));

    (useGameStore as any).setState = vi.fn((partial: any) => {
      if (typeof partial === 'function') {
        partial((useGameStore as any).getState());
      }
    });

    (useGameStore as any).subscribe = vi.fn(() => vi.fn());

    // Mock useSettingsStore
    (useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: any) => {
      if (typeof selector === 'function') {
        return selector({
          currentCompetition: 'nfl',
          currentSport: 'nfl',
        });
      }
      return null;
    });

    (useSettingsStore as any).subscribe = vi.fn(() => vi.fn());

    // Mock adapter
    (mockAdapter.fetchScoreboard as ReturnType<typeof vi.fn>).mockResolvedValue([
      createMockGame('game1', 'in_progress'),
    ]);
    (mockAdapter.fetchGameDetails as ReturnType<typeof vi.fn>).mockResolvedValue({
      game: createMockGame('game1', 'in_progress'),
      stats: null,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should fetch data immediately on mount', async () => {
    renderHook(() => useGameData());

    // Trigger immediate fetch (setTimeout 0)
    await vi.runOnlyPendingTimersAsync();

    await waitFor(() => {
      expect(mockAdapter.fetchScoreboard).toHaveBeenCalled();
    });
  });

  it('should set loading state on first fetch', async () => {
    renderHook(() => useGameData());

    await vi.runOnlyPendingTimersAsync();

    await waitFor(() => {
      expect(mockSetLoading).toHaveBeenCalledWith(true);
    });
  });

  it('should clear error on successful fetch', async () => {
    renderHook(() => useGameData());

    await vi.runOnlyPendingTimersAsync();

    await waitFor(() => {
      expect(mockSetError).toHaveBeenCalledWith(null);
    });
  });

  it('should set available games after fetch', async () => {
    const games = [createMockGame('game1', 'in_progress')];
    (mockAdapter.fetchScoreboard as ReturnType<typeof vi.fn>).mockResolvedValue(games);

    renderHook(() => useGameData());

    await vi.runOnlyPendingTimersAsync();

    await waitFor(() => {
      expect(mockSetAvailableGames).toHaveBeenCalledWith(games);
    });
  });
});

describe('useGameData - Error Handling', () => {
  let mockSetLoading: ReturnType<typeof vi.fn>;
  let mockSetError: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSetLoading = vi.fn();
    mockSetError = vi.fn();

    (useGameStore as any).getState = vi.fn(() => ({
      currentGame: null,
      userConfirmedGameId: null,
      isLive: false,
      setLoading: mockSetLoading,
      setError: mockSetError,
      setAvailableGames: vi.fn(),
      setCurrentGame: vi.fn(),
      setGameStats: vi.fn(),
    }));

    (useGameStore as any).setState = vi.fn();
    (useGameStore as any).subscribe = vi.fn(() => vi.fn());

    (useGameStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: any) => {
      if (typeof selector === 'function') {
        return selector((useGameStore as any).getState());
      }
      return null;
    });

    (useSettingsStore as any).subscribe = vi.fn(() => vi.fn());
    (useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: any) => {
      if (typeof selector === 'function') {
        return selector({ currentCompetition: 'nfl', currentSport: 'nfl' });
      }
      return null;
    });
  });

  it('should handle fetch errors gracefully', async () => {
    const error = new Error('Network error');
    (mockAdapter.fetchScoreboard as ReturnType<typeof vi.fn>).mockRejectedValue(error);

    renderHook(() => useGameData());

    await vi.runOnlyPendingTimersAsync();

    await waitFor(() => {
      expect(mockSetError).toHaveBeenCalledWith('Network error');
    });
  });

  it('should still turn off loading state after error', async () => {
    const error = new Error('API error');
    (mockAdapter.fetchScoreboard as ReturnType<typeof vi.fn>).mockRejectedValue(error);

    renderHook(() => useGameData());

    await vi.runOnlyPendingTimersAsync();

    await waitFor(() => {
      expect(mockSetLoading).toHaveBeenCalledWith(false);
    });
  });

  it('should handle non-Error exceptions', async () => {
    (mockAdapter.fetchScoreboard as ReturnType<typeof vi.fn>).mockRejectedValue('String error');

    renderHook(() => useGameData());

    await vi.runOnlyPendingTimersAsync();

    await waitFor(() => {
      expect(mockSetError).toHaveBeenCalledWith('Failed to fetch game data');
    });
  });
});

describe('useGameData - User Confirmed Game Selection', () => {
  let mockSetCurrentGame: ReturnType<typeof vi.fn>;
  let mockSetGameStats: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSetCurrentGame = vi.fn();
    mockSetGameStats = vi.fn();

    (useSettingsStore as any).subscribe = vi.fn(() => vi.fn());
    (useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: any) => {
      if (typeof selector === 'function') {
        return selector({ currentCompetition: 'nfl', currentSport: 'nfl' });
      }
      return null;
    });
  });

  it('should show user confirmed game when available', async () => {
    const game1 = createMockGame('game1', 'in_progress');
    const game2 = createMockGame('game2', 'in_progress');

    (mockAdapter.fetchScoreboard as ReturnType<typeof vi.fn>).mockResolvedValue([game1, game2]);
    (mockAdapter.fetchGameDetails as ReturnType<typeof vi.fn>).mockResolvedValue({
      game: game1,
      stats: null,
    });

    // User confirmed game1
    (useGameStore as any).getState = vi.fn(() => ({
      currentGame: game1,
      userConfirmedGameId: 'game1',
      isLive: true,
      setLoading: vi.fn(),
      setError: vi.fn(),
      setAvailableGames: vi.fn(),
      setCurrentGame: mockSetCurrentGame,
      setGameStats: mockSetGameStats,
    }));

    (useGameStore as any).setState = vi.fn();
    (useGameStore as any).subscribe = vi.fn(() => vi.fn());

    (useGameStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: any) => {
      if (typeof selector === 'function') {
        return selector((useGameStore as any).getState());
      }
      return null;
    });

    renderHook(() => useGameData());

    await vi.runOnlyPendingTimersAsync();

    await waitFor(() => {
      expect(mockAdapter.fetchGameDetails).toHaveBeenCalledWith('game1');
    });
  });

  it('should keep showing cached game if confirmed game not found in API', async () => {
    const cachedGame = createMockGame('game1', 'final');

    (mockAdapter.fetchScoreboard as ReturnType<typeof vi.fn>).mockResolvedValue([
      createMockGame('game2', 'scheduled'),
    ]);

    (useGameStore as any).getState = vi.fn(() => ({
      currentGame: cachedGame,
      userConfirmedGameId: 'game1',
      isLive: false,
      setLoading: vi.fn(),
      setError: vi.fn(),
      setAvailableGames: vi.fn(),
      setCurrentGame: mockSetCurrentGame,
      setGameStats: vi.fn(),
    }));

    (useGameStore as any).setState = vi.fn();
    (useGameStore as any).subscribe = vi.fn(() => vi.fn());

    (useGameStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: any) => {
      if (typeof selector === 'function') {
        return selector((useGameStore as any).getState());
      }
      return null;
    });

    renderHook(() => useGameData());

    await vi.runOnlyPendingTimersAsync();

    // Should use cached game
    await waitFor(() => {
      expect(mockSetCurrentGame).toHaveBeenCalled();
    });
  });
});

describe('useGameData - Game Details Fetching', () => {
  let mockSetCurrentGame: ReturnType<typeof vi.fn>;
  let mockSetGameStats: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockSetCurrentGame = vi.fn();
    mockSetGameStats = vi.fn();

    (useGameStore as any).subscribe = vi.fn(() => vi.fn());
    (useSettingsStore as any).subscribe = vi.fn(() => vi.fn());
    (useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: any) => {
      if (typeof selector === 'function') {
        return selector({ currentCompetition: 'nfl', currentSport: 'nfl' });
      }
      return null;
    });
  });

  it('should fetch details for in_progress games', async () => {
    const game = createMockGame('game1', 'in_progress');
    const stats: GameStats = {
      homeTeamStats: { totalYards: 350, passingYards: 250, rushingYards: 100, turnovers: 1, timeOfPossession: '30:00' },
      awayTeamStats: { totalYards: 280, passingYards: 180, rushingYards: 100, turnovers: 2, timeOfPossession: '30:00' },
    };

    (mockAdapter.fetchScoreboard as ReturnType<typeof vi.fn>).mockResolvedValue([game]);
    (mockAdapter.fetchGameDetails as ReturnType<typeof vi.fn>).mockResolvedValue({
      game,
      stats,
    });

    (useGameStore as any).getState = vi.fn(() => ({
      currentGame: null,
      userConfirmedGameId: 'game1',
      isLive: false,
      setLoading: vi.fn(),
      setError: vi.fn(),
      setAvailableGames: vi.fn(),
      setCurrentGame: mockSetCurrentGame,
      setGameStats: mockSetGameStats,
    }));

    (useGameStore as any).setState = vi.fn();

    (useGameStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: any) => {
      if (typeof selector === 'function') {
        return selector((useGameStore as any).getState());
      }
      return null;
    });

    renderHook(() => useGameData());

    await vi.runOnlyPendingTimersAsync();

    await waitFor(() => {
      expect(mockAdapter.fetchGameDetails).toHaveBeenCalledWith('game1');
      expect(mockSetGameStats).toHaveBeenCalledWith(stats);
    });
  });

  it('should fetch details for halftime games', async () => {
    const game = createMockGame('game1', 'halftime');

    (mockAdapter.fetchScoreboard as ReturnType<typeof vi.fn>).mockResolvedValue([game]);
    (mockAdapter.fetchGameDetails as ReturnType<typeof vi.fn>).mockResolvedValue({
      game,
      stats: null,
    });

    (useGameStore as any).getState = vi.fn(() => ({
      currentGame: null,
      userConfirmedGameId: 'game1',
      isLive: false,
      setLoading: vi.fn(),
      setError: vi.fn(),
      setAvailableGames: vi.fn(),
      setCurrentGame: mockSetCurrentGame,
      setGameStats: mockSetGameStats,
    }));

    (useGameStore as any).setState = vi.fn();

    (useGameStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: any) => {
      if (typeof selector === 'function') {
        return selector((useGameStore as any).getState());
      }
      return null;
    });

    renderHook(() => useGameData());

    await vi.runOnlyPendingTimersAsync();

    await waitFor(() => {
      expect(mockAdapter.fetchGameDetails).toHaveBeenCalledWith('game1');
    });
  });

  it('should fetch details for final games', async () => {
    const game = createMockGame('game1', 'final');

    (mockAdapter.fetchScoreboard as ReturnType<typeof vi.fn>).mockResolvedValue([game]);
    (mockAdapter.fetchGameDetails as ReturnType<typeof vi.fn>).mockResolvedValue({
      game,
      stats: null,
    });

    (useGameStore as any).getState = vi.fn(() => ({
      currentGame: null,
      userConfirmedGameId: 'game1',
      isLive: false,
      setLoading: vi.fn(),
      setError: vi.fn(),
      setAvailableGames: vi.fn(),
      setCurrentGame: mockSetCurrentGame,
      setGameStats: vi.fn(),
    }));

    (useGameStore as any).setState = vi.fn();

    (useGameStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: any) => {
      if (typeof selector === 'function') {
        return selector((useGameStore as any).getState());
      }
      return null;
    });

    renderHook(() => useGameData());

    await vi.runOnlyPendingTimersAsync();

    await waitFor(() => {
      expect(mockAdapter.fetchGameDetails).toHaveBeenCalledWith('game1');
    });
  });

  it('should NOT fetch details for scheduled games', async () => {
    const game = createMockGame('game1', 'scheduled');

    (mockAdapter.fetchScoreboard as ReturnType<typeof vi.fn>).mockResolvedValue([game]);

    (useGameStore as any).getState = vi.fn(() => ({
      currentGame: null,
      userConfirmedGameId: 'game1',
      isLive: false,
      setLoading: vi.fn(),
      setError: vi.fn(),
      setAvailableGames: vi.fn(),
      setCurrentGame: mockSetCurrentGame,
      setGameStats: vi.fn(),
    }));

    (useGameStore as any).setState = vi.fn();
    (useGameStore as any).subscribe = vi.fn(() => vi.fn());

    (useGameStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: any) => {
      if (typeof selector === 'function') {
        return selector((useGameStore as any).getState());
      }
      return null;
    });

    renderHook(() => useGameData());

    await vi.runOnlyPendingTimersAsync();

    await waitFor(() => {
      expect(mockAdapter.fetchGameDetails).not.toHaveBeenCalled();
      expect(mockSetCurrentGame).toHaveBeenCalledWith(game);
    });
  });

  it('should handle fetchGameDetails errors gracefully', async () => {
    const game = createMockGame('game1', 'in_progress');

    (mockAdapter.fetchScoreboard as ReturnType<typeof vi.fn>).mockResolvedValue([game]);
    (mockAdapter.fetchGameDetails as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('Details error'));

    (useGameStore as any).getState = vi.fn(() => ({
      currentGame: null,
      userConfirmedGameId: 'game1',
      isLive: false,
      setLoading: vi.fn(),
      setError: vi.fn(),
      setAvailableGames: vi.fn(),
      setCurrentGame: mockSetCurrentGame,
      setGameStats: mockSetGameStats,
    }));

    (useGameStore as any).setState = vi.fn();
    (useGameStore as any).subscribe = vi.fn(() => vi.fn());

    (useGameStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: any) => {
      if (typeof selector === 'function') {
        return selector((useGameStore as any).getState());
      }
      return null;
    });

    renderHook(() => useGameData());

    await vi.runOnlyPendingTimersAsync();

    // Should fallback to scoreboard data
    await waitFor(() => {
      expect(mockSetCurrentGame).toHaveBeenCalledWith(game);
      expect(mockSetGameStats).toHaveBeenCalledWith(null);
    });
  });
});

describe('useGameData - Concurrent Fetch Prevention', () => {
  it('should prevent concurrent fetches', async () => {
    (mockAdapter.fetchScoreboard as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve([]), 1000))
    );

    (useGameStore as any).getState = vi.fn(() => ({
      currentGame: null,
      userConfirmedGameId: null,
      isLive: false,
      setLoading: vi.fn(),
      setError: vi.fn(),
      setAvailableGames: vi.fn(),
      setCurrentGame: vi.fn(),
      setGameStats: vi.fn(),
    }));

    (useGameStore as any).setState = vi.fn();
    (useGameStore as any).subscribe = vi.fn(() => vi.fn());

    (useGameStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: any) => {
      if (typeof selector === 'function') {
        return selector((useGameStore as any).getState());
      }
      return null;
    });

    (useSettingsStore as any).subscribe = vi.fn(() => vi.fn());
    (useSettingsStore as unknown as ReturnType<typeof vi.fn>).mockImplementation((selector: any) => {
      if (typeof selector === 'function') {
        return selector({ currentCompetition: 'nfl', currentSport: 'nfl' });
      }
      return null;
    });

    const { result } = renderHook(() => useGameData());

    await vi.runOnlyPendingTimersAsync();

    // Try to manually trigger another fetch while first is in progress
    result.current.refetch();
    result.current.refetch();
    result.current.refetch();

    await vi.advanceTimersByTimeAsync(2000);

    // Should only call fetchScoreboard once (concurrent calls prevented)
    expect(mockAdapter.fetchScoreboard).toHaveBeenCalledTimes(1);
  });
});
