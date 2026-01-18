import { create } from 'zustand';
import type { Game } from '../types/game';
import type { GameStats } from '../types/stats';
import { useSettingsStore } from './settingsStore';

interface PreviousScores {
  home: number;
  away: number;
}

interface GameState {
  // Current Game
  currentGame: Game | null;
  isLive: boolean;

  // User confirmed game selection (only set by explicit UI button click)
  userConfirmedGameId: string | null;

  // All available games (for game selector)
  availableGames: Game[];

  // Scores tracking (for change detection)
  previousScores: PreviousScores;

  // Scoring team tracking (for glow effect)
  scoringTeam: 'home' | 'away' | null;
  scoringTimestamp: number | null;

  // Stats
  gameStats: GameStats | null;

  // Loading states
  isLoading: boolean;
  error: string | null;

  // Actions
  setCurrentGame: (game: Game | null) => void;
  confirmGameSelection: (game: Game) => void;
  setAvailableGames: (games: Game[]) => void;
  updateScores: (home: number, away: number) => void;
  setScoringTeam: (team: 'home' | 'away' | null) => void;
  setGameStats: (stats: GameStats | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearUserConfirmation: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
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

  // Auto-set (from polling) - respects user selection
  setCurrentGame: (game) => {
    const { userConfirmedGameId, currentGame: prevGame, previousScores } = get();

    // RACE CONDITION FIX: Validate sport matches current sport
    // This catches data corruption when sport switches during fetch
    if (game) {
      const currentSport = useSettingsStore.getState().currentSport;
      if (game.sport && game.sport !== currentSport) {
        console.warn(
          `[gameStore] Sport mismatch: received ${game.sport} but current sport is ${currentSport}. Rejecting update.`
        );
        return;
      }
    }

    // If user confirmed a game, only update if it's the same game ID
    if (userConfirmedGameId && game && game.id !== userConfirmedGameId) {
      return;
    }

    // If game is null but we have a confirmed selection, don't clear
    if (!game && userConfirmedGameId) {
      return;
    }

    const isLive = game?.status === 'in_progress' || game?.status === 'halftime' || game?.status === 'end_period';

    // Only update previousScores if this is a NEW game (different ID)
    // This prevents celebration triggers when switching games
    const isNewGame = !prevGame || prevGame.id !== game?.id;
    const newPreviousScores = isNewGame && game
      ? { home: game.homeTeam.score, away: game.awayTeam.score }
      : previousScores;

    set({
      currentGame: game,
      isLive,
      previousScores: newPreviousScores,
      scoringTeam: isNewGame ? null : get().scoringTeam,
      scoringTimestamp: isNewGame ? null : get().scoringTimestamp,
    });
  },

  // Explicit user confirmation - ONLY way to select a game
  confirmGameSelection: (game) => {
    const isLive = game.status === 'in_progress' || game.status === 'halftime' || game.status === 'end_period';
    set({
      currentGame: game,
      isLive,
      userConfirmedGameId: game.id,
      previousScores: { home: game.homeTeam.score, away: game.awayTeam.score },
      scoringTeam: null,
      scoringTimestamp: null,
    });
  },

  setAvailableGames: (games) => set({ availableGames: games }),

  updateScores: (home, away) => {
    const { previousScores } = get();

    if (previousScores.home !== home || previousScores.away !== away) {
      set({ previousScores: { home, away } });
    }
  },

  setScoringTeam: (team) => {
    set({
      scoringTeam: team,
      scoringTimestamp: team ? Date.now() : null
    });
  },

  setGameStats: (stats) => set({ gameStats: stats }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  clearUserConfirmation: () => set({ userConfirmedGameId: null }),
}));
