import { useEffect, useRef } from 'react';
import { useGameStore } from '../stores/gameStore';
import { fetchScoreboard, fetchGameDetails } from '../services/espnApi';
import { POLLING_INTERVALS } from '../constants/api';

export function useGameData() {
  const currentGame = useGameStore((state) => state.currentGame);
  const isLive = useGameStore((state) => state.isLive);
  const setCurrentGame = useGameStore((state) => state.setCurrentGame);
  const setAvailableGames = useGameStore((state) => state.setAvailableGames);
  const setGameStats = useGameStore((state) => state.setGameStats);
  const setLoading = useGameStore((state) => state.setLoading);
  const setError = useGameStore((state) => state.setError);
  
  const intervalRef = useRef<number | null>(null);
  const isFirstFetch = useRef(true);

  // Set up polling
  useEffect(() => {
    const fetchData = async () => {
      // Get the CURRENT value of manuallySelectedGameId directly from store
      const { manuallySelectedGameId } = useGameStore.getState();
      
      try {
        if (isFirstFetch.current) {
          setLoading(true);
        }
        setError(null);

        // Fetch scoreboard (all games)
        const games = await fetchScoreboard();
        setAvailableGames(games);

        // Determine which game to show
        let gameToShow = null;

        // If user manually selected a game, ALWAYS use that game
        if (manuallySelectedGameId) {
          gameToShow = games.find((g) => g.id === manuallySelectedGameId);
          console.log('[useGameData] Manual selection:', manuallySelectedGameId, 'Found:', !!gameToShow);
        }
        
        // If no manual selection or game not found, find any live game
        if (!gameToShow) {
          gameToShow = games.find((g) => g.status === 'in_progress');
        }

        // If still no game, show first available
        if (!gameToShow && games.length > 0) {
          gameToShow = games[0];
        }

        if (gameToShow) {
          // For final/scheduled games, just use scoreboard data (no need for details)
          // For live games, fetch details for stats
          if (gameToShow.status === 'in_progress' || gameToShow.status === 'halftime') {
            try {
              const details = await fetchGameDetails(gameToShow.id);
              if (details && details.game) {
                // Merge with scoreboard data to preserve season info
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
                setCurrentGame(gameToShow);
                setGameStats(null);
              }
            } catch (err) {
              console.warn('Failed to fetch game details:', err);
              setCurrentGame(gameToShow);
              setGameStats(null);
            }
          } else {
            // For final/scheduled games, use scoreboard data directly
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
    };

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
  }, [currentGame?.status, isLive, setAvailableGames, setCurrentGame, setGameStats, setLoading, setError]);

  return {
    refetch: () => {
      // Trigger refetch by clearing and resetting interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    },
  };
}
