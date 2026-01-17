import { useGameStore } from '../../stores/gameStore';
import { TeamStats } from './TeamStats';
import { isNFLGame, isTournamentGame, isUEFAGame } from '../../types/game';
import { UEFAStandings } from '../uefa/UEFAStandings';
import { TournamentGroupStandings } from '../tournament/TournamentGroupStandings';

export function StatsPanel() {
  const currentGame = useGameStore((state) => state.currentGame);
  const gameStats = useGameStore((state) => state.gameStats);
  const availableGames = useGameStore((state) => state.availableGames);

  if (!currentGame) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-slate-900">
        <p className="text-white/50 text-xl">No game data available</p>
      </div>
    );
  }

  // Show stats for non-NFL games
  if (!isNFLGame(currentGame)) {
    // Show Bundesliga match statistics (goals, cards, etc.)
    if (currentGame.sport === 'bundesliga') {
      const bundesligaGame = currentGame as any; // BundesligaGame type
      const goals = bundesligaGame.goals || [];

      return (
        <div className="h-full w-full bg-slate-900 p-6 overflow-y-auto">
          {/* Header */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white">Spielstatistik</h2>
            <p className="text-white/50">
              {currentGame.awayTeam.shortDisplayName} vs {currentGame.homeTeam.shortDisplayName}
            </p>
          </div>

          {/* Score */}
          <div className="flex justify-center gap-8 mb-8">
            <div className="text-center">
              <div className="text-white/50 text-sm mb-2">{currentGame.awayTeam.abbreviation}</div>
              <div className="text-5xl font-bold text-white">{currentGame.awayTeam.score}</div>
            </div>
            <div className="text-white/30 text-3xl flex items-center">:</div>
            <div className="text-center">
              <div className="text-white/50 text-sm mb-2">{currentGame.homeTeam.abbreviation}</div>
              <div className="text-5xl font-bold text-white">{currentGame.homeTeam.score}</div>
            </div>
          </div>

          {/* Halftime Score */}
          {bundesligaGame.halftimeScore && (
            <div className="text-center mb-6 text-white/50 text-sm">
              Halbzeit: {bundesligaGame.halftimeScore.away} : {bundesligaGame.halftimeScore.home}
            </div>
          )}

          {/* Goals */}
          {goals.length > 0 && (
            <div className="max-w-2xl mx-auto mb-6">
              <h3 className="text-lg font-semibold text-white mb-4">Tore</h3>
              <div className="space-y-2">
                {goals.map((goal: any, index: number) => (
                  <div
                    key={index}
                    className={`flex items-center gap-4 p-3 rounded bg-slate-800 ${
                      goal.scorerTeam === 'home' ? 'flex-row-reverse' : ''
                    }`}
                  >
                    <div className="text-white/50 text-sm w-12">{goal.minute}'</div>
                    <div className="flex-1">
                      <div className="text-white font-medium">{goal.scorerName}</div>
                      {(goal.isPenalty || goal.isOwnGoal) && (
                        <div className="text-xs text-white/50">
                          {goal.isPenalty && '(Elfmeter)'}
                          {goal.isOwnGoal && '(Eigentor)'}
                        </div>
                      )}
                    </div>
                    <div className="text-white/50 text-sm">
                      {goal.scoreAfter.away}:{goal.scoreAfter.home}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No goals yet */}
          {goals.length === 0 && currentGame.status === 'in_progress' && (
            <div className="text-center text-white/50 text-sm mb-6">
              Noch keine Tore gefallen
            </div>
          )}
        </div>
      );
    }

    // For tournaments (World Cup, Euro), show tournament-specific stats
    if (isTournamentGame(currentGame)) {
      const tournamentGame = currentGame;

      // Show tournament bracket placeholder for knockout phase
      if (tournamentGame.roundType !== 'group') {
        return (
          <div className="h-full w-full flex flex-col items-center justify-center bg-slate-900 p-6">
            <p className="text-white/50 text-xl mb-2">Turnierbaum</p>
            <p className="text-white/30 text-sm">{tournamentGame.round}</p>
            <p className="text-white/30 text-xs mt-4">Tournament bracket - Coming soon</p>
          </div>
        );
      }

      // Show group tables for group phase
      return (
        <TournamentGroupStandings
          currentGames={availableGames}
          currentGame={tournamentGame}
        />
      );
    }

    // For UEFA Champions League, show standings table
    if (isUEFAGame(currentGame)) {
      return <UEFAStandings currentGames={availableGames} />;
    }

    // Fallback for unknown sports
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-slate-900 p-6">
        <p className="text-white/50 text-xl mb-2">Keine Statistiken verfügbar</p>
      </div>
    );
  }

  // NFL: Show normal stats
  return (
    <div className="h-full w-full bg-slate-900 p-6 overflow-y-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white">Game Statistics</h2>
        <p className="text-white/50">
          {currentGame.awayTeam.shortDisplayName} vs {currentGame.homeTeam.shortDisplayName}
        </p>
      </div>

      {/* Team Stats Grid */}
      <div className="grid grid-cols-2 gap-6 max-w-5xl mx-auto">
        {/* Away Team Stats */}
        <TeamStats
          team={currentGame.awayTeam}
          stats={gameStats?.awayStats}
          isHome={false}
        />

        {/* Home Team Stats */}
        <TeamStats
          team={currentGame.homeTeam}
          stats={gameStats?.homeStats}
          isHome={true}
        />
      </div>

      {/* Efficiency Comparison */}
      {gameStats && (
        <div className="mt-8 max-w-3xl mx-auto">
          <h3 className="text-lg font-semibold text-white mb-4 text-center">
            Efficiency Comparison
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <EfficiencyCard
              label="3rd Down"
              awayValue={gameStats.awayStats.thirdDownEfficiency}
              awayPercent={gameStats.awayStats.thirdDownPercentage}
              homeValue={gameStats.homeStats.thirdDownEfficiency}
              homePercent={gameStats.homeStats.thirdDownPercentage}
            />
            <EfficiencyCard
              label="Red Zone"
              awayValue={gameStats.awayStats.redZoneEfficiency}
              awayPercent={gameStats.awayStats.redZonePercentage}
              homeValue={gameStats.homeStats.redZoneEfficiency}
              homePercent={gameStats.homeStats.redZonePercentage}
            />
            <EfficiencyCard
              label="Turnovers"
              awayValue={String(gameStats.awayStats.turnovers)}
              awayPercent={0}
              homeValue={String(gameStats.homeStats.turnovers)}
              homePercent={0}
              inverse={true}
            />
          </div>
        </div>
      )}
    </div>
  );
}

interface EfficiencyCardProps {
  label: string;
  awayValue: string;
  awayPercent: number;
  homeValue: string;
  homePercent: number;
  inverse?: boolean;
}

function EfficiencyCard({ 
  label, 
  awayValue, 
  awayPercent, 
  homeValue, 
  homePercent,
  inverse = false,
}: EfficiencyCardProps) {
  const awayWinning = inverse 
    ? parseInt(awayValue) < parseInt(homeValue)
    : awayPercent > homePercent;
  const homeWinning = inverse
    ? parseInt(homeValue) < parseInt(awayValue)
    : homePercent > awayPercent;

  return (
    <div className="bg-slate-800 rounded-lg p-4">
      <h4 className="text-sm text-white/60 text-center mb-3">{label}</h4>
      <div className="flex justify-between items-center">
        <div className={`text-center ${awayWinning ? 'text-green-400' : 'text-white'}`}>
          <div className="text-xl font-bold">{awayValue}</div>
          {!inverse && <div className="text-sm text-white/50">{awayPercent}%</div>}
        </div>
        <div className="text-white/30">vs</div>
        <div className={`text-center ${homeWinning ? 'text-green-400' : 'text-white'}`}>
          <div className="text-xl font-bold">{homeValue}</div>
          {!inverse && <div className="text-sm text-white/50">{homePercent}%</div>}
        </div>
      </div>
    </div>
  );
}
