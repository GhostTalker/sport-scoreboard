import { useSettingsStore } from '../../stores/settingsStore';
import { useUIStore } from '../../stores/uiStore';
import { GameSelector } from './GameSelector';
import { DebugControls } from './DebugControls';
import { CompetitionSelector } from './CompetitionSelector';
import { SportTabs } from './SportTabs';
import { SettingsSidebar } from './SettingsSidebar';
import { LanguageSelector } from './LanguageSelector';
import { useTranslation } from '../../i18n/useTranslation';
import type { ViewMode } from '../../types/settings';

function MultiViewFilters() {
  const multiViewFilters = useSettingsStore((state) => state.multiViewFilters);
  const setMultiViewFilter = useSettingsStore((state) => state.setMultiViewFilter);
  const { t } = useTranslation();

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
          {t.settings.multiViewFilters.live}
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
          {t.settings.multiViewFilters.upcoming}
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
          {t.settings.multiViewFilters.final}
        </span>
      </label>
    </div>
  );
}

export function SettingsPanel() {
  const viewMode = useSettingsStore((state) => state.viewMode);
  const setViewMode = useSettingsStore((state) => state.setViewMode);
  const debugMode = useUIStore((state) => state.debugMode);
  const setView = useUIStore((state) => state.setView);
  const { t } = useTranslation();

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    // Auto-close settings and show scoreboard when changing view mode
    setView('scoreboard');
  };

  return (
    <div className="h-full w-full bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="text-center py-6 border-b border-slate-700">
        <h2 className="text-2xl font-bold text-white">{t.settings.title}</h2>
        <p className="text-white/50">{t.settings.subtitle}</p>
      </div>

      {/* Sport Tabs */}
      <div className="px-6">
        <SportTabs />
      </div>

      {/* Main Content with Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Competition Selector */}
            <CompetitionSelector />

            {/* View Mode Toggle */}
            <section className="bg-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">{t.settings.viewMode.title}</h3>
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
                  <div className="text-lg">{t.settings.viewMode.singleView}</div>
                  <div className="text-xs opacity-70 mt-1">{t.settings.viewMode.singleViewDesc}</div>
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
                  <div className="text-lg">{t.settings.viewMode.multiView}</div>
                  <div className="text-xs opacity-70 mt-1">{t.settings.viewMode.multiViewDesc}</div>
                </button>
              </div>

              {/* Multi-View Filters - always visible */}
              <MultiViewFilters />
            </section>

            {/* Game Selection */}
            <section className="bg-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">{t.settings.gameSelection.title}</h3>
              <p className="text-white/50 text-sm mb-4">
                {t.settings.gameSelection.subtitle}
              </p>
              <GameSelector />
            </section>

            {/* Language Selector */}
            <LanguageSelector />

            {/* Debug Controls - only show when debug mode is active */}
            {debugMode && (
              <section className="bg-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">{t.settings.debug.title}</h3>
                <DebugControls />
              </section>
            )}
          </div>

          {/* Navigation hint */}
          <div className="text-center mt-8 text-white/30 text-sm">
            {t.settings.navigation.hint}
          </div>
        </div>

        {/* Right Sidebar - Closer to main content */}
        <div className="w-40 border-l border-slate-700 p-3 bg-slate-800/50">
          <SettingsSidebar />
        </div>
      </div>
    </div>
  );
}
