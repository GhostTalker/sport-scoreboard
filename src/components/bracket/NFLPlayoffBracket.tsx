import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { isNFLGame } from '../../types/game';
import type { NFLGame, PlayoffMatchup, PlayoffTeam, PlayoffBracket } from '../../types/nfl';
import { fetchAllPlayoffGames } from '../../services/espnApi';

export function NFLPlayoffBracket() {
  const currentGame = useGameStore((state) => state.currentGame);
  const availableGames = useGameStore((state) => state.availableGames);
  const [bracketGames, setBracketGames] = useState<NFLGame[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Track if initial load has completed
  const hasInitialLoad = useRef(false);
  // Track game IDs that are finalized (won't change)
  const finalizedGameIds = useRef<Set<string>>(new Set());

  // Memoize NFL playoff games from the store to prevent unnecessary recalculations
  const storePlayoffGames = useMemo(() =>
    availableGames.filter((g): g is NFLGame => isNFLGame(g) && g.seasonType === 3),
    [availableGames]
  );

  // Initial load - fetch all playoff games once when component mounts
  useEffect(() => {
    async function loadInitialPlayoffGames() {
      if (!currentGame || !isNFLGame(currentGame)) {
        setIsLoading(false);
        return;
      }

      // Skip if already loaded
      if (hasInitialLoad.current && bracketGames.length > 0) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        // Use 2025 for current playoffs season
        const year = 2025;
        console.log(`[Playoff Bracket] Initial load - fetching playoff games for year ${year}`);

        const playoffGames = await fetchAllPlayoffGames(year);
        const nflPlayoffGames = playoffGames.filter((g): g is NFLGame => isNFLGame(g));

        console.log(`[Playoff Bracket] Loaded ${nflPlayoffGames.length} NFL playoff games`);
        console.log('[Playoff Bracket] Games:', nflPlayoffGames.map(g => `Week ${g.week}: ${g.awayTeam.abbreviation} @ ${g.homeTeam.abbreviation}`));

        // Track finalized games (won't need updates)
        nflPlayoffGames.forEach(game => {
          if (game.status === 'final') {
            finalizedGameIds.current.add(game.id);
          }
        });

        setBracketGames(nflPlayoffGames);
        hasInitialLoad.current = true;
      } catch (error) {
        console.error('[Playoff Bracket] Error loading playoff games:', error);
        // Fallback to available games from store
        setBracketGames(storePlayoffGames);
        hasInitialLoad.current = true;
      } finally {
        setIsLoading(false);
      }
    }

    loadInitialPlayoffGames();
    // Only depend on currentGame ID for initial load trigger - not the entire object
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentGame?.id]);

  // Update live/in-progress games from store without refetching entire bracket
  const updateLiveGames = useCallback(() => {
    if (!hasInitialLoad.current || bracketGames.length === 0) {
      return;
    }

    if (storePlayoffGames.length === 0) {
      return;
    }

    // Create a map of store games by ID for quick lookup
    const storeGamesMap = new Map(storePlayoffGames.map(g => [g.id, g]));

    // Check if any games need updating
    let hasUpdates = false;
    const updatedGames = bracketGames.map(bracketGame => {
      // Skip finalized games - they won't change
      if (finalizedGameIds.current.has(bracketGame.id)) {
        return bracketGame;
      }

      const storeGame = storeGamesMap.get(bracketGame.id);
      if (!storeGame) {
        return bracketGame;
      }

      // Check if game state changed (scores or status)
      const hasScoreChange =
        bracketGame.homeTeam.score !== storeGame.homeTeam.score ||
        bracketGame.awayTeam.score !== storeGame.awayTeam.score;
      const hasStatusChange = bracketGame.status !== storeGame.status;

      if (hasScoreChange || hasStatusChange) {
        hasUpdates = true;
        console.log(`[Playoff Bracket] Updating game ${bracketGame.id}: ${bracketGame.awayTeam.abbreviation} @ ${bracketGame.homeTeam.abbreviation} (status: ${storeGame.status})`);

        // Mark as finalized if game just ended
        if (storeGame.status === 'final') {
          finalizedGameIds.current.add(storeGame.id);
        }

        return storeGame;
      }

      return bracketGame;
    });

    // Also check for new games that might have appeared (e.g., newly scheduled playoff games)
    storePlayoffGames.forEach(storeGame => {
      const existsInBracket = bracketGames.some(g => g.id === storeGame.id);
      if (!existsInBracket) {
        hasUpdates = true;
        updatedGames.push(storeGame);
        console.log(`[Playoff Bracket] Adding new game ${storeGame.id}: ${storeGame.awayTeam.abbreviation} @ ${storeGame.homeTeam.abbreviation}`);
      }
    });

    if (hasUpdates) {
      setBracketGames(updatedGames);
    }
  }, [bracketGames, storePlayoffGames]);

  // Listen for store updates and selectively update live games
  useEffect(() => {
    updateLiveGames();
  }, [updateLiveGames]);

  // Alias for backward compatibility with the rest of the component
  const allPlayoffGames = bracketGames;

  if (!currentGame || !isNFLGame(currentGame)) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-slate-900">
        <p className="text-white/50 text-xl">No NFL game data available</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/50 text-xl">Loading playoff bracket...</p>
        </div>
      </div>
    );
  }

  // Build playoff bracket from all playoff games
  const bracket = buildPlayoffBracket(allPlayoffGames, currentGame);

  return (
    <div className="h-full w-full bg-slate-900 flex justify-center pt-4 overflow-hidden">
      {/* Fixed-size bracket container for iPad mini (1024x768 landscape) */}
      <div className="flex flex-col" style={{ width: '1000px', height: '680px' }}>
        {/* Header */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-white">NFL Playoffs {bracket.season}</h2>
        </div>

        {/* Bracket Layout - Fixed dimensions */}
        <div className="relative flex items-start justify-center gap-4" style={{ height: '620px' }}>
          {/* Super Bowl Connection Lines - Overlays entire bracket */}
          <SuperBowlConnectionLines />

          {/* Left: AFC Bracket */}
          <div style={{ width: '340px', height: '100%' }}>
            <div className="text-center mb-3 bg-red-600/20 rounded-lg py-2 border border-red-500/30">
              <h3 className="text-xl font-bold text-red-400">AFC</h3>
            </div>
            <div style={{ height: 'calc(100% - 44px)' }}>
              <ConferenceBracketLeft
                conference="AFC"
                wildCard={bracket.afc.wildCard}
                divisional={bracket.afc.divisional}
                conferenceGame={bracket.afc.conference}
                byeTeam={bracket.afc.byeTeam}
              />
            </div>
          </div>

          {/* Center: Super Bowl - aligned with Conference Championship */}
          <div className="flex flex-col items-center relative z-10" style={{ width: '240px', height: '100%', paddingTop: '120px' }}>
            {/* Trophy Image */}
            <img
              src="/images/nfl_trophy.png"
              alt="Super Bowl Trophy"
              className="w-32 h-32 object-contain mb-4"
              style={{
                filter: 'drop-shadow(0 4px 12px rgba(234,179,8,0.4))',
                mixBlendMode: 'lighten'
              }}
            />
            <SuperBowlMatchup matchup={bracket.superBowl} />
          </div>

          {/* Right: NFC Bracket */}
          <div style={{ width: '340px', height: '100%' }}>
            <div className="text-center mb-3 bg-blue-600/20 rounded-lg py-2 border border-blue-500/30">
              <h3 className="text-xl font-bold text-blue-400">NFC</h3>
            </div>
            <div style={{ height: 'calc(100% - 44px)' }}>
              <ConferenceBracketRight
                conference="NFC"
                wildCard={bracket.nfc.wildCard}
                divisional={bracket.nfc.divisional}
                conferenceGame={bracket.nfc.conference}
                byeTeam={bracket.nfc.byeTeam}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ConferenceBracketProps {
  conference: 'AFC' | 'NFC';
  wildCard: PlayoffMatchup[];
  divisional: PlayoffMatchup[];
  conferenceGame: PlayoffMatchup | null;
  byeTeam: PlayoffTeam | null;
}

// AFC Bracket - Left side (flows left to right) - Fixed layout
function ConferenceBracketLeft({ conference, wildCard, divisional, conferenceGame, byeTeam }: ConferenceBracketProps) {
  const wcSlots = Array(3).fill(null).map((_, i) => wildCard[i] || createPlaceholderMatchup('wild_card', conference, i));
  const divSlots = Array(2).fill(null).map((_, i) => divisional[i] || createPlaceholderMatchup('divisional', conference, i));
  const confSlot = conferenceGame || createPlaceholderMatchup('conference', conference, 0);

  return (
    <div className="relative h-full flex gap-0.5">
      {/* Column 1: Wild Card (with BYE) - Fixed width */}
      <div className="flex flex-col py-2 bg-slate-800/10 rounded-lg" style={{ width: '112px' }}>
        <div className="text-center mb-2 bg-red-500/20 rounded mx-1 py-1">
          <p className="text-[10px] text-red-300 font-bold">WILD CARD</p>
        </div>
        <div className="flex-1 flex flex-col justify-around">
          {/* #1 Seed BYE */}
          <div className="mx-2">
            <ByeTeamCard team={byeTeam} conference={conference} />
          </div>
          {wcSlots.map((matchup, idx) => (
            <div key={idx} className="mx-2">
              <MatchupCard matchup={matchup} compact conference={conference} />
            </div>
          ))}
        </div>
      </div>

      {/* Column 2: Divisional - Fixed width */}
      <div className="flex flex-col py-2 bg-slate-800/10 rounded-lg" style={{ width: '112px' }}>
        <div className="text-center mb-2 bg-red-500/20 rounded mx-1 py-1">
          <p className="text-[10px] text-red-300 font-bold">DIVISIONAL</p>
        </div>
        <div className="flex-1 flex flex-col justify-around">
          {divSlots.map((matchup, idx) => (
            <div key={idx} className="mx-2">
              <MatchupCard matchup={matchup} compact conference={conference} />
            </div>
          ))}
        </div>
      </div>

      {/* Column 3: Conference Championship - Fixed width */}
      <div className="flex flex-col justify-center py-2 bg-slate-800/10 rounded-lg" style={{ width: '112px' }}>
        <div className="text-center mb-2 bg-red-500/20 rounded mx-1 py-1">
          <p className="text-[10px] text-red-300 font-bold">AFC CHAMP</p>
        </div>
        <div className="flex-1 flex items-center">
          <div className="mx-2 w-full">
            <MatchupCard matchup={confSlot} compact conference={conference} />
          </div>
        </div>
      </div>

      {/* SVG Connection Lines - Fixed positions */}
      <BracketConnectionsLeft />
    </div>
  );
}

// NFC Bracket - Right side (flows right to left, mirrored) - Fixed layout
function ConferenceBracketRight({ conference, wildCard, divisional, conferenceGame, byeTeam }: ConferenceBracketProps) {
  const wcSlots = Array(3).fill(null).map((_, i) => wildCard[i] || createPlaceholderMatchup('wild_card', conference, i));
  const divSlots = Array(2).fill(null).map((_, i) => divisional[i] || createPlaceholderMatchup('divisional', conference, i));
  const confSlot = conferenceGame || createPlaceholderMatchup('conference', conference, 0);

  return (
    <div className="relative h-full flex gap-0.5">
      {/* Column 3: Conference Championship - Fixed width */}
      <div className="flex flex-col justify-center py-2 bg-slate-800/10 rounded-lg" style={{ width: '112px' }}>
        <div className="text-center mb-2 bg-blue-500/20 rounded mx-1 py-1">
          <p className="text-[10px] text-blue-300 font-bold">NFC CHAMP</p>
        </div>
        <div className="flex-1 flex items-center">
          <div className="mx-2 w-full">
            <MatchupCard matchup={confSlot} compact conference={conference} />
          </div>
        </div>
      </div>

      {/* Column 2: Divisional - Fixed width */}
      <div className="flex flex-col py-2 bg-slate-800/10 rounded-lg" style={{ width: '112px' }}>
        <div className="text-center mb-2 bg-blue-500/20 rounded mx-1 py-1">
          <p className="text-[10px] text-blue-300 font-bold">DIVISIONAL</p>
        </div>
        <div className="flex-1 flex flex-col justify-around">
          {divSlots.map((matchup, idx) => (
            <div key={idx} className="mx-2">
              <MatchupCard matchup={matchup} compact conference={conference} />
            </div>
          ))}
        </div>
      </div>

      {/* Column 1: Wild Card (with BYE) - Fixed width */}
      <div className="flex flex-col py-2 bg-slate-800/10 rounded-lg" style={{ width: '112px' }}>
        <div className="text-center mb-2 bg-blue-500/20 rounded mx-1 py-1">
          <p className="text-[10px] text-blue-300 font-bold">WILD CARD</p>
        </div>
        <div className="flex-1 flex flex-col justify-around">
          {/* #1 Seed BYE */}
          <div className="mx-2">
            <ByeTeamCard team={byeTeam} conference={conference} />
          </div>
          {wcSlots.map((matchup, idx) => (
            <div key={idx} className="mx-2">
              <MatchupCard matchup={matchup} compact conference={conference} />
            </div>
          ))}
        </div>
      </div>

      {/* SVG Connection Lines - Fixed positions */}
      <BracketConnectionsRight />
    </div>
  );
}

// Connection lines for AFC bracket (left side)
// Uses viewBox for consistent coordinate system matching actual layout
function BracketConnectionsLeft() {
  // Container is 340px wide, viewBox is 0-100 for X and 0-200 for Y
  // Column layout: WC=110px (0-110), gap=4px, DIV=110px (114-224), gap=4px, CONF=118px (228-340)

  // Y positions - measured from screenshot (viewBox 0-200)
  const wc1 = 30;    // BYE
  const wc2 = 68;    // BUF vs JAX
  const wc3 = 108;   // LAC vs NE
  const wc4 = 147;   // HOU vs PIT
  const div1 = 51;   // BUF vs DEN
  const div2 = 128;  // HOU vs NE
  const conf = 90;   // Conference Championship

  // X coordinates (in viewBox units, 340 = 100%)
  // Layout: WC(0-112) | gap(2) | DIV(114-226) | gap(2) | CONF(228-340)
  // With mx-2 (8px margin): WC box(8-104), DIV box(122-218), CONF box(236-332)
  // Using BOX EDGES and SHORT LINES (like example image)
  const scale = 100 / 340;
  const wcRight = 104 * scale;       // 30.59 - Right edge of WC box
  const gap1Mid = 113 * scale;       // 33.22 - Middle of gap between WC and DIV
  const divLeft = 122 * scale;       // 35.88 - Left edge of DIV box
  const divRight = 218 * scale;      // 64.12 - Right edge of DIV box
  const gap2Mid = 227 * scale;       // 66.74 - Middle of gap between DIV and CONF
  const confLeft = 236 * scale;      // 69.41 - Left edge of CONF box

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 5 }}
      viewBox="0 0 100 200"
      preserveAspectRatio="none"
    >
      {/* === Wild Card to Divisional - Top pair === */}
      {/* wc1 (BYE at 30) + wc2 (68) -> div1 (51) */}
      {/* Short horizontal from WC box edge to gap middle */}
      <line x1={wcRight} y1={wc1} x2={gap1Mid} y2={wc1} stroke="#ef4444" strokeWidth="0.6" opacity="0.7" strokeLinecap="butt" />
      <line x1={wcRight} y1={wc2} x2={gap1Mid} y2={wc2} stroke="#ef4444" strokeWidth="0.6" opacity="0.7" strokeLinecap="butt" />
      {/* Vertical connector at gap middle */}
      <line x1={gap1Mid} y1={wc1} x2={gap1Mid} y2={wc2} stroke="#ef4444" strokeWidth="0.6" opacity="0.7" strokeLinecap="butt" />
      {/* Short horizontal from gap middle to DIV box edge */}
      <line x1={gap1Mid} y1={div1} x2={divLeft} y2={div1} stroke="#ef4444" strokeWidth="0.6" opacity="0.7" strokeLinecap="butt" />

      {/* === Wild Card to Divisional - Bottom pair === */}
      {/* wc3 (108) + wc4 (147) -> div2 (128) */}
      {/* Short horizontal from WC box edge to gap middle */}
      <line x1={wcRight} y1={wc3} x2={gap1Mid} y2={wc3} stroke="#ef4444" strokeWidth="0.6" opacity="0.7" strokeLinecap="butt" />
      <line x1={wcRight} y1={wc4} x2={gap1Mid} y2={wc4} stroke="#ef4444" strokeWidth="0.6" opacity="0.7" strokeLinecap="butt" />
      {/* Vertical connector at gap middle */}
      <line x1={gap1Mid} y1={wc3} x2={gap1Mid} y2={wc4} stroke="#ef4444" strokeWidth="0.6" opacity="0.7" strokeLinecap="butt" />
      {/* Short horizontal from gap middle to DIV box edge */}
      <line x1={gap1Mid} y1={div2} x2={divLeft} y2={div2} stroke="#ef4444" strokeWidth="0.6" opacity="0.7" strokeLinecap="butt" />

      {/* === Divisional to Conference === */}
      {/* div1 (51) + div2 (128) -> conf (90) */}
      {/* Short horizontal from DIV box edge to gap middle */}
      <line x1={divRight} y1={div1} x2={gap2Mid} y2={div1} stroke="#ef4444" strokeWidth="0.6" opacity="0.7" strokeLinecap="butt" />
      <line x1={divRight} y1={div2} x2={gap2Mid} y2={div2} stroke="#ef4444" strokeWidth="0.6" opacity="0.7" strokeLinecap="butt" />
      {/* Vertical connector at gap middle */}
      <line x1={gap2Mid} y1={div1} x2={gap2Mid} y2={div2} stroke="#ef4444" strokeWidth="0.6" opacity="0.7" strokeLinecap="butt" />
      {/* Short horizontal from gap middle to CONF box edge */}
      <line x1={gap2Mid} y1={conf} x2={confLeft} y2={conf} stroke="#ef4444" strokeWidth="0.6" opacity="0.7" strokeLinecap="butt" />
    </svg>
  );
}

