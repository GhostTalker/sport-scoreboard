import { useSettingsStore } from '../../stores/settingsStore';
import { useTranslation } from '../../i18n/useTranslation';

export function SoundSettings() {
  const soundEffectsEnabled = useSettingsStore((state) => state.soundEffectsEnabled);
  const toggleSoundEffects = useSettingsStore((state) => state.toggleSoundEffects);
  const videoVolume = useSettingsStore((state) => state.videoVolume);
  const setVideoVolume = useSettingsStore((state) => state.setVideoVolume);
  const { t } = useTranslation();

  return (
    <section className="bg-slate-800 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-4">{t.settings.sound.title}</h3>

      {/* Sound Effects Toggle */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-white font-medium">{t.settings.sound.soundEffects}</p>
            <p className="text-white/50 text-sm">{t.settings.sound.soundEffectsDesc}</p>
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
      </div>

      {/* Video Volume Slider */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-white font-medium">Video Lautstärke</p>
          <span className="text-white/70 text-sm">{Math.round(videoVolume * 100)}%</span>
        </div>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={videoVolume}
          onChange={(e) => setVideoVolume(parseFloat(e.target.value))}
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-4
            [&::-webkit-slider-thumb]:h-4
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-blue-600
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-moz-range-thumb]:w-4
            [&::-moz-range-thumb]:h-4
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-blue-600
            [&::-moz-range-thumb]:border-0
            [&::-moz-range-thumb]:cursor-pointer"
        />
        <p className="text-white/40 text-xs mt-2">
          Lautstärke für Celebration Videos
        </p>
      </div>
    </section>
  );
}
