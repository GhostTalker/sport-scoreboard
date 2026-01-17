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
        <div className="flex items-start justify-center gap-4" style={{ height: '620px' }}>
          {/* Left: AFC Bracket */}
          <div style={{ width: '340px', height: '100%' }}>
            <div className="text-center mb-3 bg-blue-600/20 rounded-lg py-2 border border-blue-500/30">
              <h3 className="text-xl font-bold text-blue-400">AFC</h3>
            </div>
            <div style={{ height: 'calc(100% - 44px)' }}>
              <ConferenceBracketLeft
                conference="AFC"
                wildCard={bracket.afc.wildCard}
                divisional={bracket.afc.divisional}
                conferenceGame={bracket.afc.conference}
              />
            </div>
          </div>

          {/* Center: Super Bowl - aligned with Conference Championship */}
          <div className="flex flex-col items-center" style={{ width: '240px', height: '100%', paddingTop: '120px' }}>
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
            <div className="text-center mb-3 bg-red-600/20 rounded-lg py-2 border border-red-500/30">
              <h3 className="text-xl font-bold text-red-400">NFC</h3>
            </div>
            <div style={{ height: 'calc(100% - 44px)' }}>
              <ConferenceBracketRight
                conference="NFC"
                wildCard={bracket.nfc.wildCard}
                divisional={bracket.nfc.divisional}
                conferenceGame={bracket.nfc.conference}
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
}

// AFC Bracket - Left side (flows left to right) - Fixed layout
function ConferenceBracketLeft({ conference, wildCard, divisional, conferenceGame }: ConferenceBracketProps) {
  const wcSlots = Array(3).fill(null).map((_, i) => wildCard[i] || createPlaceholderMatchup('wild_card', conference, i));
  const divSlots = Array(2).fill(null).map((_, i) => divisional[i] || createPlaceholderMatchup('divisional', conference, i));
  const confSlot = conferenceGame || createPlaceholderMatchup('conference', conference, 0);

  return (
    <div className="relative h-full flex gap-1">
      {/* Column 1: Wild Card (with BYE) - Fixed width */}
      <div className="flex flex-col py-2 bg-slate-800/10 rounded-lg" style={{ width: '110px' }}>
        <div className="text-center mb-2 bg-blue-500/20 rounded mx-1 py-1">
          <p className="text-[10px] text-blue-300 font-bold">WILD CARD</p>
        </div>
        <div className="flex-1 flex flex-col justify-around">
          {/* #1 Seed BYE */}
          <div className="h-12 flex items-center justify-center bg-slate-800/20 rounded border border-slate-700/30 mx-2">
            <span className="text-white/30 text-[10px] font-semibold">#1 BYE</span>
          </div>
          {wcSlots.map((matchup, idx) => (
            <div key={idx} className="mx-2">
              <MatchupCard matchup={matchup} compact />
            </div>
          ))}
        </div>
      </div>

      {/* Column 2: Divisional - Fixed width */}
      <div className="flex flex-col py-2 bg-slate-800/10 rounded-lg" style={{ width: '110px' }}>
        <div className="text-center mb-2 bg-blue-500/20 rounded mx-1 py-1">
          <p className="text-[10px] text-blue-300 font-bold">DIVISIONAL</p>
        </div>
        <div className="flex-1 flex flex-col justify-around">
          {divSlots.map((matchup, idx) => (
            <div key={idx} className="mx-2">
              <MatchupCard matchup={matchup} compact />
            </div>
          ))}
        </div>
      </div>

      {/* Column 3: Conference Championship - Fixed width */}
      <div className="flex flex-col justify-center py-2 bg-slate-800/10 rounded-lg" style={{ width: '118px' }}>
        <div className="text-center mb-2 bg-blue-500/20 rounded mx-1 py-1">
          <p className="text-[10px] text-blue-300 font-bold">AFC CHAMP</p>
        </div>
        <div className="flex-1 flex items-center">
          <div className="mx-2 w-full">
            <MatchupCard matchup={confSlot} compact />
          </div>
        </div>
      </div>

      {/* SVG Connection Lines - Fixed positions */}
      <BracketConnectionsLeft />
    </div>
  );
}

