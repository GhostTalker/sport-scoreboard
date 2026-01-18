// Aggregate Score Display Component
// Shows combined score for UEFA knockout 2-leg matches

import type { AggregateScore } from '../../types/uefa';
import { getLegDescription } from '../../services/aggregateScore';
import { useSettingsStore } from '../../stores/settingsStore';

interface AggregateScoreDisplayProps {
  aggregate: AggregateScore;
  homeTeamAbbr: string;
  awayTeamAbbr: string;
}

/**
 * Displays the aggregate score for UEFA knockout rounds
 * Shows: Current leg indicator, aggregate total, and first leg result
 */
export function AggregateScoreDisplay({
  aggregate,
  homeTeamAbbr,
  awayTeamAbbr,
}: AggregateScoreDisplayProps) {
  const language = useSettingsStore((state) => state.language);
  const legDescription = getLegDescription(aggregate.currentLeg, language);

  // Determine if there's a clear leader on aggregate
  const hasLeader = aggregate.homeTotal !== aggregate.awayTotal;
  const homeLeading = aggregate.homeTotal > aggregate.awayTotal;
  const awayLeading = aggregate.awayTotal > aggregate.homeTotal;

  // Text labels based on language
  const labels = {
    aggregate: language === 'de' ? 'Gesamt' : 'Aggregate',
    firstLeg: language === 'de' ? 'Hinspiel' : '1st Leg',
    secondLeg: language === 'de' ? 'Rückspiel' : '2nd Leg',
    tbd: language === 'de' ? 'TBD' : 'TBD',
  };

  return (
    <div className="flex flex-col items-center gap-1 mt-2">
      {/* Current leg indicator */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-white/50 uppercase tracking-wider px-2 py-0.5 rounded bg-white/10">
          {legDescription}
        </span>
      </div>

      {/* Aggregate Score Box */}
      <div
        className="flex items-center gap-3 px-4 py-2 rounded-lg"
        style={{
          background: 'linear-gradient(180deg, rgba(0,70,150,0.4) 0%, rgba(0,50,120,0.3) 100%)',
          border: '1px solid rgba(255,255,255,0.15)',
          boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
        }}
      >
        {/* Label */}
        <span className="text-xs text-white/60 uppercase tracking-wider font-medium">
          {labels.aggregate}:
        </span>

        {/* Score Display */}
        <div className="flex items-center gap-2">
          {/* Home Team Aggregate */}
          <span
            className={`text-xl font-black ${
              homeLeading ? 'text-green-400' : hasLeader && awayLeading ? 'text-white/60' : 'text-white'
            }`}
          >
            {aggregate.homeTotal}
          </span>

          {/* Separator */}
          <span className="text-white/40 text-lg">-</span>

          {/* Away Team Aggregate */}
          <span
            className={`text-xl font-black ${
              awayLeading ? 'text-green-400' : hasLeader && homeLeading ? 'text-white/60' : 'text-white'
            }`}
          >
            {aggregate.awayTotal}
          </span>
        </div>
      </div>

      {/* First/Second Leg Results */}
      <div className="flex items-center gap-4 text-xs text-white/40">
        {/* First Leg Result */}
        <div className="flex items-center gap-1">
          <span className="uppercase tracking-wider">{labels.firstLeg}:</span>
          {aggregate.currentLeg === 1 ? (
            // Current game is first leg - show live score
            <span className="text-white/60 font-medium">
              {aggregate.firstLeg.home}-{aggregate.firstLeg.away}
            </span>
          ) : (
            // Current game is second leg - show completed first leg
            <span className="text-white/60 font-medium">
              {aggregate.firstLeg.home}-{aggregate.firstLeg.away}
            </span>
          )}
        </div>

        {/* Second Leg Result (if available) */}
        {aggregate.secondLeg && (
          <>
            <span className="text-white/20">|</span>
            <div className="flex items-center gap-1">
              <span className="uppercase tracking-wider">{labels.secondLeg}:</span>
              <span className="text-white/60 font-medium">
                {aggregate.secondLeg.home}-{aggregate.secondLeg.away}
              </span>
            </div>
          </>
        )}

        {/* TBD indicator for second leg if not played */}
        {!aggregate.secondLeg && aggregate.currentLeg === 1 && (
          <>
            <span className="text-white/20">|</span>
            <div className="flex items-center gap-1">
              <span className="uppercase tracking-wider">{labels.secondLeg}:</span>
              <span className="text-white/40 italic">{labels.tbd}</span>
            </div>
          </>
        )}
      </div>

      {/* Winner indicator (only when both legs finished and decided) */}
      {aggregate.winner && aggregate.winner !== 'tbd' && aggregate.secondLeg && (
        <div className="flex items-center gap-2 mt-1">
          <div
            className="flex items-center gap-1.5 px-3 py-1 rounded-full"
            style={{
              background: 'linear-gradient(180deg, rgba(16,185,129,0.3) 0%, rgba(5,150,105,0.2) 100%)',
              border: '1px solid rgba(16,185,129,0.4)',
            }}
          >
            <svg
              className="w-3 h-3 text-green-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-xs text-green-400 font-bold uppercase tracking-wider">
              {aggregate.winner === 'home' ? homeTeamAbbr : awayTeamAbbr}
              {language === 'de' ? ' weiter' : ' advances'}
            </span>
          </div>
        </div>
      )}

      {/* Aggregate tie indicator */}
      {aggregate.secondLeg &&
        aggregate.homeTotal === aggregate.awayTotal &&
        (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-yellow-400/80 italic">
              {language === 'de'
                ? 'Gesamt unentschieden - Verlängerung/Elfmeter'
                : 'Aggregate tie - Extra time/Penalties'}
            </span>
          </div>
        )}
    </div>
  );
}

/**
 * Compact version for use in game list/selector
 */
export function AggregateScoreBadge({
  aggregate,
}: {
  aggregate: AggregateScore;
}) {
  const language = useSettingsStore((state) => state.language);
  const legDescription = getLegDescription(aggregate.currentLeg, language);

  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-white/40 uppercase tracking-wider">
        {legDescription}
      </span>
      <span className="text-xs text-white/60 px-1.5 py-0.5 rounded bg-white/10">
        {language === 'de' ? 'Ges' : 'Agg'}: {aggregate.homeTotal}-{aggregate.awayTotal}
      </span>
    </div>
  );
}
