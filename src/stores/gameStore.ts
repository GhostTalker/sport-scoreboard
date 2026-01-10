import { create } from 'zustand';
import type { Game } from '../types/game';
import type { GameStats } from '../types/stats';

interface PreviousScores {
  home: number;
  away: number;
}

interface GameState {
  // Current Game
  currentGame: Game | null;
  isLive: boolean;

  // User confirmed game selection (NEW - only set by explicit UI button click)
  userConfirmedGameId: string | null;

  // Legacy variable (keeping for now, will be removed)
  manuallySelectedGameId: string | null;

  // All available games (for game selector)
  availableGames: Game[];
  
  // Scores tracking (for change detection)
  previousScores: PreviousScores;
  
  // Stats
  gameStats: GameStats | null;
  
  // Loading states
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setCurrentGame: (game: Game | null) => void;
  selectGame: (game: Game | null) => void; // Manual selection
  confirmGameSelection: (game: Game) => void; // NEW - explicit user confirmation
  setAvailableGames: (games: Game[]) => void;
  updateScores: (home: number, away: number) => void;
  setGameStats: (stats: GameStats | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearManualSelection: () => void;
  clearUserConfirmation: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  currentGame: null,
  isLive: false,
  userConfirmedGameId: null,
  manuallySelectedGameId: null,
  availableGames: [],
  previousScores: { home: 0, away: 0 },
  gameStats: null,
  isLoading: false,
  error: null,

  // Auto-set (from polling) - respects manual selection
  setCurrentGame: (game) => {
    const { manuallySelectedGameId, currentGame: prevGame, previousScores } = get();
    
    // If user manually selected a game, only update if it's the same game ID
    if (manuallySelectedGameId && game && game.id !== manuallySelectedGameId) {
      return;
    }
    
    // If game is null but we have a manual selection, don't clear
    if (!game && manuallySelectedGameId) {
      return;
    }
    
    const isLive = game?.status === 'in_progress' || game?.status === 'halftime';
    
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
    });
  },

  // Manual selection - always applies
  selectGame: (game) => {
    const stack = new Error().stack;
    console.log('[SELECT-GAME] ==========================================');
    console.log('[SELECT-GAME] selectGame called with gameId:', game?.id);
    console.log('[SELECT-GAME] Teams:', game ? `${game.awayTeam.abbreviation} @ ${game.homeTeam.abbreviation}` : 'null');
    console.log('[SELECT-GAME] FULL CALL STACK:');
    console.log(stack); // Print full stack separately for better visibility
    console.log('[SELECT-GAME] ==========================================');

    const isLive = game?.status === 'in_progress' || game?.status === 'halftime';
    set({
      currentGame: game,
      isLive,
      manuallySelectedGameId: game?.id || null,
      previousScores: game
        ? { home: game.homeTeam.score, away: game.awayTeam.score }
        : { home: 0, away: 0 },
    });
  },

  setAvailableGames: (games) => set({ availableGames: games }),

  updateScores: (home, away) => {
    const { previousScores } = get();
    
    if (previousScores.home !== home || previousScores.away !== away) {
      set({ previousScores: { home, away } });
    }
  },

  setGameStats: (stats) => set({ gameStats: stats }),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  clearManualSelection: () => set({ manuallySelectedGameId: null }),

  // NEW: Explicit user confirmation - ONLY way to set userConfirmedGameId
  confirmGameSelection: (game) => {
    console.log('[CONFIRM-GAME] ==========================================');
    console.log('[CONFIRM-GAME] User explicitly confirmed game:', game.id);
    console.log('[CONFIRM-GAME] Teams:', `${game.awayTeam.abbreviation} @ ${game.homeTeam.abbreviation}`);
    console.log('[CONFIRM-GAME] ==========================================');

    const isLive = game.status === 'in_progress' || game.status === 'halftime';
    set({
      currentGame: game,
      isLive,
      userConfirmedGameId: game.id,
      manuallySelectedGameId: game.id, // Keep legacy in sync
      previousScores: { home: game.homeTeam.score, away: game.awayTeam.score },
    });
  },

  clearUserConfirmation: () => set({ userConfirmedGameId: null }),
}));
