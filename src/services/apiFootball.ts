// API-Football Service - Bundesliga Live Minutes
// Used only for live-minute sync (drift correction)

const API_FOOTBALL_BASE_URL = 'https://v3.football.api-sports.io';
const BUNDESLIGA_LEAGUE_ID = 78;

export interface ApiFootballFixture {
  fixture: {
    id: number;
    status: {
      long: string;
      short: string;
      elapsed: number | null;
    };
  };
  teams: {
    home: {
      id: number;
      name: string;
    };
    away: {
      id: number;
      name: string;
    };
  };
}

export interface ApiFootballResponse {
  response: ApiFootballFixture[];
}

/**
 * Fetch all live Bundesliga fixtures (BATCH request)
 * Returns all live games in one call
 */
export async function fetchBundesligaLiveFixtures(): Promise<ApiFootballFixture[]> {
  const apiKey = import.meta.env.VITE_API_FOOTBALL_KEY;

  if (!apiKey) {
    console.warn('⚠️ API-Football key not configured, skipping live minute sync');
    return [];
  }

  try {
    const response = await fetch(
      `${API_FOOTBALL_BASE_URL}/fixtures?live=all&league=${BUNDESLIGA_LEAGUE_ID}`,
      {
        headers: {
          'x-apisports-key': apiKey,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API-Football error: ${response.status} ${response.statusText}`);
    }

    const data: ApiFootballResponse = await response.json();
    return data.response || [];
  } catch (error) {
    console.error('❌ API-Football fetch failed:', error);
    return [];
  }
}
