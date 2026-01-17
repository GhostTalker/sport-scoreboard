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
    <div className="h-full w-full bg-slate-900 flex items-center justify-center overflow-hidden">
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

          {/* Center: Super Bowl - vertically centered */}
          <div className="flex flex-col items-center" style={{ width: '240px', height: '100%', paddingTop: '180px' }}>
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
  return (
    <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 5 }}>
      {/* Wild Card to Divisional - Lines from WC games to DIV games */}
      {/* WC Game 1 (37.5%) + WC Game 2 (62.5%) -> DIV Game 1 (25%) */}
      <line x1="110" y1="37.5%" x2="145" y2="37.5%" stroke="#60a5fa" strokeWidth="2" opacity="0.5" />
      <line x1="110" y1="62.5%" x2="145" y2="62.5%" stroke="#60a5fa" strokeWidth="2" opacity="0.5" />
      <line x1="145" y1="37.5%" x2="145" y2="62.5%" stroke="#60a5fa" strokeWidth="2" opacity="0.5" />
      <line x1="145" y1="50%" x2="165" y2="25%" stroke="#60a5fa" strokeWidth="2" opacity="0.5" />

      {/* BYE (12.5%) + WC Game 3 (87.5%) -> DIV Game 2 (75%) */}
      <line x1="110" y1="12.5%" x2="145" y2="12.5%" stroke="#60a5fa" strokeWidth="2" opacity="0.5" />
      <line x1="110" y1="87.5%" x2="145" y2="87.5%" stroke="#60a5fa" strokeWidth="2" opacity="0.5" />
      <line x1="145" y1="12.5%" x2="145" y2="87.5%" stroke="#60a5fa" strokeWidth="2" opacity="0.5" />
      <line x1="145" y1="50%" x2="165" y2="75%" stroke="#60a5fa" strokeWidth="2" opacity="0.5" />

      {/* Divisional to Conference - Both DIV games to CONF */}
      <line x1="220" y1="25%" x2="255" y2="25%" stroke="#60a5fa" strokeWidth="2" opacity="0.5" />
      <line x1="220" y1="75%" x2="255" y2="75%" stroke="#60a5fa" strokeWidth="2" opacity="0.5" />
      <line x1="255" y1="25%" x2="255" y2="75%" stroke="#60a5fa" strokeWidth="2" opacity="0.5" />
      <line x1="255" y1="50%" x2="280" y2="50%" stroke="#60a5fa" strokeWidth="2.5" opacity="0.6" />

      {/* Conference to Super Bowl */}
      <line x1="338" y1="50%" x2="360" y2="50%" stroke="#fbbf24" strokeWidth="3" opacity="0.7" />
    </svg>
  );
}

// Connection lines for NFC bracket - Fixed pixel positions (mirrored)
function BracketConnectionsRight() {
  return (
    <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 5 }}>
      {/* Conference to Super Bowl */}
      <line x1="0" y1="50%" x2="22" y2="50%" stroke="#fbbf24" strokeWidth="3" opacity="0.7" />

      {/* Conference to Divisional */}
      <line x1="58" y1="50%" x2="83" y2="50%" stroke="#ef4444" strokeWidth="2.5" opacity="0.6" />
      <line x1="83" y1="25%" x2="83" y2="75%" stroke="#ef4444" strokeWidth="2" opacity="0.5" />
      <line x1="83" y1="25%" x2="118" y2="25%" stroke="#ef4444" strokeWidth="2" opacity="0.5" />
      <line x1="83" y1="75%" x2="118" y2="75%" stroke="#ef4444" strokeWidth="2" opacity="0.5" />

      {/* Divisional to Wild Card - Top pair */}
      <line x1="173" y1="25%" x2="193" y2="50%" stroke="#ef4444" strokeWidth="2" opacity="0.5" />
      <line x1="193" y1="37.5%" x2="193" y2="62.5%" stroke="#ef4444" strokeWidth="2" opacity="0.5" />
      <line x1="193" y1="37.5%" x2="228" y2="37.5%" stroke="#ef4444" strokeWidth="2" opacity="0.5" />
      <line x1="193" y1="62.5%" x2="228" y2="62.5%" stroke="#ef4444" strokeWidth="2" opacity="0.5" />

      {/* Divisional to Wild Card - Bottom pair */}
      <line x1="173" y1="75%" x2="193" y2="50%" stroke="#ef4444" strokeWidth="2" opacity="0.5" />
      <line x1="193" y1="12.5%" x2="193" y2="87.5%" stroke="#ef4444" strokeWidth="2" opacity="0.5" />
      <line x1="193" y1="12.5%" x2="228" y2="12.5%" stroke="#ef4444" strokeWidth="2" opacity="0.5" />
      <line x1="193" y1="87.5%" x2="228" y2="87.5%" stroke="#ef4444" strokeWidth="2" opacity="0.5" />
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