// Super Bowl connection lines - connects AFC/NFC Championship to Super Bowl box
function SuperBowlConnectionLines() {
  // Total width: AFC(340) + gap(16) + SB(240) + gap(16) + NFC(340) = 952px
  // Total height: 620px
  // Conference Championship box center Y position
  // Looking at the screenshot, the CONF boxes are centered around 360px from top

  const totalWidth = 952;
  const totalHeight = 620;
  const confY = 365; // Conference Championship vertical position - center of TBD boxes

  // X positions - these need to match the actual box edges
  // AFC bracket: 340px wide, CONF column starts at 228px (with 8px margin = 236px to box edge)
  // NFC bracket starts at 612px, CONF column at 612px (with 8px margin = 620px to box edge)
  const afcConfRight = 332; // Right edge of AFC CONF box (340 - 8px margin)
  const nfcConfLeft = 620; // Left edge of NFC CONF box (612 + 8px margin)

  // Super Bowl box: centered in 240px area, roughly 200px wide
  // Starts at 356 (AFC 340 + gap 16), box starts ~20px in
  const sbBoxLeft = 396; // Left edge of SB box content
  const sbBoxRight = 556; // Right edge of SB box content

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 5 }}
      viewBox={`0 0 ${totalWidth} ${totalHeight}`}
      preserveAspectRatio="none"
    >
      {/* AFC to Super Bowl - Red pulsing line */}
      <line
        x1={afcConfRight}
        y1={confY}
        x2={sbBoxLeft}
        y2={confY}
        className="superbowl-line-pulse-afc"
        stroke="#ef4444"
        strokeWidth="3"
        opacity="0.7"
        strokeLinecap="butt"
      />

      {/* NFC to Super Bowl - Blue pulsing line */}
      <line
        x1={nfcConfLeft}
        y1={confY}
        x2={sbBoxRight}
        y2={confY}
        className="superbowl-line-pulse-nfc"
        stroke="#60a5fa"
        strokeWidth="3"
        opacity="0.7"
        strokeLinecap="butt"
      />
    </svg>
  );
}

