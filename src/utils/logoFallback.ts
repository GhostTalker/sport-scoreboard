// External logo sources for when OpenLigaDB logos are missing or low quality
// This provides fallback URLs from Wikipedia/Wikimedia Commons
// Team names MUST match OpenLigaDB exactly (e.g., "FC Bayern München" not "Bayern München")
const WIKIMEDIA_DIRECT_LOGOS: Record<string, string> = {
  // German Clubs (OpenLigaDB names)
  'Borussia Dortmund': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Borussia_Dortmund_logo.svg/200px-Borussia_Dortmund_logo.svg.png',
  'FC Bayern München': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg/200px-FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg.png',
  'Bayer 04 Leverkusen': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Bayer_Leverkusen_Logo.svg/200px-Bayer_Leverkusen_Logo.svg.png',
  'Eintracht Frankfurt': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/04/Eintracht_Frankfurt_Logo.svg/200px-Eintracht_Frankfurt_Logo.svg.png',

  // English Clubs (OpenLigaDB names)
  'FC Liverpool': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Liverpool_FC.svg/200px-Liverpool_FC.svg.png',
  'Chelsea FC': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Chelsea_FC.svg/200px-Chelsea_FC.svg.png',
  'Arsenal FC': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Arsenal_FC.svg/200px-Arsenal_FC.svg.png',
  'Manchester City': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Manchester_City_FC_badge.svg/200px-Manchester_City_FC_badge.svg.png',
  'Tottenham Hotspur FC': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b4/Tottenham_Hotspur.svg/200px-Tottenham_Hotspur.svg.png',
  'Newcastle United FC': 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/56/Newcastle_United_Logo.svg/200px-Newcastle_United_Logo.svg.png',

  // Spanish Clubs (OpenLigaDB names)
  'FC Barcelona': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/FC_Barcelona_%28crest%29.svg/200px-FC_Barcelona_%28crest%29.svg.png',
  'Atlético Madrid': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/Atletico_Madrid_2017_logo.svg/200px-Atletico_Madrid_2017_logo.svg.png',
  'Villarreal CF': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Villarreal_CF_logo-en.svg/200px-Villarreal_CF_logo-en.svg.png',
  'Athletic Club': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f1/Athletic_Club.svg/200px-Athletic_Club.svg.png',

  // Italian Clubs (OpenLigaDB names)
  'Inter Mailand': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/FC_Internazionale_Milano_2021.svg/200px-FC_Internazionale_Milano_2021.svg.png',
  'Juventus Turin': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6d/Juventus_logo.svg/200px-Juventus_logo.svg.png',
  'SSC Neapel': 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2d/SSC_Neapel.svg/200px-SSC_Neapel.svg.png',
  'Atalanta Bergamo': 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/66/Atalanta_BC_logo.svg/200px-Atalanta_BC_logo.svg.png',

  // French Clubs (OpenLigaDB names)
  'Paris St. Germain': 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Paris_Saint-Germain_Logo.svg/200px-Paris_Saint-Germain_Logo.svg.png',

  // Dutch Clubs (OpenLigaDB names)
  'PSV Eindhoven': 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/PSV_Eindhoven.svg/200px-PSV_Eindhoven.svg.png',

  // Belgian Clubs (OpenLigaDB names)
  'FC Brügge': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/Club_Brugge_KV_logo.svg/200px-Club_Brugge_KV_logo.svg.png',
  'Union Saint-Gilloise': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/Royale_Union_Saint-Gilloise_logo.svg/200px-Royale_Union_Saint-Gilloise_logo.svg.png',

  // Portuguese Clubs (OpenLigaDB names)
  'Benfica Lissabon': 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/SL_Benfica_logo.svg/200px-SL_Benfica_logo.svg.png',
  'Sporting CP': 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/Sporting_Clube_de_Portugal_%28Logo%29.svg/200px-Sporting_Clube_de_Portugal_%28Logo%29.svg.png',

  // Turkish Clubs (OpenLigaDB names)
  'Galatasaray Istanbul': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Galatasaray_Sports_Club_Logo.png/200px-Galatasaray_Sports_Club_Logo.png',

  // Other Clubs (OpenLigaDB names)
  'FC Kopenhagen': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/78/FC_K%C3%B8benhavn_logo.svg/200px-FC_K%C3%B8benhavn_logo.svg.png',
  'Qarabag FK': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Qaraba%C4%9F_FK_logo.svg/200px-Qaraba%C4%9F_FK_logo.svg.png',
  'FK Bodö/Glimt': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/FK_Bodo_Glimt_logo.svg/200px-FK_Bodo_Glimt_logo.svg.png',
  'Olympiakos Piräus': 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/da/Olympiacos_FC_logo.svg/200px-Olympiacos_FC_logo.svg.png',
  'Paphos FC': 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/Pafos_FC_logo.svg/200px-Pafos_FC_logo.svg.png',
};

/**
 * Get a fallback logo URL for a team name
 * Uses Wikimedia Commons as fallback source
 */
export function getLogoFallback(teamName: string): string | null {
  // First try direct logo mapping
  if (WIKIMEDIA_DIRECT_LOGOS[teamName]) {
    return WIKIMEDIA_DIRECT_LOGOS[teamName];
  }

  // Try partial matches (for slight name variations)
  for (const [key, url] of Object.entries(WIKIMEDIA_DIRECT_LOGOS)) {
    if (teamName.includes(key) || key.includes(teamName)) {
      return url;
    }
  }

  return null;
}

/**
 * Get the best quality logo URL, with fallbacks
 * 1. Try OpenLigaDB logo
 * 2. Fall back to Wikimedia Commons
 * 3. Return placeholder if all fail
 */
export function getBestLogoUrl(openLigaDbUrl: string, teamName: string): string {
  // If OpenLigaDB URL looks good, use it
  if (openLigaDbUrl && openLigaDbUrl.includes('http')) {
    return openLigaDbUrl;
  }

  // Try fallback
  const fallback = getLogoFallback(teamName);
  if (fallback) {
    return fallback;
  }

  // Return original (even if it's bad)
  return openLigaDbUrl || '/images/tbd-logo.svg';
}
