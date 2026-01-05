import type { Team } from '../../types/game';

interface TeamDisplayProps {
  team: Team;
  isHome: boolean;
}

export function TeamDisplay({ team, isHome }: TeamDisplayProps) {
  return (
    <div 
      className={`flex flex-col items-center ${isHome ? 'order-2' : 'order-0'}`}
      style={{
        background: `linear-gradient(180deg, #${team.color}dd 0%, #${team.color}99 100%)`,
      }}
    >
      {/* Team Panel */}
      <div className="relative w-72 h-64 flex flex-col items-center justify-center p-4">
        {/* Team Logo */}
        <div className="w-36 h-36 flex items-center justify-center mb-2">
          <img
            src={team.logo}
            alt={team.displayName}
            className="w-full h-full object-contain drop-shadow-lg"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const fallback = e.currentTarget.nextElementSibling as HTMLElement;
              if (fallback) fallback.classList.remove('hidden');
            }}
          />
          <div className="hidden text-5xl font-bold text-white">
            {team.abbreviation}
          </div>
        </div>

        {/* Team Name Bar */}
        <div 
          className="w-full py-2 text-center"
          style={{ backgroundColor: `#${team.alternateColor || team.color}` }}
        >
          <span className="text-2xl font-bold text-white uppercase tracking-wider drop-shadow">
            {team.shortDisplayName}
          </span>
        </div>
      </div>
    </div>
  );
}
