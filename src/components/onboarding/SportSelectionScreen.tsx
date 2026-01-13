import { useSettingsStore } from '../../stores/settingsStore';
import { useUIStore } from '../../stores/uiStore';
import { useAvailablePlugins } from '../../hooks/usePlugin';
import type { SportType } from '../../config/plugins';

export function SportSelectionScreen() {
  const plugins = useAvailablePlugins();
  const setInitialSportSelection = useSettingsStore((state) => state.setInitialSportSelection);
  const setView = useUIStore((state) => state.setView);

  console.log('[SportSelectionScreen] Plugins loaded:', plugins.length, plugins);

  const handleSportSelection = (pluginId: string) => {
    // Set the sport and mark initial selection as complete
    // pluginId is from plugin.manifest.id which is type-safe from PLUGIN_DEFINITIONS
    setInitialSportSelection(pluginId as SportType);
    // Small delay to allow useGameData subscriber to trigger and start fetching
    // This prevents showing empty state before games are loaded
    setTimeout(() => {
      setView('scoreboard');
    }, 100);
  };

  // Color mapping for hover effects (can be moved to plugin manifest later)
  const getPluginColor = (id: string) => {
    if (id === 'nfl') return { border: 'blue-500', shadow: 'blue-500/20', gradient: 'blue' };
    if (id === 'bundesliga') return { border: 'green-500', shadow: 'green-500/20', gradient: 'green' };
    return { border: 'purple-500', shadow: 'purple-500/20', gradient: 'purple' }; // default
  };

  return (
    <div className="h-full w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-8">
      <div className="max-w-4xl w-full">
        {/* Header with Scoreboard Logo */}
        <div className="text-center mb-4">
          <div className="-mb-20 flex justify-center">
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

        {/* Sport Selection Cards - Dynamic from Plugins */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {plugins.map(plugin => {
            const colors = getPluginColor(plugin.id);
            return (
              <button
                key={plugin.id}
                onClick={() => handleSportSelection(plugin.id)}
                className={`group relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-12 border-4 border-slate-700 hover:border-${colors.border} transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-${colors.shadow}`}
              >
                {/* Plugin Icon/Logo */}
                <div className="text-center">
                  <div className="mb-6 flex justify-center transform group-hover:scale-110 transition-transform duration-300">
                    <img
                      src={plugin.icon}
                      alt={plugin.displayName}
                      className="h-32 w-auto object-contain"
                    />
                  </div>
                  <h2 className="text-4xl font-bold text-white mb-3">
                    {plugin.displayName}
                  </h2>
                  <p className="text-xl text-white/60 mb-4">
                    {plugin.description}
                  </p>
                  <div className="text-sm text-white/40">
                    {plugin.celebrationTypes.length} Celebration Types
                  </div>
                </div>

                {/* Glow effect on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br from-${colors.gradient}-500/0 to-${colors.gradient}-500/0 group-hover:from-${colors.gradient}-500/10 group-hover:to-${colors.gradient}-600/10 rounded-3xl transition-all duration-300`} />
              </button>
            );
          })}
        </div>

        {/* Footer note */}
        <div className="text-center mt-12 text-white/40 text-sm">
          Du kannst die Sportart jederzeit in den Einstellungen ändern
        </div>
      </div>
    </div>
  );
}
