import { useGameStore } from '../../stores/gameStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { TeamDisplay } from './TeamDisplay';
import { GameClock } from './GameClock';
import { GameSituation } from './GameSituation';

export function MainScoreboard() {
  const currentGame = useGameStore((state) => state.currentGame);
  const isLoading = useGameStore((state) => state.isLoading);
  const error = useGameStore((state) => state.error);
  const primaryTeamId = useSettingsStore((state) => state.primaryTeamId);

  // Check if primary team is playing
  const isPrimaryTeamHome = currentGame?.homeTeam.id === primaryTeamId;
  const isPrimaryTeamAway = currentGame?.awayTeam.id === primaryTeamId;
  const isPrimaryTeamPlaying = isPrimaryTeamHome || isPrimaryTeamAway;

  // Get team colors for background
  const primaryColor = isPrimaryTeamPlaying
    ? isPrimaryTeamHome
      ? currentGame?.homeTeam.color
      : currentGame?.awayTeam.color
    : currentGame?.homeTeam.color;

  const secondaryColor = isPrimaryTeamPlaying
    ? isPrimaryTeamHome
      ? currentGame?.homeTeam.alternateColor
      : currentGame?.awayTeam.alternateColor
    : currentGame?.awayTeam.color;

  if (isLoading && !currentGame) {
    return <LoadingState />;
  }

  if (error && !currentGame) {
    return <ErrorState message={error} />;
  }

  if (!currentGame) {
    return <NoGameState />;
  }

  return (
    <div
      className="h-full w-full flex flex-col items-center justify-center p-8"
      style={{
        background: `linear-gradient(135deg, #${primaryColor || '1a1a2e'} 0%, #${secondaryColor || '16213e'} 100%)`,
      }}
    >
      {/* Main Score Display */}
      <div className="flex items-center justify-center gap-8 w-full max-w-5xl">
        {/* Away Team */}
        <TeamDisplay
          team={currentGame.awayTeam}
          isHome={false}
          isPrimary={isPrimaryTeamAway}
        />

        {/* Score */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-4">
            <span className="text-8xl font-bold font-score text-white drop-shadow-lg">
              {currentGame.awayTeam.score}
            </span>
            <span className="text-6xl font-bold text-white/50">:</span>
            <span className="text-8xl font-bold font-score text-white drop-shadow-lg">
              {currentGame.homeTeam.score}
            </span>
          </div>
        </div>

        {/* Home Team */}
        <TeamDisplay
          team={currentGame.homeTeam}
          isHome={true}
          isPrimary={isPrimaryTeamHome}
        />
      </div>

      {/* Game Info */}
      <div className="mt-8 flex flex-col items-center gap-4">
        <GameClock
          clock={currentGame.clock}
          status={currentGame.status}
        />

        {currentGame.situation && currentGame.status === 'in_progress' && (
          <GameSituation
            situation={currentGame.situation}
            homeTeam={currentGame.homeTeam}
            awayTeam={currentGame.awayTeam}
          />
        )}
      </div>

      {/* Game Status Badge */}
      {currentGame.status !== 'in_progress' && (
        <StatusBadge status={currentGame.status} startTime={currentGame.startTime} />
      )}
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
        <p className="text-white/50">Swipe left to change team or check schedule</p>
      </div>
    </div>
  );
}

function StatusBadge({ status, startTime }: { status: string; startTime?: string }) {
  const getStatusText = () => {
    switch (status) {
      case 'final':
        return 'FINAL';
      case 'halftime':
        return 'HALFTIME';
      case 'scheduled':
        if (startTime) {
          const date = new Date(startTime);
          return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        }
        return 'SCHEDULED';
      case 'postponed':
        return 'POSTPONED';
      case 'delayed':
        return 'DELAYED';
      default:
        return status.toUpperCase();
    }
  };

  const getBadgeColor = () => {
    switch (status) {
      case 'final':
        return 'bg-gray-600';
      case 'halftime':
        return 'bg-yellow-600';
      case 'scheduled':
        return 'bg-blue-600';
      case 'postponed':
      case 'delayed':
        return 'bg-red-600';
      default:
        return 'bg-gray-600';
    }
  };

  return (
    <div className={`mt-4 px-4 py-2 rounded-full ${getBadgeColor()}`}>
      <span className="text-white font-semibold text-lg">{getStatusText()}</span>
    </div>
  );
}
