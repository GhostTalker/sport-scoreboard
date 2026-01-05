// ESPN API Proxy with caching

const ESPN_BASE_URL = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl';

interface CacheEntry {
  data: any;
  timestamp: number;
}

export const CacheKeys = {
  SCOREBOARD: 'scoreboard',
  GAME: (id: string) => `game_${id}`,
  SCHEDULE: (year: number, week: number, type: number) => `schedule_${year}_${week}_${type}`,
  TEAM: (id: string) => `team_${id}`,
} as const;

class ESPNProxy {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly TTL = {
    scoreboard: 15000,  // 15 seconds for live data
    game: 15000,        // 15 seconds for game details
    schedule: 300000,   // 5 minutes for schedule
    team: 3600000,      // 1 hour for team info
  };

  private async fetch(url: string): Promise<any> {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'NFL-Scoreboard/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`ESPN API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  private getCached(key: string, ttl: number): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const age = Date.now() - entry.timestamp;
    if (age > ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  private setCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  async fetchScoreboard(): Promise<any> {
    const cacheKey = CacheKeys.SCOREBOARD;
    const cached = this.getCached(cacheKey, this.TTL.scoreboard);
    if (cached) {
      console.log('[Cache HIT] Scoreboard');
      return cached;
    }

    console.log('[Cache MISS] Fetching scoreboard from ESPN...');
    const data = await this.fetch(`${ESPN_BASE_URL}/scoreboard`);
    this.setCache(cacheKey, data);
    return data;
  }

  async fetchGameDetails(gameId: string): Promise<any> {
    const cacheKey = CacheKeys.GAME(gameId);
    const cached = this.getCached(cacheKey, this.TTL.game);
    if (cached) {
      console.log(`[Cache HIT] Game ${gameId}`);
      return cached;
    }

    console.log(`[Cache MISS] Fetching game ${gameId} from ESPN...`);
    const data = await this.fetch(`${ESPN_BASE_URL}/summary?event=${gameId}`);
    this.setCache(cacheKey, data);
    return data;
  }

  async fetchSchedule(
    year?: number, 
    week?: number, 
    seasonType?: number
  ): Promise<any> {
    const currentYear = year || new Date().getFullYear();
    const currentWeek = week || 1;
    const currentType = seasonType || 2; // Regular season

    const cacheKey = CacheKeys.SCHEDULE(currentYear, currentWeek, currentType);
    const cached = this.getCached(cacheKey, this.TTL.schedule);
    if (cached) {
      console.log(`[Cache HIT] Schedule ${currentYear}/${currentWeek}`);
      return cached;
    }

    console.log(`[Cache MISS] Fetching schedule from ESPN...`);
    const url = `${ESPN_BASE_URL}/scoreboard?dates=${currentYear}&seasontype=${currentType}&week=${currentWeek}`;
    const data = await this.fetch(url);
    this.setCache(cacheKey, data);
    return data;
  }

  async fetchTeam(teamId: string): Promise<any> {
    const cacheKey = CacheKeys.TEAM(teamId);
    const cached = this.getCached(cacheKey, this.TTL.team);
    if (cached) {
      console.log(`[Cache HIT] Team ${teamId}`);
      return cached;
    }

    console.log(`[Cache MISS] Fetching team ${teamId} from ESPN...`);
    const data = await this.fetch(`${ESPN_BASE_URL}/teams/${teamId}`);
    this.setCache(cacheKey, data);
    return data;
  }

  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  clearCache(): void {
    this.cache.clear();
    console.log('[Cache] Cleared');
  }
}

export const espnProxy = new ESPNProxy();
