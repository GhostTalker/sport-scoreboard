import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Settings, ViewMode, MultiViewFilters } from '../types/settings';
import { DEFAULT_SETTINGS, DEFAULT_CELEBRATION_SETTINGS, DEFAULT_MULTI_VIEW_FILTERS } from '../types/settings';
import type { CelebrationType } from '../types/game';
import type { SportType, CompetitionType } from '../types/base';
import type { Language } from '../i18n/translations';

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

  // Plugin management
  togglePlugin: (pluginId: string) => void;
  isPluginEnabled: (pluginId: string) => boolean;
  setEnabledPlugins: (pluginIds: string[]) => void;

  // Language
  setLanguage: (language: Language) => void;
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

      // Plugin management actions
      togglePlugin: (pluginId) =>
        set((state) => {
          const enabled = state.enabledPlugins.includes(pluginId);
          return {
            enabledPlugins: enabled
              ? state.enabledPlugins.filter(id => id !== pluginId)
              : [...state.enabledPlugins, pluginId],
          };
        }),

      isPluginEnabled: (pluginId) => {
        const state = get();
        return state.enabledPlugins.includes(pluginId);
      },

      setEnabledPlugins: (pluginIds) => set({ enabledPlugins: pluginIds }),

      // Language action
      setLanguage: (language) => set({ language }),
    }),
    {
      name: 'scoreboard-settings',
      // Exclude hasSelectedInitialSport from persistence
      // This ensures sport selection screen shows on every app start
      partialize: (state): Omit<Settings, 'hasSelectedInitialSport'> => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { hasSelectedInitialSport, ...rest } = state;
        return rest;
      },
      // Migration for existing users
      migrate: (persistedState: unknown, _version: number) => {
        // Type guard for partial settings object
        const state = persistedState as Partial<Settings> & Record<string, unknown>;
        if (!state.celebrationVideos) {
          state.celebrationVideos = DEFAULT_CELEBRATION_SETTINGS;
        }
        if (!state.viewMode) {
          state.viewMode = 'single';
        }
        if (!state.multiViewFilters) {
          state.multiViewFilters = DEFAULT_MULTI_VIEW_FILTERS;
        }
        // Version 2.0 - Add sport selection
        if (!state.currentSport) {
          state.currentSport = 'nfl';
          state.currentCompetition = 'nfl';
        }
        // hasSelectedInitialSport is now excluded from persistence (v2.0.14)
        // It always starts as false on every app start
        // This line is kept for backward compatibility but has no effect
        state.hasSelectedInitialSport = false;
        // Version 3.0 - Add plugin management
        if (!state.enabledPlugins) {
          state.enabledPlugins = ['nfl', 'bundesliga']; // Enable all existing plugins by default
        }
        // Add Bundesliga celebration settings
        if (state.celebrationVideos) {
          if (state.celebrationVideos.goal === undefined) {
            state.celebrationVideos.goal = true;
          }
          if (state.celebrationVideos.penalty === undefined) {
            state.celebrationVideos.penalty = true;
          }
          if (state.celebrationVideos.own_goal === undefined) {
            state.celebrationVideos.own_goal = true;
          }
          if (state.celebrationVideos.red_card === undefined) {
            state.celebrationVideos.red_card = true;
          }
          if (state.celebrationVideos.yellow_red_card === undefined) {
            state.celebrationVideos.yellow_red_card = true;
          }
        }
        // Version 3.0.1 - Add language support
        if (!state.language) {
          // Auto-detect browser language
          const browserLang = navigator.language.toLowerCase();
          state.language = browserLang.startsWith('de') ? 'de' : 'en';
        }
        return state as Settings;
      },
      version: 13, // Incremented for language support feature
    }
  )
);
