import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Settings, ViewMode, MultiViewFilters } from '../types/settings';
import { DEFAULT_SETTINGS, DEFAULT_CELEBRATION_SETTINGS, DEFAULT_MULTI_VIEW_FILTERS } from '../types/settings';
import type { CelebrationType } from '../types/game';

interface SettingsState extends Settings {
  // Actions
  setPrimaryTeam: (teamId: string) => void;
  toggleSoundEffects: () => void;
  setVideoVolume: (volume: number) => void;
  toggleCelebrationVideo: (type: CelebrationType) => void;
  isCelebrationEnabled: (type: CelebrationType) => boolean;
  setViewMode: (mode: ViewMode) => void;
  setMultiViewFilter: (key: keyof MultiViewFilters, value: boolean) => void;
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

      setViewMode: (mode) => set({ viewMode: mode }),

      setMultiViewFilter: (key, value) =>
        set((state) => ({
          multiViewFilters: {
            ...state.multiViewFilters,
            [key]: value,
          },
        })),

      resetSettings: () => set(DEFAULT_SETTINGS),
    }),
    {
      name: 'scoreboard-settings',
      // Migration for existing users
      migrate: (persistedState: any, _version: number) => {
        if (!persistedState.celebrationVideos) {
          persistedState.celebrationVideos = DEFAULT_CELEBRATION_SETTINGS;
        }
        if (!persistedState.viewMode) {
          persistedState.viewMode = 'single';
        }
        if (!persistedState.multiViewFilters) {
          persistedState.multiViewFilters = DEFAULT_MULTI_VIEW_FILTERS;
        }
        return persistedState;
      },
      version: 3,
    }
  )
);
