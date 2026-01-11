import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Settings } from '../types/settings';
import { DEFAULT_SETTINGS, DEFAULT_CELEBRATION_SETTINGS } from '../types/settings';
import type { CelebrationType } from '../types/game';

interface SettingsState extends Settings {
  // Actions
  setPrimaryTeam: (teamId: string) => void;
  toggleSoundEffects: () => void;
  setVideoVolume: (volume: number) => void;
  toggleCelebrationVideo: (type: CelebrationType) => void;
  isCelebrationEnabled: (type: CelebrationType) => boolean;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...DEFAULT_SETTINGS,

      setPrimaryTeam: (teamId) => set({ primaryTeamId: teamId }),

      toggleSoundEffects: () =>
        set((state) => ({ soundEffectsEnabled: !state.soundEffectsEnabled })),

      setVideoVolume: (volume) =>
        set({ videoVolume: Math.max(0, Math.min(1, volume)) }),

      toggleCelebrationVideo: (type) =>
        set((state) => ({
          celebrationVideos: {
            ...state.celebrationVideos,
            [type]: !state.celebrationVideos[type],
          },
        })),

      isCelebrationEnabled: (type) => {
        const state = get();
        // Handle migration from old settings without celebrationVideos
        if (!state.celebrationVideos) return true;
        return state.celebrationVideos[type] ?? true;
      },

      resetSettings: () => set(DEFAULT_SETTINGS),
    }),
    {
      name: 'scoreboard-settings',
      // Migration for existing users without celebrationVideos
      migrate: (persistedState: any, _version: number) => {
        if (!persistedState.celebrationVideos) {
          persistedState.celebrationVideos = DEFAULT_CELEBRATION_SETTINGS;
        }
        return persistedState;
      },
      version: 1,
    }
  )
);
