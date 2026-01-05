export interface Settings {
  primaryTeamId: string;
  soundEffectsEnabled: boolean;
  videoVolume: number; // 0-1
}

export const DEFAULT_SETTINGS: Settings = {
  primaryTeamId: '17', // New England Patriots
  soundEffectsEnabled: true,
  videoVolume: 0.8,
};
