import { useSwipeable, SwipeEventData } from 'react-swipeable';
import { useUIStore } from '../stores/uiStore';

type View = 'scoreboard' | 'stats' | 'settings';

// Navigation map: from view -> swipe direction -> to view
const NAVIGATION: Record<View, Record<string, View | null>> = {
  scoreboard: {
    up: 'stats',
    down: null,
    left: 'settings',
    right: null,
  },
  stats: {
    up: null,
    down: 'scoreboard',
    left: 'settings',
    right: null,
  },
  settings: {
    up: null,
    down: null,
    left: null,
    right: 'scoreboard',
  },
};

export function useSwipe() {
  const currentView = useUIStore((state) => state.currentView);
  const setView = useUIStore((state) => state.setView);

  const handleSwipe = (direction: string) => {
    const navigation = NAVIGATION[currentView];
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
  const nav = NAVIGATION[view];
  return Object.entries(nav)
    .filter(([_, target]) => target !== null)
    .map(([direction]) => direction);
}
