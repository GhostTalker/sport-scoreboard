import { useUIStore } from '../../stores/uiStore';
import { useGameStore } from '../../stores/gameStore';

export function DebugControls() {
  const showCelebration = useUIStore((state) => state.showCelebration);
  const currentGame = useGameStore((state) => state.currentGame);

  return (
    <div className="border-t border-slate-600 pt-4 mt-4">
      <h4 className="text-sm font-semibold text-orange-400 mb-3">Debug Controls</h4>
      
      <div className="space-y-4">
        {/* Trigger Celebrations */}
        <div>
          <p className="text-white/50 text-sm mb-2">Trigger Celebration Videos</p>
          <div className="flex gap-3">
            <button
              onClick={() => showCelebration('touchdown')}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Touchdown
            </button>
            <button
              onClick={() => showCelebration('fieldgoal')}
              className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Field Goal
            </button>
          </div>
        </div>

        {/* Current Game Info */}
        {currentGame && (
          <div>
            <p className="text-white/50 text-sm mb-2">Current Game Data</p>
            <div className="bg-slate-900 rounded-lg p-3 text-xs font-mono text-white/70 overflow-x-auto">
              <p>Game ID: {currentGame.id}</p>
              <p>Status: {currentGame.status}</p>
              <p>Home: {currentGame.homeTeam.abbreviation} ({currentGame.homeTeam.score})</p>
              <p>Away: {currentGame.awayTeam.abbreviation} ({currentGame.awayTeam.score})</p>
              <p>Period: {currentGame.clock.periodName}</p>
              <p>Time: {currentGame.clock.displayValue}</p>
            </div>
          </div>
        )}

        {/* API Status */}
        <div>
          <p className="text-white/50 text-sm mb-2">API Status</p>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-green-500 rounded-full"></span>
            <span className="text-white text-sm">Connected to ESPN API</span>
          </div>
        </div>
      </div>
    </div>
  );
}
