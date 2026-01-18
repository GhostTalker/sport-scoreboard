import { useEffect, useState } from 'react';
import type { UEFATableEntry } from '../../services/uefaStandings';
import type { Game } from '../../types/game';
import { calculateUEFAStandings, getUEFAPositionZone } from '../../services/uefaStandings';
import { getBestLogoUrl } from '../../utils/logoFallback';

interface UEFAStandingsProps {
  currentGames: Game[];
}

export function UEFAStandings({ currentGames }: UEFAStandingsProps) {
  const [standings, setStandings] = useState<UEFATableEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      setLoading(true);
      const calculatedStandings = calculateUEFAStandings(currentGames);
      setStandings(calculatedStandings);
    } catch (err) {
      console.error('Error calculating UEFA standings:', err);
    } finally {
      setLoading(false);
    }
  }, [currentGames]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white/60 text-lg">Tabelle wird geladen...</div>
      </div>
    );
  }

  if (standings.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-white/60 text-lg">Keine Daten verfügbar</div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-900 px-3 py-2">
      {/* Header */}
      <div className="mb-2 flex-shrink-0">
        <h2 className="text-lg font-bold text-white">⚡ UEFA Champions League Tabelle</h2>
        <p className="text-xs text-white/50">Ligaphase 2024/25</p>
      </div>

      {/* Scrollable Table */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="space-y-0.5 max-w-2xl mx-auto">
          {standings.map((entry) => {
            const zone = getUEFAPositionZone(entry.position);

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

      {/* Compact Legend */}
      <div className="mt-2 pt-2 border-t border-white/10 flex-shrink-0">
        <div className="text-[10px] text-white/40 grid grid-cols-1 gap-y-0.5 max-w-2xl mx-auto">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded" style={{ backgroundColor: '#10B981' }}></div>
            <span>Achtelfinale Direkt (1-8)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded" style={{ backgroundColor: '#3B82F6' }}></div>
            <span>Playoff Qualifikation (9-24)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded" style={{ backgroundColor: '#EF4444' }}></div>
            <span>Ausgeschieden (25-36)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