// Connection lines for NFC bracket (right side) - flows right to left (mirrored)
// Uses viewBox for consistent coordinate system matching actual layout
function BracketConnectionsRight() {
  // Container is 340px wide, viewBox is 0-100 for X and 0-200 for Y
  // NFC column layout (reversed): CONF=118px (0-118), gap=4px, DIV=110px (122-232), gap=4px, WC=110px (236-340)

  // Y positions - same as AFC (mirrored layout, same vertical positions)
  const wc1 = 30;    // BYE
  const wc2 = 68;    // Wild Card game 1
  const wc3 = 108;   // Wild Card game 2
  const wc4 = 147;   // Wild Card game 3
  const div1 = 51;   // Divisional game 1
  const div2 = 128;  // Divisional game 2
  const conf = 90;   // Conference Championship

  // X coordinates (in viewBox units, 340 = 100%)
  // NFC layout (mirrored): CONF(0-112) | gap(2) | DIV(114-226) | gap(2) | WC(228-340)
  // With mx-2 (8px margin): CONF box(8-104), DIV box(122-218), WC box(236-332)
  // Using BOX EDGES and SHORT LINES (like example image)
  const scale = 100 / 340;
  const confRight = 104 * scale;     // 30.59 - Right edge of CONF box
  const gapConfDiv = 113 * scale;    // 33.22 - Middle of gap between CONF and DIV
  const divLeft = 122 * scale;       // 35.88 - Left edge of DIV box
  const divRight = 218 * scale;      // 64.12 - Right edge of DIV box
  const gapDivWC = 227 * scale;      // 66.74 - Middle of gap between DIV and WC
  const wcLeft = 236 * scale;        // 69.41 - Left edge of WC box

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 5 }}
      viewBox="0 0 100 200"
      preserveAspectRatio="none"
    >
      {/* === Conference to Divisional === */}
      {/* Short horizontal from CONF box edge to gap middle */}
      <line x1={confRight} y1={conf} x2={gapConfDiv} y2={conf} stroke="#60a5fa" strokeWidth="0.6" opacity="0.7" strokeLinecap="butt" />
      {/* Vertical connector at gap middle from div1 to div2 */}
      <line x1={gapConfDiv} y1={div1} x2={gapConfDiv} y2={div2} stroke="#60a5fa" strokeWidth="0.6" opacity="0.7" strokeLinecap="butt" />
      {/* Short horizontal from gap middle to DIV box edge at div1 */}
      <line x1={gapConfDiv} y1={div1} x2={divLeft} y2={div1} stroke="#60a5fa" strokeWidth="0.6" opacity="0.7" strokeLinecap="butt" />
      {/* Short horizontal from gap middle to DIV box edge at div2 */}
      <line x1={gapConfDiv} y1={div2} x2={divLeft} y2={div2} stroke="#60a5fa" strokeWidth="0.6" opacity="0.7" strokeLinecap="butt" />

      {/* === Wild Card to Divisional - Top pair === */}
      {/* Short horizontal from WC box edge to gap middle */}
      <line x1={wcLeft} y1={wc1} x2={gapDivWC} y2={wc1} stroke="#60a5fa" strokeWidth="0.6" opacity="0.7" strokeLinecap="butt" />
      <line x1={wcLeft} y1={wc2} x2={gapDivWC} y2={wc2} stroke="#60a5fa" strokeWidth="0.6" opacity="0.7" strokeLinecap="butt" />
      {/* Vertical connector at gap middle */}
      <line x1={gapDivWC} y1={wc1} x2={gapDivWC} y2={wc2} stroke="#60a5fa" strokeWidth="0.6" opacity="0.7" strokeLinecap="butt" />
      {/* Short horizontal from gap middle to DIV box edge */}
      <line x1={gapDivWC} y1={div1} x2={divRight} y2={div1} stroke="#60a5fa" strokeWidth="0.6" opacity="0.7" strokeLinecap="butt" />

      {/* === Wild Card to Divisional - Bottom pair === */}
      {/* Short horizontal from WC box edge to gap middle */}
      <line x1={wcLeft} y1={wc3} x2={gapDivWC} y2={wc3} stroke="#60a5fa" strokeWidth="0.6" opacity="0.7" strokeLinecap="butt" />
      <line x1={wcLeft} y1={wc4} x2={gapDivWC} y2={wc4} stroke="#60a5fa" strokeWidth="0.6" opacity="0.7" strokeLinecap="butt" />
      {/* Vertical connector at gap middle */}
      <line x1={gapDivWC} y1={wc3} x2={gapDivWC} y2={wc4} stroke="#60a5fa" strokeWidth="0.6" opacity="0.7" strokeLinecap="butt" />
      {/* Short horizontal from gap middle to DIV box edge */}
      <line x1={gapDivWC} y1={div2} x2={divRight} y2={div2} stroke="#60a5fa" strokeWidth="0.6" opacity="0.7" strokeLinecap="butt" />
    </svg>
  );
}

