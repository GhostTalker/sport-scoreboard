/**
 * LoadingSkeleton - Skeleton loading states for the scoreboard
 *
 * Provides shimmer effect loading placeholders that match the actual UI structure
 * for a smooth loading experience.
 */

interface SkeletonProps {
  className?: string;
}

// Base shimmer animation component
function Shimmer({ className = '' }: SkeletonProps) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
    </div>
  );
}

// Team logo placeholder
function TeamLogoSkeleton() {
  return (
    <div className="relative w-52 h-52">
      <div className="w-full h-full rounded-full bg-slate-700/50">
        <Shimmer className="w-full h-full rounded-full" />
      </div>
    </div>
  );
}

// Team name and record placeholder
function TeamInfoSkeleton() {
  return (
    <div className="flex flex-col items-center gap-2 mt-4">
      {/* Team name */}
      <div className="h-8 w-40 rounded bg-slate-700/50">
        <Shimmer className="h-full w-full rounded" />
      </div>
      {/* Record */}
      <div className="h-5 w-20 rounded bg-slate-700/30">
        <Shimmer className="h-full w-full rounded" />
      </div>
    </div>
  );
}

// Score box placeholder
function ScoreBoxSkeleton() {
  return (
    <div className="relative w-28 h-36 rounded-xl bg-slate-800/80 border-3 border-slate-700/50">
      <Shimmer className="w-full h-full rounded-xl" />
      {/* Score number placeholder */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="h-16 w-16 rounded bg-slate-700/50">
          <Shimmer className="h-full w-full rounded" />
        </div>
      </div>
    </div>
  );
}

// Clock/Status placeholder
function ClockSkeleton() {
  return (
    <div className="flex items-center gap-4 px-6 py-3 rounded-xl bg-slate-800/60">
      <div className="flex flex-col items-center gap-1">
        <div className="h-3 w-12 rounded bg-slate-700/50">
          <Shimmer className="h-full w-full rounded" />
        </div>
        <div className="h-8 w-10 rounded bg-slate-700/50">
          <Shimmer className="h-full w-full rounded" />
        </div>
      </div>
      <div className="w-px h-12 bg-slate-700/50" />
      <div className="flex flex-col items-center gap-1">
        <div className="h-3 w-12 rounded bg-slate-700/50">
          <Shimmer className="h-full w-full rounded" />
        </div>
        <div className="h-8 w-16 rounded bg-slate-700/50">
          <Shimmer className="h-full w-full rounded" />
        </div>
      </div>
    </div>
  );
}

// Header/Title placeholder
function HeaderSkeleton() {
  return (
    <div className="flex flex-col items-center gap-3">
      {/* Title graphic placeholder */}
      <div className="h-20 w-64 rounded-lg bg-slate-700/30">
        <Shimmer className="h-full w-full rounded-lg" />
      </div>
    </div>
  );
}

// Main scoreboard skeleton - matches the actual MainScoreboard layout
export function MainScoreboardSkeleton() {
  return (
    <div
      className="h-full w-full flex flex-col items-center justify-center relative overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse at top, #1a2744 0%, transparent 50%),
          radial-gradient(ellipse at bottom, #0d1f3c 0%, transparent 50%),
          linear-gradient(180deg, #0a1628 0%, #152238 50%, #0a1628 100%)
        `,
      }}
    >
      {/* Top glow effect */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-40 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse, rgba(255,200,100,0.15) 0%, transparent 70%)',
        }}
      />

      {/* Header skeleton */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
        <HeaderSkeleton />
      </div>

      {/* Main Score Display skeleton */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-start w-full max-w-7xl px-8 gap-10 mt-32">
        {/* Away Team */}
        <div className="flex justify-end">
          <div className="flex flex-col items-center">
            <TeamLogoSkeleton />
            <TeamInfoSkeleton />
          </div>
        </div>

        {/* Center - Score */}
        <div className="flex flex-col items-center gap-4 mt-8">
          <div className="flex items-center gap-3">
            <ScoreBoxSkeleton />
            {/* Separator dots */}
            <div className="flex flex-col items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-slate-700/40" />
              <div className="w-3 h-3 rounded-full bg-slate-700/40" />
            </div>
            <ScoreBoxSkeleton />
          </div>
          <ClockSkeleton />
        </div>

        {/* Home Team */}
        <div className="flex justify-start">
          <div className="flex flex-col items-center">
            <TeamLogoSkeleton />
            <TeamInfoSkeleton />
          </div>
        </div>
      </div>

      {/* Bottom info skeleton */}
      <div className="absolute bottom-12 left-0 right-0 flex flex-col items-center gap-2">
        <div className="h-6 w-32 rounded-full bg-slate-700/30">
          <Shimmer className="h-full w-full rounded-full" />
        </div>
        <div className="h-4 w-48 rounded bg-slate-700/20">
          <Shimmer className="h-full w-full rounded" />
        </div>
      </div>

      {/* Loading text overlay */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2">
        <div className="flex items-center gap-3 text-slate-400">
          <div className="animate-spin w-5 h-5 border-2 border-slate-600 border-t-blue-500 rounded-full" />
          <span className="text-sm">Lade Spieldaten...</span>
        </div>
      </div>
    </div>
  );
}

// Game card skeleton for NoGameState / MultiGameView
export function GameCardSkeleton() {
  return (
    <div className="bg-slate-800/50 border-2 border-slate-700 rounded-xl p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="h-4 w-24 rounded bg-slate-700/50">
          <Shimmer className="h-full w-full rounded" />
        </div>
        <div className="h-3 w-16 rounded bg-slate-700/30">
          <Shimmer className="h-full w-full rounded" />
        </div>
      </div>

      {/* Teams */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-700/50">
            <Shimmer className="w-full h-full rounded-full" />
          </div>
          <div className="h-5 w-12 rounded bg-slate-700/50">
            <Shimmer className="h-full w-full rounded" />
          </div>
        </div>
        <div className="h-4 w-4 rounded bg-slate-700/30">
          <Shimmer className="h-full w-full rounded" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-5 w-12 rounded bg-slate-700/50">
            <Shimmer className="h-full w-full rounded" />
          </div>
          <div className="w-10 h-10 rounded-full bg-slate-700/50">
            <Shimmer className="w-full h-full rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Multiple game cards skeleton
export function GameListSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <GameCardSkeleton key={i} />
      ))}
    </div>
  );
}

// Stats panel skeleton
export function StatsPanelSkeleton() {
  return (
    <div className="h-full w-full bg-slate-900 p-6">
      {/* Header */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-full bg-slate-700/50">
          <Shimmer className="w-full h-full rounded-full" />
        </div>
        <div className="h-8 w-8 rounded bg-slate-700/30">
          <Shimmer className="h-full w-full rounded" />
        </div>
        <div className="w-16 h-16 rounded-full bg-slate-700/50">
          <Shimmer className="w-full h-full rounded-full" />
        </div>
      </div>

      {/* Stats rows */}
      <div className="space-y-4 max-w-2xl mx-auto">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="h-6 w-20 rounded bg-slate-700/50">
              <Shimmer className="h-full w-full rounded" />
            </div>
            <div className="flex-1 h-3 rounded-full bg-slate-700/30">
              <Shimmer className="h-full w-full rounded-full" />
            </div>
            <div className="h-6 w-20 rounded bg-slate-700/50">
              <Shimmer className="h-full w-full rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// MultiGameView Skeleton
// ============================================================================

// Single game card skeleton for MultiGameView grid
function MultiGameCardSkeleton({ layoutConfig }: { layoutConfig: MultiGameLayoutConfig }) {
  return (
    <div
      className={`rounded-xl px-2 ${layoutConfig.cardHeight} flex flex-col justify-center items-center`}
      style={{
        background: 'linear-gradient(180deg, rgba(25,35,55,0.95) 0%, rgba(15,25,45,0.98) 100%)',
        border: '2px solid rgba(59,130,246,0.3)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}
    >
      {/* Status Badge placeholder */}
      <div className="flex justify-center mb-0.5 w-full">
        <div className={`px-3 py-1 rounded-full ${layoutConfig.badgeText} bg-slate-700/50 w-24 h-5`}>
          <Shimmer className="h-full w-full rounded-full" />
        </div>
      </div>

      {/* Teams and Score Layout */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 w-full">
        {/* Left Team */}
        <div className="flex justify-end">
          <MultiGameTeamSkeleton layoutConfig={layoutConfig} />
        </div>

        {/* Score Display */}
        <div className="flex items-center justify-center gap-1.5 min-w-[120px] self-center">
          {/* Left Score */}
          <div className={`${layoutConfig.scoreMinW} h-8 rounded bg-slate-700/50`}>
            <Shimmer className="h-full w-full rounded" />
          </div>

          {/* Separator Dots */}
          <div className="flex flex-col items-center gap-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
            <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
          </div>

          {/* Right Score */}
          <div className={`${layoutConfig.scoreMinW} h-8 rounded bg-slate-700/50`}>
            <Shimmer className="h-full w-full rounded" />
          </div>
        </div>

        {/* Right Team */}
        <div className="flex justify-start">
          <MultiGameTeamSkeleton layoutConfig={layoutConfig} />
        </div>
      </div>
    </div>
  );
}

// Team badge skeleton for MultiGameView
function MultiGameTeamSkeleton({ layoutConfig }: { layoutConfig: MultiGameLayoutConfig }) {
  return (
    <div className={`flex flex-col items-center gap-0.5 ${layoutConfig.teamBoxWidth}`}>
      {/* Team Logo */}
      <div
        className={`relative ${layoutConfig.logoSize} rounded-full bg-slate-700/50`}
        style={{
          background: 'radial-gradient(circle, rgba(100,116,139,0.4) 0%, rgba(100,116,139,0.15) 50%, transparent 70%)',
        }}
      >
        <Shimmer className="w-full h-full rounded-full" />
      </div>

      {/* Team Name Box */}
      <div className="w-full h-4 rounded bg-slate-700/50">
        <Shimmer className="h-full w-full rounded" />
      </div>
    </div>
  );
}

interface MultiGameLayoutConfig {
  cardHeight: string;
  logoSize: string;
  logoInner: string;
  scoreSize: string;
  scoreMinW: string;
  teamBoxWidth: string;
  badgeText: string;
  gridGap: string;
}

// Full MultiGameView skeleton with 6 cards
export function MultiGameViewSkeleton({ cardCount = 6 }: { cardCount?: number }) {
  // Default layout config (matches 6 games or fewer)
  const layoutConfig: MultiGameLayoutConfig = {
    cardHeight: 'h-[140px]',
    logoSize: 'w-16 h-16',
    logoInner: 'w-11 h-11',
    scoreSize: 'text-3xl',
    scoreMinW: 'min-w-[45px]',
    teamBoxWidth: 'w-22',
    badgeText: 'text-xs',
    gridGap: 'gap-4',
  };

  return (
    <div
      className="h-full w-full flex flex-col overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse at top, #1a2744 0%, transparent 50%),
          radial-gradient(ellipse at bottom, #0d1f3c 0%, transparent 50%),
          linear-gradient(180deg, #0a1628 0%, #152238 50%, #0a1628 100%)
        `,
      }}
    >
      {/* Title Graphic Header skeleton */}
      <div className="flex-shrink-0 pt-2 pb-2 flex justify-center">
        <div className="h-40 w-64 rounded-lg bg-slate-700/30">
          <Shimmer className="h-full w-full rounded-lg" />
        </div>
      </div>

      {/* Games Grid - 2 columns */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className={`grid grid-cols-2 ${layoutConfig.gridGap} max-w-6xl mx-auto`}>
          {Array.from({ length: cardCount }).map((_, i) => (
            <MultiGameCardSkeleton key={i} layoutConfig={layoutConfig} />
          ))}
        </div>
      </div>

      {/* Version info placeholder */}
      <div className="flex-shrink-0 pb-2 flex items-center justify-center">
        <div className="h-4 w-12 rounded bg-slate-700/20">
          <Shimmer className="h-full w-full rounded" />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// LiveTable Skeleton (Bundesliga Table)
// ============================================================================

// Single table row skeleton
function TableRowSkeleton({ index }: { index: number }) {
  // Alternate zone colors for visual variety
  const zoneColors = ['#9333EA', '#0066CC', '#FF6600', '#00CC66', '#FFAA00', '#CC0000'];
  const zoneColor = zoneColors[index % zoneColors.length];

  return (
    <div
      className="flex items-center gap-2 p-1.5 rounded bg-slate-800/50"
      style={{
        borderLeftWidth: '3px',
        borderLeftColor: zoneColor,
      }}
    >
      {/* Position */}
      <div className="flex items-center gap-1 w-8">
        <div className="w-4 h-4 rounded bg-slate-700/50">
          <Shimmer className="h-full w-full rounded" />
        </div>
      </div>

      {/* Team Logo */}
      <div className="w-5 h-5 flex-shrink-0 rounded-full bg-slate-700/50">
        <Shimmer className="w-full h-full rounded-full" />
      </div>

      {/* Team Name */}
      <div className="flex-1 min-w-0">
        <div className="h-3 w-20 rounded bg-slate-700/50">
          <Shimmer className="h-full w-full rounded" />
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-1.5 text-xs">
        {/* Games */}
        <div className="w-5 h-3 rounded bg-slate-700/30">
          <Shimmer className="h-full w-full rounded" />
        </div>
        {/* W-D-L */}
        <div className="w-12 h-3 rounded bg-slate-700/30">
          <Shimmer className="h-full w-full rounded" />
        </div>
        {/* Goal Difference */}
        <div className="w-7 h-3 rounded bg-slate-700/30">
          <Shimmer className="h-full w-full rounded" />
        </div>
        {/* Points */}
        <div className="w-9 h-4 rounded bg-slate-700/50">
          <Shimmer className="h-full w-full rounded" />
        </div>
      </div>
    </div>
  );
}

// Full LiveTable skeleton
export function LiveTableSkeleton() {
  return (
    <div className="h-full flex flex-col bg-slate-900 px-3 py-2">
      {/* Header */}
      <div className="mb-2 flex-shrink-0">
        <div className="h-6 w-32 rounded bg-slate-700/50 mb-1">
          <Shimmer className="h-full w-full rounded" />
        </div>
        <div className="h-3 w-56 rounded bg-slate-700/30">
          <Shimmer className="h-full w-full rounded" />
        </div>
      </div>

      {/* Table Rows */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="space-y-0.5 max-w-2xl mx-auto">
          {Array.from({ length: 18 }).map((_, i) => (
            <TableRowSkeleton key={i} index={i} />
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-2 pt-2 border-t border-white/10 flex-shrink-0">
        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 max-w-2xl mx-auto">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-1">
              <div className="w-2 h-2 rounded bg-slate-700/50" />
              <div className="h-2 w-16 rounded bg-slate-700/30">
                <Shimmer className="h-full w-full rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// NFL Playoff Bracket Skeleton
// ============================================================================

// Single matchup card skeleton
function MatchupCardSkeleton({ conference }: { conference: 'AFC' | 'NFC' }) {
  const borderColor = conference === 'AFC' ? 'border-red-500/50' : 'border-blue-500/50';

  return (
    <div className={`bg-slate-800/80 rounded p-1 border-2 ${borderColor} relative z-10`}>
      {/* Away Team Row */}
      <div className="flex items-center gap-1 py-0.5">
        <div className="w-4 h-4 rounded-full bg-slate-700/50">
          <Shimmer className="w-full h-full rounded-full" />
        </div>
        <div className="flex-1 min-w-0 flex items-center gap-0.5">
          <div className="h-2 w-3 rounded bg-slate-700/30">
            <Shimmer className="h-full w-full rounded" />
          </div>
          <div className="h-3 w-8 rounded bg-slate-700/50">
            <Shimmer className="h-full w-full rounded" />
          </div>
        </div>
        <div className="h-3 w-4 rounded bg-slate-700/50">
          <Shimmer className="h-full w-full rounded" />
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-slate-700/50 my-0.5" />

      {/* Home Team Row */}
      <div className="flex items-center gap-1 py-0.5">
        <div className="w-4 h-4 rounded-full bg-slate-700/50">
          <Shimmer className="w-full h-full rounded-full" />
        </div>
        <div className="flex-1 min-w-0 flex items-center gap-0.5">
          <div className="h-2 w-3 rounded bg-slate-700/30">
            <Shimmer className="h-full w-full rounded" />
          </div>
          <div className="h-3 w-8 rounded bg-slate-700/50">
            <Shimmer className="h-full w-full rounded" />
          </div>
        </div>
        <div className="h-3 w-4 rounded bg-slate-700/50">
          <Shimmer className="h-full w-full rounded" />
        </div>
      </div>
    </div>
  );
}

// Bye team card skeleton
function ByeTeamCardSkeleton({ conference }: { conference: 'AFC' | 'NFC' }) {
  const borderColor = conference === 'AFC' ? 'border-red-500/50' : 'border-blue-500/50';

  return (
    <div className={`bg-slate-800/80 rounded p-1 border-2 ${borderColor} relative z-10`}>
      {/* Team Row */}
      <div className="flex items-center gap-1 py-0.5">
        <div className="w-4 h-4 rounded-full bg-slate-700/50">
          <Shimmer className="w-full h-full rounded-full" />
        </div>
        <div className="flex-1">
          <div className="h-3 w-8 rounded bg-slate-700/50">
            <Shimmer className="h-full w-full rounded" />
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px bg-slate-700/50 my-0.5" />

      {/* BYE Row */}
      <div className="flex items-center gap-1 py-0.5">
        <div className="w-4 h-4 rounded bg-slate-700/30" />
        <div className="flex-1">
          <div className="h-3 w-6 rounded bg-slate-700/30">
            <Shimmer className="h-full w-full rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Conference bracket skeleton (AFC - left side)
function ConferenceBracketLeftSkeleton() {
  return (
    <div className="relative h-full flex gap-0.5">
      {/* Column 1: Wild Card (with BYE) */}
      <div className="flex flex-col py-2 bg-slate-800/10 rounded-lg" style={{ width: '112px' }}>
        <div className="text-center mb-2 bg-red-500/20 rounded mx-1 py-1">
          <div className="h-2 w-16 mx-auto rounded bg-slate-700/50">
            <Shimmer className="h-full w-full rounded" />
          </div>
        </div>
        <div className="flex-1 flex flex-col justify-around">
          <div className="mx-2">
            <ByeTeamCardSkeleton conference="AFC" />
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="mx-2">
              <MatchupCardSkeleton conference="AFC" />
            </div>
          ))}
        </div>
      </div>

      {/* Column 2: Divisional */}
      <div className="flex flex-col py-2 bg-slate-800/10 rounded-lg" style={{ width: '112px' }}>
        <div className="text-center mb-2 bg-red-500/20 rounded mx-1 py-1">
          <div className="h-2 w-16 mx-auto rounded bg-slate-700/50">
            <Shimmer className="h-full w-full rounded" />
          </div>
        </div>
        <div className="flex-1 flex flex-col justify-around">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="mx-2">
              <MatchupCardSkeleton conference="AFC" />
            </div>
          ))}
        </div>
      </div>

      {/* Column 3: Conference Championship */}
      <div className="flex flex-col justify-center py-2 bg-slate-800/10 rounded-lg" style={{ width: '112px' }}>
        <div className="text-center mb-2 bg-red-500/20 rounded mx-1 py-1">
          <div className="h-2 w-16 mx-auto rounded bg-slate-700/50">
            <Shimmer className="h-full w-full rounded" />
          </div>
        </div>
        <div className="flex-1 flex items-center">
          <div className="mx-2 w-full">
            <MatchupCardSkeleton conference="AFC" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Conference bracket skeleton (NFC - right side)
function ConferenceBracketRightSkeleton() {
  return (
    <div className="relative h-full flex gap-0.5">
      {/* Column 3: Conference Championship */}
      <div className="flex flex-col justify-center py-2 bg-slate-800/10 rounded-lg" style={{ width: '112px' }}>
        <div className="text-center mb-2 bg-blue-500/20 rounded mx-1 py-1">
          <div className="h-2 w-16 mx-auto rounded bg-slate-700/50">
            <Shimmer className="h-full w-full rounded" />
          </div>
        </div>
        <div className="flex-1 flex items-center">
          <div className="mx-2 w-full">
            <MatchupCardSkeleton conference="NFC" />
          </div>
        </div>
      </div>

      {/* Column 2: Divisional */}
      <div className="flex flex-col py-2 bg-slate-800/10 rounded-lg" style={{ width: '112px' }}>
        <div className="text-center mb-2 bg-blue-500/20 rounded mx-1 py-1">
          <div className="h-2 w-16 mx-auto rounded bg-slate-700/50">
            <Shimmer className="h-full w-full rounded" />
          </div>
        </div>
        <div className="flex-1 flex flex-col justify-around">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="mx-2">
              <MatchupCardSkeleton conference="NFC" />
            </div>
          ))}
        </div>
      </div>

      {/* Column 1: Wild Card (with BYE) */}
      <div className="flex flex-col py-2 bg-slate-800/10 rounded-lg" style={{ width: '112px' }}>
        <div className="text-center mb-2 bg-blue-500/20 rounded mx-1 py-1">
          <div className="h-2 w-16 mx-auto rounded bg-slate-700/50">
            <Shimmer className="h-full w-full rounded" />
          </div>
        </div>
        <div className="flex-1 flex flex-col justify-around">
          <div className="mx-2">
            <ByeTeamCardSkeleton conference="NFC" />
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="mx-2">
              <MatchupCardSkeleton conference="NFC" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Super Bowl skeleton
function SuperBowlSkeleton() {
  return (
    <div
      className="w-full bg-gradient-to-br from-yellow-900/30 to-slate-800 rounded-lg p-4 border-2 border-yellow-600/50"
      style={{
        boxShadow: '0 0 20px rgba(234,179,8,0.3), 0 0 40px rgba(234,179,8,0.2)',
      }}
    >
      {/* Header */}
      <div className="text-center mb-3">
        <div className="h-5 w-24 mx-auto rounded bg-slate-700/50 mb-1">
          <Shimmer className="h-full w-full rounded" />
        </div>
        <div className="h-2 w-32 mx-auto rounded bg-slate-700/30">
          <Shimmer className="h-full w-full rounded" />
        </div>
      </div>

      {/* Horizontal Team Layout */}
      <div className="flex items-center justify-center gap-3">
        {/* AFC Champion */}
        <div className="flex flex-col items-center gap-1" style={{ width: '70px' }}>
          <div className="w-12 h-12 rounded-full bg-slate-700/50">
            <Shimmer className="w-full h-full rounded-full" />
          </div>
          <div className="h-3 w-8 rounded bg-slate-700/30">
            <Shimmer className="h-full w-full rounded" />
          </div>
        </div>

        {/* VS Divider */}
        <div className="flex flex-col items-center justify-center px-2">
          <div className="h-4 w-6 rounded bg-slate-700/30">
            <Shimmer className="h-full w-full rounded" />
          </div>
        </div>

        {/* NFC Champion */}
        <div className="flex flex-col items-center gap-1" style={{ width: '70px' }}>
          <div className="w-12 h-12 rounded-full bg-slate-700/50">
            <Shimmer className="w-full h-full rounded-full" />
          </div>
          <div className="h-3 w-8 rounded bg-slate-700/30">
            <Shimmer className="h-full w-full rounded" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Full NFL Playoff Bracket skeleton
export function NFLPlayoffBracketSkeleton() {
  return (
    <div className="h-full w-full bg-slate-900 flex justify-center pt-4 overflow-hidden">
      {/* Fixed-size bracket container */}
      <div className="flex flex-col" style={{ width: '1000px', height: '680px' }}>
        {/* Header */}
        <div className="text-center mb-6">
          <div className="h-7 w-48 mx-auto rounded bg-slate-700/50">
            <Shimmer className="h-full w-full rounded" />
          </div>
        </div>

        {/* Bracket Layout */}
        <div className="relative flex items-start justify-center gap-4" style={{ height: '620px' }}>
          {/* Left: AFC Bracket */}
          <div style={{ width: '340px', height: '100%' }}>
            <div className="text-center mb-3 bg-red-600/20 rounded-lg py-2 border border-red-500/30">
              <div className="h-5 w-12 mx-auto rounded bg-slate-700/50">
                <Shimmer className="h-full w-full rounded" />
              </div>
            </div>
            <div style={{ height: 'calc(100% - 44px)' }}>
              <ConferenceBracketLeftSkeleton />
            </div>
          </div>

          {/* Center: Super Bowl */}
          <div className="flex flex-col items-center relative z-10" style={{ width: '240px', height: '100%', paddingTop: '120px' }}>
            {/* Trophy placeholder */}
            <div className="w-32 h-32 rounded-full bg-slate-700/30 mb-4">
              <Shimmer className="w-full h-full rounded-full" />
            </div>
            <SuperBowlSkeleton />
          </div>

          {/* Right: NFC Bracket */}
          <div style={{ width: '340px', height: '100%' }}>
            <div className="text-center mb-3 bg-blue-600/20 rounded-lg py-2 border border-blue-500/30">
              <div className="h-5 w-12 mx-auto rounded bg-slate-700/50">
                <Shimmer className="h-full w-full rounded" />
              </div>
            </div>
            <div style={{ height: 'calc(100% - 44px)' }}>
              <ConferenceBracketRightSkeleton />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
