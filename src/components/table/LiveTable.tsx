import { useEffect, useState } from 'react';
import type { LiveTableEntry } from '../../types/bundesliga';
import type { Game } from '../../types/game';
import { fetchBundesligaTable, calculateLiveTable, getPositionZone } from '../../services/bundesligaTable';
import { getBestLogoUrl } from '../../utils/logoFallback';

interface LiveTableProps {
  currentGames: Game[];
  season?: number;
}

export function LiveTable({ currentGames, season = 2024 }: LiveTableProps) {
  const [liveTable, setLiveTable] = useState<LiveTableEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadTable() {
      try {
        setLoading(true);
        setError(null);
        const officialTable = await fetchBundesligaTable(season);
        const calculatedTable = calculateLiveTable(officialTable, currentGames);
        setLiveTable(calculatedTable);
      } catch (err) {
        console.error('Error loading table:', err);
        setError('Tabelle konnte nicht geladen werden');
      } finally {
        setLoading(false);
      }
    }

    loadTable();
  }, [currentGames, season]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white/60 text-lg">Tabelle wird geladen...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-red-400 text-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-900 px-3 py-2">
      {/* Compact Header */}
      <div className="mb-2 flex-shrink-0">
        <h2 className="text-lg font-bold text-white">⚡ Blitztabelle</h2>
        <p className="text-xs text-white/50">Live basierend auf aktuellen Spielständen</p>
      </div>

      {/* Scrollable Table */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="space-y-0.5">
          {liveTable.map((entry) => {
            const zone = getPositionZone(entry.position);
            const hasPositionChange = entry.previousPosition !== entry.position;
            const positionChange = hasPositionChange
              ? entry.previousPosition! - entry.position
              : 0;
            const hasLivePoints = entry.livePoints !== entry.points;

            return (
              <div
                key={entry.teamId}
                className={`flex items-center gap-2 p-1.5 rounded transition-colors ${
                  hasLivePoints ? 'bg-blue-500/10 border border-blue-500/30' : 'bg-slate-800/50'
                }`}
                style={{
                  borderLeftWidth: '3px',
                  borderLeftColor: zone.color,
                }}
              >
                {/* Position */}
                <div className="flex items-center gap-1 w-8">
                  <span className="text-sm font-bold text-white">{entry.position}</span>
                  {hasPositionChange && (
                    <span
                      className={`text-[10px] ${
                        positionChange > 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {positionChange > 0 ? `↑${positionChange}` : `↓${Math.abs(positionChange)}`}
                    </span>
                  )}
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
                  <div className="text-white text-xs font-medium truncate">{entry.shortName}</div>
                </div>

                {/* Stats - Compact */}
                <div className="flex items-center gap-2 text-xs">
                  {/* Games */}
                  <div className="text-white/50 w-5 text-center">{entry.played}</div>

                  {/* Goal Difference */}
                  <div
                    className={`w-8 text-center font-mono ${
                      entry.liveGoalDifference > 0
                        ? 'text-green-400'
                        : entry.liveGoalDifference < 0
                        ? 'text-red-400'
                        : 'text-white/50'
                    }`}
                  >
                    {entry.liveGoalDifference > 0 ? '+' : ''}
                    {entry.liveGoalDifference}
                  </div>

                  {/* Points */}
                  <div className="w-10 text-right">
                    {hasLivePoints ? (
                      <div className="flex items-center gap-0.5 justify-end">
                        <span className="text-white/30 line-through text-[10px]">
                          {entry.points}
                        </span>
                        <span className="text-blue-400 font-bold text-xs">{entry.livePoints}</span>
                      </div>
                    ) : (
                      <span className="text-white font-bold text-xs">{entry.points}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Compact Legend */}
      <div className="mt-2 pt-2 border-t border-white/10 flex-shrink-0">
        <div className="text-[10px] text-white/40 grid grid-cols-2 gap-x-4 gap-y-0.5">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded" style={{ backgroundColor: '#0066CC' }}></div>
            <span>CL (1-4)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded" style={{ backgroundColor: '#FFAA00' }}></div>
            <span>Relegation (16)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded" style={{ backgroundColor: '#FF6600' }}></div>
            <span>EL (5)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded" style={{ backgroundColor: '#CC0000' }}></div>
            <span>Abstieg (17-18)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded" style={{ backgroundColor: '#00CC66' }}></div>
            <span>ECL (6)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
