import { useEffect } from 'react';
import { useUIStore } from '../stores/uiStore';
import { useGameStore } from '../stores/gameStore';
import { isNFLGame } from '../types/game';

type View = 'scoreboard' | 'stats' | 'settings' | 'bracket';

// Base navigation map: from view -> key -> to view
const BASE_NAVIGATION: Record<View, Record<string, View | null>> = {
  scoreboard: {
    ArrowUp: 'stats',
    ArrowDown: null,
    ArrowLeft: 'settings',
    ArrowRight: null, // Will be 'bracket' for NFL playoffs
  },
  stats: {
    ArrowUp: null,
    ArrowDown: 'scoreboard',
    ArrowLeft: 'settings',
    ArrowRight: null, // Will be 'bracket' for NFL playoffs
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
};

export function useKeyboardNavigation() {
  const currentView = useUIStore((state) => state.currentView);
  const setView = useUIStore((state) => state.setView);
  const showCelebration = useUIStore((state) => state.showCelebration);
  const debugMode = useUIStore((state) => state.debugMode);
  const currentGame = useGameStore((state) => state.currentGame);

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

      // Enable bracket navigation for NFL playoffs
      const isBracketAvailable = currentGame && isNFLGame(currentGame) && currentGame.seasonType === 3;
      if (isBracketAvailable) {
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
  }, [currentView, setView, showCelebration, debugMode, currentGame]);
}
