import { useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../stores/gameStore';
import { fetchScoreboard, fetchGameDetails } from '../services/espnApi';
import { POLLING_INTERVALS } from '../constants/api';

export function useGameData() {
  const intervalRef = useRef<number | null>(null);
  const isFirstFetch = useRef(true);
  const isFetching = useRef(false);
  const hasInitialized = useRef(false);

  // ALFRED'S FIX: useLayoutEffect for SYNCHRONOUS reset BEFORE any rendering
  // This prevents Zustand store from keeping state between StrictMode mounts
  useLayoutEffect(() => {
    const store = useGameStore.getState();
    console.log('[LAYOUT-MOUNT] Checking store state:', {
      hasCurrentGame: !!store.currentGame,
      currentGameId: store.currentGame?.id,
      userConfirmedGameId: store.userConfirmedGameId,
      manuallySelectedGameId: store.manuallySelectedGameId
    });

    // Check if there's a confirmed selection
    const hasConfirmedSelection = store.userConfirmedGameId || store.manuallySelectedGameId;

    // ALWAYS clear orphaned state on mount (synchronously!)
    // Clear orphaned game (game exists but no selection)
    if (store.currentGame && !hasConfirmedSelection) {
      console.log('[LAYOUT-MOUNT] SYNC clearing orphaned game state');
      useGameStore.setState({
        currentGame: null,
        isLive: false,
        gameStats: null,
        userConfirmedGameId: null,
        manuallySelectedGameId: null
      });
    }

    // Clear orphaned selection (selection exists but no game)
    if (!store.currentGame && hasConfirmedSelection) {
      console.log('[LAYOUT-MOUNT] SYNC clearing orphaned selection');
      useGameStore.setState({
        userConfirmedGameId: null,
        manuallySelectedGameId: null
      });
    }
  }, []); // Empty deps - only on mount

  const fetchData = useCallback(async () => {
    const fetchId = Math.random().toString(36).substring(7);
    console.log(`[FETCH-START ${fetchId}] Beginning fetch...`);

    // CRITICAL: Initialize and clear phantom state FIRST (before any fetching)
    if (!hasInitialized.current) {
      hasInitialized.current = true;
      const store = useGameStore.getState();
      const hasConfirmedSelection = store.userConfirmedGameId || store.manuallySelectedGameId;

      console.log('[INIT] Checking for phantom state:', {
        hasCurrentGame: !!store.currentGame,
        currentGameId: store.currentGame?.id,
        userConfirmedGameId: store.userConfirmedGameId,
        manuallySelectedGameId: store.manuallySelectedGameId
      });

      // If there's a currentGame but NO confirmed selection, it's phantom state - clear it!
      if (store.currentGame && !hasConfirmedSelection) {
        console.log('[INIT] CLEARING phantom game state - no confirmed selection exists!');
        // Use Zustand's setState directly to bypass any guards
        useGameStore.setState({
          currentGame: null,
          isLive: false,
          gameStats: null,
          userConfirmedGameId: null,
          manuallySelectedGameId: null
        });
      }
    }

    // Prevent concurrent fetches
    if (isFetching.current) {
      return;
    }

    isFetching.current = true;

    // Get current state directly from store
    const store = useGameStore.getState();
    const { userConfirmedGameId, manuallySelectedGameId, setAvailableGames, setCurrentGame, setGameStats, setLoading, setError } = store;

    // Use the NEW variable (userConfirmedGameId) as primary
    const selectedGameId = userConfirmedGameId || manuallySelectedGameId;

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

      console.log('[DEBUG] userConfirmedGameId:', userConfirmedGameId);
      console.log('[DEBUG] manuallySelectedGameId:', manuallySelectedGameId);
      console.log('[DEBUG] Using selectedGameId:', selectedGameId);

      // If user confirmed a game, ALWAYS use that game
      if (selectedGameId) {
        gameToShow = games.find((g) => g.id === selectedGameId);
        console.log('[DEBUG] Found selected game:', gameToShow ? `${gameToShow.id} ${`${gameToShow.awayTeam.abbreviation} @ ${gameToShow.homeTeam.abbreviation}`}` : 'NOT FOUND');

        // If selection not found in current games, keep showing it anyway
        if (!gameToShow) {
          const { currentGame } = useGameStore.getState();
          if (currentGame && currentGame.id === selectedGameId) {
            gameToShow = currentGame;
            console.log('[DEBUG] Using cached selected game:', `${gameToShow.id} ${`${gameToShow.awayTeam.abbreviation} @ ${gameToShow.homeTeam.abbreviation}`}`);
          }
        }
      }

      // NO AUTO SELECTION - User must select a game
      console.log('[DEBUG] Final game to show:', gameToShow ? `${gameToShow.id} ${gameToShow.awayTeam.abbreviation} @ ${gameToShow.homeTeam.abbreviation}` : 'NONE - User must select a game');

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
      } else {
        // No game selected - clear current game to show picker
        console.log('[DEBUG] No game selected, clearing currentGame');
        // CRITICAL: Use setState directly to bypass guards in setCurrentGame
        useGameStore.setState({
          currentGame: null,
          isLive: false,
          gameStats: null,
          userConfirmedGameId: null, // NEW: Clear user confirmation
          manuallySelectedGameId: null, // Legacy: Clear this too
        });

        // VERIFY the clear worked
        const afterClear = useGameStore.getState();
        console.log('[DEBUG] After setState clear:', {
          currentGame: afterClear.currentGame,
          userConfirmedGameId: afterClear.userConfirmedGameId,
          manuallySelectedGameId: afterClear.manuallySelectedGameId
        });
      }
    } catch (error) {
      console.error('Error fetching game data:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch game data');
    } finally {
      setLoading(false);
      isFirstFetch.current = false;
      isFetching.current = false;
      console.log(`[FETCH-END ${fetchId}] Fetch complete`);
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
      hasInitialized.current = false; // FIX 1: Reset on unmount to fix StrictMode double-mount
    };
  }, [fetchData]);

  return {
    refetch: fetchData,
  };
}
