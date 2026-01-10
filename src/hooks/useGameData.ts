import { useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../stores/gameStore';
import { fetchScoreboard, fetchGameDetails } from '../services/espnApi';
import { POLLING_INTERVALS } from '../constants/api';

export function useGameData() {
  const intervalRef = useRef<number | null>(null);
  const isFirstFetch = useRef(true);
  const isFetching = useRef(false);
  const hasInitialized = useRef(false);

  // useLayoutEffect for SYNCHRONOUS reset BEFORE any rendering
  // This prevents Zustand store from keeping state between StrictMode mounts
  useLayoutEffect(() => {
    const store = useGameStore.getState();
    const hasConfirmedSelection = !!store.userConfirmedGameId;

    // Clear orphaned game (game exists but no selection)
    if (store.currentGame && !hasConfirmedSelection) {
      useGameStore.setState({
        currentGame: null,
        isLive: false,
        gameStats: null,
        userConfirmedGameId: null,
      });
    }

    // Clear orphaned selection (selection exists but no game)
    if (!store.currentGame && hasConfirmedSelection) {
      useGameStore.setState({
        userConfirmedGameId: null,
      });
    }
  }, []);

  const fetchData = useCallback(async () => {
    // Initialize and clear phantom state on first fetch
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      const store = useGameStore.getState();
      const hasConfirmedSelection = !!store.userConfirmedGameId;

      // If there's a currentGame but NO confirmed selection, it's phantom state - clear it!
      if (store.currentGame && !hasConfirmedSelection) {
        useGameStore.setState({
          currentGame: null,
          isLive: false,
          gameStats: null,
          userConfirmedGameId: null,
        });
      }
    }

    // Prevent concurrent fetches
    if (isFetching.current) {
      return;
    }

    isFetching.current = true;

    const store = useGameStore.getState();
    const { userConfirmedGameId, setAvailableGames, setCurrentGame, setGameStats, setLoading, setError } = store;

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

      // If user confirmed a game, use that game
      if (userConfirmedGameId) {
        gameToShow = games.find((g) => g.id === userConfirmedGameId);

        // If selection not found in current games, keep showing cached game
        if (!gameToShow) {
          const { currentGame } = useGameStore.getState();
          if (currentGame && currentGame.id === userConfirmedGameId) {
            gameToShow = currentGame;
          }
        }
      }

      if (gameToShow) {
        // Fetch details for live AND final games (for stats)
        const needsDetails = gameToShow.status === 'in_progress' ||
                             gameToShow.status === 'halftime' ||
                             gameToShow.status === 'final';

        if (needsDetails) {
          try {
            const details = await fetchGameDetails(gameToShow.id);

            // Re-check selection before updating - user may have changed selection during async fetch
            const currentSelection = useGameStore.getState().userConfirmedGameId;
            if (currentSelection && currentSelection !== gameToShow.id) {
              return;
            }

            if (details && details.game) {
              // Merge with scoreboard data to preserve season info AND correct status
              // The details API sometimes returns wrong status (scheduled instead of in_progress)
              // and missing clock data when it thinks the game is scheduled
              const gameWithSeasonInfo = {
                ...details.game,
                status: gameToShow.status,  // Use scoreboard status
                clock: gameToShow.clock,    // Use scoreboard clock data
                situation: gameToShow.situation || details.game.situation,
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
          // Re-check selection before updating
          const currentSelection = useGameStore.getState().userConfirmedGameId;
          if (currentSelection && currentSelection !== gameToShow.id) {
            return;
          }

          // For scheduled games, use scoreboard data directly
          setCurrentGame(gameToShow);
          setGameStats(null);
        }
      } else {
        // No game selected - clear current game to show picker
        useGameStore.setState({
          currentGame: null,
          isLive: false,
          gameStats: null,
          userConfirmedGameId: null,
        });
      }
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
    fetchData();

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
      hasInitialized.current = false;
    };
  }, [fetchData]);

  return {
    refetch: fetchData,
  };
}
