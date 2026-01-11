import { useSettingsStore } from '../../stores/settingsStore';
import { useUIStore } from '../../stores/uiStore';
import { GameSelector } from './GameSelector';
import { DebugControls } from './DebugControls';
import { CelebrationSettings } from './CelebrationSettings';

export function SettingsPanel() {
  const soundEffectsEnabled = useSettingsStore((state) => state.soundEffectsEnabled);
  const toggleSoundEffects = useSettingsStore((state) => state.toggleSoundEffects);
  const debugMode = useUIStore((state) => state.debugMode);
  const toggleDebugMode = useUIStore((state) => state.toggleDebugMode);

  return (
    <div className="h-full w-full bg-slate-900 p-6 overflow-y-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white">Settings</h2>
        <p className="text-white/50">Configure your scoreboard</p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
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
