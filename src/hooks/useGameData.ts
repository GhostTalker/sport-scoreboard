import { useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../stores/gameStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useCurrentPlugin } from './usePlugin';
import { POLLING_INTERVALS, BUNDESLIGA_POLLING_INTERVAL } from '../constants/api';
import { isNFLGame, isBundesligaGame } from '../types/game';

export function useGameData() {
  // Get current plugin and adapter
  const plugin = useCurrentPlugin();
  const adapter = plugin?.adapter;
  const currentCompetition = useSettingsStore(state => state.currentCompetition);

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
    // Early return if adapter not loaded yet
    if (!adapter) {
      return;
    }

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

      // Fetch scoreboard (all games) using sport adapter
      const games = await adapter.fetchScoreboard();

      // Debug logging for game loading
      console.log(`[useGameData] Fetched ${games.length} games for ${adapter.sport}:`, games.map(g => ({
        id: g.id,
        competition: g.competition,
        teams: `${g.awayTeam.abbreviation} @ ${g.homeTeam.abbreviation}`,
        status: g.status
      })));

      // Show all games for the sport (don't filter by competition)
      // This allows showing both Bundesliga + DFB-Pokal games together
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
            const details = await adapter.fetchGameDetails(gameToShow.id);

            // Re-check selection before updating - user may have changed selection during async fetch
            const currentSelection = useGameStore.getState().userConfirmedGameId;
            if (currentSelection && currentSelection !== gameToShow.id) {
              return;
            }

            if (details && details.game) {
              // Merge with scoreboard data to preserve important info
              // For NFL: preserve season info, correct status, clock data
              // For Bundesliga: preserve matchday and current state

              // Preserve sport-specific fields
              if (isNFLGame(gameToShow) && isNFLGame(details.game)) {
                const mergedNFLGame = {
                  ...details.game,
                  status: gameToShow.status,
                  clock: gameToShow.clock,
                  situation: details.game.situation || gameToShow.situation, // Preserve situation if details doesn't have it
                  seasonType: gameToShow.seasonType,
                  week: gameToShow.week,
                  seasonName: gameToShow.seasonName,
                  startTime: gameToShow.startTime || details.game.startTime,
                  venue: gameToShow.venue || details.game.venue,
                  broadcast: gameToShow.broadcast || details.game.broadcast,
                };
                setCurrentGame(mergedNFLGame);
              } else if (isBundesligaGame(gameToShow) && isBundesligaGame(details.game)) {
                const mergedBLGame = {
                  ...details.game,
                  status: gameToShow.status,
                  clock: gameToShow.clock,
                  matchday: gameToShow.matchday,
                  startTime: gameToShow.startTime || details.game.startTime,
                  venue: gameToShow.venue || details.game.venue,
                  broadcast: gameToShow.broadcast || details.game.broadcast,
                };
                setCurrentGame(mergedBLGame);
              } else {
                // Fallback: just use details game
                setCurrentGame(details.game);
              }

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
  }, [adapter]);

  // Set up polling - refetch when sport changes OR when adapter becomes available
  useEffect(() => {
    // Only fetch if adapter is available
    if (!adapter) {
      console.log('[useGameData] Waiting for adapter to load...');
      return; // Wait for plugin to load
    }

    // Check if competition is set (required for multi-competition sports like Bundesliga)
    if (!currentCompetition) {
      // Don't fetch yet - wait for user to select competition
      console.log('[useGameData] Waiting for competition selection...');
      return;
    }

    console.log(`[useGameData] Adapter loaded for ${adapter.sport}, competition: ${currentCompetition}. Starting fetch...`);

    // Reset initialization flag when adapter changes (e.g., sport switch)
    hasInitialized.current = false;
    isFirstFetch.current = true;
    isFetching.current = false; // Reset fetching flag to allow immediate fetch

    // Immediate fetch when adapter becomes available - this is the key fix
    // The setTimeout(0) ensures the state is fully updated before fetching
    const immediateTimeout = setTimeout(() => {
      console.log(`[useGameData] Triggering immediate fetch for ${adapter.sport}`);
      fetchData();
    }, 0);

    const setupInterval = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      const { currentGame, isLive } = useGameStore.getState();
      let interval = POLLING_INTERVALS.scheduled;

      if (currentGame?.status === 'final') {
        interval = POLLING_INTERVALS.final;
      } else if (isLive) {
        // Use sport-specific intervals
        if (adapter.sport === 'bundesliga') {
          interval = BUNDESLIGA_POLLING_INTERVAL; // 15 seconds for Bundesliga
        } else {
          interval = POLLING_INTERVALS.live; // 10 seconds for NFL
        }
      }

      intervalRef.current = window.setInterval(fetchData, interval);
    };

    // Set up polling after initial fetch completes
    const pollSetupTimeout = setTimeout(() => {
      setupInterval();
    }, 100); // Small delay to let initial fetch start

    // Re-setup interval when game status changes
    const unsubscribe = useGameStore.subscribe((state, prevState) => {
      if (state.currentGame?.status !== prevState.currentGame?.status ||
          state.isLive !== prevState.isLive) {
        setupInterval();
      }
    });

    // Re-fetch when competition changes (sport changes handled by adapter dependency)
    const unsubscribeSport = useSettingsStore.subscribe((state, prevState) => {
      const competitionChanged = state.currentCompetition !== prevState.currentCompetition;
      const sportChanged = state.currentSport !== prevState.currentSport;

      // Sport change is handled by adapter dependency, don't double-clear
      if (sportChanged) {
        return;
      }

      if (competitionChanged) {
        // Competition changed but sport stayed the same
        // Adapter doesn't change, so we need to explicitly refetch
        console.log(`[useGameData] Competition changed to ${state.currentCompetition}, refetching...`);
        useGameStore.setState({
          currentGame: null,
          isLive: false,
          gameStats: null,
          userConfirmedGameId: null,
          availableGames: [],
        });
        isFetching.current = false; // Reset to allow fetch
        fetchData();
      }
    });

    return () => {
      clearTimeout(immediateTimeout);
      clearTimeout(pollSetupTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      unsubscribe();
      unsubscribeSport();
      hasInitialized.current = false;
    };
  }, [adapter, fetchData, currentCompetition]); // adapter and currentCompetition dependencies ensure refetch when plugin loads or competition changes

  return {
    refetch: fetchData,
  };
}