// NFC Bracket - Right side (flows right to left, mirrored) - Fixed layout
function ConferenceBracketRight({ conference, wildCard, divisional, conferenceGame }: ConferenceBracketProps) {
  const wcSlots = Array(3).fill(null).map((_, i) => wildCard[i] || createPlaceholderMatchup('wild_card', conference, i));
  const divSlots = Array(2).fill(null).map((_, i) => divisional[i] || createPlaceholderMatchup('divisional', conference, i));
  const confSlot = conferenceGame || createPlaceholderMatchup('conference', conference, 0);

  return (
    <div className="relative h-full flex gap-1">
      {/* Column 3: Conference Championship - Fixed width */}
      <div className="flex flex-col justify-center py-2 bg-slate-800/10 rounded-lg" style={{ width: '118px' }}>
        <div className="text-center mb-2 bg-red-500/20 rounded mx-1 py-1">
          <p className="text-[10px] text-red-300 font-bold">NFC CHAMP</p>
        </div>
        <div className="flex-1 flex items-center">
          <div className="mx-2 w-full">
            <MatchupCard matchup={confSlot} compact />
          </div>
        </div>
      </div>

      {/* Column 2: Divisional - Fixed width */}
      <div className="flex flex-col py-2 bg-slate-800/10 rounded-lg" style={{ width: '110px' }}>
        <div className="text-center mb-2 bg-red-500/20 rounded mx-1 py-1">
          <p className="text-[10px] text-red-300 font-bold">DIVISIONAL</p>
        </div>
        <div className="flex-1 flex flex-col justify-around">
          {divSlots.map((matchup, idx) => (
            <div key={idx} className="mx-2">
              <MatchupCard matchup={matchup} compact />
            </div>
          ))}
        </div>
      </div>

      {/* Column 1: Wild Card (with BYE) - Fixed width */}
      <div className="flex flex-col py-2 bg-slate-800/10 rounded-lg" style={{ width: '110px' }}>
        <div className="text-center mb-2 bg-red-500/20 rounded mx-1 py-1">
          <p className="text-[10px] text-red-300 font-bold">WILD CARD</p>
        </div>
        <div className="flex-1 flex flex-col justify-around">
          {/* #1 Seed BYE */}
          <div className="h-12 flex items-center justify-center bg-slate-800/20 rounded border border-slate-700/30 mx-2">
            <span className="text-white/30 text-[10px] font-semibold">#1 BYE</span>
          </div>
          {wcSlots.map((matchup, idx) => (
            <div key={idx} className="mx-2">
              <MatchupCard matchup={matchup} compact />
            </div>
          ))}
        </div>
      </div>

      {/* SVG Connection Lines - Fixed positions */}
      <BracketConnectionsRight />
    </div>
  );
}

