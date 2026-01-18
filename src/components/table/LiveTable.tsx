import { useEffect, useState } from 'react';
import type { LiveTableEntry } from '../../types/bundesliga';
import type { Game } from '../../types/game';
import { fetchBundesligaTable, calculateLiveTable, getPositionZone } from '../../services/bundesligaTable';
import { getBestLogoUrl } from '../../utils/logoFallback';
import { LiveTableSkeleton } from '../LoadingSkeleton';

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
    return <LiveTableSkeleton />;
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
      {/* Centered Header */}
      <div className="mb-2 flex-shrink-0 text-center">
        <h2 className="text-lg font-bold text-white">⚡ Blitztabelle</h2>
        <p className="text-xs text-white/50">Live basierend auf aktuellen Spielständen</p>
      </div>

      {/* Scrollable Table */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="space-y-0.5 max-w-2xl mx-auto">
          {liveTable.map((entry) => {
            const zone = getPositionZone(entry.position);
            const hasPositionChange = entry.previousPosition !== entry.position;
            const positionChange = hasPositionChange
              ? entry.previousPosition! - entry.position
              : 0;

            // Check if this team is currently playing in a live game
            const isPlayingLive = currentGames.some(game => {
              const isLive = game.status === 'in_progress' || game.status === 'halftime' || game.status === 'end_period';
              const isTeamInGame = game.homeTeam.id === String(entry.teamId) || game.awayTeam.id === String(entry.teamId);
              return isLive && isTeamInGame;
            });

            return (
              <div
                key={entry.teamId}
                className={`flex items-center gap-2 p-1.5 rounded transition-colors ${
                  isPlayingLive ? 'animate-pulse' : ''
                }`}
                style={{
                  borderLeftWidth: '3px',
                  borderLeftColor: zone.color,
                  backgroundColor: zone.color + '15', // Add 15% opacity to zone color
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
                    src={entry.teamId === 80 ? '/logos/union.png' : getBestLogoUrl(entry.teamIconUrl, entry.teamName)}
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
                  <div className="w-9 text-right">
                    <span className="font-bold text-xs text-white">
                      {entry.livePoints}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Compact Legend */}
      <div className="mt-2 pt-2 border-t border-white/10 flex-shrink-0">
        <div className="text-[10px] text-white/40 grid grid-cols-2 gap-x-4 gap-y-0.5 max-w-2xl mx-auto">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded" style={{ backgroundColor: '#9333EA' }}></div>
            <span>Meister (1)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded" style={{ backgroundColor: '#FFAA00' }}></div>
            <span>Relegation (16)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded" style={{ backgroundColor: '#0066CC' }}></div>
            <span>CL (2-4)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded" style={{ backgroundColor: '#CC0000' }}></div>
            <span>Abstieg (17-18)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded" style={{ backgroundColor: '#FF6600' }}></div>
            <span>EL (5)</span>
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
