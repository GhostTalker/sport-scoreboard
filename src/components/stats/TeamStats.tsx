import type { Team } from '../../types/game';
import type { TeamStats as TeamStatsType } from '../../types/stats';

interface TeamStatsProps {
  team: Team;
  stats?: TeamStatsType;
  isHome: boolean;
}

export function TeamStats({ team, stats, isHome }: TeamStatsProps) {
  return (
    <div 
      className="bg-slate-800 rounded-xl p-4"
      style={{ borderTop: `4px solid #${team.color}` }}
    >
      {/* Team Header */}
      <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-700">
        <img 
          src={team.logo} 
          alt={team.displayName}
          className="w-10 h-10 object-contain"
        />
        <div>
          <h3 className="font-bold text-white">{team.shortDisplayName}</h3>
          <span className="text-xs text-white/50">{isHome ? 'HOME' : 'AWAY'}</span>
        </div>
        <div className="ml-auto text-3xl font-bold text-white">
          {team.score}
        </div>
      </div>

      {stats ? (
        <div className="space-y-4">
          {/* Passing Leader */}
          {stats.passing && (
            <StatCategory
              label="PASSING"
              playerName={stats.passing.name}
              statsLine={stats.passing.stats}
              icon="🏈"
            />
          )}

          {/* Rushing Leader */}
          {stats.rushing && (
            <StatCategory
              label="RUSHING"
              playerName={stats.rushing.name}
              statsLine={stats.rushing.stats}
              icon="🏃"
            />
          )}

          {/* Receiving Leader */}
          {stats.receiving && (
            <StatCategory
              label="RECEIVING"
              playerName={stats.receiving.name}
              statsLine={stats.receiving.stats}
              icon="🎯"
            />
          )}

          {/* Team Totals */}
          <div className="pt-3 border-t border-slate-700">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <StatLine label="Total Yards" value={String(stats.totalYards)} />
              <StatLine label="Time of Poss." value={stats.timeOfPossession} />
              <StatLine label="Sacks" value={String(stats.sacks)} />
              <StatLine label="Penalties" value={`${stats.penalties} (${stats.penaltyYards} yds)`} />
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-white/40">
          <p>Stats not available</p>
        </div>
      )}
    </div>
  );
}

interface StatCategoryProps {
  label: string;
  playerName: string;
  statsLine: string;
  icon: string;
}

function StatCategory({ label, playerName, statsLine, icon }: StatCategoryProps) {
  return (
    <div className="bg-slate-700/50 rounded-lg p-3">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-lg">{icon}</span>
        <span className="text-xs text-white/50 uppercase tracking-wider">{label}</span>
      </div>
      <div className="font-semibold text-white">{playerName}</div>
      <div className="text-sm text-white/70">{statsLine}</div>
    </div>
  );
}

interface StatLineProps {
  label: string;
  value: string;
}

function StatLine({ label, value }: StatLineProps) {
  return (
    <div className="flex justify-between">
      <span className="text-white/50">{label}</span>
      <span className="text-white font-medium">{value}</span>
    </div>
  );
}
