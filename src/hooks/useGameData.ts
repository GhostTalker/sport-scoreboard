import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../stores/gameStore';
import { fetchScoreboard, fetchGameDetails } from '../services/espnApi';
import { POLLING_INTERVALS } from '../constants/api';

export function useGameData() {
  const intervalRef = useRef<number | null>(null);
  const isFirstFetch = useRef(true);
  const isFetching = useRef(false);

  const fetchData = useCallback(async () => {
    // Prevent concurrent fetches
    if (isFetching.current) {
      return;
    }
    
    isFetching.current = true;
    
    // Get current state directly from store
    const store = useGameStore.getState();
    const { manuallySelectedGameId, setAvailableGames, setCurrentGame, setGameStats, setLoading, setError } = store;
    
    
    try {
      if (isFirstFetch.current) {
        setLoading(true);
      }
      setError(null);

      // Fetch scoreboard (all games)
      const games = await fetchScoreboard();
      console.log('[DEBUG] Fetched games:', games.map(g => ({
        id: g.id,
        name: `${g.awayTeam.abbreviation} @ ${g.homeTeam.abbreviation}`,
        status: g.status
      })));
      setAvailableGames(games);

      // Determine which game to show
      let gameToShow = null;

      console.log('[DEBUG] manuallySelectedGameId:', manuallySelectedGameId);

      // If user manually selected a game, ALWAYS use that game
      if (manuallySelectedGameId) {
        gameToShow = games.find((g) => g.id === manuallySelectedGameId);
        console.log('[DEBUG] Found manually selected game:', gameToShow ? `${gameToShow.id} ${`${gameToShow.awayTeam.abbreviation} @ ${gameToShow.homeTeam.abbreviation}`}` : 'NOT FOUND');

        // If manual selection not found in current games, keep showing it anyway
        if (!gameToShow) {
          const { currentGame } = useGameStore.getState();
          if (currentGame && currentGame.id === manuallySelectedGameId) {
            gameToShow = currentGame;
            console.log('[DEBUG] Using cached manually selected game:', `${gameToShow.id} ${`${gameToShow.awayTeam.abbreviation} @ ${gameToShow.homeTeam.abbreviation}`}`);
          }
        }
      }

      // If no manual selection, find any live game
      if (!gameToShow && !manuallySelectedGameId) {
        gameToShow = games.find((g) => g.status === 'in_progress');
        console.log('[DEBUG] Auto-selected live game:', gameToShow ? `${gameToShow.id} ${`${gameToShow.awayTeam.abbreviation} @ ${gameToShow.homeTeam.abbreviation}`}` : 'NONE');
      }

      // If still no game, show first available (but only if no manual selection)
      if (!gameToShow && !manuallySelectedGameId && games.length > 0) {
        gameToShow = games[0];
        console.log('[DEBUG] Auto-selected first game:', `${gameToShow.id} ${`${gameToShow.awayTeam.abbreviation} @ ${gameToShow.homeTeam.abbreviation}`}`);
      }

      console.log('[DEBUG] Final game to show:', gameToShow ? `${gameToShow.id} ${gameToShow.awayTeam.abbreviation} @ ${gameToShow.homeTeam.abbreviation}` : 'NONE');

      if (gameToShow) {
        // Fetch details for live AND final games (for stats)
        const needsDetails = gameToShow.status === 'in_progress' ||
                             gameToShow.status === 'halftime' ||
                             gameToShow.status === 'final';

        if (needsDetails) {
          try {
            const details = await fetchGameDetails(gameToShow.id);

            // Re-check manual selection before updating - user may have changed selection during async fetch
            const currentManualSelection = useGameStore.getState().manuallySelectedGameId;
            if (currentManualSelection && currentManualSelection !== gameToShow.id) {
              console.log('[DEBUG] Manual selection changed during fetch, skipping update');
              return;
            }

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
          // Re-check manual selection before updating
          const currentManualSelection = useGameStore.getState().manuallySelectedGameId;
          if (currentManualSelection && currentManualSelection !== gameToShow.id) {
            console.log('[DEBUG] Manual selection changed, skipping update');
            return;
          }

          // For scheduled games, use scoreboard data directly
          setCurrentGame(gameToShow);
          setGameStats(null);
        }
      }
      // Don't set null if we have a manual selection - keep showing the selected game
    } catch (error) {
      console.error('Error fetching game data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch game data');
    } finally {
      setLoading(false);
      isFirstFetch.current = false;
      isFetching.current = false;
    }
  }, []);

  // Set up polling - only run once on mount
  useEffect(() => {
    // Initial fetch
    fetchData();

    // Set up interval with dynamic timing
    const setupInterval = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      
      const { currentGame, isLive } = useGameStore.getState();
      let interval = POLLING_INTERVALS.scheduled;
      
      if (currentGame?.status === 'final') {
        interval = POLLING_INTERVALS.final;
      } else if (isLive) {
        interval = POLLING_INTERVALS.live;
      }
      
      intervalRef.current = window.setInterval(fetchData, interval);
    };
    
    setupInterval();
    
    // Re-setup interval when game status changes
    const unsubscribe = useGameStore.subscribe((state, prevState) => {
      if (state.currentGame?.status !== prevState.currentGame?.status ||
          state.isLive !== prevState.isLive) {
        setupInterval();
      }
    });

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      unsubscribe();
    };
  }, [fetchData]);

  return {
    refetch: fetchData,
  };
}
