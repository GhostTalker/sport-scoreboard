import type { ScoreEvent, ScoreType, NFLCelebrationType } from '../types/game';

/**
 * @deprecated This service is deprecated in favor of the adapter-based score detection.
 * Use `adapter.detectScoreChange()` instead for sport-specific score change detection.
 * This file is kept for backward compatibility with `useScoreChange` hook but should
 * be migrated to use the plugin adapter's `detectScoreChange()` method.
 *
 * Migration path:
 * 1. Update `useScoreChange` hook to use `adapter.detectScoreChange()` from the current plugin
 * 2. Remove this service once migration is complete
 *
 * @see src/adapters/SportAdapter.ts - SportAdapter.detectScoreChange()
 * @see src/plugins/nfl/adapter.ts - NFLAdapter.detectScoreChange()
 * @see src/plugins/bundesliga/adapter.ts - BundesligaAdapter.detectScoreChange()
 */

/**
 * Detects the type of score based on point differential
 * @deprecated Use adapter.detectScoreChange() instead
 */
export function detectScoreChange(
  prevHome: number,
  prevAway: number,
  newHome: number,
  newAway: number
): ScoreEvent | null {
  const homeDiff = newHome - prevHome;
  const awayDiff = newAway - prevAway;

  // No score change
  if (homeDiff === 0 && awayDiff === 0) {
    return null;
  }

  // Only one team can score at a time
  if (homeDiff > 0 && awayDiff === 0) {
    return analyzeScore(homeDiff, 'home');
  }

  if (awayDiff > 0 && homeDiff === 0) {
    return analyzeScore(awayDiff, 'away');
  }

  // Edge case: both scores changed (shouldn't happen, but handle it)
  // This could happen if we missed an update
  console.warn('Both scores changed simultaneously - possible missed update');

  // Prioritize the larger change
  if (homeDiff >= awayDiff) {
    return analyzeScore(homeDiff, 'home');
  }
  return analyzeScore(awayDiff, 'away');
}

function analyzeScore(diff: number, team: 'home' | 'away'): ScoreEvent {
  const result: ScoreEvent = {
    team,
    type: getScoreType(diff),
    points: diff,
    video: getVideoType(diff),
  };

  return result;
}

function getScoreType(diff: number): ScoreType {
  switch (diff) {
    case 1:
      return 'EXTRA_POINT';
    case 2:
      return 'SAFETY'; // Could also be 2-point conversion
    case 3:
      return 'FIELD_GOAL';
    case 6:
      return 'TOUCHDOWN';
    case 7:
      return 'TOUCHDOWN_PAT';
    case 8:
      return 'TOUCHDOWN_2PT';
    default:
      // For any other value (e.g., 9+ from multiple plays at once)
      // Assume it includes a touchdown
      if (diff >= 6) {
        return 'TOUCHDOWN';
      }
      return 'FIELD_GOAL';
  }
}

function getVideoType(diff: number): NFLCelebrationType | null {
  // Touchdown scenarios: 6, 7, 8 points
  if (diff >= 6) {
    return 'touchdown';
  }

  // Field goal: 3 points
  if (diff === 3) {
    return 'fieldgoal';
  }

  // Safety: 2 points (defensive score)
  if (diff === 2) {
    return 'safety';
  }

  // Extra Point (1 point) - no video
  return null;
}
