import { Router } from 'express';
import { espnProxy } from '../services/espnProxy';

export const apiRouter = Router();

// GET /api/scoreboard - Get all current games
apiRouter.get('/scoreboard', async (_req, res) => {
  try {
    const data = await espnProxy.fetchScoreboard();
    res.json(data);
  } catch (error) {
    console.error('❌ [API Error] Scoreboard failed:', error instanceof Error ? error.message : error);
    if (error instanceof Error && error.stack) {
      console.error('Stack trace:', error.stack);
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
    console.error(`❌ [API Error] Game ${req.params.gameId} failed:`, error instanceof Error ? error.message : error);
    if (error instanceof Error && error.stack) {
      console.error('Stack trace:', error.stack);
    }
    res.status(500).json({
      error: 'Failed to fetch game details',
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
    console.error('❌ [API Error] Schedule failed:', error instanceof Error ? error.message : error);
    if (error instanceof Error && error.stack) {
      console.error('Stack trace:', error.stack);
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
    console.error('Error fetching team:', error);
    res.status(500).json({ 
      error: 'Failed to fetch team',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/health - Health check
apiRouter.get('/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    cache: espnProxy.getCacheStats()
  });
});
