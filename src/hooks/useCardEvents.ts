import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../stores/gameStore';
import { useUIStore } from '../stores/uiStore';
import { useSettingsStore } from '../stores/settingsStore';
import { fetchAllLiveCardEvents, ProcessedCardEvent } from '../services/apiFootball';
import type { CelebrationType } from '../types/game';

// Polling interval for card events (30 seconds - cards are rare events)
// This is separate from minute sync which polls every 1-10 minutes
const CARD_POLLING_INTERVAL = 30000;

/**
 * useCardEvents - Detects red card events in live Bundesliga games
 *
 * Since OpenLigaDB does NOT provide card data, we use API-Football events endpoint
 * to detect red cards and yellow-red cards (second yellow = send off)
 *
 * This hook:
 * 1. Polls API-Football for card events during live Bundesliga games
 * 2. Tracks seen card events to avoid duplicate celebrations
 * 3. Triggers celebration videos for new red cards
 *
 * Only triggers for:
 * - Direct red cards ('red_card')
 * - Second yellow cards ('yellow_red_card')
 *
 * Does NOT trigger for regular yellow cards (too frequent, not dramatic enough)
 */
export function useCardEvents() {
  const currentGame = useGameStore((state) => state.currentGame);
  const isLive = useGameStore((state) => state.isLive);
  const showCelebration = useUIStore((state) => state.showCelebration);
  const celebrationOverlay = useUIStore((state) => state.celebrationOverlay);
  const isCelebrationEnabled = useSettingsStore((state) => state.isCelebrationEnabled);
  const currentSport = useSettingsStore((state) => state.currentSport);

  // Track seen card events to avoid duplicate celebrations
  // Key: eventId (fixtureId-playerId-minute)
  const seenCardEvents = useRef<Set<string>>(new Set());

  // Track last game ID to reset seen events when switching games
  const lastGameId = useRef<string | null>(null);

  // Skip first fetch to avoid triggering on page load
  const isFirstFetch = useRef(true);

  const processCardEvents = useCallback((events: ProcessedCardEvent[]): CelebrationType | null => {
    // Find new card events we haven't seen yet
    const newEvents = events.filter(event => !seenCardEvents.current.has(event.eventId));

    if (newEvents.length === 0) {
      return null;
    }

    // Mark all new events as seen
    newEvents.forEach(event => {
      seenCardEvents.current.add(event.eventId);
    });

    // Skip first fetch to avoid triggering on page load
    if (isFirstFetch.current) {
      isFirstFetch.current = false;
      return null;
    }

    // Return the most recent new card event type
    // If there are multiple new cards, we just show one celebration
    // (Multiple red cards in 30 seconds is extremely rare)
    const latestCard = newEvents[newEvents.length - 1];

    console.log(`RED CARD DETECTED! ${latestCard.playerName} (${latestCard.teamName}) - ${latestCard.cardType}`);

    return latestCard.cardType;
  }, []);

  useEffect(() => {
    // Only run for Bundesliga (soccer sports)
    // NFL doesn't have red cards, obviously!
    if (currentSport !== 'bundesliga') {
      return;
    }

    // Reset tracking when game changes
    if (currentGame?.id !== lastGameId.current) {
      lastGameId.current = currentGame?.id || null;
      seenCardEvents.current.clear();
      isFirstFetch.current = true;
    }

    // Only poll when game is live and no celebration is showing
    if (!currentGame?.id || !isLive || celebrationOverlay.visible) {
      return;
    }

    let timeoutId: number;
    let isMounted = true;

    const pollCardEvents = async () => {
      if (!isMounted) return;

      try {
        const cardEvents = await fetchAllLiveCardEvents();

        if (cardEvents.length > 0 && isMounted) {
          const celebration = processCardEvents(cardEvents);

          // Only show celebration if this type is enabled in settings
          if (celebration && isCelebrationEnabled(celebration)) {
            showCelebration(celebration);
          }
        }
      } catch (error) {
        console.error('Card event polling failed:', error);
      }

      // Schedule next poll
      if (isMounted && isLive) {
        timeoutId = window.setTimeout(pollCardEvents, CARD_POLLING_INTERVAL);
      }
    };

    // Start polling
    pollCardEvents();

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [
    currentGame?.id,
    isLive,
    celebrationOverlay.visible,
    currentSport,
    processCardEvents,
    showCelebration,
    isCelebrationEnabled,
  ]);
}
