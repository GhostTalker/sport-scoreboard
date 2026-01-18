import { useEffect } from 'react';
import { useUIStore } from '../stores/uiStore';
import { useGameStore } from '../stores/gameStore';
import { useSettingsStore } from '../stores/settingsStore';
import { isNFLGame, isBundesligaGame } from '../types/game';

type View = 'scoreboard' | 'stats' | 'settings' | 'bracket' | 'table';

// Base navigation map: from view -> key -> to view
const BASE_NAVIGATION: Record<View, Record<string, View | null>> = {
  scoreboard: {
    ArrowUp: 'stats',
    ArrowDown: null,
    ArrowLeft: 'settings', // Always settings
    ArrowRight: null, // Will be 'table' for Bundesliga or 'bracket' for NFL playoffs
  },
  stats: {
    ArrowUp: null,
    ArrowDown: 'scoreboard',
    ArrowLeft: 'settings',
    ArrowRight: null,
  },
  settings: {
    ArrowUp: null,
    ArrowDown: null,
    ArrowLeft: null,
    ArrowRight: 'scoreboard',
    Escape: 'scoreboard',
  },
  bracket: {
    ArrowUp: null,
    ArrowDown: null,
    ArrowLeft: 'scoreboard',
    ArrowRight: null,
    Escape: 'scoreboard',
  },
  table: {
    ArrowUp: null,
    ArrowDown: null,
    ArrowLeft: 'scoreboard',
    ArrowRight: null,
    Escape: 'scoreboard',
  },
};

export function useKeyboardNavigation() {
  const currentView = useUIStore((state) => state.currentView);
  const setView = useUIStore((state) => state.setView);
  const showCelebration = useUIStore((state) => state.showCelebration);
  const debugMode = useUIStore((state) => state.debugMode);
  const currentGame = useGameStore((state) => state.currentGame);
  const availableGames = useGameStore((state) => state.availableGames);
  const viewMode = useSettingsStore((state) => state.viewMode);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Debug shortcuts
      if (debugMode) {
        if (e.key === 't' || e.key === 'T') {
          e.preventDefault();
          showCelebration('touchdown');
          return;
        }
        if (e.key === 'f' || e.key === 'F') {
          e.preventDefault();
          showCelebration('fieldgoal');
          return;
        }
      }

      // Get dynamic navigation based on current game
      const navigation = { ...BASE_NAVIGATION[currentView] };

      // Check if bracket is available (NFL playoffs)
      // In single-view mode: check currentGame
      // In multi-view mode: check if any game is NFL playoffs
      const isBracketAvailableSingle = currentGame && isNFLGame(currentGame) && currentGame.seasonType === 3;
      const isBracketAvailableMulti = viewMode === 'multi' && availableGames.some(
        (game) => isNFLGame(game) && game.seasonType === 3
      );
      const isBracketAvailable = isBracketAvailableSingle || isBracketAvailableMulti;

      // Check if table is available (Bundesliga)
      const isTableAvailableSingle = currentGame && isBundesligaGame(currentGame);
      const isTableAvailableMulti = viewMode === 'multi' && availableGames.some((game) => isBundesligaGame(game));
      const isTableAvailable = isTableAvailableSingle || isTableAvailableMulti;

      // Enable table navigation for Bundesliga (right from scoreboard)
      if (isTableAvailable) {
        if (currentView === 'scoreboard') {
          navigation.ArrowRight = 'table';
        }
      }
      // Enable bracket navigation for NFL playoffs (right from scoreboard)
      else if (isBracketAvailable) {
        if (currentView === 'scoreboard' || currentView === 'stats') {
          navigation.ArrowRight = 'bracket';
        }
      }

      const nextView = navigation[e.key];

      if (nextView) {
        e.preventDefault();
        setView(nextView);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentView, setView, showCelebration, debugMode, currentGame, availableGames, viewMode]);
}
