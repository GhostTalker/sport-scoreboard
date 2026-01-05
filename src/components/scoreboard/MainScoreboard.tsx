import { useGameStore } from '../../stores/gameStore';
import { TeamDisplay } from './TeamDisplay';
import { GameSituation } from './GameSituation';

export function MainScoreboard() {
  const currentGame = useGameStore((state) => state.currentGame);
  const isLoading = useGameStore((state) => state.isLoading);
  const error = useGameStore((state) => state.error);

  if (isLoading && !currentGame) {
    return <LoadingState />;
  }

  if (error && !currentGame) {
    return <ErrorState message={error} />;
  }

  if (!currentGame) {
    return <NoGameState />;
  }

  // Format date
  const gameDate = currentGame.startTime 
    ? new Date(currentGame.startTime).toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      }).toUpperCase()
    : new Date().toLocaleDateString('en-US', { 
        month: 'long', 
        day: 'numeric', 
        year: 'numeric' 
      }).toUpperCase();

  return (
    <div 
      className="h-full w-full flex flex-col items-center justify-center relative overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, #0a1628 0%, #1a2744 50%, #0d1f3c 100%)',
      }}
    >
      {/* Stadium lights effect */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-yellow-500/20 to-transparent pointer-events-none" />
      
      {/* Header - GAME DAY */}
      <div className="absolute top-4 left-0 right-0 text-center">
        <h1 className="text-4xl font-bold text-white tracking-widest drop-shadow-lg">
          GAME DAY
        </h1>
        <p className="text-xl text-white/80 mt-1">{gameDate}</p>
      </div>

      {/* Main Content */}
      <div className="flex items-stretch justify-center gap-0 mt-16">
        {/* Away Team Panel */}
        <TeamDisplay team={currentGame.awayTeam} isHome={false} />

        {/* Center - VS and Scores */}
        <div className="flex flex-col items-center justify-center px-4 relative">
          {/* VS Badge */}
          <div className="absolute -top-2 bg-gradient-to-r from-orange-500 via-yellow-400 to-orange-500 px-6 py-2 rounded-lg shadow-lg z-10">
            <span className="text-3xl font-black text-white drop-shadow">VS</span>
          </div>

          {/* Score Boxes */}
          <div className="flex gap-4 mt-12">
            {/* Away Score */}
            <div className="w-32 h-40 bg-black/80 border-4 border-yellow-600 rounded-lg flex items-center justify-center shadow-2xl">
              <span className="text-7xl font-black text-white font-score">
                {currentGame.awayTeam.score}
              </span>
            </div>
            
            {/* Home Score */}
            <div className="w-32 h-40 bg-black/80 border-4 border-yellow-600 rounded-lg flex items-center justify-center shadow-2xl">
              <span className="text-7xl font-black text-white font-score">
                {currentGame.homeTeam.score}
              </span>
            </div>
          </div>

          {/* Quarter & Time Boxes */}
          <div className="flex gap-4 mt-4">
            {/* Quarter */}
            <div className="w-24 h-16 bg-black/80 border-4 border-yellow-600 rounded-lg flex items-center justify-center">
              <span className="text-2xl font-bold text-white">
                {currentGame.clock.periodName || 'Q1'}
              </span>
            </div>
            
            {/* Time */}
            <div className="w-40 h-16 bg-black/80 border-4 border-yellow-600 rounded-lg flex items-center justify-center">
              <span className="text-2xl font-bold text-white font-mono">
                {currentGame.clock.displayValue || '15:00'}
              </span>
              {currentGame.status === 'in_progress' && (
                <span className="ml-2 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              )}
            </div>
          </div>
        </div>

        {/* Home Team Panel */}
        <TeamDisplay team={currentGame.homeTeam} isHome={true} />
      </div>

      {/* Game Situation (Down & Distance) */}
      {currentGame.situation && currentGame.status === 'in_progress' && (
        <div className="mt-6">
          <GameSituation
            situation={currentGame.situation}
            homeTeam={currentGame.homeTeam}
            awayTeam={currentGame.awayTeam}
          />
        </div>
      )}

      {/* Status Badge for non-live games */}
      {currentGame.status !== 'in_progress' && currentGame.status !== 'scheduled' && (
        <StatusBadge status={currentGame.status} />
      )}

      {/* Navigation hint */}
      <div className="absolute bottom-4 left-0 right-0 text-center text-white/30 text-sm">
        Press Arrow Keys or Swipe to navigate
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="h-full w-full flex items-center justify-center bg-slate-900">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-white"></div>
        <p className="text-white/70 text-xl">Loading game data...</p>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="h-full w-full flex items-center justify-center bg-slate-900">
      <div className="flex flex-col items-center gap-4 text-center p-8">
        <svg className="w-16 h-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="text-white text-xl">Error loading game data</p>
        <p className="text-white/50">{message}</p>
        <p className="text-white/30 text-sm mt-4">Press Arrow Keys to navigate to Settings</p>
      </div>
    </div>
  );
}

function NoGameState() {
  return (
    <div className="h-full w-full flex items-center justify-center bg-slate-900">
      <div className="flex flex-col items-center gap-4 text-center p-8">
        <svg className="w-16 h-16 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-white text-xl">No games available</p>
        <p className="text-white/50">Press Left Arrow or swipe left for settings</p>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const getStatusText = () => {
    switch (status) {
      case 'final': return 'FINAL';
      case 'halftime': return 'HALFTIME';
      case 'postponed': return 'POSTPONED';
      case 'delayed': return 'DELAYED';
      default: return status.toUpperCase();
    }
  };

  const getBadgeColor = () => {
    switch (status) {
      case 'final': return 'bg-gray-700';
      case 'halftime': return 'bg-yellow-600';
      case 'postponed':
      case 'delayed': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div className={`mt-6 px-6 py-3 rounded-lg ${getBadgeColor()} shadow-lg`}>
      <span className="text-white font-bold text-xl">{getStatusText()}</span>
    </div>
  );
}
