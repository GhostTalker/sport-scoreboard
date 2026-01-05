// ESPN API Endpoints
export const ESPN_BASE_URL = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl';

export const ESPN_ENDPOINTS = {
  scoreboard: `${ESPN_BASE_URL}/scoreboard`,
  summary: (gameId: string) => `${ESPN_BASE_URL}/summary?event=${gameId}`,
  teams: `${ESPN_BASE_URL}/teams`,
  team: (teamId: string) => `${ESPN_BASE_URL}/teams/${teamId}`,
};

// Local API Proxy (runs on your PC)
export const API_BASE_URL = import.meta.env.PROD 
  ? '/api' 
  : 'http://localhost:3001/api';

export const API_ENDPOINTS = {
  scoreboard: `${API_BASE_URL}/scoreboard`,
  game: (gameId: string) => `${API_BASE_URL}/game/${gameId}`,
  schedule: `${API_BASE_URL}/schedule`,
};

// Polling Intervals (in ms)
export const POLLING_INTERVALS = {
  live: 10000,      // 10 seconds when game is live
  scheduled: 60000, // 1 minute when waiting for game
  final: 300000,    // 5 minutes when game is over
};

// Season Types
export const SEASON_TYPE = {
  PRE: 1,      // Pre-Season
  REGULAR: 2,  // Regular Season
  POST: 3,     // Playoffs
  OFF: 4,      // Off-Season
} as const;
