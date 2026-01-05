import { ReactNode } from 'react';
import { useSwipe, getAvailableDirections } from '../../hooks/useSwipe';

interface SwipeContainerProps {
  children: ReactNode;
}

export function SwipeContainer({ children }: SwipeContainerProps) {
  const { handlers, currentView } = useSwipe();
  const availableDirections = getAvailableDirections(currentView);

  return (
    <div {...handlers} className="h-full w-full relative">
      {children}
      
      {/* Navigation hints - subtle, only on edges */}
      <NavigationHints directions={availableDirections} currentView={currentView} />
    </div>
  );
}

interface NavigationHintsProps {
  directions: string[];
  currentView: string;
}

function NavigationHints({ directions, currentView }: NavigationHintsProps) {
  // Don't show hints on main scoreboard (keep it clean)
  if (currentView === 'scoreboard') {
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
      
      {directions.includes('left') && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center text-white/40">
          <span className="text-xs mr-1">Settings (Arrow Left)</span>
          <svg className="w-5 h-5 -rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      )}
      
      {directions.includes('right') && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center text-white/40">
          <svg className="w-5 h-5 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          <span className="text-xs ml-1">Back (Arrow Right / Esc)</span>
        </div>
      )}
    </>
  );
}
