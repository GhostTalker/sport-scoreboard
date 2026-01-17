import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../stores/gameStore';
import { useUIStore } from '../stores/uiStore';
import { useSettingsStore } from '../stores/settingsStore';
import { detectScoreChange } from '../services/scoreDetector';

/**
 * useScoreChange - Detects score changes and triggers celebrations
 *
 * MEMORY LEAK FIX: This hook properly cleans up all timeouts to prevent
 * lingering callbacks after component unmount or rapid score changes.
 */
export function useScoreChange() {
  const currentGame = useGameStore((state) => state.currentGame);
  const updateScores = useGameStore((state) => state.updateScores);
  const setScoringTeam = useGameStore((state) => state.setScoringTeam);
  const showCelebration = useUIStore((state) => state.showCelebration);
  const isCelebrationEnabled = useSettingsStore((state) => state.isCelebrationEnabled);
  const viewMode = useSettingsStore((state) => state.viewMode);

  // Track the current game ID to detect game changes
  const currentGameId = useRef<string | null>(null);
  const lastProcessedScores = useRef({ home: 0, away: 0 });
  const isFirstUpdateForGame = useRef(true);

  // Track active timeouts for cleanup - using Set for multiple concurrent timeouts
  const activeTimeouts = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  // Cleanup function for all timeouts
  const clearAllTimeouts = useCallback(() => {
    activeTimeouts.current.forEach((timeoutId) => {
      clearTimeout(timeoutId);
    });
    activeTimeouts.current.clear();
  }, []);

  // Helper to create a tracked timeout
  const createTrackedTimeout = useCallback(
    (callback: () => void, delay: number) => {
      const timeoutId = setTimeout(() => {
        callback();
        // Remove from tracking after execution
        activeTimeouts.current.delete(timeoutId);
      }, delay);
      activeTimeouts.current.add(timeoutId);
      return timeoutId;
    },
    []
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearAllTimeouts();
    };
  }, [clearAllTimeouts]);

  useEffect(() => {
    if (!currentGame) {
      // Reset everything when no game
      currentGameId.current = null;
      lastProcessedScores.current = { home: 0, away: 0 };
      isFirstUpdateForGame.current = true;
      // Clear any pending scoring team timeouts
      clearAllTimeouts();
      return;
    }

    const newHomeScore = currentGame.homeTeam.score;
    const newAwayScore = currentGame.awayTeam.score;

    // Check if this is a different game than before
    if (currentGameId.current !== currentGame.id) {
      // New game - reset tracking, don't trigger celebration
      currentGameId.current = currentGame.id;
      lastProcessedScores.current = { home: newHomeScore, away: newAwayScore };
      isFirstUpdateForGame.current = true;
      // Clear any pending scoring team timeouts from previous game
      clearAllTimeouts();
      updateScores(newHomeScore, newAwayScore);
      return;
    }

    // Skip the very first update after game change to avoid false triggers
    if (isFirstUpdateForGame.current) {
      isFirstUpdateForGame.current = false;
      lastProcessedScores.current = { home: newHomeScore, away: newAwayScore };
      updateScores(newHomeScore, newAwayScore);
      return;
    }

    // Check if scores have changed since last processed
    const { home: lastHome, away: lastAway } = lastProcessedScores.current;

    if (newHomeScore === lastHome && newAwayScore === lastAway) {
      return; // No change
    }

    // Only trigger celebration for score INCREASES (not decreases or corrections)
    const homeIncreased = newHomeScore > lastHome;
    const awayIncreased = newAwayScore > lastAway;

    if (homeIncreased || awayIncreased) {
      // Determine which team scored
      let scoringTeam: 'home' | 'away' | null = null;
      if (homeIncreased && !awayIncreased) {
        scoringTeam = 'home';
      } else if (awayIncreased && !homeIncreased) {
        scoringTeam = 'away';
      }

      // Set scoring team (for glow effect in SingleView)
      if (scoringTeam && viewMode === 'single') {
        // Clear any pending timeouts from previous scores
        clearAllTimeouts();

        setScoringTeam(scoringTeam);

        // Clear after 30 seconds using tracked timeout
        // This ensures cleanup on unmount or rapid score changes
        createTrackedTimeout(() => {
          setScoringTeam(null);
        }, 30000);
      }

      // Detect the score change type
      const scoreEvent = detectScoreChange(
        lastHome,
        lastAway,
        newHomeScore,
        newAwayScore
      );

      if (scoreEvent) {
        // Trigger celebration if we have a video for this score type AND it's enabled
        if (scoreEvent.video && isCelebrationEnabled(scoreEvent.video)) {
          showCelebration(scoreEvent.video);
        }
      }
    }

    // Update tracked scores
    lastProcessedScores.current = { home: newHomeScore, away: newAwayScore };
    updateScores(newHomeScore, newAwayScore);
  }, [
    currentGame,
    updateScores,
    showCelebration,
    isCelebrationEnabled,
    viewMode,
    setScoringTeam,
    clearAllTimeouts,
    createTrackedTimeout,
  ]);
}
