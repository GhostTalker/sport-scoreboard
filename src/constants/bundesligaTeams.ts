// Bundesliga Team Colors
// OpenLigaDB Team ID → Team Colors mapping

export interface BundesligaTeamColors {
  name: string;
  color: string;
  alternateColor: string;
}

export const BUNDESLIGA_TEAMS: Record<number, BundesligaTeamColors> = {
  // 2024/25 Season Teams
  40: {
    name: 'FC Bayern München',
    color: 'DC143C', // Red
    alternateColor: 'FFFFFF', // White
  },
  7: {
    name: 'Borussia Dortmund',
    color: 'FDE100', // Yellow
    alternateColor: '000000', // Black
  },
  9: {
    name: 'FC Schalke 04',
    color: '1B75BB', // Blue
    alternateColor: 'FFFFFF', // White
  },
  87: {
    name: 'Werder Bremen',
    color: '1D9053', // Green
    alternateColor: 'FFFFFF', // White
  },
  16: {
    name: 'VfB Stuttgart',
    color: 'DC0028', // Red
    alternateColor: 'FFFFFF', // White
  },
  6: {
    name: 'Bayer 04 Leverkusen',
    color: 'E32221', // Red
    alternateColor: '000000', // Black
  },
  91: {
    name: 'Eintracht Frankfurt',
    color: 'E1000F', // Red
    alternateColor: 'FFFFFF', // White
  },
  54: {
    name: 'Hertha BSC',
    color: '005CA9', // Blue
    alternateColor: 'FFFFFF', // White
  },
  112: {
    name: 'RB Leipzig',
    color: 'DD0741', // Red
    alternateColor: 'FFFFFF', // White
  },
  3209: {
    name: 'TSG 1899 Hoffenheim',
    color: '1961B5', // Blue
    alternateColor: 'FFFFFF', // White
  },
  81: {
    name: 'SC Freiburg',
    color: 'E2001A', // Red
    alternateColor: 'FFFFFF', // White
  },
  131: {
    name: 'VfL Wolfsburg',
    color: '65B32E', // Green
    alternateColor: 'FFFFFF', // White
  },
  18: {
    name: "Borussia Mönchengladbach",
    color: '000000', // Black
    alternateColor: 'FFFFFF', // White
  },
  80: {
    name: '1. FSV Mainz 05',
    color: 'C3011E', // Red
    alternateColor: 'FFFFFF', // White
  },
  95: {
    name: 'FC Augsburg',
    color: 'BA3733', // Red
    alternateColor: 'FFFFFF', // White
  },
  65: {
    name: '1. FC Köln',
    color: 'ED1C24', // Red
    alternateColor: 'FFFFFF', // White
  },
  28: {
    name: '1. FC Union Berlin',
    color: 'EB1923', // Red
    alternateColor: 'F4C318', // Yellow
  },
  32: {
    name: 'VfL Bochum 1848',
    color: '005CA9', // Blue
    alternateColor: 'FFFFFF', // White
  },

  // Additional teams (2. Bundesliga or former teams)
  55: {
    name: 'Hannover 96',
    color: '006838', // Green
    alternateColor: 'FFFFFF', // White
  },
  76: {
    name: 'Hamburger SV',
    color: '0069B4', // Blue
    alternateColor: 'FFFFFF', // White
  },
  100: {
    name: '1. FC Nürnberg',
    color: '8C1721', // Dark Red
    alternateColor: 'FFFFFF', // White
  },
  134: {
    name: 'Fortuna Düsseldorf',
    color: 'E30613', // Red
    alternateColor: 'FFFFFF', // White
  },
  167: {
    name: 'SV Darmstadt 98',
    color: '003D7A', // Blue
    alternateColor: 'FFFFFF', // White
  },
  175: {
    name: 'FC St. Pauli',
    color: '6C3014', // Brown
    alternateColor: 'FFFFFF', // White
  },
  185: {
    name: 'SC Paderborn 07',
    color: '005CA9', // Blue
    alternateColor: 'FFFFFF', // White
  },
  229: {
    name: 'SpVgg Greuther Fürth',
    color: '009A44', // Green
    alternateColor: 'FFFFFF', // White
  },
};

/**
 * Get team color by OpenLigaDB team ID
 * Returns default blue if team not found
 */
export function getBundesligaTeamColor(teamId: number): string {
  return BUNDESLIGA_TEAMS[teamId]?.color || '0000FF';
}

/**
 * Get team alternate color by OpenLigaDB team ID
 * Returns default white if team not found
 */
export function getBundesligaTeamAlternateColor(teamId: number): string {
  return BUNDESLIGA_TEAMS[teamId]?.alternateColor || 'FFFFFF';
}
