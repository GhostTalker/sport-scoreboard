import { useEffect } from 'react';
import { useUIStore } from '../stores/uiStore';

type View = 'scoreboard' | 'stats' | 'settings';

// Navigation map: from view -> key -> to view
const NAVIGATION: Record<View, Record<string, View | null>> = {
  scoreboard: {
    ArrowUp: 'stats',
    ArrowDown: null,
    ArrowLeft: 'settings',
    ArrowRight: null,
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
};

export function useKeyboardNavigation() {
  const currentView = useUIStore((state) => state.currentView);
  const setView = useUIStore((state) => state.setView);
  const showCelebration = useUIStore((state) => state.showCelebration);
  const debugMode = useUIStore((state) => state.debugMode);

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

      // Navigation
      const navigation = NAVIGATION[currentView];
      const nextView = navigation[e.key];
      
      if (nextView) {
        e.preventDefault();
        setView(nextView);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentView, setView, showCelebration, debugMode]);
}
