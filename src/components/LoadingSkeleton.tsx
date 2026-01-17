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
