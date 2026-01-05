import { useGameStore } from '../../stores/gameStore';
import { useUIStore } from '../../stores/uiStore';

export function GameSelector() {
  const availableGames = useGameStore((state) => state.availableGames);
  const currentGame = useGameStore((state) => state.currentGame);
  const setCurrentGame = useGameStore((state) => state.setCurrentGame);
  const setView = useUIStore((state) => state.setView);

  const selectGame = (game: typeof availableGames[0]) => {
    setCurrentGame(game);
    setView('scoreboard');
  };

  if (availableGames.length === 0) {
    return (
      <div className="text-center py-4 text-white/50">
        No games available
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-64 overflow-y-auto">
      {availableGames.map((game) => {
        const isSelected = currentGame?.id === game.id;
        const isLive = game.status === 'in_progress';
        const isHalftime = game.status === 'halftime';
        const isFinal = game.status === 'final';

        return (
          <button
            key={game.id}
            onClick={() => selectGame(game)}
            className={`
              w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left
              ${isSelected ? 'bg-blue-600' : 'bg-slate-700 hover:bg-slate-600'}
            `}
          >
            {/* Away Team */}
            <div className="flex items-center gap-2 flex-1">
              <img 
                src={game.awayTeam.logo} 
                alt={game.awayTeam.abbreviation}
                className="w-8 h-8 object-contain"
              />
              <span className="font-medium text-white">
                {game.awayTeam.abbreviation}
              </span>
            </div>

            {/* Score / Status */}
            <div className="flex flex-col items-center min-w-[60px]">
              {isLive || isFinal || isHalftime ? (
                <>
                  <span className="text-lg font-bold text-white">
                    {game.awayTeam.score} - {game.homeTeam.score}
                  </span>
                  <span className={`text-xs ${isLive ? 'text-red-400' : 'text-white/50'}`}>
                    {isLive && (
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                        {game.clock.periodName} {game.clock.displayValue}
                      </span>
                    )}
                    {isHalftime && 'Halftime'}
                    {isFinal && 'Final'}
                  </span>
                </>
              ) : (
                <span className="text-sm text-white/50">
                  {game.startTime 
                    ? new Date(game.startTime).toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit' 
                      })
                    : 'TBD'
                  }
                </span>
              )}
            </div>

            {/* Home Team */}
            <div className="flex items-center gap-2 flex-1 justify-end">
              <span className="font-medium text-white">
                {game.homeTeam.abbreviation}
              </span>
              <img 
                src={game.homeTeam.logo} 
                alt={game.homeTeam.abbreviation}
                className="w-8 h-8 object-contain"
              />
            </div>

            {/* Selected indicator */}
            {isSelected && (
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        );
      })}
    </div>
  );
}
