import { useGameStore } from '../../stores/gameStore';
import { useUIStore } from '../../stores/uiStore';
import type { Game } from '../../types/game';

export function GameSelector() {
  const availableGames = useGameStore((state) => state.availableGames);
  const currentGame = useGameStore((state) => state.currentGame);
  const selectGame = useGameStore((state) => state.selectGame);
  const setView = useUIStore((state) => state.setView);

  const handleSelectGame = (game: Game) => {
    selectGame(game);
    setView('scoreboard');
  };

  if (availableGames.length === 0) {
    return (
      <div className="text-center py-4 text-white/50">
        No games available
      </div>
    );
  }

  // Group games by status
  const liveGames = availableGames.filter(g => g.status === 'in_progress' || g.status === 'halftime');
  const scheduledGames = availableGames.filter(g => g.status === 'scheduled');
  const finishedGames = availableGames.filter(g => g.status === 'final');

  return (
    <div className="space-y-4 max-h-96 overflow-y-auto">
      {/* Live Games */}
      {liveGames.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            <span className="text-red-400 text-sm font-bold uppercase tracking-wider">Live</span>
          </div>
          <div className="space-y-2">
            {liveGames.map((game) => (
              <GameCard 
                key={game.id} 
                game={game} 
                isSelected={currentGame?.id === game.id}
                onSelect={handleSelectGame}
              />
            ))}
          </div>
        </div>
      )}

      {/* Scheduled Games */}
      {scheduledGames.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-blue-400 text-sm font-bold uppercase tracking-wider">Upcoming</span>
          </div>
          <div className="space-y-2">
            {scheduledGames.map((game) => (
              <GameCard 
                key={game.id} 
                game={game} 
                isSelected={currentGame?.id === game.id}
                onSelect={handleSelectGame}
              />
            ))}
          </div>
        </div>
      )}

      {/* Finished Games */}
      {finishedGames.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-gray-400 text-sm font-bold uppercase tracking-wider">Final</span>
          </div>
          <div className="space-y-2">
            {finishedGames.map((game) => (
              <GameCard 
                key={game.id} 
                game={game} 
                isSelected={currentGame?.id === game.id}
                onSelect={handleSelectGame}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface GameCardProps {
  game: Game;
  isSelected: boolean;
  onSelect: (game: Game) => void;
}

function GameCard({ game, isSelected, onSelect }: GameCardProps) {
  const isLive = game.status === 'in_progress';
  const isHalftime = game.status === 'halftime';
  const isFinal = game.status === 'final';
  const isScheduled = game.status === 'scheduled';

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return { date: '', time: 'TBD' };
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = date.toDateString() === tomorrow.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
    
    const time = date.toLocaleTimeString('de-DE', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    if (isToday) {
      return { date: 'HEUTE', time };
    } else if (isYesterday) {
      return { date: 'GESTERN', time };
    } else if (isTomorrow) {
      return { date: 'MORGEN', time };
    } else {
      const dateFormatted = date.toLocaleDateString('de-DE', { 
        weekday: 'short',
        day: 'numeric',
        month: 'numeric',
      }).toUpperCase();
      return { date: dateFormatted, time };
    }
  };

  const dateTime = formatDateTime(game.startTime);

  return (
    <button
      onClick={() => onSelect(game)}
      className={`
        w-full flex flex-col gap-2 p-3 rounded-xl transition-all text-left relative
        ${isSelected 
          ? 'bg-blue-600 ring-2 ring-blue-400' 
          : isLive 
          ? 'bg-slate-700 ring-1 ring-red-500/50 hover:bg-slate-600'
          : 'bg-slate-700 hover:bg-slate-600 hover:scale-[1.01]'
        }
      `}
    >
      {/* Top row: Season info & Status */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-white/40">
          {game.seasonName || 'NFL'}
        </span>
        {isScheduled && (
          <span className="text-blue-400">
            {dateTime.date} {dateTime.time}
          </span>
        )}
        {isLive && (
          <span className="flex items-center gap-1 text-red-400">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
            {game.clock.periodName} {game.clock.displayValue}
          </span>
        )}
        {isHalftime && (
          <span className="text-yellow-400">Halftime</span>
        )}
        {isFinal && (
          <span className="text-gray-400">Final</span>
        )}
      </div>

      {/* Main row: Teams & Score */}
      <div className="flex items-center gap-3">
        {/* Away Team */}
        <div className="flex items-center gap-2 flex-1">
          <img 
            src={game.awayTeam.logo} 
            alt={game.awayTeam.abbreviation}
            className="w-8 h-8 object-contain"
          />
          <span className="font-bold text-white text-sm">
            {game.awayTeam.abbreviation}
          </span>
        </div>

        {/* Score / Time */}
        <div className="flex items-center min-w-[70px] justify-center">
          {isLive || isFinal || isHalftime ? (
            <span className="text-xl font-black text-white">
              {game.awayTeam.score} - {game.homeTeam.score}
            </span>
          ) : (
            <span className="text-sm font-bold text-blue-400">
              {dateTime.time}
            </span>
          )}
        </div>

        {/* Home Team */}
        <div className="flex items-center gap-2 flex-1 justify-end">
          <span className="font-bold text-white text-sm">
            {game.homeTeam.abbreviation}
          </span>
          <img 
            src={game.homeTeam.logo} 
            alt={game.homeTeam.abbreviation}
            className="w-8 h-8 object-contain"
          />
        </div>
      </div>

      {/* Bottom row: Venue / Broadcast */}
      {(game.venue || game.broadcast) && (
        <div className="flex items-center gap-3 text-xs text-white/30">
          {game.broadcast && (
            <span>{game.broadcast}</span>
          )}
          {game.venue && (
            <span className="truncate">{game.venue}</span>
          )}
        </div>
      )}

      {/* Selected checkmark */}
      {isSelected && (
        <div className="absolute right-2 top-2">
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </button>
  );
}
