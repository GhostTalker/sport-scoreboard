import { useSettingsStore } from '../../stores/settingsStore';

export function SportSelector() {
  const currentSport = useSettingsStore((state) => state.currentSport);
  const currentCompetition = useSettingsStore((state) => state.currentCompetition);
  const setSport = useSettingsStore((state) => state.setSport);
  const setCompetition = useSettingsStore((state) => state.setCompetition);

  return (
    <section className="bg-slate-800 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Sport & Liga</h3>

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
