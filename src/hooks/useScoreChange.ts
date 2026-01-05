import { useEffect, useRef } from 'react';
import { useGameStore } from '../stores/gameStore';
import { useUIStore } from '../stores/uiStore';
import { detectScoreChange } from '../services/scoreDetector';

export function useScoreChange() {
  const currentGame = useGameStore((state) => state.currentGame);
  const previousScores = useGameStore((state) => state.previousScores);
  const updateScores = useGameStore((state) => state.updateScores);
  const showCelebration = useUIStore((state) => state.showCelebration);
  
  // Track if this is the initial load
  const isInitialLoad = useRef(true);
  const lastProcessedScores = useRef({ home: 0, away: 0 });

  useEffect(() => {
    if (!currentGame) {
      isInitialLoad.current = true;
      lastProcessedScores.current = { home: 0, away: 0 };
      return;
    }

    const newHomeScore = currentGame.homeTeam.score;
    const newAwayScore = currentGame.awayTeam.score;

    // Skip on initial load to prevent celebration on page load
    if (isInitialLoad.current) {
      isInitialLoad.current = false;
      lastProcessedScores.current = { home: newHomeScore, away: newAwayScore };
      updateScores(newHomeScore, newAwayScore);
      return;
    }

    // Check if scores have changed since last processed
    const { home: lastHome, away: lastAway } = lastProcessedScores.current;
    
    if (newHomeScore === lastHome && newAwayScore === lastAway) {
      return; // No change
    }

    // Detect the score change
    const scoreEvent = detectScoreChange(
      lastHome,
      lastAway,
      newHomeScore,
      newAwayScore
    );

    if (scoreEvent) {
      console.log('Score change detected:', scoreEvent);

      // Trigger celebration if we have a video for this score type
      if (scoreEvent.video) {
        showCelebration(scoreEvent.video);
      }
    }

    // Update tracked scores
    lastProcessedScores.current = { home: newHomeScore, away: newAwayScore };
    updateScores(newHomeScore, newAwayScore);
  }, [currentGame, updateScores, showCelebration]);
}
