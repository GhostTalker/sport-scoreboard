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

function NavigationHints({ directions, currentView, viewMode, isBracketAvailable }: NavigationHintsProps) {
  // Show bracket hint on scoreboard and stats during NFL playoffs
  const showBracketHint = isBracketAvailable && (currentView === 'scoreboard' || currentView === 'stats');

  // Don't show hints in bracket view (keep it clean)
  if (currentView === 'bracket') {
    return null;
  }

  // Don't show hints in multi-game view (has its own footer hint)
  if (currentView === 'scoreboard' && viewMode === 'multi') {
    return null;
  }

  // Don't show hints on main scoreboard (keep it clean) unless bracket is available
  if (currentView === 'scoreboard' && !showBracketHint) {
    return null;
  }

  return (
    <>
      {directions.includes('up') && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex flex-col items-center text-white/40">
          <svg className="w-5 h-5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          <span className="text-xs">Stats (Arrow Up)</span>
        </div>
      )}
      
      {directions.includes('down') && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 flex flex-col items-center text-white/40">
          <span className="text-xs">Score (Arrow Down)</span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      )}
      
      {directions.includes('left') && !showBracketHint && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center text-white/40">
          <span className="text-xs mr-1">Settings (Arrow Left)</span>
          <svg className="w-5 h-5 -rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      )}

      {directions.includes('right') && currentView === 'bracket' && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center text-white/40">
          <svg className="w-5 h-5 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          <span className="text-xs ml-1">Back (Arrow Left / Esc)</span>
        </div>
      )}

      {showBracketHint && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center text-white/40">
          <span className="text-xs mr-1">Bracket (Arrow Right)</span>
          <svg className="w-5 h-5 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      )}
    </>
  );
}
