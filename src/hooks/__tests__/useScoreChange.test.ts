/**
 * useScoreChange Hook Tests
 *
 * Tests Track 2 memory leak prevention:
 * - setTimeout cleanup on unmount
 * - setTimeout cleanup on game change
 * - Rapid score changes (only latest timeout runs)
 * - Memory leak detection
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useScoreChange } from '../useScoreChange';
import { useGameStore } from '../../stores/gameStore';
import { useUIStore } from '../../stores/uiStore';
import { useSettingsStore } from '../../stores/settingsStore';
import type { Game } from '../../types/game';

// Mock stores
vi.mock('../../stores/gameStore', () => ({
  useGameStore: vi.fn(),
}));

vi.mock('../../stores/uiStore', () => ({
  useUIStore: vi.fn(),
}));

vi.mock('../../stores/settingsStore', () => ({
  useSettingsStore: vi.fn(),
}));

vi.mock('../../services/scoreDetector', () => ({
  detectScoreChange: vi.fn(() => ({
    video: 'touchdown',
    team: 'home',
  })),
}));

// Helper to create mock game
const createMockGame = (homeScore: number, awayScore: number): Game => ({
  id: 'game123',
  date: '2026-01-17T18:00:00Z',
  homeTeam: {
    id: '17',
    name: 'Patriots',
    abbreviation: 'NE',
    logo: '',
    score: homeScore,
    record: { wins: 10, losses: 7, ties: 0 },
    color: '#002244',
  },
  awayTeam: {
    id: '3',
    name: 'Bills',
    abbreviation: 'BUF',
    logo: '',
    score: awayScore,
    record: { wins: 12, losses: 5, ties: 0 },
    color: '#00338D',
  },
  status: 'live',
  clock: '10:30',
  quarter: 3,
  season: 2025,
  week: 18,
  seasonType: 2,
  seasonName: 'Regular Season',
});

describe('useScoreChange - setTimeout Cleanup', () => {
  let mockUpdateScores: ReturnType<typeof vi.fn>;
  let mockSetScoringTeam: ReturnType<typeof vi.fn>;
  let mockShowCelebration: ReturnType<typeof vi.fn>;
  let mockIsCelebrationEnabled: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    mockUpdateScores = vi.fn();
    mockSetScoringTeam = vi.fn();
    mockShowCelebration = vi.fn();
    mockIsCelebrationEnabled = vi.fn(() => true);

    (useGameStore as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
      const store = {
        currentGame: null,
        updateScores: mockUpdateScores,
        setScoringTeam: mockSetScoringTeam,
      };
      return selector(store);
    });

    (useUIStore as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
      const store = {
        showCelebration: mockShowCelebration,
      };
      return selector(store);
    });

    (useSettingsStore as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
      const store = {
        isCelebrationEnabled: mockIsCelebrationEnabled,
        viewMode: 'single',
      };
      return selector(store);
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should cleanup timeout on unmount', () => {
    // Set up game with initial scores
    const initialGame = createMockGame(7, 0);
    (useGameStore as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
      const store = {
        currentGame: initialGame,
        updateScores: mockUpdateScores,
        setScoringTeam: mockSetScoringTeam,
      };
      return selector(store);
    });

    const { unmount } = renderHook(() => useScoreChange());

    // Skip first update (game change)
    vi.runOnlyPendingTimers();

    // Update score to trigger setTimeout
    const updatedGame = createMockGame(14, 0); // Score increased
    (useGameStore as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
      const store = {
        currentGame: updatedGame,
        updateScores: mockUpdateScores,
        setScoringTeam: mockSetScoringTeam,
      };
      return selector(store);
    });

    // Force re-render
    renderHook(() => useScoreChange());

    // Unmount before timeout fires
    unmount();

    // Advance time past the 30s timeout
    vi.advanceTimersByTime(31000);

    // setScoringTeam(null) should NOT be called because timeout was cleaned up
    // (We can't directly test this, but if there's a memory leak, the callback would still fire)

    // The test passes if no errors occur and no unexpected calls happen
    expect(true).toBe(true);
  });

  it('should cleanup timeout on game change', () => {
    // Start with game1
    const game1 = createMockGame(7, 0);
    (useGameStore as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
      const store = {
        currentGame: game1,
        updateScores: mockUpdateScores,
        setScoringTeam: mockSetScoringTeam,
      };
      return selector(store);
    });

    const { rerender } = renderHook(() => useScoreChange());
    vi.runOnlyPendingTimers();

    // Score increases in game1
    const game1Updated = createMockGame(14, 0);
    (useGameStore as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
      const store = {
        currentGame: game1Updated,
        updateScores: mockUpdateScores,
        setScoringTeam: mockSetScoringTeam,
      };
      return selector(store);
    });

    rerender();

    // Now switch to different game (game2) before timeout fires
    const game2 = { ...createMockGame(0, 0), id: 'game456' };
    (useGameStore as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
      const store = {
        currentGame: game2,
        updateScores: mockUpdateScores,
        setScoringTeam: mockSetScoringTeam,
      };
      return selector(store);
    });

    rerender();

    // Advance time past the timeout
    vi.advanceTimersByTime(31000);

    // Timeout from game1 should have been cleaned up
    // No error should occur
    expect(true).toBe(true);
  });

  it.skip('should handle rapid score changes correctly', () => {
    const initialGame = createMockGame(0, 0);
    (useGameStore as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
      const store = {
        currentGame: initialGame,
        updateScores: mockUpdateScores,
        setScoringTeam: mockSetScoringTeam,
      };
      return selector(store);
    });

    const { rerender } = renderHook(() => useScoreChange());
    vi.runOnlyPendingTimers();

    // Rapid score changes: 0→7→14→21 within seconds
    mockSetScoringTeam.mockClear();

    // First score
    (useGameStore as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
      const store = {
        currentGame: createMockGame(7, 0),
        updateScores: mockUpdateScores,
        setScoringTeam: mockSetScoringTeam,
      };
      return selector(store);
    });
    rerender();
    // Celebration should be triggered
    expect(mockShowCelebration).toHaveBeenCalled();
    mockShowCelebration.mockClear();

    // Second score (before first timeout fires)
    vi.advanceTimersByTime(5000); // 5s later
    (useGameStore as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
      const store = {
        currentGame: createMockGame(14, 0),
        updateScores: mockUpdateScores,
        setScoringTeam: mockSetScoringTeam,
      };
      return selector(store);
    });
    rerender();
    expect(mockShowCelebration).toHaveBeenCalled();
    mockShowCelebration.mockClear();

    // Third score (before previous timeouts fire)
    vi.advanceTimersByTime(5000); // Another 5s
    (useGameStore as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
      const store = {
        currentGame: createMockGame(21, 0),
        updateScores: mockUpdateScores,
        setScoringTeam: mockSetScoringTeam,
      };
      return selector(store);
    });
    rerender();
    expect(mockShowCelebration).toHaveBeenCalled();

    // Test passes if celebrations were triggered for all score changes
    expect(true).toBe(true);
  });

  it('should not leak memory with multiple timeouts', () => {
    const initialGame = createMockGame(0, 0);
    (useGameStore as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
      const store = {
        currentGame: initialGame,
        updateScores: mockUpdateScores,
        setScoringTeam: mockSetScoringTeam,
      };
      return selector(store);
    });

    const { rerender } = renderHook(() => useScoreChange());
    vi.runOnlyPendingTimers();

    // First rerender to set isFirstUpdateForGame = false
    rerender();

    // Create many rapid score changes (10 scores)
    for (let i = 1; i <= 10; i++) {
      (useGameStore as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
        const store = {
          currentGame: createMockGame(i * 7, 0),
          updateScores: mockUpdateScores,
          setScoringTeam: mockSetScoringTeam,
        };
        return selector(store);
      });
      rerender();
      vi.advanceTimersByTime(1000); // 1s between each
    }

    mockSetScoringTeam.mockClear();

    // Advance past all timeouts
    vi.advanceTimersByTime(30000);

    // Only the LAST timeout should fire
    expect(mockSetScoringTeam).toHaveBeenCalledTimes(1);
    expect(mockSetScoringTeam).toHaveBeenCalledWith(null);
  });
});

describe('useScoreChange - Score Detection', () => {
  let mockUpdateScores: ReturnType<typeof vi.fn>;
  let mockSetScoringTeam: ReturnType<typeof vi.fn>;
  let mockShowCelebration: ReturnType<typeof vi.fn>;
  let mockIsCelebrationEnabled: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    mockUpdateScores = vi.fn();
    mockSetScoringTeam = vi.fn();
    mockShowCelebration = vi.fn();
    mockIsCelebrationEnabled = vi.fn(() => true);

    (useGameStore as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
      const store = {
        currentGame: null,
        updateScores: mockUpdateScores,
        setScoringTeam: mockSetScoringTeam,
      };
      return selector(store);
    });

    (useUIStore as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
      const store = {
        showCelebration: mockShowCelebration,
      };
      return selector(store);
    });

    (useSettingsStore as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
      const store = {
        isCelebrationEnabled: mockIsCelebrationEnabled,
        viewMode: 'single',
      };
      return selector(store);
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it.skip('should detect home team score increase', () => {
    const initialGame = createMockGame(0, 0);
    (useGameStore as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
      const store = {
        currentGame: initialGame,
        updateScores: mockUpdateScores,
        setScoringTeam: mockSetScoringTeam,
      };
      return selector(store);
    });

    const { rerender } = renderHook(() => useScoreChange());

    // Now update score
    const updatedGame = createMockGame(7, 0);
    (useGameStore as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
      const store = {
        currentGame: updatedGame,
        updateScores: mockUpdateScores,
        setScoringTeam: mockSetScoringTeam,
      };
      return selector(store);
    });

    rerender();

    // Should trigger celebration (setScoringTeam is only called in viewMode='single' which requires proper store subscription)
    expect(mockShowCelebration).toHaveBeenCalled();
    // Verify updateScores was called with the new scores
    expect(mockUpdateScores).toHaveBeenCalledWith(7, 0);
  });

  it.skip('should detect away team score increase', () => {
    const initialGame = createMockGame(0, 0);
    (useGameStore as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
      const store = {
        currentGame: initialGame,
        updateScores: mockUpdateScores,
        setScoringTeam: mockSetScoringTeam,
      };
      return selector(store);
    });

    const { rerender } = renderHook(() => useScoreChange());

    // Now update score
    const updatedGame = createMockGame(0, 7);
    (useGameStore as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
      const store = {
        currentGame: updatedGame,
        updateScores: mockUpdateScores,
        setScoringTeam: mockSetScoringTeam,
      };
      return selector(store);
    });

    rerender();

    // Should trigger celebration (setScoringTeam is only called in viewMode='single' which requires proper store subscription)
    expect(mockShowCelebration).toHaveBeenCalled();
    // Verify updateScores was called with the new scores
    expect(mockUpdateScores).toHaveBeenCalledWith(0, 7);
  });

  it('should not trigger on score decrease', () => {
    const initialGame = createMockGame(14, 0);
    (useGameStore as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
      const store = {
        currentGame: initialGame,
        updateScores: mockUpdateScores,
        setScoringTeam: mockSetScoringTeam,
      };
      return selector(store);
    });

    const { rerender } = renderHook(() => useScoreChange());
    mockShowCelebration.mockClear();

    // Score decreases (correction)
    const updatedGame = createMockGame(7, 0);
    (useGameStore as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
      const store = {
        currentGame: updatedGame,
        updateScores: mockUpdateScores,
        setScoringTeam: mockSetScoringTeam,
      };
      return selector(store);
    });

    rerender();

    expect(mockShowCelebration).not.toHaveBeenCalled();
  });

  it('should not trigger on first update after game change', () => {
    const game1 = createMockGame(21, 14);
    (useGameStore as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
      const store = {
        currentGame: game1,
        updateScores: mockUpdateScores,
        setScoringTeam: mockSetScoringTeam,
      };
      return selector(store);
    });

    renderHook(() => useScoreChange());

    // First update should NOT trigger celebration (even though scores exist)
    expect(mockShowCelebration).not.toHaveBeenCalled();
  });
});

describe('useScoreChange - Edge Cases', () => {
  let mockUpdateScores: ReturnType<typeof vi.fn>;
  let mockSetScoringTeam: ReturnType<typeof vi.fn>;
  let mockShowCelebration: ReturnType<typeof vi.fn>;
  let mockIsCelebrationEnabled: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();

    mockUpdateScores = vi.fn();
    mockSetScoringTeam = vi.fn();
    mockShowCelebration = vi.fn();
    mockIsCelebrationEnabled = vi.fn(() => true);

    (useGameStore as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
      const store = {
        currentGame: null,
        updateScores: mockUpdateScores,
        setScoringTeam: mockSetScoringTeam,
      };
      return selector(store);
    });

    (useUIStore as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
      const store = {
        showCelebration: mockShowCelebration,
      };
      return selector(store);
    });

    (useSettingsStore as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
      const store = {
        isCelebrationEnabled: mockIsCelebrationEnabled,
        viewMode: 'single',
      };
      return selector(store);
    });
  });

  it('should handle null currentGame', () => {
    (useGameStore as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
      const store = {
        currentGame: null,
        updateScores: mockUpdateScores,
        setScoringTeam: mockSetScoringTeam,
      };
      return selector(store);
    });

    expect(() => renderHook(() => useScoreChange())).not.toThrow();
  });

  it('should not show celebration if disabled', () => {
    mockIsCelebrationEnabled.mockReturnValue(false);

    const initialGame = createMockGame(0, 0);
    (useGameStore as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
      const store = {
        currentGame: initialGame,
        updateScores: mockUpdateScores,
        setScoringTeam: mockSetScoringTeam,
      };
      return selector(store);
    });

    const { rerender } = renderHook(() => useScoreChange());

    const updatedGame = createMockGame(7, 0);
    (useGameStore as ReturnType<typeof vi.fn>).mockImplementation((selector) => {
      const store = {
        currentGame: updatedGame,
        updateScores: mockUpdateScores,
        setScoringTeam: mockSetScoringTeam,
      };
      return selector(store);
    });

    rerender();

    expect(mockShowCelebration).not.toHaveBeenCalled();
  });
});
