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
      
      {/* Navigation hints */}
      <NavigationHints directions={availableDirections} />
    </div>
  );
}

interface NavigationHintsProps {
  directions: string[];
}

function NavigationHints({ directions }: NavigationHintsProps) {
  return (
    <>
      {directions.includes('up') && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center text-white/30 animate-bounce">
          <svg className="w-6 h-6 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          <span className="text-xs">Stats</span>
        </div>
      )}
      
      {directions.includes('down') && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center text-white/30 animate-bounce">
          <span className="text-xs">Score</span>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      )}
      
      {directions.includes('left') && (
        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center text-white/30">
          <span className="text-xs mr-1">Settings</span>
          <svg className="w-6 h-6 -rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      )}
      
      {directions.includes('right') && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center text-white/30">
          <svg className="w-6 h-6 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
          <span className="text-xs ml-1">Back</span>
        </div>
      )}
    </>
  );
}
