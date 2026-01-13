import { useState } from 'react';
import { useUIStore } from '../../stores/uiStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { PluginManager } from './PluginManager';
import { CelebrationSettings } from './CelebrationSettings';
import { useTranslation } from '../../i18n/useTranslation';

export function SettingsSidebar() {
  const [showPluginOverlay, setShowPluginOverlay] = useState(false);
  const [showCelebrationOverlay, setShowCelebrationOverlay] = useState(false);
  const debugMode = useUIStore((state) => state.debugMode);
  const toggleDebugMode = useUIStore((state) => state.toggleDebugMode);
  const soundEffectsEnabled = useSettingsStore((state) => state.soundEffectsEnabled);
  const toggleSoundEffects = useSettingsStore((state) => state.toggleSoundEffects);
  const { t } = useTranslation();

  return (
    <>
      <div className="flex flex-col gap-2">
        {/* Plugins Button */}
        <button
          onClick={() => setShowPluginOverlay(true)}
          className="
            flex items-center gap-2
            px-3 py-2.5 rounded-lg
            bg-slate-700 hover:bg-slate-600
            text-white font-medium text-sm
            transition-all
          "
        >
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          <span className="text-left">{t.sidebar.plugins}</span>
        </button>

        {/* Celebration Videos Button */}
        <button
          onClick={() => setShowCelebrationOverlay(true)}
          className="
            flex items-center gap-2
            px-3 py-2.5 rounded-lg
            bg-slate-700 hover:bg-slate-600
            text-white font-medium text-sm
            transition-all
          "
        >
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <span className="text-left">Videos</span>
        </button>

        {/* Sound Effects Toggle */}
        <button
          onClick={toggleSoundEffects}
          className={`
            flex items-center gap-2
            px-3 py-2.5 rounded-lg
            font-medium text-sm
            transition-all
            ${soundEffectsEnabled ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-slate-700 hover:bg-slate-600 text-white'}
          `}
        >
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
          <span className="text-left">Sound</span>
        </button>

        {/* Debug Mode Toggle */}
        <button
          onClick={toggleDebugMode}
          className={`
            flex items-center gap-2
            px-3 py-2.5 rounded-lg
            font-medium text-sm
            transition-all
            ${debugMode ? 'bg-orange-600 hover:bg-orange-500 text-white' : 'bg-slate-700 hover:bg-slate-600 text-white'}
          `}
        >
          <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          <span className="text-left">{t.sidebar.debug}</span>
        </button>
      </div>

      {/* Plugin Overlay */}
      {showPluginOverlay && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6"
          onClick={() => setShowPluginOverlay(false)}
        >
          <div
            className="bg-slate-800 rounded-xl p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">{t.pluginManager.title}</h2>
              <button
                onClick={() => setShowPluginOverlay(false)}
                className="text-white/50 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Plugin Manager Content */}
            <PluginManager />
          </div>
        </div>
      )}

      {/* Celebration Videos Overlay */}
      {showCelebrationOverlay && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6"
          onClick={() => setShowCelebrationOverlay(false)}
        >
          <div
            className="bg-slate-800 rounded-xl p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">{t.settings.celebration.title}</h2>
              <button
                onClick={() => setShowCelebrationOverlay(false)}
                className="text-white/50 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Celebration Settings Content */}
            <CelebrationSettings />
          </div>
        </div>
      )}
    </>
  );
}
