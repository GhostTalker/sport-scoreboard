export interface PlayerStats {
  name: string;
  stats: string; // Formatted stats string like "18/24, 245 yds, 2 TD"
}

export interface TeamStats {
  teamId: string;
  passing: PlayerStats | null;
  rushing: PlayerStats | null;
  receiving: PlayerStats | null;
  totalYards: number;
  turnovers: number;
  timeOfPossession: string;
  thirdDownEfficiency: string; // "4/8"
  thirdDownPercentage: number;
  redZoneEfficiency: string; // "2/3"
  redZonePercentage: number;
  sacks: number;
  penalties: number;
  penaltyYards: number;
}

export interface GameStats {
  homeStats: TeamStats;
  awayStats: TeamStats;
}
