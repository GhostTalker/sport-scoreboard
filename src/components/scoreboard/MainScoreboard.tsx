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

  return (
    <div 
      className="h-full w-full flex flex-col items-center justify-center relative overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse at top, #1a2744 0%, transparent 50%),
          radial-gradient(ellipse at bottom, #0d1f3c 0%, transparent 50%),
          linear-gradient(180deg, #0a1628 0%, #152238 50%, #0a1628 100%)
        `,
      }}
    >
      {/* Animated background particles/stars effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white/20 rounded-full animate-pulse" />
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-white/30 rounded-full animate-ping" />
        <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-white/20 rounded-full animate-pulse" />
        <div className="absolute top-1/2 right-1/4 w-1 h-1 bg-white/25 rounded-full animate-ping" />
      </div>

      {/* Top glow effect */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-32 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse, rgba(255,200,100,0.15) 0%, transparent 70%)',
        }}
      />

      {/* Season/Round Header with Date/Status and Venue */}
      <GameHeader 
        seasonName={currentGame.seasonName} 
        status={currentGame.status}
        startTime={currentGame.startTime}
        venue={currentGame.venue}
        broadcast={currentGame.broadcast}
      />

      {/* Main Score Display */}
      <div className="flex items-center justify-center gap-6 w-full max-w-6xl px-8">
        {/* Away Team */}
        <TeamDisplay team={currentGame.awayTeam} isHome={false} />

        {/* Center Score Section */}
        <div className="flex flex-col items-center gap-4">
          {/* Score Display */}
          <div className="flex items-center gap-3">
            {/* Away Score */}
            <ScoreBox score={currentGame.awayTeam.score} teamColor={currentGame.awayTeam.color} />
            
            {/* Separator */}
            <div className="flex flex-col items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-white/40" />
              <div className="w-3 h-3 rounded-full bg-white/40" />
            </div>
            
            {/* Home Score */}
            <ScoreBox score={currentGame.homeTeam.score} teamColor={currentGame.homeTeam.color} />
          </div>

          {/* Game Clock */}
          <div 
            className="flex items-center gap-4 px-6 py-3 rounded-xl"
            style={{
              background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.4) 100%)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            {/* Quarter */}
            <div className="flex flex-col items-center">
              <span className="text-xs text-white/50 uppercase tracking-wider">Quarter</span>
              <span className="text-3xl font-black text-white">
                {currentGame.clock.periodName || '-'}
              </span>
            </div>
            
            {/* Divider */}
            <div className="w-px h-12 bg-white/20" />
            
            {/* Time */}
            <div className="flex flex-col items-center">
              <span className="text-xs text-white/50 uppercase tracking-wider">Time</span>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-black text-white font-mono">
                  {currentGame.clock.displayValue || '0:00'}
                </span>
                {currentGame.status === 'in_progress' && (
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Home Team */}
        <TeamDisplay team={currentGame.homeTeam} isHome={true} />
      </div>

      {/* Game Situation */}
      {currentGame.situation && currentGame.status === 'in_progress' && (
        <div className="mt-6">
          <GameSituation
            situation={currentGame.situation}
            homeTeam={currentGame.homeTeam}
            awayTeam={currentGame.awayTeam}
          />
        </div>
      )}



      {/* Navigation hint - very subtle */}
      <div className="absolute bottom-3 left-0 right-0 text-center text-white/20 text-xs">
        Arrow Keys to navigate
      </div>
    </div>
  );
}

interface ScoreBoxProps {
  score: number;
  teamColor: string;
}

function ScoreBox({ score, teamColor }: ScoreBoxProps) {
  return (
    <div 
      className="relative w-28 h-36 rounded-xl flex items-center justify-center overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, rgba(20,20,30,0.95) 0%, rgba(10,10,20,0.98) 100%)',
        boxShadow: `
          0 0 30px rgba(0,0,0,0.8),
          inset 0 0 20px rgba(0,0,0,0.5),
          0 0 60px #${teamColor}30
        `,
        border: '3px solid rgba(255,255,255,0.15)',
      }}
    >
      {/* Inner glow from team color */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          background: `radial-gradient(circle at center, #${teamColor} 0%, transparent 70%)`,
        }}
      />
      
      {/* Score number */}
      <span 
        className="text-7xl font-black text-white relative z-10"
        style={{
          textShadow: `0 0 30px #${teamColor}, 0 4px 8px rgba(0,0,0,0.8)`,
        }}
      >
        {score}
      </span>
      
      {/* Bottom accent line */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-1"
        style={{
          background: `linear-gradient(90deg, transparent, #${teamColor}, transparent)`,
        }}
      />
    </div>
  );
}

function LoadingState() {
  return (
    <div className="h-full w-full flex items-center justify-center bg-slate-900">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500" />
          <div className="absolute inset-0 animate-ping rounded-full h-16 w-16 border border-blue-500/30" />
        </div>
        <p className="text-white/70 text-xl">Loading game data...</p>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="h-full w-full flex items-center justify-center bg-slate-900">
      <div className="flex flex-col items-center gap-4 text-center p-8">
        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
          <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
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
        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
          <svg className="w-10 h-10 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <p className="text-white text-xl">No games available</p>
        <p className="text-white/50 text-sm">Press Arrow Left for Settings</p>
      </div>
    </div>
  );
}

interface GameHeaderProps {
  seasonName?: string;
  status: string;
  startTime?: string;
  venue?: string;
  broadcast?: string;
}

function GameHeader({ seasonName, status, startTime, venue, broadcast }: GameHeaderProps) {
  // Determine style based on round importance
  const isPlayoffs = seasonName && seasonName !== 'GAME DAY' && seasonName !== 'PRESEASON';
  const isSuperBowl = seasonName === 'SUPER BOWL';
  const isConference = seasonName === 'CONFERENCE CHAMPIONSHIP';
  const isFinal = status === 'final';
  const isLive = status === 'in_progress' || status === 'halftime';
  const isScheduled = status === 'scheduled';

  // Format date/time for display
  const getDateTimeDisplay = () => {
    if (isFinal) {
      return 'FINAL';
    }
    if (isLive) {
      return 'LIVE';
    }
    if (isScheduled && startTime) {
      const date = new Date(startTime);
      const now = new Date();
      const isToday = date.toDateString() === now.toDateString();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const isTomorrow = date.toDateString() === tomorrow.toDateString();
      
      const time = date.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit' 
      });
      
      if (isToday) {
        return `TODAY ${time}`;
      } else if (isTomorrow) {
        return `TOMORROW ${time}`;
      } else {
        const dateStr = date.toLocaleDateString('en-US', { 
          weekday: 'short',
          month: 'short', 
          day: 'numeric' 
        }).toUpperCase();
        return `${dateStr} ${time}`;
      }
    }
    return null;
  };

  const dateTimeDisplay = getDateTimeDisplay();
  
  // Build venue/broadcast info line
  const venueInfo = [broadcast, venue].filter(Boolean).join(' • ');
  
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1">
      {/* Season/Round Name */}
      {seasonName && (
        <div 
          className="relative px-6 py-1.5 rounded-lg"
          style={{
            background: isSuperBowl 
              ? 'linear-gradient(180deg, rgba(212,175,55,0.9) 0%, rgba(170,140,40,0.8) 100%)'
              : isConference
              ? 'linear-gradient(180deg, rgba(180,180,180,0.9) 0%, rgba(140,140,140,0.8) 100%)'
              : isPlayoffs
              ? 'linear-gradient(180deg, rgba(50,100,200,0.9) 0%, rgba(30,70,150,0.8) 100%)'
              : 'linear-gradient(180deg, rgba(40,60,80,0.8) 0%, rgba(30,45,60,0.7) 100%)',
            boxShadow: isSuperBowl
              ? '0 0 40px rgba(212,175,55,0.6), inset 0 1px 0 rgba(255,255,255,0.3)'
              : isPlayoffs
              ? '0 0 30px rgba(50,100,200,0.5), inset 0 1px 0 rgba(255,255,255,0.2)'
              : '0 4px 20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
            border: isSuperBowl
              ? '2px solid rgba(255,215,0,0.8)'
              : isConference
              ? '2px solid rgba(200,200,200,0.6)'
              : '1px solid rgba(255,255,255,0.2)',
          }}
        >
          {/* Glow effect for important games */}
          {isSuperBowl && (
            <div 
              className="absolute inset-0 rounded-lg animate-pulse opacity-50"
              style={{
                background: 'radial-gradient(circle, rgba(255,215,0,0.4) 0%, transparent 70%)',
              }}
            />
          )}
          
          <span 
            className={`relative text-base font-black uppercase tracking-[0.25em] ${
              isSuperBowl ? 'text-white' : isPlayoffs ? 'text-white' : 'text-white/80'
            }`}
            style={{
              textShadow: isSuperBowl 
                ? '0 0 20px rgba(255,215,0,0.8), 0 2px 4px rgba(0,0,0,0.5)'
                : '0 2px 4px rgba(0,0,0,0.5)',
            }}
          >
            {seasonName}
          </span>
        </div>
      )}
      
      {/* Date/Time or Status + Venue/Broadcast */}
      <div className="flex flex-col items-center gap-0.5">
        {dateTimeDisplay && (
          <div 
            className={`px-4 py-1 rounded-full text-sm font-bold tracking-wider ${
              isFinal 
                ? 'bg-gray-600/80 text-white/90' 
                : isLive 
                ? 'bg-red-600/90 text-white' 
                : 'bg-blue-600/80 text-white/90'
            }`}
            style={{
              boxShadow: isLive ? '0 0 20px rgba(220,38,38,0.5)' : undefined,
            }}
          >
            {isLive && (
              <span className="inline-flex items-center gap-2">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                {dateTimeDisplay}
              </span>
            )}
            {!isLive && dateTimeDisplay}
          </div>
        )}
        
        {/* Venue & Broadcast Info */}
        {venueInfo && (
          <span className="text-white/40 text-xs tracking-wide">
            {venueInfo}
          </span>
        )}
      </div>
    </div>
  );
}
