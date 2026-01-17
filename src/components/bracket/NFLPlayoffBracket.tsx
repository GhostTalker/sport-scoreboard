import { useGameStore } from '../../stores/gameStore';
import { isNFLGame } from '../../types/game';
import type { NFLGame, PlayoffMatchup, PlayoffTeam, PlayoffBracket } from '../../types/nfl';

export function NFLPlayoffBracket() {
  const currentGame = useGameStore((state) => state.currentGame);
  const availableGames = useGameStore((state) => state.availableGames);

  if (!currentGame || !isNFLGame(currentGame)) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-slate-900">
        <p className="text-white/50 text-xl">No NFL game data available</p>
      </div>
    );
  }

  // Build playoff bracket from available games
  const bracket = buildPlayoffBracket(availableGames.filter(isNFLGame), currentGame);

  return (
    <div className="h-full w-full bg-slate-900 p-4 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="text-center mb-4">
        <h2 className="text-2xl font-bold text-white">NFL Playoffs {bracket.season}</h2>
      </div>

      {/* Bracket Layout - Three columns: AFC left, Super Bowl center, NFC right */}
      <div className="flex-1 flex items-stretch gap-4 min-h-0">
        {/* Left: AFC Bracket */}
        <div className="flex-1 flex flex-col">
          <div className="text-center mb-3">
            <h3 className="text-xl font-bold text-blue-400">AFC</h3>
          </div>
          <div className="flex-1 min-h-0">
            <ConferenceBracketLeft
              conference="AFC"
              wildCard={bracket.afc.wildCard}
              divisional={bracket.afc.divisional}
              conferenceGame={bracket.afc.conference}
            />
          </div>
        </div>

        {/* Center: Super Bowl */}
        <div className="w-64 flex items-center justify-center">
          <SuperBowlMatchup matchup={bracket.superBowl} />
        </div>

        {/* Right: NFC Bracket */}
        <div className="flex-1 flex flex-col">
          <div className="text-center mb-3">
            <h3 className="text-xl font-bold text-red-400">NFC</h3>
          </div>
          <div className="flex-1 min-h-0">
            <ConferenceBracketRight
              conference="NFC"
              wildCard={bracket.nfc.wildCard}
              divisional={bracket.nfc.divisional}
              conferenceGame={bracket.nfc.conference}
            />
          </div>
        </div>
      </div>

      {/* Swipe hint */}
      <div className="text-center mt-2 text-white/30 text-xs">
        Swipe left to return to scoreboard
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

// AFC Bracket - Left side (flows left to right)
function ConferenceBracketLeft({ conference, wildCard, divisional, conferenceGame }: ConferenceBracketProps) {
  const wcSlots = Array(3).fill(null).map((_, i) => wildCard[i] || createPlaceholderMatchup('wild_card', conference, i));
  const divSlots = Array(2).fill(null).map((_, i) => divisional[i] || createPlaceholderMatchup('divisional', conference, i));
  const confSlot = conferenceGame || createPlaceholderMatchup('conference', conference, 0);

  return (
    <div className="relative h-full flex">
      {/* Column 1: Wild Card (with BYE) */}
      <div className="flex-1 flex flex-col justify-around py-2">
        <div className="text-center mb-1">
          <p className="text-[10px] text-white/40 font-semibold">WC</p>
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

      {/* Column 2: Divisional */}
      <div className="flex-1 flex flex-col justify-around py-2">
        <div className="text-center mb-1">
          <p className="text-[10px] text-white/40 font-semibold">DIV</p>
        </div>
        <div className="flex-1 flex flex-col justify-around">
          {divSlots.map((matchup, idx) => (
            <div key={idx} className="mx-2">
              <MatchupCard matchup={matchup} compact />
            </div>
          ))}
        </div>
      </div>

      {/* Column 3: Conference Championship */}
      <div className="flex-1 flex flex-col justify-center py-2">
        <div className="text-center mb-1">
          <p className="text-[10px] text-white/40 font-semibold">CONF</p>
        </div>
        <div className="mx-2">
          <MatchupCard matchup={confSlot} compact />
        </div>
      </div>

      {/* Connection Lines */}
      <BracketConnectionsLeft />
    </div>
  );
}

// NFC Bracket - Right side (flows right to left, mirrored)
function ConferenceBracketRight({ conference, wildCard, divisional, conferenceGame }: ConferenceBracketProps) {
  const wcSlots = Array(3).fill(null).map((_, i) => wildCard[i] || createPlaceholderMatchup('wild_card', conference, i));
  const divSlots = Array(2).fill(null).map((_, i) => divisional[i] || createPlaceholderMatchup('divisional', conference, i));
  const confSlot = conferenceGame || createPlaceholderMatchup('conference', conference, 0);

  return (
    <div className="relative h-full flex">
      {/* Column 3: Conference Championship */}
      <div className="flex-1 flex flex-col justify-center py-2">
        <div className="text-center mb-1">
          <p className="text-[10px] text-white/40 font-semibold">CONF</p>
        </div>
        <div className="mx-2">
          <MatchupCard matchup={confSlot} compact />
        </div>
      </div>

      {/* Column 2: Divisional */}
      <div className="flex-1 flex flex-col justify-around py-2">
        <div className="text-center mb-1">
          <p className="text-[10px] text-white/40 font-semibold">DIV</p>
        </div>
        <div className="flex-1 flex flex-col justify-around">
          {divSlots.map((matchup, idx) => (
            <div key={idx} className="mx-2">
              <MatchupCard matchup={matchup} compact />
            </div>
          ))}
        </div>
      </div>

      {/* Column 1: Wild Card (with BYE) */}
      <div className="flex-1 flex flex-col justify-around py-2">
        <div className="text-center mb-1">
          <p className="text-[10px] text-white/40 font-semibold">WC</p>
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

      {/* Connection Lines (mirrored) */}
      <BracketConnectionsRight />
    </div>
  );
}

// Connection lines for left bracket (AFC)
function BracketConnectionsLeft() {
  // justify-around positioning for 4 items (BYE + 3 WC): ~12%, 31%, 51%, 70%
  // justify-around positioning for 2 items (DIV): ~40%, 60%
  return (
    <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
      {/* Wild Card to Divisional - Top pair (WC game 1 @ 31% + WC game 2 @ 51% -> DIV game 1 @ 40%) */}
      <line x1="33%" y1="31%" x2="50%" y2="31%" stroke="#475569" strokeWidth="1.5" opacity="0.4" />
      <line x1="33%" y1="51%" x2="50%" y2="51%" stroke="#475569" strokeWidth="1.5" opacity="0.4" />
      <line x1="50%" y1="31%" x2="50%" y2="51%" stroke="#475569" strokeWidth="1.5" opacity="0.4" />
      <line x1="50%" y1="41%" x2="66%" y2="40%" stroke="#475569" strokeWidth="1.5" opacity="0.4" />

      {/* Wild Card to Divisional - Bottom pair (WC game 3 @ 70% -> DIV game 2 @ 60%) */}
      <line x1="33%" y1="70%" x2="50%" y2="70%" stroke="#475569" strokeWidth="1.5" opacity="0.4" />
      <line x1="50%" y1="51%" x2="50%" y2="70%" stroke="#475569" strokeWidth="1.5" opacity="0.4" />
      <line x1="50%" y1="60.5%" x2="66%" y2="60%" stroke="#475569" strokeWidth="1.5" opacity="0.4" />

      {/* Divisional to Conference */}
      <line x1="66%" y1="40%" x2="83%" y2="40%" stroke="#475569" strokeWidth="1.5" opacity="0.4" />
      <line x1="66%" y1="60%" x2="83%" y2="60%" stroke="#475569" strokeWidth="1.5" opacity="0.4" />
      <line x1="83%" y1="40%" x2="83%" y2="60%" stroke="#475569" strokeWidth="1.5" opacity="0.4" />
      <line x1="83%" y1="50%" x2="100%" y2="50%" stroke="#475569" strokeWidth="2" opacity="0.5" />
    </svg>
  );
}

// Connection lines for right bracket (NFC - mirrored)
function BracketConnectionsRight() {
  // justify-around positioning for 4 items (BYE + 3 WC): ~12%, 31%, 51%, 70%
  // justify-around positioning for 2 items (DIV): ~40%, 60%
  return (
    <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
      {/* Conference to Divisional */}
      <line x1="0%" y1="50%" x2="17%" y2="50%" stroke="#475569" strokeWidth="2" opacity="0.5" />
      <line x1="17%" y1="40%" x2="17%" y2="60%" stroke="#475569" strokeWidth="1.5" opacity="0.4" />
      <line x1="17%" y1="40%" x2="34%" y2="40%" stroke="#475569" strokeWidth="1.5" opacity="0.4" />
      <line x1="17%" y1="60%" x2="34%" y2="60%" stroke="#475569" strokeWidth="1.5" opacity="0.4" />

      {/* Divisional to Wild Card - Top pair (DIV game 1 @ 40% -> WC game 1 @ 31% + WC game 2 @ 51%) */}
      <line x1="34%" y1="40%" x2="50%" y2="41%" stroke="#475569" strokeWidth="1.5" opacity="0.4" />
      <line x1="50%" y1="31%" x2="50%" y2="51%" stroke="#475569" strokeWidth="1.5" opacity="0.4" />
      <line x1="50%" y1="31%" x2="67%" y2="31%" stroke="#475569" strokeWidth="1.5" opacity="0.4" />
      <line x1="50%" y1="51%" x2="67%" y2="51%" stroke="#475569" strokeWidth="1.5" opacity="0.4" />

      {/* Divisional to Wild Card - Bottom pair (DIV game 2 @ 60% -> WC game 3 @ 70%) */}
      <line x1="34%" y1="60%" x2="50%" y2="60.5%" stroke="#475569" strokeWidth="1.5" opacity="0.4" />
      <line x1="50%" y1="51%" x2="50%" y2="70%" stroke="#475569" strokeWidth="1.5" opacity="0.4" />
      <line x1="50%" y1="70%" x2="67%" y2="70%" stroke="#475569" strokeWidth="1.5" opacity="0.4" />
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
  if (!matchup) {
    return (
      <div className="w-full bg-gradient-to-br from-yellow-900/20 to-slate-800/50 rounded-lg p-4 border-2 border-yellow-600/30">
        <div className="text-center mb-3">
          <h3 className="text-lg font-bold text-yellow-400/60">Super Bowl</h3>
          <p className="text-white/20 text-[10px] mt-1">To Be Determined</p>
        </div>
      </div>
    );
  }

  const isLive = matchup.status === 'in_progress';

  return (
    <div className="w-full bg-gradient-to-br from-yellow-900/30 to-slate-800 rounded-lg p-4 border-2 border-yellow-600/50">
      <div className="text-center mb-3">
        <h3 className="text-lg font-bold text-yellow-400">Super Bowl</h3>
        {matchup.venue && (
          <p className="text-white/40 text-[9px] mt-0.5">{matchup.venue}</p>
        )}
      </div>

      <div className="space-y-2">
        {/* Away Team */}
        <TeamRow
          team={matchup.awayTeam}
          isWinner={matchup.winner === 'away'}
          status={matchup.status}
        />

        <div className="text-center text-white/30 text-[10px] font-semibold">VS</div>

        {/* Home Team */}
        <TeamRow
          team={matchup.homeTeam}
          isWinner={matchup.winner === 'home'}
          status={matchup.status}
        />
      </div>

      {/* Live indicator */}
      {isLive && (
        <div className="mt-2 text-center">
          <span className="text-[10px] text-green-400 font-semibold">● LIVE</span>
        </div>
      )}
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
