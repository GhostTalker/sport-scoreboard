import type { Team } from '../../types/game';

interface TeamDisplayProps {
  team: Team;
  isHome: boolean;
}

export function TeamDisplay({ team, isHome: _isHome }: TeamDisplayProps) {
  // Check if the primary color is too dark (for glow visibility)
  // Convert hex to brightness: if R+G+B < 150, it's too dark
  const hexToRgbSum = (hex: string) => {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return r + g + b;
  };
  
  const primaryColor = team.color;
  const altColor = team.alternateColor || 'ffffff';
  const isPrimaryDark = hexToRgbSum(primaryColor) < 180;
  
  // Use alternate color for glow if primary is too dark
  const glowColor = isPrimaryDark ? altColor : primaryColor;
  const ringColor = primaryColor; // Keep ring in primary color
  
  return (
    <div className="flex flex-col items-center gap-5">
      {/* Team Logo with Glow Effect */}
      <div 
        className="relative w-52 h-52 rounded-full flex items-center justify-center transition-transform duration-300 hover:scale-105"
        style={{
          background: `radial-gradient(circle, #${glowColor}50 0%, #${glowColor}20 50%, transparent 70%)`,
          boxShadow: `
            0 0 70px #${glowColor}50,
            0 0 120px #${glowColor}30,
            inset 0 0 40px #${glowColor}20
          `,
        }}
      >
        {/* Outer ring with glow */}
        <div 
          className="absolute inset-2 rounded-full"
          style={{
            border: `5px solid #${ringColor}`,
            boxShadow: `
              0 0 25px #${glowColor}80,
              inset 0 0 25px #${glowColor}40
            `,
          }}
        />
        
        {/* Inner glow ring */}
        <div 
          className="absolute inset-5 rounded-full opacity-50"
          style={{
            border: `3px solid #${altColor}`,
          }}
        />
        
        <img
          src={team.logo}
          alt={team.displayName}
          className="w-36 h-36 object-contain drop-shadow-2xl relative z-10"
          style={{
            filter: `drop-shadow(0 0 20px #${glowColor}80)`,
          }}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
            const fallback = e.currentTarget.nextElementSibling as HTMLElement;
            if (fallback) fallback.classList.remove('hidden');
          }}
        />
        <div className="hidden absolute inset-0 flex items-center justify-center text-6xl font-black text-white z-10">
          {team.abbreviation}
        </div>
      </div>

      {/* Team Name with fancy styling */}
      <div className="relative">
        {/* Glow background */}
        <div 
          className="absolute inset-0 blur-xl opacity-60 rounded-xl"
          style={{ backgroundColor: `#${team.color}` }}
        />
        
        {/* Name container */}
        <div 
          className="relative px-8 py-3 rounded-xl border-2"
          style={{
            background: `linear-gradient(180deg, #${team.color}dd 0%, #${team.color}99 100%)`,
            borderColor: `#${team.alternateColor || team.color}`,
            boxShadow: `0 4px 25px #${team.color}70`,
          }}
        >
          <span 
            className="text-3xl font-black text-white uppercase tracking-widest"
            style={{
              textShadow: '0 3px 6px rgba(0,0,0,0.6), 0 0 25px rgba(255,255,255,0.4)',
            }}
          >
            {team.shortDisplayName}
          </span>
        </div>
      </div>
    </div>
  );
}
