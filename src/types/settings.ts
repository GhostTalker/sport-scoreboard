import type { CelebrationType } from './game';

// Which celebration videos are enabled
export type CelebrationSettings = Record<CelebrationType, boolean>;

export interface Settings {
  primaryTeamId: string;
  soundEffectsEnabled: boolean;
  videoVolume: number; // 0-1
  celebrationVideos: CelebrationSettings;
}

export const DEFAULT_CELEBRATION_SETTINGS: CelebrationSettings = {
  touchdown: true,
  fieldgoal: true,
  interception: true,
  sack: true,
  fumble: true,
  safety: true,
};

export const DEFAULT_SETTINGS: Settings = {
  primaryTeamId: '17', // New England Patriots
  soundEffectsEnabled: true,
  videoVolume: 0.8,
  celebrationVideos: DEFAULT_CELEBRATION_SETTINGS,
};
