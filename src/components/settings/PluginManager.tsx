import { useSettingsStore } from '../../stores/settingsStore';
import { useAvailablePlugins } from '../../hooks/usePlugin';

// Plugin logos for Settings display (different from sport selection logos)
const PLUGIN_LOGOS: Record<string, string> = {
  'nfl': '/logos/Logo_NFL.png',
  'bundesliga': '/logos/Logo_Bundesliga.png',
};

export function PluginManager() {
  const enabledPlugins = useSettingsStore((state) => state.enabledPlugins);
  const togglePlugin = useSettingsStore((state) => state.togglePlugin);
  const currentSport = useSettingsStore((state) => state.currentSport);

  // Get all available plugins
  const plugins = useAvailablePlugins();

  if (plugins.length === 0) {
    return (
      <section className="space-y-3">
        <h3 className="text-xl font-bold text-white">Plugins</h3>
        <p className="text-sm text-white/50">Lade verfügbare Plugins...</p>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-xl font-bold text-white">Plugins</h3>
        <p className="text-sm text-white/50 mt-1">
          Aktiviere oder deaktiviere Sportarten. Deaktivierte Plugins werden nicht in der Sportauswahl angezeigt.
        </p>
      </div>

      <div className="space-y-2">
        {plugins.map((plugin) => {
          const isEnabled = enabledPlugins.includes(plugin.id);
          const isCurrent = currentSport === plugin.id;
          const canDisable = !isCurrent; // Can't disable currently active plugin

          return (
            <div
              key={plugin.id}
              className={`
                flex items-center justify-between p-4 rounded-lg
                ${isEnabled ? 'bg-slate-700' : 'bg-slate-800/50'}
                ${isCurrent ? 'ring-2 ring-blue-500' : ''}
                transition-all
              `}
            >
              <div className="flex items-center gap-3">
                {/* Plugin Icon - Use specific settings logos */}
                <img
                  src={PLUGIN_LOGOS[plugin.id] || plugin.icon}
                  alt={plugin.displayName}
                  className="w-10 h-10 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />

                {/* Plugin Info */}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">
                      {plugin.displayName}
                    </span>
                    {isCurrent && (
                      <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full">
                        Aktiv
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-white/60">{plugin.description}</p>
                  <p className="text-xs text-white/40 mt-1">Version {plugin.version}</p>
                </div>
              </div>

              {/* Toggle Switch */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isEnabled}
                  onChange={() => togglePlugin(plugin.id)}
                  disabled={!canDisable}
                  className="sr-only peer"
                />
                <div
                  className={`
                    w-11 h-6 bg-gray-600 rounded-full peer
                    peer-checked:bg-blue-600
                    peer-focus:ring-2 peer-focus:ring-blue-300
                    after:content-[''] after:absolute after:top-[2px] after:left-[2px]
                    after:bg-white after:rounded-full after:h-5 after:w-5
                    after:transition-all
                    peer-checked:after:translate-x-5
                    ${!canDisable ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                ></div>
              </label>
            </div>
          );
        })}
      </div>

      {/* Info Box */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <svg
            className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div className="text-sm text-blue-200">
            <p className="font-semibold">Hinweis:</p>
            <ul className="mt-1 space-y-1 text-blue-300">
              <li>• Das aktive Plugin kann nicht deaktiviert werden</li>
              <li>• Wechsle zu einem anderen Sport, um dieses Plugin zu deaktivieren</li>
              <li>• Neue Plugins werden automatisch erkannt beim App-Start</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
