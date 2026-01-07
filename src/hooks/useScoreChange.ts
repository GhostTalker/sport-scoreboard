import { useEffect, useRef } from 'react';
import { useGameStore } from '../stores/gameStore';
import { useUIStore } from '../stores/uiStore';
import { detectScoreChange } from '../services/scoreDetector';

export function useScoreChange() {
  const currentGame = useGameStore((state) => state.currentGame);
  const updateScores = useGameStore((state) => state.updateScores);
  const showCelebration = useUIStore((state) => state.showCelebration);
  
  // Track the current game ID to detect game changes
  const currentGameId = useRef<string | null>(null);
  const lastProcessedScores = useRef({ home: 0, away: 0 });
  const isFirstUpdateForGame = useRef(true);

  useEffect(() => {
    if (!currentGame) {
      // Reset everything when no game
      currentGameId.current = null;
      lastProcessedScores.current = { home: 0, away: 0 };
      isFirstUpdateForGame.current = true;
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
      // Detect the score change type
      const scoreEvent = detectScoreChange(
        lastHome,
        lastAway,
        newHomeScore,
        newAwayScore
      );

      if (scoreEvent) {

        // Trigger celebration if we have a video for this score type
        if (scoreEvent.video) {
          showCelebration(scoreEvent.video);
        }
      }
    }

    // Update tracked scores
    lastProcessedScores.current = { home: newHomeScore, away: newAwayScore };
    updateScores(newHomeScore, newAwayScore);
  }, [currentGame, updateScores, showCelebration]);
}
