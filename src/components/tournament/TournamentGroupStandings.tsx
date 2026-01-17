import { useEffect, useState } from 'react';
import type { Game, GroupTable, TournamentGame } from '../../types/game';
import {
  calculateTournamentGroupStandings,
  getTournamentGroupPositionZone,
  getTournamentName,
} from '../../services/tournamentStandings';
import { getBestLogoUrl } from '../../utils/logoFallback';

interface TournamentGroupStandingsProps {
  currentGames: Game[];
  currentGame: TournamentGame;
}

export function TournamentGroupStandings({
  currentGames,
  currentGame,
}: TournamentGroupStandingsProps) {
  const [groupTables, setGroupTables] = useState<GroupTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);

  useEffect(() => {
    try {
      setLoading(true);
      const calculatedTables = calculateTournamentGroupStandings(currentGames);
      setGroupTables(calculatedTables);

      // Default to showing current game's group if available
      if (currentGame.group && calculatedTables.some((t) => t.groupName === currentGame.group)) {
        setSelectedGroup(currentGame.group);
      } else if (calculatedTables.length > 0) {
        setSelectedGroup(calculatedTables[0].groupName);
      }
    } catch (err) {
      console.error('Error calculating tournament standings:', err);
    } finally {
      setLoading(false);
    }
  }, [currentGames, currentGame.group]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white/60 text-lg">Tabelle wird geladen...</div>
      </div>
    );
  }

  if (groupTables.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white/60 text-lg">Keine Gruppendaten verfugbar</div>
      </div>
    );
  }

  const tournamentName = getTournamentName(currentGame.sport as 'worldcup' | 'euro');
  const displayedTable = selectedGroup
    ? groupTables.find((t) => t.groupName === selectedGroup)
    : groupTables[0];

  return (
    <div className="h-full flex flex-col bg-slate-900 px-3 py-2">
      {/* Header */}
      <div className="mb-2 flex-shrink-0">
        <h2 className="text-lg font-bold text-white">{tournamentName} Gruppenphase</h2>
        <p className="text-xs text-white/50">{currentGame.round}</p>
      </div>

      {/* Group Tabs */}
      <div className="flex gap-1 mb-2 overflow-x-auto flex-shrink-0">
        {groupTables.map((table) => (
          <button
            key={table.groupName}
            onClick={() => setSelectedGroup(table.groupName)}
            className={`px-3 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap ${
              selectedGroup === table.groupName
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700 text-white/70 hover:bg-slate-600'
            }`}
          >
            {table.groupName.replace('Gruppe ', '')}
          </button>
        ))}
      </div>

      {/* Selected Group Table */}
      {displayedTable && (
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="space-y-0.5 max-w-2xl mx-auto">
            {/* Table Header */}
            <div className="flex items-center gap-2 px-1.5 py-1 text-[10px] text-white/40 uppercase">
              <div className="w-8 text-center">#</div>
              <div className="w-5"></div>
              <div className="flex-1">Team</div>
              <div className="w-5 text-center">Sp</div>
              <div className="w-12 text-center">S-U-N</div>
              <div className="w-7 text-center">TD</div>
              <div className="w-9 text-right">Pkt</div>
            </div>

            {displayedTable.teams.map((entry) => {
              const zone = getTournamentGroupPositionZone(entry.position);

              return (
                <div
                  key={entry.teamId}
                  className="flex items-center gap-2 p-1.5 rounded bg-slate-800/50 transition-colors"
                  style={{
                    borderLeftWidth: '3px',
                    borderLeftColor: zone.color,
                  }}
                >
                  {/* Position */}
                  <div className="flex items-center gap-1 w-8">
                    <span className="text-sm font-bold text-white">{entry.position}</span>
                  </div>

                  {/* Team Logo */}
                  <div className="w-5 h-5 flex-shrink-0">
                    <img
                      src={getBestLogoUrl(entry.teamIconUrl, entry.teamName)}
                      alt={entry.shortName}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        e.currentTarget.src = '/images/tbd-logo.svg';
                      }}
                    />
                  </div>

                  {/* Team Name */}
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-xs font-medium truncate">
                      {entry.shortName || entry.teamName}
                    </div>
                  </div>

                  {/* Stats - Compact */}
                  <div className="flex items-center gap-1.5 text-xs">
                    {/* Games */}
                    <div className="text-white/50 w-5 text-center">{entry.played}</div>

                    {/* W-D-L */}
                    <div className="text-white/40 text-[10px] w-12 text-center">
                      {entry.won}-{entry.draw}-{entry.lost}
                    </div>

                    {/* Goal Difference */}
                    <div
                      className={`w-7 text-center font-mono ${
                        entry.goalDifference > 0
                          ? 'text-green-400'
                          : entry.goalDifference < 0
                          ? 'text-red-400'
                          : 'text-white/50'
                      }`}
                    >
                      {entry.goalDifference > 0 ? '+' : ''}
                      {entry.goalDifference}
                    </div>

                    {/* Points */}
                    <div className="w-9 text-right">
                      <span className="text-white font-bold text-xs">{entry.points}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Compact Legend */}
      <div className="mt-2 pt-2 border-t border-white/10 flex-shrink-0">
        <div className="text-[10px] text-white/40 grid grid-cols-1 gap-y-0.5 max-w-2xl mx-auto">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded" style={{ backgroundColor: '#10B981' }}></div>
            <span>Achtelfinale (Platz 1-2)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded" style={{ backgroundColor: '#EF4444' }}></div>
            <span>Ausgeschieden (Platz 3-4)</span>
          </div>
        </div>
      </div>

      {/* Swipe hint */}
      <div className="text-center mt-2 text-white/30 text-xs">
        Swipe down to return to scoreboard
      </div>
    </div>
  );
}
