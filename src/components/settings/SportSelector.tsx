import { useSettingsStore } from '../../stores/settingsStore';
import { useGameStore } from '../../stores/gameStore';

export function SportSelector() {
  const currentSport = useSettingsStore((state) => state.currentSport);
  const currentCompetition = useSettingsStore((state) => state.currentCompetition);
  const setSport = useSettingsStore((state) => state.setSport);
  const setCompetition = useSettingsStore((state) => state.setCompetition);
  const isLoading = useGameStore((state) => state.isLoading);

  return (
    <section className="bg-slate-800 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Sport & Liga</h3>
        {isLoading && (
          <div className="flex items-center gap-2 text-blue-400">
            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-xs">Laden...</span>
          </div>
        )}
      </div>

      {/* Sport Selection */}
      <div className="mb-4">
        <label className="text-sm text-white/60 mb-2 block">Sportart</label>
        <div className="flex gap-3">
          <button
            onClick={() => setSport('nfl')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
              currentSport === 'nfl'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-white/70 hover:bg-slate-600'
            }`}
          >
            <div className="text-lg">NFL</div>
            <div className="text-xs opacity-70 mt-1">American Football</div>
          </button>

          <button
            onClick={() => setSport('bundesliga')}
            className={`flex-1 py-3 px-4 rounded-lg font-medium transition-all ${
              currentSport === 'bundesliga'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-white/70 hover:bg-slate-600'
            }`}
          >
            <div className="text-lg">Bundesliga</div>
            <div className="text-xs opacity-70 mt-1">Deutscher Fußball</div>
          </button>
        </div>
      </div>

      {/* Competition Selection (only for Bundesliga) */}
      {currentSport === 'bundesliga' && (
        <div>
          <label className="text-sm text-white/60 mb-2 block">Wettbewerb</label>
          <div className="flex gap-3">
            <button
              onClick={() => setCompetition('bundesliga')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                currentCompetition === 'bundesliga'
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-700 text-white/70 hover:bg-slate-600'
              }`}
            >
              Bundesliga
            </button>

            <button
              onClick={() => setCompetition('dfb-pokal')}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                currentCompetition === 'dfb-pokal'
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-700 text-white/70 hover:bg-slate-600'
              }`}
            >
              DFB-Pokal
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
