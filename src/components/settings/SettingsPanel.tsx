import { useSettingsStore } from '../../stores/settingsStore';
import { useUIStore } from '../../stores/uiStore';
import { GameSelector } from './GameSelector';
import { DebugControls } from './DebugControls';
import { CelebrationSettings } from './CelebrationSettings';
import type { ViewMode } from '../../types/settings';

function MultiViewFilters() {
  const multiViewFilters = useSettingsStore((state) => state.multiViewFilters);
  const setMultiViewFilter = useSettingsStore((state) => state.setMultiViewFilter);

  return (
    <div className="flex justify-center gap-6 mt-4">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={multiViewFilters.showLive}
          onChange={(e) => setMultiViewFilter('showLive', e.target.checked)}
          className="w-4 h-4 rounded border-2 border-red-500 bg-slate-700 checked:bg-red-600 focus:ring-2 focus:ring-red-500 cursor-pointer"
        />
        <span className="text-sm font-bold text-white flex items-center gap-1.5">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          Live
        </span>
      </label>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={multiViewFilters.showUpcoming}
          onChange={(e) => setMultiViewFilter('showUpcoming', e.target.checked)}
          className="w-4 h-4 rounded border-2 border-blue-500 bg-slate-700 checked:bg-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
        />
        <span className="text-sm font-bold text-blue-400">
          Upcoming
        </span>
      </label>

      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={multiViewFilters.showFinal}
          onChange={(e) => setMultiViewFilter('showFinal', e.target.checked)}
          className="w-4 h-4 rounded border-2 border-gray-500 bg-slate-700 checked:bg-gray-600 focus:ring-2 focus:ring-gray-500 cursor-pointer"
        />
        <span className="text-sm font-bold text-gray-400">
          Final
        </span>
      </label>
    </div>
  );
}

export function SettingsPanel() {
  const soundEffectsEnabled = useSettingsStore((state) => state.soundEffectsEnabled);
  const toggleSoundEffects = useSettingsStore((state) => state.toggleSoundEffects);
  const viewMode = useSettingsStore((state) => state.viewMode);
  const setViewMode = useSettingsStore((state) => state.setViewMode);
  const debugMode = useUIStore((state) => state.debugMode);
  const toggleDebugMode = useUIStore((state) => state.toggleDebugMode);
  const setView = useUIStore((state) => state.setView);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    // Auto-close settings and show scoreboard when changing view mode
    setView('scoreboard');
  };

  return (
    <div className="h-full w-full bg-slate-900 p-6 overflow-y-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white">Settings</h2>
        <p className="text-white/50">Configure your scoreboard</p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {/* View Mode Toggle */}
        <section className="bg-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">View Mode</h3>
          <div className="flex gap-3">
            <button
              onClick={() => handleViewModeChange('single')}
              className={`
                flex-1 py-3 px-4 rounded-lg font-medium transition-all
                ${viewMode === 'single'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-white/70 hover:bg-slate-600'}
              `}
            >
              <div className="text-lg">SingleView</div>
              <div className="text-xs opacity-70 mt-1">Show one game detailed</div>
            </button>
            <button
              onClick={() => handleViewModeChange('multi')}
              className={`
                flex-1 py-3 px-4 rounded-lg font-medium transition-all
                ${viewMode === 'multi'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-white/70 hover:bg-slate-600'}
              `}
            >
              <div className="text-lg">MultiView</div>
              <div className="text-xs opacity-70 mt-1">Overview of all games</div>
            </button>
          </div>

          {/* Multi-View Filters - always visible */}
          <MultiViewFilters />
        </section>

        {/* Game Selection - Now the primary control */}
        <section className="bg-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Select Game</h3>
          <p className="text-white/50 text-sm mb-4">
            Choose which game to display on the scoreboard
          </p>
          <GameSelector />
        </section>

        {/* Sound Settings */}
        <section className="bg-slate-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Sound</h3>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white">Sound Effects</p>
              <p className="text-white/50 text-sm">Play sounds on touchdowns and field goals</p>
            </div>
            <button
              onClick={toggleSoundEffects}
              className={`
                relative inline-flex h-8 w-14 items-center rounded-full transition-colors
                ${soundEffectsEnabled ? 'bg-green-600' : 'bg-slate-600'}
              `}
            >
              <span
                className={`
                  inline-block h-6 w-6 transform rounded-full bg-white transition-transform
                  ${soundEffectsEnabled ? 'translate-x-7' : 'translate-x-1'}
                `}
              />
            </button>
          </div>
        </section>

        {/* Celebration Videos */}
        <CelebrationSettings />

        {/* Debug Mode */}
        <section className="bg-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Debug Mode</h3>
              <p className="text-white/50 text-sm">Show debug controls for testing</p>
            </div>
            <button
              onClick={toggleDebugMode}
              className={`
                relative inline-flex h-8 w-14 items-center rounded-full transition-colors
                ${debugMode ? 'bg-orange-600' : 'bg-slate-600'}
              `}
            >
              <span
                className={`
                  inline-block h-6 w-6 transform rounded-full bg-white transition-transform
                  ${debugMode ? 'translate-x-7' : 'translate-x-1'}
                `}
              />
            </button>
          </div>
          
          {debugMode && <DebugControls />}
        </section>
      </div>

      {/* Navigation hint */}
      <div className="text-center mt-8 text-white/30 text-sm">
        Press Arrow Right or Escape to return
      </div>
    </div>
  );
}
