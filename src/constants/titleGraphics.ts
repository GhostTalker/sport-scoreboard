// Title Graphics Mapping
// Maps season names to their corresponding title graphics

export const TITLE_GRAPHICS: Record<string, string> = {
  'SUPER BOWL': '/title/superbowl.png',
  'CONFERENCE CHAMPIONSHIP': '/title/conference.png',
  'DIVISIONAL ROUND': '/title/divisional.png',
  'WILD CARD': '/title/wildcard.png',
  // Default for regular season and other games
  'GAME DAY': '/title/gameday.png',
  'PRESEASON': '/title/gameday.png',
};

/**
 * Get the appropriate title graphic for a given season name
 * @param seasonName - The season name (e.g., "SUPER BOWL", "WILD CARD")
 * @returns Path to the title graphic, or default gameday graphic
 */
export function getTitleGraphic(seasonName?: string): string | null {
  if (!seasonName) return null;
  
  // Check for exact match first
  if (TITLE_GRAPHICS[seasonName]) {
    return TITLE_GRAPHICS[seasonName];
  }
  
  // Default to gameday graphic for any unmatched season name
  return TITLE_GRAPHICS['GAME DAY'];
}
