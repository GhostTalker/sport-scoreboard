import { ReactNode } from 'react';
import { useSwipe, getAvailableDirections } from '../../hooks/useSwipe';
import { useGameStore } from '../../stores/gameStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { isNFLGame } from '../../types/game';

interface SwipeContainerProps {
  children: ReactNode;
}

export function SwipeContainer({ children }: SwipeContainerProps) {
  const { handlers, currentView } = useSwipe();
  const currentGame = useGameStore((state) => state.currentGame);
  const availableGames = useGameStore((state) => state.availableGames);
  const viewMode = useSettingsStore((state) => state.viewMode);
  const availableDirections = getAvailableDirections(currentView);

  // Check if bracket is available for NFL playoffs
  // In single-view mode: check currentGame
  // In multi-view mode: check if any game is NFL playoffs
  const isBracketAvailableSingle = !!(currentGame && isNFLGame(currentGame) && currentGame.seasonType === 3);
  const isBracketAvailableMulti = viewMode === 'multi' && availableGames.some(
    (game) => isNFLGame(game) && game.seasonType === 3
  );
  const isBracketAvailable = isBracketAvailableSingle || isBracketAvailableMulti;

  return (
    <div {...handlers} className="h-full w-full relative">
      {children}

      {/* Navigation hints - subtle, only on edges */}
      <NavigationHints
        directions={availableDirections}
        currentView={currentView}
        viewMode={viewMode}
        isBracketAvailable={isBracketAvailable}
      />
    </div>
  );
}

interface NavigationHintsProps {
  directions: string[];
  currentView: string;
  viewMode?: 'single' | 'multi';
  isBracketAvailable?: boolean;
}

function NavigationHints(_props: NavigationHintsProps) {
  // DISABLED: Navigation hints removed per user request
  // Users can navigate via swipe gestures and arrow keys without on-screen hints
  return null;
}
