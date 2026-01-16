import { useSwipeable } from 'react-swipeable';
import { useUIStore } from '../stores/uiStore';
import { useGameStore } from '../stores/gameStore';
import { isNFLGame } from '../types/game';

type View = 'scoreboard' | 'stats' | 'settings' | 'bracket';

// Base navigation map: from view -> swipe direction -> to view
const BASE_NAVIGATION: Record<View, Record<string, View | null>> = {
  scoreboard: {
    up: 'stats',
    down: null,
    left: 'settings',
    right: null, // Will be 'bracket' for NFL playoffs
  },
  stats: {
    up: null,
    down: 'scoreboard',
    left: 'settings',
    right: null, // Will be 'bracket' for NFL playoffs
  },
  settings: {
    up: null,
    down: null,
    left: null,
    right: 'scoreboard',
  },
  bracket: {
    up: null,
    down: null,
    left: 'scoreboard', // Go back to scoreboard
    right: null,
  },
};

export function useSwipe() {
  const currentView = useUIStore((state) => state.currentView);
  const setView = useUIStore((state) => state.setView);
  const currentGame = useGameStore((state) => state.currentGame);

  // Check if bracket view is available (NFL playoffs only)
  const isBracketAvailable = currentGame && isNFLGame(currentGame) && currentGame.seasonType === 3;

  const handleSwipe = (direction: string) => {
    // Get dynamic navigation based on current game
    const navigation = { ...BASE_NAVIGATION[currentView] };

    // Enable bracket navigation for NFL playoffs
    if (isBracketAvailable) {
      if (currentView === 'scoreboard' || currentView === 'stats') {
        navigation.right = 'bracket';
      }
    }

    const nextView = navigation[direction];

    if (nextView) {
      setView(nextView);
    }
  };

  const handlers = useSwipeable({
    onSwipedUp: () => handleSwipe('up'),
    onSwipedDown: () => handleSwipe('down'),
    onSwipedLeft: () => handleSwipe('left'),
    onSwipedRight: () => handleSwipe('right'),
    trackMouse: false, // Only track touch events
    trackTouch: true,
    delta: 50, // Minimum swipe distance
    preventScrollOnSwipe: true,
    swipeDuration: 500,
  });

  return {
    handlers,
    currentView,
    setView,
  };
}

// Get available navigation directions for current view
export function getAvailableDirections(view: View): string[] {
  const nav = BASE_NAVIGATION[view];
  return Object.entries(nav)
    .filter(([, target]) => target !== null)
    .map(([direction]) => direction);
}
