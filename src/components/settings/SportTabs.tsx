import { useSettingsStore } from '../../stores/settingsStore';
import { useAvailablePlugins } from '../../hooks/usePlugin';
import type { SportType } from '../../config/plugins';

export function SportTabs() {
  const currentSport = useSettingsStore((state) => state.currentSport);
  const setSport = useSettingsStore((state) => state.setSport);

  // Only show enabled plugins as tabs
  const enabledPlugins = useAvailablePlugins(true);

  const handleSportChange = (sport: SportType) => {
    setSport(sport);
  };

  if (enabledPlugins.length === 0) {
    return null;
  }

  return (
    <div className="flex gap-2 border-b border-slate-700 justify-center">
      {enabledPlugins.map((plugin) => {
        const isActive = currentSport === plugin.id;

        return (
          <button
            key={plugin.id}
            onClick={() => handleSportChange(plugin.id as SportType)}
            className={`
              flex items-center gap-2 px-6 py-3 font-medium transition-all
              border-b-2 -mb-[2px]
              ${isActive
                ? 'border-blue-500 text-white bg-slate-700/50'
                : 'border-transparent text-white/60 hover:text-white hover:bg-slate-800/30'
              }
            `}
          >
            <img
              src={plugin.icon}
              alt={plugin.displayName}
              className="w-5 h-5 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <span>{plugin.displayName}</span>
          </button>
        );
      })}
    </div>
  );
}
