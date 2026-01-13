import { useUIStore } from '../../stores/uiStore';
import { useGameStore } from '../../stores/gameStore';
import { useSettingsStore } from '../../stores/settingsStore';
import type { CelebrationType } from '../../types/game';

// NFL celebration button configuration
const NFL_CELEBRATION_BUTTONS: Array<{ type: CelebrationType; label: string; color: string }> = [
  { type: 'touchdown', label: 'Touchdown', color: 'bg-green-600 hover:bg-green-700' },
  { type: 'fieldgoal', label: 'Field Goal', color: 'bg-yellow-600 hover:bg-yellow-700' },
  { type: 'interception', label: 'Interception', color: 'bg-blue-600 hover:bg-blue-700' },
  { type: 'sack', label: 'Sack', color: 'bg-red-600 hover:bg-red-700' },
  { type: 'fumble', label: 'Fumble', color: 'bg-orange-600 hover:bg-orange-700' },
  { type: 'safety', label: 'Safety', color: 'bg-purple-600 hover:bg-purple-700' },
];

// Bundesliga celebration button configuration
const BUNDESLIGA_CELEBRATION_BUTTONS: Array<{ type: CelebrationType; label: string; color: string }> = [
  { type: 'goal', label: 'Tor', color: 'bg-green-600 hover:bg-green-700' },
  { type: 'penalty', label: 'Elfmeter', color: 'bg-blue-600 hover:bg-blue-700' },
  { type: 'own_goal', label: 'Eigentor', color: 'bg-orange-600 hover:bg-orange-700' },
  { type: 'red_card', label: 'Rote Karte', color: 'bg-red-600 hover:bg-red-700' },
  { type: 'yellow_red_card', label: 'Gelb-Rot', color: 'bg-yellow-600 hover:bg-yellow-700' },
];

export function DebugControls() {
  const showCelebration = useUIStore((state) => state.showCelebration);
  const currentGame = useGameStore((state) => state.currentGame);
  const currentSport = useSettingsStore((state) => state.currentSport);

  // Get sport-specific celebration buttons
  const celebrationButtons = currentSport === 'nfl'
    ? NFL_CELEBRATION_BUTTONS
    : BUNDESLIGA_CELEBRATION_BUTTONS;

  // Get sport-specific API name
  const apiName = currentSport === 'nfl' ? 'ESPN API' : 'OpenLigaDB API';

  return (
    <div className="border-t border-slate-600 pt-4 mt-4">
      <h4 className="text-sm font-semibold text-orange-400 mb-3">Debug Controls</h4>

      <div className="space-y-4">
        {/* Trigger Celebrations */}
        <div>
          <p className="text-white/50 text-sm mb-2">Trigger Celebration Videos</p>
          <div className="grid grid-cols-2 gap-2">
            {celebrationButtons.map(({ type, label, color }) => (
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
              <p>Sport: {currentGame.sport}</p>
              <p>Status: {currentGame.status}</p>
              <p>Home: {currentGame.homeTeam.abbreviation} ({currentGame.homeTeam.score})</p>
              <p>Away: {currentGame.awayTeam.abbreviation} ({currentGame.awayTeam.score})</p>
              <p>Period: {currentGame.clock?.periodName || currentGame.clock?.period || 'N/A'}</p>
              <p>Time: {currentGame.clock.displayValue}</p>
            </div>
          </div>
        )}

        {/* API Status */}
        <div>
          <p className="text-white/50 text-sm mb-2">API Status</p>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-green-500 rounded-full"></span>
            <span className="text-white text-sm">Connected to {apiName}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
