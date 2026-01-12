import type { CelebrationType } from './game';
import type { SportType, CompetitionType } from './base';

// Which celebration videos are enabled
export type CelebrationSettings = Record<CelebrationType, boolean>;

// View mode: single game or all games overview
export type ViewMode = 'single' | 'multi';

// Multi-view game filters
export interface MultiViewFilters {
  showLive: boolean;
  showUpcoming: boolean;
  showFinal: boolean;
}

export interface Settings {
  // Sport selection
  currentSport: SportType;
  currentCompetition: CompetitionType;

  // Team preferences
  primaryTeamId: string;

  // Audio/Visual
  soundEffectsEnabled: boolean;
  videoVolume: number; // 0-1
  celebrationVideos: CelebrationSettings;

  // View mode
  viewMode: ViewMode;
  multiViewFilters: MultiViewFilters;
}

export const DEFAULT_CELEBRATION_SETTINGS: CelebrationSettings = {
  // NFL celebrations
  touchdown: true,
  fieldgoal: true,
  interception: true,
  sack: true,
  fumble: true,
  safety: true,
  // Bundesliga celebrations
  goal: true,
  penalty: true,
  own_goal: true,
  red_card: true,
  yellow_red_card: true,
};

export const DEFAULT_MULTI_VIEW_FILTERS: MultiViewFilters = {
  showLive: true,
  showUpcoming: true,
  showFinal: true,
};

export const DEFAULT_SETTINGS: Settings = {
  currentSport: 'nfl',
  currentCompetition: 'nfl',
  primaryTeamId: '17', // New England Patriots
  soundEffectsEnabled: true,
  videoVolume: 0.8,
  celebrationVideos: DEFAULT_CELEBRATION_SETTINGS,
  viewMode: 'single',
  multiViewFilters: DEFAULT_MULTI_VIEW_FILTERS,
};
