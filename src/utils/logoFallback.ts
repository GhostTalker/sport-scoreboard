// External logo sources for when OpenLigaDB logos are missing or low quality
// This provides HIGH-RESOLUTION direct SVG URLs from Wikipedia/Wikimedia Commons
// Team names MUST match OpenLigaDB exactly (e.g., "FC Bayern München" not "Bayern München")
// Using direct SVG URLs for maximum quality (vector graphics scale perfectly)
const WIKIMEDIA_DIRECT_LOGOS: Record<string, string> = {
  // German Clubs (OpenLigaDB names) - Direct SVG URLs
  'Borussia Dortmund': 'https://upload.wikimedia.org/wikipedia/commons/6/67/Borussia_Dortmund_logo.svg',
  'FC Bayern München': 'https://upload.wikimedia.org/wikipedia/commons/1/1b/FC_Bayern_M%C3%BCnchen_logo_%282017%29.svg',
  'Bayer 04 Leverkusen': 'https://upload.wikimedia.org/wikipedia/en/5/59/Bayer_04_Leverkusen_logo.svg',
  'Eintracht Frankfurt': 'https://i.imgur.com/X8NFkOb.png', // High-res PNG from Imgur (OpenLigaDB source)

  // English Clubs (OpenLigaDB names) - Direct SVG URLs
  'FC Liverpool': 'https://upload.wikimedia.org/wikipedia/en/0/0c/Liverpool_FC.svg',
  'Chelsea FC': 'https://upload.wikimedia.org/wikipedia/en/c/cc/Chelsea_FC.svg',
  'Arsenal FC': 'https://upload.wikimedia.org/wikipedia/en/5/53/Arsenal_FC.svg',
  'Manchester City': 'https://upload.wikimedia.org/wikipedia/en/e/eb/Manchester_City_FC_badge.svg',
  'Tottenham Hotspur FC': 'https://upload.wikimedia.org/wikipedia/en/b/b4/Tottenham_Hotspur.svg',
  'Newcastle United FC': 'https://upload.wikimedia.org/wikipedia/en/5/56/Newcastle_United_Logo.svg',

  // Spanish Clubs (OpenLigaDB names) - Direct SVG URLs
  'FC Barcelona': 'https://upload.wikimedia.org/wikipedia/en/4/47/FC_Barcelona_%28crest%29.svg',
  'Atlético Madrid': 'https://upload.wikimedia.org/wikipedia/en/f/f4/Atletico_Madrid_2017_logo.svg',
  'Villarreal CF': 'https://upload.wikimedia.org/wikipedia/en/b/b9/Villarreal_CF_logo-en.svg',
  'Athletic Club': 'https://upload.wikimedia.org/wikipedia/en/f/f1/Athletic_Club.svg',

  // Italian Clubs (OpenLigaDB names) - Direct SVG URLs
  'Inter Mailand': 'https://upload.wikimedia.org/wikipedia/commons/0/05/FC_Internazionale_Milano_2021.svg',
  'Juventus Turin': 'https://upload.wikimedia.org/wikipedia/commons/6/6d/Juventus_logo.svg',
  'SSC Neapel': 'https://upload.wikimedia.org/wikipedia/commons/2/2d/SSC_Neapel.svg',
  'Atalanta Bergamo': 'https://upload.wikimedia.org/wikipedia/en/6/66/Atalanta_BC_logo.svg',

  // French Clubs (OpenLigaDB names) - Direct SVG URLs
  'Paris St. Germain': 'https://upload.wikimedia.org/wikipedia/en/a/a7/Paris_Saint-Germain_F.C..svg',

  // Dutch Clubs (OpenLigaDB names) - Direct SVG URLs
  'PSV Eindhoven': 'https://upload.wikimedia.org/wikipedia/en/0/05/PSV_Eindhoven.svg',

  // Belgian Clubs (OpenLigaDB names) - Direct SVG URLs
  'FC Brügge': 'https://upload.wikimedia.org/wikipedia/en/d/d0/Club_Brugge_KV_logo.svg',
  'Union Saint-Gilloise': '/images/teams/union-saint-gilloise-big.png', // Local high-res PNG

  // Portuguese Clubs (OpenLigaDB names) - Direct SVG URLs
  'Benfica Lissabon': 'https://upload.wikimedia.org/wikipedia/en/a/a2/SL_Benfica_logo.svg',
  'Sporting CP': 'https://upload.wikimedia.org/wikipedia/en/c/cc/Sporting_Clube_de_Portugal_%28Logo%29.svg',

  // Turkish Clubs (OpenLigaDB names) - PNG (no SVG available)
  'Galatasaray Istanbul': 'https://upload.wikimedia.org/wikipedia/commons/f/f6/Galatasaray_Sports_Club_Logo.png',

  // Other Clubs (OpenLigaDB names) - Direct SVG URLs
  'FC Kopenhagen': 'https://upload.wikimedia.org/wikipedia/en/7/78/FC_K%C3%B8benhavn_logo.svg',
  'Qarabag FK': '/images/teams/Qarabagh_1987.png', // Local high-res PNG
  'FK Bodö/Glimt': 'https://upload.wikimedia.org/wikipedia/en/4/4c/FK_Bodo_Glimt_logo.svg',
  // 'Olympiakos Piräus': Use OpenLigaDB URL (no high-res Wikimedia available)
  'Paphos FC': 'https://upload.wikimedia.org/wikipedia/en/f/f9/Pafos_FC_logo.svg',
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
 * Validate URL protocol to prevent XSS attacks
 * SECURITY: CWE-79 - Prevents javascript:, data:, vbscript: protocol injection
 *
 * Only allow:
 * - http: and https: (absolute URLs)
 * - Relative URLs starting with /
 */
function isValidLogoUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  // Trim whitespace
  const trimmedUrl = url.trim();

  // Allow relative URLs (start with /)
  if (trimmedUrl.startsWith('/')) {
    return true;
  }

  // Only allow http: and https: protocols
  // Reject javascript:, data:, vbscript:, file:, etc.
  const lowercaseUrl = trimmedUrl.toLowerCase();
  if (lowercaseUrl.startsWith('http://') || lowercaseUrl.startsWith('https://')) {
    return true;
  }

  // Reject everything else (javascript:, data:, vbscript:, etc.)
  return false;
}

/**
 * Get the best quality logo URL, with fallbacks
 * ALWAYS prefer our curated high-quality Wikimedia SVG URLs over OpenLigaDB's low-res images
 * SECURITY: Validates all URLs to prevent XSS attacks
 */
export function getBestLogoUrl(openLigaDbUrl: string, teamName: string): string {
  // PRIORITY 1: Try our curated high-quality Wikimedia Commons SVG URLs
  const wikimediaUrl = getLogoFallback(teamName);
  if (wikimediaUrl && isValidLogoUrl(wikimediaUrl)) {
    return wikimediaUrl;
  }

  // PRIORITY 2: Fall back to OpenLigaDB URL if we don't have a Wikimedia URL
  // SECURITY: Validate URL protocol before using
  if (openLigaDbUrl && isValidLogoUrl(openLigaDbUrl)) {
    return openLigaDbUrl;
  }

  // Last resort: placeholder (always safe - relative URL)
  return '/images/tbd-logo.svg';
}
