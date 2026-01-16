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
    <div className="h-full w-full bg-slate-900 p-6 overflow-y-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">NFL Playoffs {bracket.season}</h2>
        <p className="text-white/60 text-lg">{getRoundDisplayName(bracket.currentRound)}</p>
      </div>

      {/* Bracket Layout */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-3 gap-8">
          {/* Left: AFC Bracket */}
          <div className="space-y-6">
            <ConferenceBracket
              conference="AFC"
              wildCard={bracket.afc.wildCard}
              divisional={bracket.afc.divisional}
              conferenceGame={bracket.afc.conference}
            />
          </div>

          {/* Center: Super Bowl */}
          <div className="flex items-center justify-center">
            {bracket.superBowl && (
              <SuperBowlMatchup matchup={bracket.superBowl} />
            )}
          </div>

          {/* Right: NFC Bracket */}
          <div className="space-y-6">
            <ConferenceBracket
              conference="NFC"
              wildCard={bracket.nfc.wildCard}
              divisional={bracket.nfc.divisional}
              conferenceGame={bracket.nfc.conference}
            />
          </div>
        </div>
      </div>

      {/* Swipe hint */}
      <div className="text-center mt-8 text-white/30 text-sm">
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

function ConferenceBracket({ conference, wildCard, divisional, conferenceGame }: ConferenceBracketProps) {
  return (
    <div className="space-y-6">
      {/* Conference Header */}
      <div className="text-center">
        <h3 className="text-2xl font-bold text-white">{conference}</h3>
      </div>

      {/* Wild Card Round */}
      {wildCard.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-white/60 font-semibold">Wild Card</p>
          {wildCard.map((matchup) => (
            <MatchupCard key={matchup.id} matchup={matchup} />
          ))}
        </div>
      )}

      {/* Divisional Round */}
      {divisional.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-white/60 font-semibold">Divisional</p>
          {divisional.map((matchup) => (
            <MatchupCard key={matchup.id} matchup={matchup} />
          ))}
        </div>
      )}

      {/* Conference Championship */}
      {conferenceGame && (
        <div className="space-y-3">
          <p className="text-sm text-white/60 font-semibold">Championship</p>
          <MatchupCard matchup={conferenceGame} />
        </div>
      )}
    </div>
  );
}

interface MatchupCardProps {
  matchup: PlayoffMatchup;
}

function MatchupCard({ matchup }: MatchupCardProps) {
  return (
    <div className="bg-slate-800 rounded-lg p-3 border border-slate-700">
      {/* Away Team */}
      <TeamRow
        team={matchup.awayTeam}
        isWinner={matchup.winner === 'away'}
        status={matchup.status}
      />

      {/* Divider */}
      <div className="h-px bg-slate-700 my-2"></div>

      {/* Home Team */}
      <TeamRow
        team={matchup.homeTeam}
        isWinner={matchup.winner === 'home'}
        status={matchup.status}
      />

      {/* Game Status */}
      {matchup.status === 'in_progress' && (
        <div className="mt-2 text-center">
          <span className="text-xs text-green-400 font-semibold">LIVE</span>
        </div>
      )}
    </div>
  );
}

interface TeamRowProps {
  team: PlayoffTeam | null;
  isWinner: boolean;
  status: 'scheduled' | 'in_progress' | 'final';
}

function TeamRow({ team, isWinner, status }: TeamRowProps) {
  if (!team) {
    return (
      <div className="flex items-center gap-3 py-1">
        <div className="w-8 h-8 bg-slate-700 rounded"></div>
        <div className="flex-1">
          <span className="text-white/40 text-sm">TBD</span>
        </div>
      </div>
    );
  }

  const isComplete = status === 'final';
  const opacity = isComplete && !isWinner ? 'opacity-50' : '';

  return (
    <div className={`flex items-center gap-3 py-1 ${opacity}`}>
      {/* Team Logo */}
      <div className="w-8 h-8 flex-shrink-0">
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
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          {team.seed && (
            <span className="text-xs text-white/40">#{team.seed}</span>
          )}
          <span className={`font-semibold ${isWinner ? 'text-white' : 'text-white/80'}`}>
            {team.abbreviation}
          </span>
        </div>
      </div>

      {/* Score */}
      {team.score !== undefined && (
        <div className={`text-xl font-bold tabular-nums ${isWinner ? 'text-white' : 'text-white/60'}`}>
          {team.score}
        </div>
      )}
    </div>
  );
}

function SuperBowlMatchup({ matchup }: { matchup: PlayoffMatchup }) {
  return (
    <div className="bg-gradient-to-br from-yellow-900/30 to-slate-800 rounded-lg p-6 border-2 border-yellow-600/50">
      <div className="text-center mb-4">
        <h3 className="text-2xl font-bold text-yellow-400">Super Bowl</h3>
      </div>

      <div className="space-y-4">
        {/* Away Team */}
        <TeamRow
          team={matchup.awayTeam}
          isWinner={matchup.winner === 'away'}
          status={matchup.status}
        />

        <div className="text-center text-white/40 text-sm font-semibold">VS</div>

        {/* Home Team */}
        <TeamRow
          team={matchup.homeTeam}
          isWinner={matchup.winner === 'home'}
          status={matchup.status}
        />
      </div>

      {/* Game Status */}
      {matchup.status === 'in_progress' && (
        <div className="mt-4 text-center">
          <span className="text-sm text-green-400 font-semibold">LIVE</span>
        </div>
      )}
    </div>
  );
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
      wildCard: wildCardGames.filter(g => isAFCGame(g)).map(gameToMatchup),
      divisional: divisionalGames.filter(g => isAFCGame(g)).map(gameToMatchup),
      conference: conferenceGames.find(g => isAFCGame(g)) ? gameToMatchup(conferenceGames.find(g => isAFCGame(g))!) : null,
    },
    nfc: {
      wildCard: wildCardGames.filter(g => !isAFCGame(g)).map(gameToMatchup),
      divisional: divisionalGames.filter(g => !isAFCGame(g)).map(gameToMatchup),
      conference: conferenceGames.find(g => !isAFCGame(g)) ? gameToMatchup(conferenceGames.find(g => !isAFCGame(g))!) : null,
    },
    superBowl: superBowlGames[0] ? gameToMatchup(superBowlGames[0]) : null,
  };
}

// Check if game involves AFC teams (simple heuristic based on team names)
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

function getRoundDisplayName(round: PlayoffBracket['currentRound']): string {
  switch (round) {
    case 'wild_card':
      return 'Wild Card Round';
    case 'divisional':
      return 'Divisional Round';
    case 'conference':
      return 'Conference Championships';
    case 'super_bowl':
      return 'Super Bowl';
    default:
      return 'Playoffs';
  }
}
