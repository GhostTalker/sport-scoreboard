// API-Football Service - Bundesliga Live Minutes & Card Events
// OpenLigaDB provides goals but NOT cards - we use API-Football for card detection
// Used for: live-minute sync (drift correction) and red card celebration triggers

const API_FOOTBALL_BASE_URL = 'https://v3.football.api-sports.io';
const BUNDESLIGA_LEAGUE_ID = 78;

// Card event from API-Football /fixtures/events endpoint
export interface ApiFootballCardEvent {
  time: {
    elapsed: number;
    extra: number | null;
  };
  team: {
    id: number;
    name: string;
  };
  player: {
    id: number;
    name: string;
  };
  type: 'Card';
  detail: 'Yellow Card' | 'Red Card' | 'Second Yellow card';
  comments: string | null;
}

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
  events?: ApiFootballCardEvent[];
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

// Processed card event for internal use
export interface ProcessedCardEvent {
  fixtureId: number;
  minute: number;
  extraMinute: number | null;
  playerName: string;
  teamName: string;
  teamId: number;
  cardType: 'red_card' | 'yellow_red_card';
  // Unique ID based on fixture, player, and minute to detect new cards
  eventId: string;
}

/**
 * Fetch events for a specific fixture (includes cards, goals, substitutions)
 * Only fetches red cards and second yellow cards (which result in red)
 */
export async function fetchFixtureCardEvents(fixtureId: number): Promise<ProcessedCardEvent[]> {
  const apiKey = import.meta.env.VITE_API_FOOTBALL_KEY;

  if (!apiKey) {
    return [];
  }

  try {
    const response = await fetch(
      `${API_FOOTBALL_BASE_URL}/fixtures/events?fixture=${fixtureId}&type=Card`,
      {
        headers: {
          'x-apisports-key': apiKey,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`API-Football events error: ${response.status}`);
    }

    const data = await response.json();
    const events = data.response || [];

    // Filter for red cards and second yellow cards only
    // We don't care about regular yellow cards
    const redCardEvents: ProcessedCardEvent[] = events
      .filter((event: ApiFootballCardEvent) =>
        event.type === 'Card' &&
        (event.detail === 'Red Card' || event.detail === 'Second Yellow card')
      )
      .map((event: ApiFootballCardEvent) => ({
        fixtureId,
        minute: event.time.elapsed,
        extraMinute: event.time.extra,
        playerName: event.player.name,
        teamName: event.team.name,
        teamId: event.team.id,
        cardType: event.detail === 'Second Yellow card' ? 'yellow_red_card' : 'red_card',
        eventId: `${fixtureId}-${event.player.id}-${event.time.elapsed}`,
      }));

    return redCardEvents;
  } catch (error) {
    console.error('❌ API-Football events fetch failed:', error);
    return [];
  }
}

/**
 * Fetch card events for all live Bundesliga fixtures at once
 * More efficient than fetching events per fixture
 */
export async function fetchAllLiveCardEvents(): Promise<ProcessedCardEvent[]> {
  const apiKey = import.meta.env.VITE_API_FOOTBALL_KEY;

  if (!apiKey) {
    console.warn('⚠️ API-Football key not configured, skipping card detection');
    return [];
  }

  try {
    // First get all live fixtures
    const fixtures = await fetchBundesligaLiveFixtures();

    if (fixtures.length === 0) {
      return [];
    }

    // Fetch events for each live fixture in parallel
    const eventPromises = fixtures.map(f => fetchFixtureCardEvents(f.fixture.id));
    const allEvents = await Promise.all(eventPromises);

    // Flatten all card events
    return allEvents.flat();
  } catch (error) {
    console.error('❌ Failed to fetch live card events:', error);
    return [];
  }
}
