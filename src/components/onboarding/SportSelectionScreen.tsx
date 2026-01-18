import { useSettingsStore } from '../../stores/settingsStore';
import { useUIStore } from '../../stores/uiStore';
import { useAvailablePlugins } from '../../hooks/usePlugin';
import type { SportType } from '../../config/plugins';

export function SportSelectionScreen() {
  // Only show enabled plugins in sport selection
  const plugins = useAvailablePlugins(true);
  const setInitialSportSelection = useSettingsStore((state) => state.setInitialSportSelection);
  const setView = useUIStore((state) => state.setView);

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

  // Color mapping for hover effects - using full class names for Tailwind
  const getPluginClasses = (id: string) => {
    if (id === 'nfl') {
      return {
        border: 'hover:border-blue-500',
        shadow: 'hover:shadow-blue-500/20',
        gradientFrom: 'group-hover:from-blue-500/10',
        gradientTo: 'group-hover:to-blue-600/10',
      };
    }
    if (id === 'bundesliga') {
      return {
        border: 'hover:border-green-500',
        shadow: 'hover:shadow-green-500/20',
        gradientFrom: 'group-hover:from-green-500/10',
        gradientTo: 'group-hover:to-green-600/10',
      };
    }
    return {
      border: 'hover:border-purple-500',
      shadow: 'hover:shadow-purple-500/20',
      gradientFrom: 'group-hover:from-purple-500/10',
      gradientTo: 'group-hover:to-purple-600/10',
    };
  };

  return (
    <div className="h-full w-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 overflow-y-auto">
      <div className="max-w-5xl mx-auto pt-8 px-4 pb-4">
        {/* Header with Scoreboard Logo */}
        <div className="text-center mb-4">
          <div className="-mb-16 flex justify-center">
            <img
              src="/title/scoreboard-logo.png"
              alt="Sport-Scoreboard"
              className="h-96 w-auto object-contain"
              style={{
                filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.8))',
              }}
            />
          </div>
          <p className="text-xl text-white/70">
            Wähle deine Sportart
          </p>
        </div>

        {/* Sport Selection Cards - Dynamic from Plugins */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {plugins.map(plugin => {
            const classes = getPluginClasses(plugin.id);
            return (
              <button
                key={plugin.id}
                onClick={() => handleSportSelection(plugin.id)}
                className={`group relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border-2 border-slate-700 ${classes.border} transition-all duration-300 hover:scale-105 hover:shadow-2xl ${classes.shadow}`}
              >
                {/* Plugin Icon/Logo */}
                <div className="text-center">
                  <div className="mb-3 flex justify-center transform group-hover:scale-110 transition-transform duration-300">
                    <img
                      src={plugin.sportSelectionIcon || plugin.icon}
                      alt={plugin.displayName}
                      className="h-20 w-auto object-contain"
                    />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {plugin.displayName}
                  </h2>
                  <p className="text-base text-white/60 mb-2">
                    {plugin.description}
                  </p>
                  <div className="text-xs text-white/40">
                    {plugin.celebrationTypes.length} Celebration Types
                  </div>
                </div>

                {/* Glow effect on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br from-transparent to-transparent ${classes.gradientFrom} ${classes.gradientTo} rounded-2xl transition-all duration-300`} />
              </button>
            );
          })}
        </div>

        {/* Footer note */}
        <div className="text-center mt-4 text-white/40 text-xs">
          Du kannst die Sportart jederzeit in den Einstellungen ändern
        </div>
      </div>
    </div>
  );
}
