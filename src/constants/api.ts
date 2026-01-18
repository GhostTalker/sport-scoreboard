// Local API Proxy (runs on your PC)
export const API_BASE_URL = import.meta.env.PROD
  ? '/api'
  : 'http://localhost:3001/api';

export const API_ENDPOINTS = {
  // NFL endpoints (ESPN proxy)
  scoreboard: `${API_BASE_URL}/scoreboard`,
  game: (gameId: string) => `${API_BASE_URL}/game/${gameId}`,
  plays: (gameId: string) => `${API_BASE_URL}/plays/${gameId}`,
  schedule: `${API_BASE_URL}/schedule`,

  // Bundesliga endpoints (OpenLigaDB proxy)
  bundesligaCurrentGroup: `${API_BASE_URL}/bundesliga/current-group`,
  bundesligaMatchday: (matchday: number) => `${API_BASE_URL}/bundesliga/matchday/${matchday}`,
  bundesligaMatch: (matchId: string) => `${API_BASE_URL}/bundesliga/match/${matchId}`,

  // Bundesliga table (direct OpenLigaDB - no proxy needed, updates infrequently)
  bundesligaTable: 'https://api.openligadb.de/getbltable/bl1',

  // Health Check endpoints
  health: `${API_BASE_URL}/health`,
  healthLive: `${API_BASE_URL}/health/live`,
  healthReady: `${API_BASE_URL}/health/ready`,
};

// Polling Intervals (in ms)
export const POLLING_INTERVALS = {
  live: 10000,      // 10 seconds when game is live (NFL)
  plays: 8000,      // 8 seconds for play-by-play (slightly faster)
  scheduled: 60000, // 1 minute when waiting for game
  final: 60000,     // 1 minute when game is over (for late corrections/extra time goals)
};

// Sport-specific polling intervals
export const BUNDESLIGA_POLLING_INTERVAL = 15000; // 15 seconds (OpenLigaDB rate limit: 1000/hour)
