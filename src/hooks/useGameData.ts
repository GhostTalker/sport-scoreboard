import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../stores/gameStore';
import { useSettingsStore } from '../stores/settingsStore';
import { fetchScoreboard, fetchGameDetails } from '../services/espnApi';
import { POLLING_INTERVALS } from '../constants/api';

export function useGameData() {
  const { 
    currentGame, 
    setCurrentGame, 
    setAvailableGames, 
    setGameStats,
    setLoading, 
    setError,
    isLive,
  } = useGameStore();
  
  const primaryTeamId = useSettingsStore((state) => state.primaryTeamId);
  const intervalRef = useRef<number | null>(null);

  // Find game for primary team
  const findPrimaryTeamGame = useCallback((games: any[]) => {
    return games.find(
      (game) =>
        game.homeTeam.id === primaryTeamId ||
        game.awayTeam.id === primaryTeamId
    );
  }, [primaryTeamId]);

  // Fetch all games and set current game
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch scoreboard (all games)
      const games = await fetchScoreboard();
      setAvailableGames(games);

      // Find game for primary team
      let gameToShow = findPrimaryTeamGame(games);

      // If no game for primary team, try to find any live game
      if (!gameToShow) {
        gameToShow = games.find((g) => g.status === 'in_progress');
      }

      // If still no game, show first available
      if (!gameToShow && games.length > 0) {
        gameToShow = games[0];
      }

      if (gameToShow) {
        // Fetch detailed stats for this game
        try {
          const details = await fetchGameDetails(gameToShow.id);
          if (details) {
            setCurrentGame(details.game);
            setGameStats(details.stats);
          } else {
            setCurrentGame(gameToShow);
          }
        } catch {
          // If detailed fetch fails, use basic game data
          setCurrentGame(gameToShow);
        }
      } else {
        setCurrentGame(null);
      }
    } catch (error) {
      console.error('Error fetching game data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch game data');
    } finally {
      setLoading(false);
    }
  }, [findPrimaryTeamGame, setAvailableGames, setCurrentGame, setGameStats, setLoading, setError]);

  // Set up polling interval
  useEffect(() => {
    // Initial fetch
    fetchData();

    // Determine polling interval based on game state
    const getInterval = () => {
      if (!currentGame) return POLLING_INTERVALS.scheduled;
      if (currentGame.status === 'final') return POLLING_INTERVALS.final;
      if (isLive) return POLLING_INTERVALS.live;
      return POLLING_INTERVALS.scheduled;
    };

    // Set up interval
    intervalRef.current = window.setInterval(fetchData, getInterval());

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [fetchData, currentGame?.status, isLive]);

  // Re-fetch when primary team changes
  useEffect(() => {
    fetchData();
  }, [primaryTeamId, fetchData]);

  return {
    refetch: fetchData,
  };
}
