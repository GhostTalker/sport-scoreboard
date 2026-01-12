// OpenLigaDB API Proxy with caching

const OPENLIGADB_BASE_URL = 'https://api.openligadb.de';

// Force stdout for PM2
const log = (msg: string) => process.stdout.write(msg + '\n');

interface CacheEntry {
  data: any;
  timestamp: number;
}

export const CacheKeys = {
  CURRENT_GROUP: (league: string) => `bl_current_group_${league}`,
  MATCHDAY: (league: string, season: string, matchday: number) => `bl_matchday_${league}_${season}_${matchday}`,
  MATCH: (matchId: string) => `bl_match_${matchId}`,
} as const;

class OpenLigaDBProxy {
  private cache: Map<string, CacheEntry> = new Map();
  private readonly TTL = {
    currentGroup: 300000,  // 5 minutes for current matchday info
    matchday: 15000,       // 15 seconds for live matchday data
    match: 15000,          // 15 seconds for single match
  };

  private async fetch(url: string): Promise<any> {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'NFL-Scoreboard/2.0',
      },
    });

    if (!response.ok) {
      throw new Error(`OpenLigaDB API error: ${response.status} ${response.statusText}`);
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

  /**
   * Fetch current matchday group for a league
   * @param league - 'bl1' for Bundesliga, 'dfb' for DFB-Pokal
   */
  async fetchCurrentGroup(league: string = 'bl1'): Promise<any> {
    const cacheKey = CacheKeys.CURRENT_GROUP(league);
    const cached = this.getCached(cacheKey, this.TTL.currentGroup);
    if (cached) {
      log(`[Cache HIT] ${league} current group`);
      return cached;
    }

    log(`[Cache MISS] Fetching ${league} current group from OpenLigaDB...`);
    const start = Date.now();
    const data = await this.fetch(`${OPENLIGADB_BASE_URL}/getcurrentgroup/${league}`);
    const duration = Date.now() - start;
    log(`[OpenLigaDB API] ${league} current group fetched in ${duration}ms`);
    this.setCache(cacheKey, data);
    return data;
  }

  /**
   * Fetch all matches for a specific matchday
   * @param league - 'bl1' for Bundesliga, 'dfb' for DFB-Pokal
   * @param season - Season year (e.g., '2024')
   * @param matchday - Matchday number
   */
  async fetchMatchday(league: string, season: string, matchday: number): Promise<any> {
    const cacheKey = CacheKeys.MATCHDAY(league, season, matchday);
    const cached = this.getCached(cacheKey, this.TTL.matchday);
    if (cached) {
      log(`[Cache HIT] ${league} matchday ${matchday}`);
      return cached;
    }

    log(`[Cache MISS] Fetching ${league} matchday ${matchday} from OpenLigaDB...`);
    const start = Date.now();
    const data = await this.fetch(
      `${OPENLIGADB_BASE_URL}/getmatchdata/${league}/${season}/${matchday}`
    );
    const duration = Date.now() - start;
    log(`[OpenLigaDB API] ${league} matchday ${matchday} fetched in ${duration}ms`);
    this.setCache(cacheKey, data);
    return data;
  }

  /**
   * Fetch single match details
   * @param matchId - OpenLigaDB match ID
   */
  async fetchMatch(matchId: string): Promise<any> {
    const cacheKey = CacheKeys.MATCH(matchId);
    const cached = this.getCached(cacheKey, this.TTL.match);
    if (cached) {
      log(`[Cache HIT] Match ${matchId}`);
      return cached;
    }

    log(`[Cache MISS] Fetching match ${matchId} from OpenLigaDB...`);
    const start = Date.now();
    const data = await this.fetch(`${OPENLIGADB_BASE_URL}/getmatchdata/${matchId}`);
    const duration = Date.now() - start;
    log(`[OpenLigaDB API] Match ${matchId} fetched in ${duration}ms`);
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
    log('[Cache] OpenLigaDB cache cleared');
  }
}

export const openligadbProxy = new OpenLigaDBProxy();
