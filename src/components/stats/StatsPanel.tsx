import { useGameStore } from '../../stores/gameStore';
import { TeamStats } from './TeamStats';

export function StatsPanel() {
  const currentGame = useGameStore((state) => state.currentGame);
  const gameStats = useGameStore((state) => state.gameStats);

  if (!currentGame) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-slate-900">
        <p className="text-white/50 text-xl">No game data available</p>
      </div>
    );
  }

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

      {/* Swipe hint */}
      <div className="text-center mt-8 text-white/30 text-sm">
        Swipe down to return to scoreboard
      </div>
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