interface MatchupCardProps {
  matchup: PlayoffMatchup;
  compact?: boolean;
  conference?: 'AFC' | 'NFC';
}

function MatchupCard({ matchup, compact, conference }: MatchupCardProps) {
  const isLive = matchup.status === 'in_progress';

  // Determine border color based on conference
  let borderColor = 'border-slate-700/50';
  if (conference === 'AFC') {
    borderColor = 'border-red-500/50';
  } else if (conference === 'NFC') {
    borderColor = 'border-blue-500/50';
  }

  // Override with green if live
  if (isLive) {
    borderColor = 'border-green-500/70';
  }

  return (
    <div className={`bg-slate-800/80 rounded ${compact ? 'p-1' : 'p-2'} border-2 ${borderColor} relative z-10`}>
      {/* Away Team */}
      <TeamRow
        team={matchup.awayTeam}
        isWinner={matchup.winner === 'away'}
        status={matchup.status}
        compact={compact}
      />

      {/* Divider */}
      <div className="h-px bg-slate-700/50 my-0.5"></div>

      {/* Home Team */}
      <TeamRow
        team={matchup.homeTeam}
        isWinner={matchup.winner === 'home'}
        status={matchup.status}
        compact={compact}
      />

      {/* Live indicator */}
      {isLive && (
        <div className="mt-0.5 text-center">
          <span className="text-[8px] text-green-400 font-semibold">● LIVE</span>
        </div>
      )}
    </div>
  );
}

