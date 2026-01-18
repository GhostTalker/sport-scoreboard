import { useState } from 'react';
import { useUIStore } from '../../stores/uiStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { PluginManager } from './PluginManager';
import { CelebrationSettings } from './CelebrationSettings';
import { SoundSettings } from './SoundSettings';
import { DebugControls } from './DebugControls';
import { LanguageSelector } from './LanguageSelector';
import { SystemHealth } from './SystemHealth';
import { useTranslation } from '../../i18n/useTranslation';

export function SettingsMenuTabs() {
  const [showPluginOverlay, setShowPluginOverlay] = useState(false);
  const [showCelebrationOverlay, setShowCelebrationOverlay] = useState(false);
  const [showSoundOverlay, setShowSoundOverlay] = useState(false);
  const [showDebugOverlay, setShowDebugOverlay] = useState(false);
  const [showLanguageOverlay, setShowLanguageOverlay] = useState(false);
  const [showSystemOverlay, setShowSystemOverlay] = useState(false);
  const debugMode = useUIStore((state) => state.debugMode);
  const soundEffectsEnabled = useSettingsStore((state) => state.soundEffectsEnabled);
  const { t } = useTranslation();

  return (
    <>
      <div className="flex gap-2 border-b border-slate-700 justify-center pb-2">
        {/* Plugins Tab */}
        <button
          onClick={() => setShowPluginOverlay(true)}
          className="
            flex items-center gap-2
            px-4 py-2 rounded-t-lg
            bg-slate-700 hover:bg-slate-600
            text-white font-medium text-sm
            transition-all
            border-b-2 border-transparent hover:border-blue-500
          "
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
          <span>{t.sidebar.plugins}</span>
        </button>

        {/* Videos Tab */}
        <button
          onClick={() => setShowCelebrationOverlay(true)}
          className="
            flex items-center gap-2
            px-4 py-2 rounded-t-lg
            bg-slate-700 hover:bg-slate-600
            text-white font-medium text-sm
            transition-all
            border-b-2 border-transparent hover:border-blue-500
          "
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <span>Videos</span>
        </button>

        {/* Sound Tab */}
        <button
          onClick={() => setShowSoundOverlay(true)}
          className={`
            flex items-center gap-2
            px-4 py-2 rounded-t-lg
            font-medium text-sm
            transition-all
            border-b-2 border-transparent hover:border-blue-500
            ${soundEffectsEnabled ? 'bg-green-600 hover:bg-green-500 text-white' : 'bg-slate-700 hover:bg-slate-600 text-white'}
          `}
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
          <span>Sound</span>
        </button>

        {/* Language Tab */}
        <button
          onClick={() => setShowLanguageOverlay(true)}
          className="
            flex items-center gap-2
            px-4 py-2 rounded-t-lg
            bg-slate-700 hover:bg-slate-600
            text-white font-medium text-sm
            transition-all
            border-b-2 border-transparent hover:border-blue-500
          "
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
          </svg>
          <span>{t.settings.language.title}</span>
        </button>

        {/* System Tab */}
        <button
          onClick={() => setShowSystemOverlay(true)}
          className="
            flex items-center gap-2
            px-4 py-2 rounded-t-lg
            bg-slate-700 hover:bg-slate-600
            text-white font-medium text-sm
            transition-all
            border-b-2 border-transparent hover:border-blue-500
          "
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
          <span>System</span>
        </button>

        {/* Debug Tab */}
        <button
          onClick={() => setShowDebugOverlay(true)}
          className={`
            flex items-center gap-2
            px-4 py-2 rounded-t-lg
            font-medium text-sm
            transition-all
            border-b-2 border-transparent hover:border-blue-500
            ${debugMode ? 'bg-orange-600 hover:bg-orange-500 text-white' : 'bg-slate-700 hover:bg-slate-600 text-white'}
          `}
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          <span>{t.sidebar.debug}</span>
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
            <CelebrationSettings />
          </div>
        </div>
      )}

      {/* Sound Overlay */}
      {showSoundOverlay && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6"
          onClick={() => setShowSoundOverlay(false)}
        >
          <div
            className="bg-slate-800 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">{t.settings.sound.title}</h2>
              <button
                onClick={() => setShowSoundOverlay(false)}
                className="text-white/50 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <SoundSettings />
          </div>
        </div>
      )}

      {/* Language Overlay */}
      {showLanguageOverlay && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6"
          onClick={() => setShowLanguageOverlay(false)}
        >
          <div
            className="bg-slate-800 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">{t.settings.language.title}</h2>
              <button
                onClick={() => setShowLanguageOverlay(false)}
                className="text-white/50 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <LanguageSelector />
          </div>
        </div>
      )}

      {/* System Health Overlay */}
      {showSystemOverlay && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6"
          onClick={() => setShowSystemOverlay(false)}
        >
          <div
            className="bg-slate-800 rounded-xl p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">System Health</h2>
              <button
                onClick={() => setShowSystemOverlay(false)}
                className="text-white/50 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <SystemHealth />
          </div>
        </div>
      )}

      {/* Debug Overlay */}
      {showDebugOverlay && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6"
          onClick={() => setShowDebugOverlay(false)}
        >
          <div
            className="bg-slate-800 rounded-xl p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">{t.settings.debug.title}</h2>
              <button
                onClick={() => setShowDebugOverlay(false)}
                className="text-white/50 hover:text-white transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <DebugControls />
          </div>
        </div>
      )}
    </>
  );
}
