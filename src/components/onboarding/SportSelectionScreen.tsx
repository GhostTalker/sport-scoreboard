import { useSettingsStore } from '../../stores/settingsStore';
import { useUIStore } from '../../stores/uiStore';
import type { SportType } from '../../types/base';

export function SportSelectionScreen() {
  const setInitialSportSelection = useSettingsStore((state) => state.setInitialSportSelection);
  const setView = useUIStore((state) => state.setView);

  const handleSportSelection = (sport: SportType) => {
    // Set the sport and mark initial selection as complete
    setInitialSportSelection(sport);
    // Small delay to allow useGameData subscriber to trigger and start fetching
    // This prevents showing empty state before games are loaded
    setTimeout(() => {
      setView('scoreboard');
    }, 100);
  };

  return (
    <div className="h-full w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-8">
      <div className="max-w-4xl w-full">
        {/* Header with Scoreboard Logo */}
        <div className="text-center mb-8">
          <div className="mb-4 flex justify-center">
            <img
              src="/title/scoreboard-logo.png"
              alt="Sport-Scoreboard"
              className="h-96 w-auto object-contain"
              style={{
                filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.8))',
              }}
            />
          </div>
          <p className="text-2xl text-white/70">
            Wähle deine Sportart
          </p>
        </div>

        {/* Sport Selection Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* NFL Card */}
          <button
            onClick={() => handleSportSelection('nfl')}
            className="group relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-12 border-4 border-slate-700 hover:border-blue-500 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20"
          >
            {/* NFL Icon/Logo */}
            <div className="text-center">
              <div className="mb-6 flex justify-center transform group-hover:scale-110 transition-transform duration-300">
                <img src="/title/nfl-logo.png" alt="NFL" className="h-32 w-auto object-contain" />
              </div>
              <h2 className="text-4xl font-bold text-white mb-3">
                NFL
              </h2>
              <p className="text-xl text-white/60 mb-4">
                American Football
              </p>
              <div className="text-sm text-white/40">
                Live-Spiele, Statistiken & Celebrations
              </div>
            </div>

            {/* Glow effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 to-blue-500/0 group-hover:from-blue-500/10 group-hover:to-blue-600/10 rounded-3xl transition-all duration-300" />
          </button>

          {/* Bundesliga Card */}
          <button
            onClick={() => handleSportSelection('bundesliga')}
            className="group relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-12 border-4 border-slate-700 hover:border-green-500 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/20"
          >
            {/* Bundesliga Icon/Logo */}
            <div className="text-center">
              <div className="mb-6 flex justify-center transform group-hover:scale-110 transition-transform duration-300">
                <img src="/title/bundesliga-logo.png" alt="Bundesliga" className="h-32 w-auto object-contain" />
              </div>
              <h2 className="text-4xl font-bold text-white mb-3">
                Bundesliga
              </h2>
              <p className="text-xl text-white/60 mb-4">
                Deutscher Fußball
              </p>
              <div className="text-sm text-white/40">
                Live-Spiele, Tore & Karten
              </div>
            </div>

            {/* Glow effect on hover */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/0 to-green-500/0 group-hover:from-green-500/10 group-hover:to-green-600/10 rounded-3xl transition-all duration-300" />
          </button>
        </div>

        {/* Footer note */}
        <div className="text-center mt-12 text-white/40 text-sm">
          Du kannst die Sportart jederzeit in den Einstellungen ändern
        </div>
      </div>
    </div>
  );
}