// Bye Team Card - displays the #1 seed with BYE as opponent (styled exactly like MatchupCard with compact)
interface ByeTeamCardProps {
  team: PlayoffTeam | null;
  conference: 'AFC' | 'NFC';
}

function ByeTeamCard({ team, conference }: ByeTeamCardProps) {
  // Determine border color based on conference
  const borderColor = conference === 'AFC' ? 'border-red-500/50' : 'border-blue-500/50';

  if (!team) {
    // Placeholder when team not yet determined - matches TeamRow TBD structure
    return (
      <div className={`bg-slate-800/80 rounded p-1 border-2 ${borderColor} relative z-10`}>
        {/* Placeholder Team Row - matches TeamRow with compact */}
        <div className="flex items-center gap-1 py-0.5">
          <div className="w-4 h-4 bg-slate-700/50 rounded"></div>
          <div className="flex-1">
            <span className="text-white/20 text-[10px]">TBD</span>
          </div>
        </div>

        {/* Divider - matches MatchupCard */}
        <div className="h-px bg-slate-700/50 my-0.5"></div>

        {/* BYE Row - matches TeamRow structure */}
        <div className="flex items-center gap-1 py-0.5">
          <div className="w-4 h-4 bg-slate-700/50 rounded"></div>
          <div className="flex-1">
            <span className="text-white/20 text-[10px]">BYE</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-slate-800/80 rounded p-1 border-2 ${borderColor} relative z-10`}>
      {/* #1 Seed Team Row - matches TeamRow with compact */}
      <div className="flex items-center gap-1 py-0.5">
        {/* Team Logo */}
        <div className="w-4 h-4 flex-shrink-0">
          <img
            src={team.logo}
            alt={team.abbreviation}
            className="w-full h-full object-contain"
            onError={(e) => {
              e.currentTarget.src = '/images/tbd-logo.svg';
            }}
          />
        </div>

        {/* Team Info - matches TeamRow structure with seed + abbreviation */}
        <div className="flex-1 min-w-0 flex items-center gap-0.5">
          {team.seed && (
            <span className="text-[9px] text-white/30">#{team.seed}</span>
          )}
          <span className="text-[11px] font-semibold text-white truncate">
            {team.abbreviation}
          </span>
        </div>
      </div>

      {/* Divider - matches MatchupCard */}
      <div className="h-px bg-slate-700/50 my-0.5"></div>

      {/* BYE Row - styled like TeamRow but for BYE opponent */}
      <div className="flex items-center gap-1 py-0.5">
        {/* Empty logo placeholder matching TeamRow w-4 h-4 */}
        <div className="w-4 h-4 flex-shrink-0 bg-slate-700/30 rounded"></div>

        {/* BYE text matching TeamRow text styling */}
        <div className="flex-1 min-w-0 flex items-center gap-0.5">
          <span className="text-[11px] font-semibold text-white/40 truncate">BYE</span>
        </div>
      </div>
    </div>
  );
}

interface TeamRowProps {
  team: PlayoffTeam | null;
  isWinner: boolean;
  status: 'scheduled' | 'in_progress' | 'final';
  compact?: boolean;
}

function TeamRow({ team, isWinner, status, compact }: TeamRowProps) {
  // Treat null teams AND teams with TBD/empty abbreviation as placeholders
  // This ensures consistent display whether the API returns null or a TBD placeholder team
  const isTBDTeam = !team || !team.abbreviation || team.abbreviation === 'TBD';

  if (isTBDTeam) {
    return (
      <div className={`flex items-center gap-1 ${compact ? 'py-0.5' : 'py-1'}`}>
        <div className="w-4 h-4 bg-slate-700/50 rounded"></div>
        <div className="flex-1">
          <span className="text-white/20 text-[10px]">TBD</span>
        </div>
      </div>
    );
  }

  const isComplete = status === 'final';
  const opacity = isComplete && !isWinner ? 'opacity-75' : '';

  return (
    <div className={`flex items-center gap-1 ${compact ? 'py-0.5' : 'py-1'} ${opacity}`}>
      {/* Team Logo */}
      <div className="w-4 h-4 flex-shrink-0">
        <img
          src={team.logo}
          alt={team.abbreviation}
          className="w-full h-full object-contain"
          onError={(e) => {
            e.currentTarget.src = '/images/tbd-logo.svg';
          }}
        />
      </div>

      {/* Team Info */}
      <div className="flex-1 min-w-0 flex items-center gap-0.5">
        {team.seed && (
          <span className="text-[9px] text-white/30">#{team.seed}</span>
        )}
        <span className={`text-[11px] font-semibold ${isWinner ? 'text-white' : 'text-white/60'} truncate`}>
          {team.abbreviation}
        </span>
      </div>

      {/* Score */}
      {team.score !== undefined && (
        <div className={`text-sm font-bold tabular-nums ${isWinner ? 'text-white' : 'text-white/75'}`}>
          {team.score}
        </div>
      )}
    </div>
  );
}

function SuperBowlMatchup({ matchup }: { matchup: PlayoffMatchup | null }) {
  const isLive = matchup?.status === 'in_progress';
  const isComplete = matchup?.status === 'final';

  // Determine if teams are TBD (no matchup or null team)
  const awayTeam = matchup?.awayTeam;
  const homeTeam = matchup?.homeTeam;

  // For Super Bowl: away is typically AFC Champion, home is NFC Champion
  const afcLogo = '/logos/afc-logo.svg';
  const nfcLogo = '/logos/nfc-logo.svg';

  return (
    <div
      className="w-full bg-gradient-to-br from-yellow-900/30 to-slate-800 rounded-lg p-4 border-2 border-yellow-600/50 superbowl-glow-pulse"
      style={{
        boxShadow: '0 0 20px rgba(234,179,8,0.3), 0 0 40px rgba(234,179,8,0.2)',
      }}
    >
      {/* Header */}
      <div className="text-center mb-3">
        <h3 className="text-lg font-bold text-yellow-400">Super Bowl</h3>
        {matchup?.venue && (
          <p className="text-white/40 text-[9px] mt-0.5">{matchup.venue}</p>
        )}
      </div>

      {/* Horizontal Team Layout */}
      <div className="flex items-center justify-center gap-3">
        {/* AFC Champion (Away Team) */}
        <SuperBowlTeamDisplay
          team={awayTeam}
          fallbackLogo={afcLogo}
          fallbackLabel="AFC"
          isWinner={matchup?.winner === 'away'}
          isComplete={isComplete}
        />

        {/* VS Divider */}
        <div className="flex flex-col items-center justify-center px-2">
          <span className="text-white/50 text-sm font-bold">VS</span>
          {isLive && (
            <span className="text-[9px] text-green-400 font-semibold mt-1">LIVE</span>
          )}
        </div>

        {/* NFC Champion (Home Team) */}
        <SuperBowlTeamDisplay
          team={homeTeam}
          fallbackLogo={nfcLogo}
          fallbackLabel="NFC"
          isWinner={matchup?.winner === 'home'}
          isComplete={isComplete}
        />
      </div>

      {/* Score display for live/final games */}
      {matchup && (awayTeam?.score !== undefined || homeTeam?.score !== undefined) && (
        <div className="flex items-center justify-center gap-3 mt-3">
          <div className={`text-2xl font-bold tabular-nums ${matchup.winner === 'away' ? 'text-white' : 'text-white/50'}`}>
            {awayTeam?.score ?? '-'}
          </div>
          <div className="text-white/30 text-sm">-</div>
          <div className={`text-2xl font-bold tabular-nums ${matchup.winner === 'home' ? 'text-white' : 'text-white/50'}`}>
            {homeTeam?.score ?? '-'}
          </div>
        </div>
      )}
    </div>
  );
}

interface SuperBowlTeamDisplayProps {
  team: PlayoffTeam | null | undefined;
  fallbackLogo: string;
  fallbackLabel: string;
  isWinner: boolean | undefined;
  isComplete: boolean | undefined;
}

function SuperBowlTeamDisplay({ team, fallbackLogo, fallbackLabel, isWinner, isComplete }: SuperBowlTeamDisplayProps) {
  const isTBD = !team;
  const opacity = isComplete && !isWinner && !isTBD ? 'opacity-75' : '';

  return (
    <div className={`flex flex-col items-center gap-1 ${opacity}`} style={{ width: '70px' }}>
      {/* Team/Conference Logo */}
      <div className="w-12 h-12 flex items-center justify-center">
        <img
          src={isTBD ? fallbackLogo : team.logo}
          alt={isTBD ? fallbackLabel : team.abbreviation}
          className={`w-full h-full object-contain ${isTBD ? 'opacity-40' : ''}`}
          onError={(e) => {
            e.currentTarget.src = fallbackLogo;
          }}
        />
      </div>

      {/* Team Name or TBD Label */}
      <div className="text-center">
        {isTBD ? (
          <span className="text-white/30 text-[10px] font-medium">{fallbackLabel}</span>
        ) : (
          <>
            {team.seed && (
              <span className="text-[9px] text-white/30 mr-0.5">#{team.seed}</span>
            )}
            <span className={`text-xs font-semibold ${isWinner ? 'text-yellow-400' : 'text-white/80'}`}>
              {team.abbreviation}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

// Helper function to create placeholder matchup for TBD games
function createPlaceholderMatchup(
  round: PlayoffMatchup['round'],
  conference: 'AFC' | 'NFC',
  index: number
): PlayoffMatchup {
  return {
    id: `placeholder-${conference}-${round}-${index}`,
    round,
    conference: conference === 'AFC' ? 'AFC' : 'NFC',
    homeTeam: null,
    awayTeam: null,
    status: 'scheduled',
  };
}

// Helper function to extract #1 seed (bye team) from divisional games
// The #1 seed is the home team in the divisional game where they play the lowest remaining seed
function extractByeTeam(divisionalGames: NFLGame[], isAFC: boolean): PlayoffTeam | null {
  const confDivisionalGames = divisionalGames.filter(g => isAFC ? isAFCGame(g) : !isAFCGame(g));

  // Find the game where the home team is seed #1
  // In divisional round, #1 seed always hosts (they have a bye in wild card)
  for (const game of confDivisionalGames) {
    // The home team in divisional is typically the higher seed
    const homeTeam = game.homeTeam;

    // Create a PlayoffTeam from the home team
    // The #1 seed is always the home team in one of the divisional games
    const byeTeam: PlayoffTeam = {
      id: homeTeam.id,
      name: homeTeam.name,
      abbreviation: homeTeam.abbreviation,
      logo: homeTeam.logo,
      color: homeTeam.color,
      seed: 1,
    };

    return byeTeam;
  }

  return null;
}

// Helper function to build playoff bracket from games
function buildPlayoffBracket(games: NFLGame[], currentGame: NFLGame): PlayoffBracket {
  const playoffGames = games.filter(g => g.seasonType === 3);

  // Group games by round
  const wildCardGames = playoffGames.filter(g => g.week === 1);
  const divisionalGames = playoffGames.filter(g => g.week === 2);
  const conferenceGames = playoffGames.filter(g => g.week === 3);
  const superBowlGames = playoffGames.filter(g => g.week === 5);

  // Determine current round based on week
  let currentRound: PlayoffBracket['currentRound'] = 'wild_card';
  if (currentGame.week === 2) currentRound = 'divisional';
  else if (currentGame.week === 3) currentRound = 'conference';
  else if (currentGame.week === 5) currentRound = 'super_bowl';

  // Extract bye teams from divisional games
  // The #1 seed is the home team in the divisional matchup against the lowest remaining seed
  const afcDivisionalMatchups = divisionalGames.filter(g => isAFCGame(g)).map(gameToMatchup);
  const nfcDivisionalMatchups = divisionalGames.filter(g => !isAFCGame(g)).map(gameToMatchup);

  // Find the #1 seed - they host in divisional and have seed=1
  const afcByeTeam = afcDivisionalMatchups.find(m => m.homeTeam?.seed === 1)?.homeTeam ||
                     extractByeTeam(divisionalGames, true);
  const nfcByeTeam = nfcDivisionalMatchups.find(m => m.homeTeam?.seed === 1)?.homeTeam ||
                     extractByeTeam(divisionalGames, false);

  return {
    season: currentGame.startTime ? new Date(currentGame.startTime).getFullYear() : new Date().getFullYear(),
    week: currentGame.week || 1,
    currentRound,
    afc: {
      wildCard: wildCardGames.filter(g => isAFCGame(g)).map(gameToMatchup).sort((a, b) => {
        const aSeed = Math.min(a.homeTeam?.seed || 999, a.awayTeam?.seed || 999);
        const bSeed = Math.min(b.homeTeam?.seed || 999, b.awayTeam?.seed || 999);
        return aSeed - bSeed;
      }),
      divisional: afcDivisionalMatchups,
      conference: conferenceGames.find(g => isAFCGame(g)) ? gameToMatchup(conferenceGames.find(g => isAFCGame(g))!) : null,
      byeTeam: afcByeTeam || null,
    },
    nfc: {
      wildCard: wildCardGames.filter(g => !isAFCGame(g)).map(gameToMatchup).sort((a, b) => {
        const aSeed = Math.min(a.homeTeam?.seed || 999, a.awayTeam?.seed || 999);
        const bSeed = Math.min(b.homeTeam?.seed || 999, b.awayTeam?.seed || 999);
        return aSeed - bSeed;
      }),
      divisional: nfcDivisionalMatchups,
      conference: conferenceGames.find(g => !isAFCGame(g)) ? gameToMatchup(conferenceGames.find(g => !isAFCGame(g))!) : null,
      byeTeam: nfcByeTeam || null,
    },
    superBowl: superBowlGames[0] ? gameToMatchup(superBowlGames[0]) : null,
  };
}

// Check if game involves AFC teams
function isAFCGame(game: NFLGame): boolean {
  const afcTeams = [
    'BAL', 'BUF', 'CIN', 'CLE', 'DEN', 'HOU', 'IND', 'JAX',
    'KC', 'LV', 'LAC', 'MIA', 'NE', 'NYJ', 'PIT', 'TEN'
  ];

  return afcTeams.includes(game.homeTeam.abbreviation) || afcTeams.includes(game.awayTeam.abbreviation);
}

// Convert NFLGame to PlayoffMatchup
function gameToMatchup(game: NFLGame): PlayoffMatchup {
  let round: PlayoffMatchup['round'] = 'wild_card';
  if (game.week === 2) round = 'divisional';
  else if (game.week === 3) round = 'conference';
  else if (game.week === 5) round = 'super_bowl';

  const conference: PlayoffMatchup['conference'] =
    game.week === 5 ? 'CHAMPIONSHIP' :
    isAFCGame(game) ? 'AFC' : 'NFC';

  const homeTeam: PlayoffTeam = {
    id: game.homeTeam.id,
    name: game.homeTeam.name,
    abbreviation: game.homeTeam.abbreviation,
    logo: game.homeTeam.logo,
    color: game.homeTeam.color,
    score: game.homeTeam.score,
  };

  const awayTeam: PlayoffTeam = {
    id: game.awayTeam.id,
    name: game.awayTeam.name,
    abbreviation: game.awayTeam.abbreviation,
    logo: game.awayTeam.logo,
    color: game.awayTeam.color,
    score: game.awayTeam.score,
  };

  let winner: 'home' | 'away' | undefined;
  if (game.status === 'final') {
    if (game.homeTeam.score > game.awayTeam.score) winner = 'home';
    else if (game.awayTeam.score > game.homeTeam.score) winner = 'away';
  }

  return {
    id: game.id,
    round,
    conference,
    homeTeam,
    awayTeam,
    winner,
    status: game.status as 'scheduled' | 'in_progress' | 'final',
    startTime: game.startTime,
    venue: game.venue,
  };
}