// Connection lines for AFC bracket - Fixed pixel positions
function BracketConnectionsLeft() {
  // Layout: WC=110px, gap=1px, DIV=110px, gap=1px, CONF=118px (total 340px)
  // X positions: WC ends at 110, DIV starts at 111, DIV ends at 221, CONF starts at 222
  // Y positions with justify-around:
  //   WC (4 items): 12.5%, 37.5%, 62.5%, 87.5%
  //   DIV (2 items): 25%, 75%
  //   CONF (1 item): 50%

  return (
    <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 5 }}>
      {/* === Wild Card to Divisional - Top DIV game === */}
      {/* Top DIV (25%) fed by: #1 BYE (12.5%) + WC Game 1 winner (37.5%) */}
      {/* Horizontal stub from BYE */}
      <line x1="110" y1="12.5%" x2="110.5" y2="12.5%" stroke="#60a5fa" strokeWidth="2" opacity="0.5" />
      {/* Horizontal stub from WC Game 1 */}
      <line x1="110" y1="37.5%" x2="110.5" y2="37.5%" stroke="#60a5fa" strokeWidth="2" opacity="0.5" />
      {/* Vertical connector between 12.5% and 37.5% */}
      <line x1="110.5" y1="12.5%" x2="110.5" y2="37.5%" stroke="#60a5fa" strokeWidth="2" opacity="0.5" />
      {/* Horizontal from midpoint (25%) to DIV */}
      <line x1="110.5" y1="25%" x2="111" y2="25%" stroke="#60a5fa" strokeWidth="2" opacity="0.5" />

      {/* === Wild Card to Divisional - Bottom DIV game === */}
      {/* Bottom DIV (75%) fed by: WC Game 2 (62.5%) + WC Game 3 (87.5%) */}
      {/* Horizontal stub from WC Game 2 */}
      <line x1="110" y1="62.5%" x2="110.5" y2="62.5%" stroke="#60a5fa" strokeWidth="2" opacity="0.5" />
      {/* Horizontal stub from WC Game 3 */}
      <line x1="110" y1="87.5%" x2="110.5" y2="87.5%" stroke="#60a5fa" strokeWidth="2" opacity="0.5" />
      {/* Vertical connector between 62.5% and 87.5% */}
      <line x1="110.5" y1="62.5%" x2="110.5" y2="87.5%" stroke="#60a5fa" strokeWidth="2" opacity="0.5" />
      {/* Horizontal from midpoint (75%) to DIV */}
      <line x1="110.5" y1="75%" x2="111" y2="75%" stroke="#60a5fa" strokeWidth="2" opacity="0.5" />

      {/* === Divisional to Conference === */}
      {/* CONF (50%) fed by: DIV Top (25%) + DIV Bottom (75%) */}
      {/* Horizontal stub from DIV Top */}
      <line x1="221" y1="25%" x2="221.5" y2="25%" stroke="#60a5fa" strokeWidth="2" opacity="0.5" />
      {/* Horizontal stub from DIV Bottom */}
      <line x1="221" y1="75%" x2="221.5" y2="75%" stroke="#60a5fa" strokeWidth="2" opacity="0.5" />
      {/* Vertical connector between 25% and 75% */}
      <line x1="221.5" y1="25%" x2="221.5" y2="75%" stroke="#60a5fa" strokeWidth="2" opacity="0.5" />
      {/* Horizontal from midpoint (50%) to CONF */}
      <line x1="221.5" y1="50%" x2="222" y2="50%" stroke="#60a5fa" strokeWidth="2.5" opacity="0.6" />

      {/* === Conference to Super Bowl === */}
      <line x1="340" y1="50%" x2="348" y2="50%" stroke="#fbbf24" strokeWidth="3" opacity="0.7" />
    </svg>
  );
}

