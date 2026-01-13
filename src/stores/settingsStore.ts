import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Settings, ViewMode, MultiViewFilters } from '../types/settings';
import { DEFAULT_SETTINGS, DEFAULT_CELEBRATION_SETTINGS, DEFAULT_MULTI_VIEW_FILTERS } from '../types/settings';
import type { CelebrationType } from '../types/game';
import type { SportType, CompetitionType } from '../types/base';

interface SettingsState extends Settings {
  // Actions
  setSport: (sport: SportType) => void;
  setCompetition: (competition: CompetitionType) => void;
  setInitialSportSelection: (sport: SportType) => void;
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

      setSport: (sport) => {
        // Atomic update to prevent race conditions
        // For NFL, auto-set competition to 'nfl' (only one competition)
        // For Bundesliga, auto-set to 'bundesliga' as default (user can change to DFB-Pokal in settings)
        // This prevents the "Laden..." (loading) state when switching sports
        set({
          currentSport: sport,
          currentCompetition: sport === 'nfl' ? 'nfl' : 'bundesliga',
        });
      },

      setCompetition: (competition) => set({ currentCompetition: competition }),

      setInitialSportSelection: (sport) => {
        // Set sport, competition, and selection flag in ONE atomic update
        // For NFL, auto-set competition. For Bundesliga, set to 'bundesliga' as default (can be changed later)
        set({
          currentSport: sport,
          currentCompetition: sport === 'nfl' ? 'nfl' : 'bundesliga',
          hasSelectedInitialSport: true,
        });
      },

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
      // Exclude hasSelectedInitialSport from persistence
      // This ensures sport selection screen shows on every app start
      partialize: (state) => {
        const { hasSelectedInitialSport, ...rest } = state;
        return rest;
      },
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
        // Version 2.0 - Add sport selection
        if (!persistedState.currentSport) {
          persistedState.currentSport = 'nfl';
          persistedState.currentCompetition = 'nfl';
        }
        // hasSelectedInitialSport is now excluded from persistence (v2.0.14)
        // It always starts as false on every app start
        // This line is kept for backward compatibility but has no effect
        persistedState.hasSelectedInitialSport = false;
        // Add Bundesliga celebration settings
        if (persistedState.celebrationVideos) {
          if (persistedState.celebrationVideos.goal === undefined) {
            persistedState.celebrationVideos.goal = true;
          }
          if (persistedState.celebrationVideos.penalty === undefined) {
            persistedState.celebrationVideos.penalty = true;
          }
          if (persistedState.celebrationVideos.own_goal === undefined) {
            persistedState.celebrationVideos.own_goal = true;
          }
          if (persistedState.celebrationVideos.red_card === undefined) {
            persistedState.celebrationVideos.red_card = true;
          }
          if (persistedState.celebrationVideos.yellow_red_card === undefined) {
            persistedState.celebrationVideos.yellow_red_card = true;
          }
        }
        return persistedState;
      },
      version: 11,
    }
  )
);
