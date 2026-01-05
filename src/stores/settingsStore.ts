import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Settings } from '../types/settings';
import { DEFAULT_SETTINGS } from '../types/settings';

interface SettingsState extends Settings {
  // Actions
  setPrimaryTeam: (teamId: string) => void;
  toggleSoundEffects: () => void;
  setVideoVolume: (volume: number) => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,

      setPrimaryTeam: (teamId) => set({ primaryTeamId: teamId }),

      toggleSoundEffects: () =>
        set((state) => ({ soundEffectsEnabled: !state.soundEffectsEnabled })),

      setVideoVolume: (volume) =>
        set({ videoVolume: Math.max(0, Math.min(1, volume)) }),

      resetSettings: () => set(DEFAULT_SETTINGS),
    }),
    {
      name: 'scoreboard-settings',
    }
  )
);
