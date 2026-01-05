import type { Team } from '../../types/game';

interface TeamDisplayProps {
  team: Team;
  isHome: boolean;
  isPrimary: boolean;
}

export function TeamDisplay({ team, isHome, isPrimary }: TeamDisplayProps) {
  return (
    <div className={`flex flex-col items-center gap-4 ${isHome ? 'order-2' : 'order-0'}`}>
      {/* Team Logo */}
      <div 
        className={`
          relative w-32 h-32 rounded-full bg-white/10 p-2
          ${isPrimary ? 'ring-4 ring-yellow-400 ring-offset-2 ring-offset-transparent' : ''}
        `}
      >
        <img
          src={team.logo}
          alt={team.displayName}
          className="w-full h-full object-contain"
          onError={(e) => {
            // Fallback to abbreviation if logo fails to load
            e.currentTarget.style.display = 'none';
            e.currentTarget.nextElementSibling?.classList.remove('hidden');
          }}
        />
        <div className="hidden absolute inset-0 flex items-center justify-center text-4xl font-bold text-white">
          {team.abbreviation}
        </div>
      </div>

      {/* Team Name */}
      <div className="flex flex-col items-center">
        <span className="text-2xl font-bold text-white uppercase tracking-wider">
          {team.shortDisplayName}
        </span>
        <span className="text-sm text-white/60">
          {isHome ? 'HOME' : 'AWAY'}
        </span>
      </div>

      {/* Primary team indicator */}
      {isPrimary && (
        <div className="flex items-center gap-1 text-yellow-400">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          <span className="text-xs font-semibold">YOUR TEAM</span>
        </div>
      )}
    </div>
  );
}
