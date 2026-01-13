import { useSettingsStore } from '../../stores/settingsStore';
import { useCurrentPlugin } from '../../hooks/usePlugin';
import type { CelebrationType } from '../../types/game';

interface CelebrationOption {
  type: string;
  label: string;
  description: string;
  color: string;
}

// Display metadata for celebration types (keyed by type)
const CELEBRATION_METADATA: Record<string, { label: string; description: string; color: string }> = {
  // NFL
  touchdown: { label: 'Touchdown', description: 'Bei +6, +7 oder +8 Punkten', color: 'bg-green-600' },
  fieldgoal: { label: 'Field Goal', description: 'Bei +3 Punkten', color: 'bg-yellow-600' },
  safety: { label: 'Safety', description: 'Bei +2 Punkten (Defensive)', color: 'bg-purple-600' },
  interception: { label: 'Interception', description: 'Bei abgefangenem Pass', color: 'bg-blue-600' },
  sack: { label: 'Sack', description: 'Wenn der QB gesackt wird', color: 'bg-red-600' },
  fumble: { label: 'Fumble', description: 'Bei Ballverlust oder Blocked Punt', color: 'bg-orange-600' },

  // Bundesliga
  goal: { label: 'Tor', description: 'Bei regulärem Tor', color: 'bg-green-600' },
  penalty: { label: 'Elfmeter', description: 'Bei Tor durch Elfmeter', color: 'bg-blue-600' },
  own_goal: { label: 'Eigentor', description: 'Bei Eigentor', color: 'bg-orange-600' },
  red_card: { label: 'Rote Karte', description: 'Bei direkter Roter Karte', color: 'bg-red-600' },
  yellow_red_card: { label: 'Gelb-Rote Karte', description: 'Bei zweiter Gelber Karte', color: 'bg-yellow-600' },
};

function getCelebrationOptions(celebrationTypes: string[]): CelebrationOption[] {
  return celebrationTypes.map(type => ({
    type,
    ...CELEBRATION_METADATA[type] || {
      label: type,
      description: 'Celebration event',
      color: 'bg-gray-600'
    },
  }));
}

export function CelebrationSettings() {
  const plugin = useCurrentPlugin();
  const celebrationVideos = useSettingsStore((state) => state.celebrationVideos);
  const toggleCelebrationVideo = useSettingsStore((state) => state.toggleCelebrationVideo);

  if (!plugin) {
    return (
      <section className="bg-slate-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-2">Celebration Videos</h3>
        <p className="text-white/50 text-sm">Loading...</p>
      </section>
    );
  }

  const celebrationOptions = getCelebrationOptions(plugin.manifest.celebrationTypes);

  return (
    <section className="bg-slate-800 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-white mb-2">Celebration Videos</h3>
      <p className="text-white/50 text-sm mb-4">
        Welche Videos sollen bei Events angezeigt werden?
      </p>

      <div className="space-y-3">
        {celebrationOptions.map(({ type, label, description, color }) => {
          const isEnabled = celebrationVideos?.[type] ?? true;

          return (
            <div
              key={type}
              className="flex items-center justify-between py-2 border-b border-slate-700 last:border-0"
            >
              <div className="flex items-center gap-3">
                <span className={`w-3 h-3 rounded-full ${color}`} />
                <div>
                  <p className="text-white text-sm font-medium">{label}</p>
                  <p className="text-white/40 text-xs">{description}</p>
                </div>
              </div>

              <button
                onClick={() => toggleCelebrationVideo(type)}
                className={`
                  relative inline-flex h-7 w-12 items-center rounded-full transition-colors
                  ${isEnabled ? 'bg-green-600' : 'bg-slate-600'}
                `}
              >
                <span
                  className={`
                    inline-block h-5 w-5 transform rounded-full bg-white transition-transform
                    ${isEnabled ? 'translate-x-6' : 'translate-x-1'}
                  `}
                />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
}
