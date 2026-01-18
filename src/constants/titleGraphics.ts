// Title Graphics Mapping
// Maps season names to their corresponding title graphics

export const TITLE_GRAPHICS: Record<string, string> = {
  // NFL Graphics
  'SUPER BOWL': '/title/superbowl.png',
  'CONFERENCE CHAMPIONSHIP': '/title/conference.png',
  'DIVISIONAL ROUND': '/title/divisional.png',
  'WILD CARD': '/title/wildcard.png',
  'GAME DAY': '/title/gameday.png',
  'PRESEASON': '/title/gameday.png',

  // Bundesliga Graphics
  'BUNDESLIGA': '/title/bundesliga.png',
  'DFB-POKAL': '/title/dfbpokal.png',
  'DFB-POKAL FINALE': '/title/dfbpokalfinale.png',

  // UEFA Champions League Graphics
  'GROUP STAGE': '/title/championsleague.png',
  'LEAGUE PHASE': '/title/championsleague.png', // New format 2024+
  'ROUND OF 16': '/title/championsleague-playoffs.png',
  'QUARTER-FINALS': '/title/championsleague-quaterfinals.png',
  'SEMI-FINALS': '/title/championsleague-semifinals.png',
  'FINAL': '/title/championsleague-finals.png',
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

  // For NFL games without a specific season name, use GAME DAY
  // For other sports, return null (no title graphic)
  if (seasonName.includes('BUNDESLIGA') || seasonName.includes('POKAL')) {
    return null; // Shouldn't happen if competition is set correctly
  }

  return TITLE_GRAPHICS['GAME DAY'];
}
