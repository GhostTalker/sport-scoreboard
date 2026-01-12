import { useGameStore } from '../../stores/gameStore';
import { useUIStore } from '../../stores/uiStore';
import { useSettingsStore } from '../../stores/settingsStore';
import type { Game } from '../../types/game';

export function GameSelector() {
  const availableGames = useGameStore((state) => state.availableGames);
  const currentGame = useGameStore((state) => state.currentGame);
  const confirmGameSelection = useGameStore((state) => state.confirmGameSelection);
  const setView = useUIStore((state) => state.setView);
  const multiViewFilters = useSettingsStore((state) => state.multiViewFilters);

  const handleSelectGame = (game: Game) => {
    confirmGameSelection(game);
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

  // Apply filters from settings
  const filteredLiveGames = multiViewFilters.showLive ? liveGames : [];
  const filteredScheduledGames = multiViewFilters.showUpcoming ? scheduledGames : [];
  const filteredFinishedGames = multiViewFilters.showFinal ? finishedGames : [];

  return (
    <div className="space-y-4 max-h-96 overflow-y-auto overflow-x-hidden">
      {/* Live Games */}
      {filteredLiveGames.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            <span className="text-red-400 text-sm font-bold uppercase tracking-wider">Live</span>
          </div>
          <div className={`grid gap-2 ${filteredLiveGames.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {filteredLiveGames.map((game) => (
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
      {filteredScheduledGames.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-blue-400 text-sm font-bold uppercase tracking-wider">Upcoming</span>
          </div>
          <div className={`grid gap-2 ${filteredScheduledGames.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {filteredScheduledGames.map((game) => (
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
      {filteredFinishedGames.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="text-gray-400 text-sm font-bold uppercase tracking-wider">Final</span>
          </div>
          <div className={`grid gap-2 ${filteredFinishedGames.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {filteredFinishedGames.map((game) => (
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
        w-full flex flex-col gap-2 p-3 rounded-lg transition-all text-left relative
        ${isSelected
          ? 'bg-blue-600 ring-2 ring-blue-400'
          : isLive
          ? 'bg-slate-700 ring-1 ring-red-500/50 hover:bg-slate-600'
          : 'bg-slate-700 hover:bg-slate-600 hover:scale-[1.01]'
        }
      `}
    >
      {/* Status badge - compact */}
      <div className="flex items-center justify-between">
        {isScheduled && (
          <span className="text-[10px] text-blue-400 font-bold">
            {dateTime.date} {dateTime.time}
          </span>
        )}
        {isLive && (
          <span className="flex items-center gap-1 text-[10px] text-red-400 font-bold">
            <span className="w-1 h-1 bg-red-500 rounded-full animate-pulse"></span>
            {game.clock.periodName} {game.clock.displayValue}
          </span>
        )}
        {isHalftime && (
          <span className="text-[10px] text-yellow-400 font-bold">Halftime</span>
        )}
        {isFinal && (
          <span className="text-[10px] text-gray-400 font-bold">Final</span>
        )}
      </div>

      {/* Main row: Teams & Score */}
      <div className="flex items-center gap-2">
        {/* Away Team */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <img
            src={game.awayTeam.logo}
            alt={game.awayTeam.abbreviation}
            className="w-10 h-10 flex-shrink-0 object-contain"
          />
          <span className="font-bold text-white text-sm truncate">
            {game.awayTeam.shortDisplayName}
          </span>
        </div>

        {/* Score / Time */}
        <div className="flex items-center justify-center flex-shrink-0">
          {isLive || isFinal || isHalftime ? (
            <span className="text-lg font-black text-white">
              {game.awayTeam.score} - {game.homeTeam.score}
            </span>
          ) : (
            <span className="text-sm font-bold text-blue-400">
              vs
            </span>
          )}
        </div>

        {/* Home Team */}
        <div className="flex items-center gap-2 flex-1 justify-end min-w-0">
          <span className="font-bold text-white text-sm truncate">
            {game.homeTeam.shortDisplayName}
          </span>
          <img
            src={game.homeTeam.logo}
            alt={game.homeTeam.abbreviation}
            className="w-10 h-10 flex-shrink-0 object-contain"
          />
        </div>
      </div>

      {/* Selected checkmark */}
      {isSelected && (
        <div className="absolute right-1 top-1">
          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}
    </button>
  );
}
