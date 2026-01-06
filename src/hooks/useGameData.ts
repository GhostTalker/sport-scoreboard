import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../stores/gameStore';
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
    manuallySelectedGameId,
  } = useGameStore();
  
  const intervalRef = useRef<number | null>(null);
  const isFirstFetch = useRef(true);

  // Fetch all games and update current game
  const fetchData = useCallback(async () => {
    try {
      // Only show loading on first fetch
      if (isFirstFetch.current) {
        setLoading(true);
      }
      setError(null);

      // Fetch scoreboard (all games)
      const games = await fetchScoreboard();
      setAvailableGames(games);

      // Determine which game to show
      let gameToShow = null;
      let gameIdToFetch: string | null = null;

      // If user manually selected a game, ALWAYS use that game from the updated list
      if (manuallySelectedGameId) {
        gameToShow = games.find((g) => g.id === manuallySelectedGameId);
        if (gameToShow) {
          gameIdToFetch = manuallySelectedGameId;
        }
      }
      
      // If no manual selection or game not found, find any live game
      if (!gameToShow) {
        gameToShow = games.find((g) => g.status === 'in_progress');
        if (gameToShow) {
          gameIdToFetch = gameToShow.id;
        }
      }

      // If still no game, show first available
      if (!gameToShow && games.length > 0) {
        gameToShow = games[0];
        gameIdToFetch = gameToShow.id;
      }

      if (gameToShow && gameIdToFetch) {
        // Fetch detailed stats for this specific game
        try {
          const details = await fetchGameDetails(gameIdToFetch);
          if (details && details.game) {
            // IMPORTANT: Preserve the seasonName from scoreboard data 
            // since game details might not have it
            const gameWithSeasonInfo = {
              ...details.game,
              seasonType: gameToShow.seasonType,
              week: gameToShow.week,
              seasonName: gameToShow.seasonName,
              startTime: gameToShow.startTime || details.game.startTime,
              venue: gameToShow.venue || details.game.venue,
              broadcast: gameToShow.broadcast || details.game.broadcast,
            };
            setCurrentGame(gameWithSeasonInfo);
            setGameStats(details.stats);
          } else {
            // No details, use scoreboard data directly
            setCurrentGame(gameToShow);
            setGameStats(null);
          }
        } catch (err) {
          console.warn('Failed to fetch game details, using scoreboard data:', err);
          // If detailed fetch fails, use basic game data from scoreboard
          setCurrentGame(gameToShow);
          setGameStats(null);
        }
      } else {
        setCurrentGame(null);
        setGameStats(null);
      }
    } catch (error) {
      console.error('Error fetching game data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch game data');
    } finally {
      setLoading(false);
      isFirstFetch.current = false;
    }
  }, [manuallySelectedGameId, setAvailableGames, setCurrentGame, setGameStats, setLoading, setError]);

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

  return {
    refetch: fetchData,
  };
}
