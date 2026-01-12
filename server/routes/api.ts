import { Router } from 'express';
import { espnProxy } from '../services/espnProxy';
import { openligadbProxy } from '../services/openligadbProxy';

// Force stdout/stderr for PM2
const logError = (msg: string, ...args: any[]) => {
  process.stderr.write(msg + ' ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') + '\n');
};

export const apiRouter = Router();

// GET /api/scoreboard - Get all current games
apiRouter.get('/scoreboard', async (_req, res) => {
  try {
    const data = await espnProxy.fetchScoreboard();
    res.json(data);
  } catch (error) {
    logError('❌ [API Error] Scoreboard failed:', error instanceof Error ? error.message : error);
    if (error instanceof Error && error.stack) {
      logError('Stack trace:', error.stack);
    }
    res.status(500).json({
      error: 'Failed to fetch scoreboard',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/game/:gameId - Get detailed game data
apiRouter.get('/game/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    const data = await espnProxy.fetchGameDetails(gameId);
    res.json(data);
  } catch (error) {
    logError(`❌ [API Error] Game ${req.params.gameId} failed:`, error instanceof Error ? error.message : error);
    if (error instanceof Error && error.stack) {
      logError('Stack trace:', error.stack);
    }
    res.status(500).json({
      error: 'Failed to fetch game details',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/plays/:gameId - Get play-by-play data (faster polling for live events)
apiRouter.get('/plays/:gameId', async (req, res) => {
  try {
    const { gameId } = req.params;
    const data = await espnProxy.fetchPlays(gameId);
    res.json(data);
  } catch (error) {
    logError(`❌ [API Error] Plays ${req.params.gameId} failed:`, error instanceof Error ? error.message : error);
    res.status(500).json({
      error: 'Failed to fetch plays',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/schedule - Get schedule for specific week/season
apiRouter.get('/schedule', async (req, res) => {
  try {
    const { year, week, seasonType } = req.query;
    const data = await espnProxy.fetchSchedule(
      year ? parseInt(year as string) : undefined,
      week ? parseInt(week as string) : undefined,
      seasonType ? parseInt(seasonType as string) : undefined
    );
    res.json(data);
  } catch (error) {
    logError('❌ [API Error] Schedule failed:', error instanceof Error ? error.message : error);
    if (error instanceof Error && error.stack) {
      logError('Stack trace:', error.stack);
    }
    res.status(500).json({
      error: 'Failed to fetch schedule',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/team/:teamId - Get team info
apiRouter.get('/team/:teamId', async (req, res) => {
  try {
    const { teamId } = req.params;
    const data = await espnProxy.fetchTeam(teamId);
    res.json(data);
  } catch (error) {
    logError('Error fetching team:', error);
    res.status(500).json({ 
      error: 'Failed to fetch team',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Bundesliga endpoints (OpenLigaDB)

// GET /api/bundesliga/current-group - Get current matchday info
apiRouter.get('/bundesliga/current-group', async (req, res) => {
  try {
    const { league = 'bl1' } = req.query;
    const data = await openligadbProxy.fetchCurrentGroup(league as string);
    res.json(data);
  } catch (error) {
    logError('❌ [API Error] Bundesliga current group failed:', error instanceof Error ? error.message : error);
    if (error instanceof Error && error.stack) {
      logError('Stack trace:', error.stack);
    }
    res.status(500).json({
      error: 'Failed to fetch current matchday',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/bundesliga/matchday/:matchday - Get all matches for a matchday
apiRouter.get('/bundesliga/matchday/:matchday', async (req, res) => {
  try {
    const { matchday } = req.params;
    const { league = 'bl1', season } = req.query;

    // If season not provided, fetch current group first
    let seasonYear = season as string;
    if (!seasonYear) {
      const currentGroup = await openligadbProxy.fetchCurrentGroup(league as string);
      seasonYear = currentGroup.GroupYear || new Date().getFullYear().toString();
    }

    const data = await openligadbProxy.fetchMatchday(
      league as string,
      seasonYear,
      parseInt(matchday)
    );
    res.json(data);
  } catch (error) {
    logError(`❌ [API Error] Bundesliga matchday ${req.params.matchday} failed:`, error instanceof Error ? error.message : error);
    if (error instanceof Error && error.stack) {
      logError('Stack trace:', error.stack);
    }
    res.status(500).json({
      error: 'Failed to fetch matchday',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/bundesliga/match/:matchId - Get single match details
apiRouter.get('/bundesliga/match/:matchId', async (req, res) => {
  try {
    const { matchId } = req.params;
    const data = await openligadbProxy.fetchMatch(matchId);
    res.json(data);
  } catch (error) {
    logError(`❌ [API Error] Bundesliga match ${req.params.matchId} failed:`, error instanceof Error ? error.message : error);
    if (error instanceof Error && error.stack) {
      logError('Stack trace:', error.stack);
    }
    res.status(500).json({
      error: 'Failed to fetch match',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/health - Health check
apiRouter.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    cache: {
      nfl: espnProxy.getCacheStats(),
      bundesliga: openligadbProxy.getCacheStats()
    }
  });
});