// Connection lines for NFC bracket - Fixed pixel positions (mirrored)
function BracketConnectionsRight() {
  // Layout: CONF=118px, gap=1px, DIV=110px, gap=1px, WC=110px (total 340px)
  // X positions: CONF ends at 118, DIV starts at 119, DIV ends at 229, WC starts at 230
  // Y positions with justify-around:
  //   CONF (1 item): 50%
  //   DIV (2 items): 25%, 75%
  //   WC (4 items): 12.5%, 37.5%, 62.5%, 87.5%

  return (
    <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 5 }}>
      {/* === Super Bowl to Conference === */}
      <line x1="-8" y1="50%" x2="0" y2="50%" stroke="#fbbf24" strokeWidth="3" opacity="0.7" />

      {/* === Conference to Divisional === */}
      {/* CONF (50%) feeds: DIV Top (25%) + DIV Bottom (75%) */}
      {/* Horizontal stub from CONF */}
      <line x1="118" y1="50%" x2="118.5" y2="50%" stroke="#ef4444" strokeWidth="2.5" opacity="0.6" />
      {/* Vertical connector between 25% and 75% */}
      <line x1="118.5" y1="25%" x2="118.5" y2="75%" stroke="#ef4444" strokeWidth="2" opacity="0.5" />
      {/* Horizontal stub to DIV Top */}
      <line x1="118.5" y1="25%" x2="119" y2="25%" stroke="#ef4444" strokeWidth="2" opacity="0.5" />
      {/* Horizontal stub to DIV Bottom */}
      <line x1="118.5" y1="75%" x2="119" y2="75%" stroke="#ef4444" strokeWidth="2" opacity="0.5" />

      {/* === Divisional to Wild Card - Top DIV game === */}
      {/* DIV Top (25%) feeds: #1 BYE (12.5%) + WC Game 1 (37.5%) */}
      {/* Horizontal stub from DIV Top */}
      <line x1="229" y1="25%" x2="229.5" y2="25%" stroke="#ef4444" strokeWidth="2" opacity="0.5" />
      {/* Vertical connector between 12.5% and 37.5% */}
      <line x1="229.5" y1="12.5%" x2="229.5" y2="37.5%" stroke="#ef4444" strokeWidth="2" opacity="0.5" />
      {/* Horizontal stub to BYE */}
      <line x1="229.5" y1="12.5%" x2="230" y2="12.5%" stroke="#ef4444" strokeWidth="2" opacity="0.5" />
      {/* Horizontal stub to WC Game 1 */}
      <line x1="229.5" y1="37.5%" x2="230" y2="37.5%" stroke="#ef4444" strokeWidth="2" opacity="0.5" />

      {/* === Divisional to Wild Card - Bottom DIV game === */}
      {/* DIV Bottom (75%) feeds: WC Game 2 (62.5%) + WC Game 3 (87.5%) */}
      {/* Horizontal stub from DIV Bottom */}
      <line x1="229" y1="75%" x2="229.5" y2="75%" stroke="#ef4444" strokeWidth="2" opacity="0.5" />
      {/* Vertical connector between 62.5% and 87.5% */}
      <line x1="229.5" y1="62.5%" x2="229.5" y2="87.5%" stroke="#ef4444" strokeWidth="2" opacity="0.5" />
      {/* Horizontal stub to WC Game 2 */}
      <line x1="229.5" y1="62.5%" x2="230" y2="62.5%" stroke="#ef4444" strokeWidth="2" opacity="0.5" />
      {/* Horizontal stub to WC Game 3 */}
      <line x1="229.5" y1="87.5%" x2="230" y2="87.5%" stroke="#ef4444" strokeWidth="2" opacity="0.5" />
    </svg>
  );
}

interface MatchupCardProps {
  matchup: PlayoffMatchup;
  compact?: boolean;
}

function MatchupCard({ matchup, compact }: MatchupCardProps) {
  const isLive = matchup.status === 'in_progress';

  return (
    <div className={`bg-slate-800/80 rounded ${compact ? 'p-1' : 'p-2'} border ${isLive ? 'border-green-500/50' : 'border-slate-700/50'} relative z-10`}>
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

interface TeamRowProps {
  team: PlayoffTeam | null;
  isWinner: boolean;
  status: 'scheduled' | 'in_progress' | 'final';
  compact?: boolean;
}

function TeamRow({ team, isWinner, status, compact }: TeamRowProps) {
  if (!team) {
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
  const opacity = isComplete && !isWinner ? 'opacity-40' : '';

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
        <div className={`text-sm font-bold tabular-nums ${isWinner ? 'text-white' : 'text-white/40'}`}>
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
    <div className="w-full bg-gradient-to-br from-yellow-900/30 to-slate-800 rounded-lg p-4 border-2 border-yellow-600/50">
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
  const opacity = isComplete && !isWinner && !isTBD ? 'opacity-40' : '';

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
      divisional: divisionalGames.filter(g => isAFCGame(g)).map(gameToMatchup),
      conference: conferenceGames.find(g => isAFCGame(g)) ? gameToMatchup(conferenceGames.find(g => isAFCGame(g))!) : null,
    },
    nfc: {
      wildCard: wildCardGames.filter(g => !isAFCGame(g)).map(gameToMatchup).sort((a, b) => {
        const aSeed = Math.min(a.homeTeam?.seed || 999, a.awayTeam?.seed || 999);
        const bSeed = Math.min(b.homeTeam?.seed || 999, b.awayTeam?.seed || 999);
        return aSeed - bSeed;
      }),
      divisional: divisionalGames.filter(g => !isAFCGame(g)).map(gameToMatchup),
      conference: conferenceGames.find(g => !isAFCGame(g)) ? gameToMatchup(conferenceGames.find(g => !isAFCGame(g))!) : null,
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
