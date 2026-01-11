import { useGameStore } from '../../stores/gameStore';
import type { Game } from '../../types/game';

export function MultiGameView() {
  const availableGames = useGameStore((state) => state.availableGames);
  const confirmGameSelection = useGameStore((state) => state.confirmGameSelection);

  // Group games by status
  const liveGames = availableGames.filter(g => g.status === 'in_progress' || g.status === 'halftime');
  const scheduledGames = availableGames.filter(g => g.status === 'scheduled');
  const finishedGames = availableGames.filter(g => g.status === 'final');

  // Combine all games with live first, then scheduled, then finished
  const allGames = [...liveGames, ...scheduledGames, ...finishedGames];

  // Calculate grid columns based on number of games
  const getGridCols = () => {
    const count = allGames.length;
    if (count <= 2) return 'grid-cols-2';
    if (count <= 4) return 'grid-cols-2';
    if (count <= 6) return 'grid-cols-3';
    if (count <= 9) return 'grid-cols-3';
    return 'grid-cols-4';
  };

  const handleSelectGame = (game: Game) => {
    confirmGameSelection(game);
  };

  if (allGames.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-slate-900">
        <p className="text-white/50 text-xl">Keine Spiele verfügbar</p>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-slate-900 p-4 overflow-hidden">
      <div className={`grid ${getGridCols()} gap-3 h-full`}>
        {allGames.map((game) => (
          <GameCard key={game.id} game={game} onSelect={handleSelectGame} />
        ))}
      </div>
    </div>
  );
}

interface GameCardProps {
  game: Game;
  onSelect: (game: Game) => void;
}

function GameCard({ game, onSelect }: GameCardProps) {
  const isLive = game.status === 'in_progress' || game.status === 'halftime';
  const isFinal = game.status === 'final';
  const isScheduled = game.status === 'scheduled';
  const isHalftime = game.status === 'halftime';

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return 'TBD';
    return new Date(dateStr).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <button
      onClick={() => onSelect(game)}
      className={`
        relative rounded-xl p-3 flex flex-col justify-between
        transition-all duration-200 hover:scale-[1.02]
        ${isLive ? 'bg-gradient-to-br from-red-900/60 to-red-800/40 border-2 border-red-500/50' : ''}
        ${isFinal ? 'bg-slate-800/40 border border-slate-700/50' : ''}
        ${isScheduled ? 'bg-slate-800/60 border border-slate-600/50' : ''}
      `}
    >
      {/* Status Badge */}
      <div className="flex justify-between items-center mb-2">
        {isLive && !isHalftime && (
          <span className="flex items-center gap-1.5 text-xs font-bold text-red-400">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            {game.clock.periodName} {game.clock.displayValue}
          </span>
        )}
        {isHalftime && (
          <span className="text-xs font-bold text-yellow-400">Halftime</span>
        )}
        {isFinal && (
          <span className="text-xs font-bold text-gray-400">FINAL</span>
        )}
        {isScheduled && (
          <span className="text-xs font-bold text-blue-400">{formatTime(game.startTime)}</span>
        )}
        <span className="text-xs text-white/40">{game.seasonName}</span>
      </div>

      {/* Teams and Score */}
      <div className="flex-1 flex flex-col justify-center gap-2">
        {/* Away Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={game.awayTeam.logo}
              alt={game.awayTeam.abbreviation}
              className="w-8 h-8 object-contain"
            />
            <span className="text-white font-bold text-sm">
              {game.awayTeam.abbreviation}
            </span>
          </div>
          <span className={`text-2xl font-black ${
            isFinal && game.awayTeam.score > game.homeTeam.score ? 'text-white' : 'text-white/70'
          }`}>
            {isScheduled ? '-' : game.awayTeam.score}
          </span>
        </div>

        {/* Home Team */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={game.homeTeam.logo}
              alt={game.homeTeam.abbreviation}
              className="w-8 h-8 object-contain"
            />
            <span className="text-white font-bold text-sm">
              {game.homeTeam.abbreviation}
            </span>
          </div>
          <span className={`text-2xl font-black ${
            isFinal && game.homeTeam.score > game.awayTeam.score ? 'text-white' : 'text-white/70'
          }`}>
            {isScheduled ? '-' : game.homeTeam.score}
          </span>
        </div>
      </div>

      {/* Live indicator glow */}
      {isLive && (
        <div
          className="absolute inset-0 rounded-xl pointer-events-none"
          style={{
            boxShadow: 'inset 0 0 30px rgba(220,38,38,0.2)',
          }}
        />
      )}
    </button>
  );
}
