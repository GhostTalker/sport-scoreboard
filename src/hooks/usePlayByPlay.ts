import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../stores/gameStore';
import { useUIStore } from '../stores/uiStore';
import { useSettingsStore } from '../stores/settingsStore';
import { API_ENDPOINTS, POLLING_INTERVALS } from '../constants/api';
import type { CelebrationType } from '../types/game';

// ESPN Play Type IDs that trigger celebrations
const CELEBRATION_PLAY_TYPES: Record<string, CelebrationType> = {
  '26': 'interception',  // Pass Interception Return
  '7': 'sack',           // Sack
  '36': 'fumble',        // Fumble
  '30': 'fumble',        // Muffed Punt Recovery (Opponent)
  '17': 'fumble',        // Blocked Punt
  // Note: Touchdowns and Field Goals are handled by score change detection
  // These are defensive/special teams plays that don't always result in score changes
};

interface PlayData {
  drives?: {
    previous?: Array<{
      plays?: Array<{
        id: string;
        sequenceNumber: number;
        type?: { id: string; text: string };
        text?: string;
        team?: { id: string };
      }>;
    }>;
    current?: {
      plays?: Array<{
        id: string;
        sequenceNumber: number;
        type?: { id: string; text: string };
        text?: string;
        team?: { id: string };
      }>;
    };
  };
  lastPlay?: {
    id: string;
    type?: { id: string; text: string };
    text?: string;
  };
}

export function usePlayByPlay() {
  const currentGame = useGameStore((state) => state.currentGame);
  const isLive = useGameStore((state) => state.isLive);
  const showCelebration = useUIStore((state) => state.showCelebration);
  const celebrationOverlay = useUIStore((state) => state.celebrationOverlay);
  const isCelebrationEnabled = useSettingsStore((state) => state.isCelebrationEnabled);

  // Track last seen play to avoid duplicate celebrations
  const lastSeenPlayId = useRef<string | null>(null);
  const lastGameId = useRef<string | null>(null);
  const isFirstFetch = useRef(true);

  const fetchPlays = useCallback(async (gameId: string): Promise<PlayData | null> => {
    try {
      const response = await fetch(API_ENDPOINTS.plays(gameId));
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      console.error('Failed to fetch plays:', error);
      return null;
    }
  }, []);

  const detectCelebrationPlay = useCallback((playData: PlayData): CelebrationType | null => {
    // Get the most recent play from drives
    const currentDrive = playData.drives?.current;
    const previousDrives = playData.drives?.previous || [];

    // Collect all plays from current and previous drives
    const allPlays: Array<{
      id: string;
      sequenceNumber: number;
      type?: { id: string; text: string };
      team?: { id: string };
    }> = [];

    if (currentDrive?.plays) {
      allPlays.push(...currentDrive.plays);
    }

    // Get plays from the most recent previous drive (last completed drive)
    if (previousDrives.length > 0) {
      const lastDrive = previousDrives[previousDrives.length - 1];
      if (lastDrive?.plays) {
        allPlays.push(...lastDrive.plays);
      }
    }

    if (allPlays.length === 0) return null;

    // Sort by sequence number to get the most recent
    allPlays.sort((a, b) => (b.sequenceNumber || 0) - (a.sequenceNumber || 0));
    const latestPlay = allPlays[0];

    if (!latestPlay || !latestPlay.type?.id) return null;

    // Check if this is a new play we haven't seen
    if (latestPlay.id === lastSeenPlayId.current) {
      return null;
    }

    // Update last seen play
    lastSeenPlayId.current = latestPlay.id;

    // Skip first fetch to avoid triggering on page load
    if (isFirstFetch.current) {
      isFirstFetch.current = false;
      return null;
    }

    // Check if this play type triggers a celebration
    const playTypeId = latestPlay.type.id;
    const celebrationType = CELEBRATION_PLAY_TYPES[playTypeId];

    if (!celebrationType) return null;

    // Optional: Only trigger for plays involving the user's primary team
    // For now, we trigger for all plays
    // if (primaryTeamId && latestPlay.team?.id !== primaryTeamId) {
    //   return null;
    // }

    return celebrationType;
  }, []);

  useEffect(() => {
    // Reset tracking when game changes
    if (currentGame?.id !== lastGameId.current) {
      lastGameId.current = currentGame?.id || null;
      lastSeenPlayId.current = null;
      isFirstFetch.current = true;
    }

    // Only poll when game is live and no celebration is showing
    if (!currentGame?.id || !isLive || celebrationOverlay.visible) {
      return;
    }

    let timeoutId: number;
    let isMounted = true;

    const pollPlays = async () => {
      if (!isMounted || !currentGame?.id) return;

      const playData = await fetchPlays(currentGame.id);

      if (playData && isMounted) {
        const celebration = detectCelebrationPlay(playData);
        // Only show celebration if this type is enabled in settings
        if (celebration && isCelebrationEnabled(celebration)) {
          showCelebration(celebration);
        }
      }

      // Schedule next poll
      if (isMounted && isLive) {
        timeoutId = window.setTimeout(pollPlays, POLLING_INTERVALS.plays);
      }
    };

    // Start polling
    pollPlays();

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [currentGame?.id, isLive, celebrationOverlay.visible, fetchPlays, detectCelebrationPlay, showCelebration, isCelebrationEnabled]);
}
