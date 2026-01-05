import type { GameClock as GameClockType, GameStatus } from '../../types/game';

interface GameClockProps {
  clock: GameClockType;
  status: GameStatus;
}

export function GameClock({ clock, status }: GameClockProps) {
  const isLive = status === 'in_progress';
  
  return (
    <div className="flex items-center gap-6 bg-black/30 rounded-xl px-8 py-4">
      {/* Quarter */}
      <div className="flex flex-col items-center">
        <span className="text-sm text-white/60 uppercase tracking-wider">Quarter</span>
        <span className="text-3xl font-bold text-white">{clock.periodName || '-'}</span>
      </div>

      {/* Divider */}
      <div className="w-px h-12 bg-white/20"></div>

      {/* Time */}
      <div className="flex flex-col items-center">
        <span className="text-sm text-white/60 uppercase tracking-wider">Time</span>
        <div className="flex items-center gap-2">
          <span className="text-3xl font-bold text-white font-mono">
            {clock.displayValue || '0:00'}
          </span>
          {isLive && (
            <span className="flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
