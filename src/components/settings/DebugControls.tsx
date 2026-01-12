import { useUIStore } from '../../stores/uiStore';
import { useGameStore } from '../../stores/gameStore';
import type { CelebrationType } from '../../types/game';
import { isNFLGame } from '../../types/game';

const CELEBRATION_BUTTONS: Array<{ type: CelebrationType; label: string; color: string }> = [
  { type: 'touchdown', label: 'Touchdown', color: 'bg-green-600 hover:bg-green-700' },
  { type: 'fieldgoal', label: 'Field Goal', color: 'bg-yellow-600 hover:bg-yellow-700' },
  { type: 'interception', label: 'Interception', color: 'bg-blue-600 hover:bg-blue-700' },
  { type: 'sack', label: 'Sack', color: 'bg-red-600 hover:bg-red-700' },
  { type: 'fumble', label: 'Fumble', color: 'bg-orange-600 hover:bg-orange-700' },
  { type: 'safety', label: 'Safety', color: 'bg-purple-600 hover:bg-purple-700' },
];

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
          <div className="grid grid-cols-2 gap-2">
            {CELEBRATION_BUTTONS.map(({ type, label, color }) => (
              <button
                key={type}
                onClick={() => showCelebration(type)}
                className={`${color} text-white font-semibold py-2 px-3 rounded-lg transition-colors text-sm`}
              >
                {label}
              </button>
            ))}
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
              <p>Period: {isNFLGame(currentGame) && currentGame.clock.periodName}</p>
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
