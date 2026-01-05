import type { ScoreEvent, ScoreType } from '../types/game';

/**
 * Detects the type of score based on point differential
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

function getVideoType(diff: number): 'touchdown' | 'fieldgoal' | null {
  // Touchdown scenarios: 6, 7, 8 points
  if (diff >= 6) {
    return 'touchdown';
  }

  // Field goal: 3 points
  if (diff === 3) {
    return 'fieldgoal';
  }

  // Safety (2 points) or Extra Point (1 point) - no video
  // These are usually part of a larger play or minor scoring
  return null;
}

/**
 * Get a human-readable description of the score event
 */
export function getScoreDescription(event: ScoreEvent): string {
  switch (event.type) {
    case 'TOUCHDOWN':
      return 'TOUCHDOWN!';
    case 'TOUCHDOWN_PAT':
      return 'TOUCHDOWN!';
    case 'TOUCHDOWN_2PT':
      return 'TOUCHDOWN + 2PT!';
    case 'FIELD_GOAL':
      return 'FIELD GOAL!';
    case 'SAFETY':
      return 'SAFETY!';
    case 'EXTRA_POINT':
      return 'EXTRA POINT';
    case 'TWO_POINT_CONVERSION':
      return '2-POINT CONVERSION!';
    default:
      return 'SCORE!';
  }
}
