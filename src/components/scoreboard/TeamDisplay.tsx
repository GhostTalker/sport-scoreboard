import type { Team } from '../../types/game';

interface TeamDisplayProps {
  team: Team;
  hasScored?: boolean;
}

export function TeamDisplay({ team, hasScored = false }: TeamDisplayProps) {
  // Special rendering for specific Bundesliga teams (matching MultiGameView)
  const isLeipzig = team.name.includes('Leipzig');
  const isHSV = team.name.includes('HSV') || team.name.includes('Hamburger');
  const isBVB = team.name.includes('Dortmund') || team.abbreviation === 'BVB';
  const isHeidenheim = team.name.includes('Heidenheim');

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
  // Special glow colors for custom teams
  const glowColor = isLeipzig ? 'DD0741' : isHSV ? '0069B4' : (isPrimaryDark ? altColor : primaryColor);
  const ringColor = isLeipzig ? 'DD0741' : isHSV ? '0069B4' : primaryColor; // Keep ring in primary color

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Team Logo with Glow Effect */}
      <div
        className={`relative w-52 h-52 rounded-full flex items-center justify-center transition-transform duration-300 hover:scale-105 ${hasScored ? 'animate-pulse' : ''}`}
        style={{
          background: hasScored
            ? `radial-gradient(circle, #${glowColor}90 0%, #${glowColor}50 50%, transparent 70%)`
            : `radial-gradient(circle, #${glowColor}50 0%, #${glowColor}20 50%, transparent 70%)`,
          boxShadow: hasScored
            ? `
              0 0 100px #${glowColor}90,
              0 0 150px #${glowColor}60,
              0 0 200px #${glowColor}40,
              inset 0 0 60px #${glowColor}40
            `
            : `
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
            boxShadow: hasScored
              ? `
                0 0 40px #${glowColor},
                0 0 60px #${glowColor}80,
                inset 0 0 40px #${glowColor}60
              `
              : `
                0 0 25px #${glowColor}80,
                inset 0 0 25px #${glowColor}40
              `,
          }}
        />

        {/* Inner glow ring */}
        <div
          className="absolute inset-5 rounded-full opacity-50"
          style={{
            border: `3px solid #${isLeipzig ? 'DD0741' : altColor}`,
          }}
        />

        <img
          src={team.logo}
          alt={team.displayName}
          className="w-36 h-36 object-contain drop-shadow-2xl relative z-10"
          style={{
            filter: hasScored
              ? `drop-shadow(0 0 35px #${glowColor}) drop-shadow(0 0 50px #${glowColor}80)`
              : `drop-shadow(0 0 20px #${glowColor}80)`,
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
      <div className={`relative ${hasScored ? 'animate-pulse' : ''}`}>
        {/* Glow background */}
        <div
          className="absolute inset-0 blur-xl rounded-xl"
          style={{
            backgroundColor: isLeipzig ? '#DD0741' : isHSV ? '#0069B4' : `#${team.color}`,
            opacity: hasScored ? 0.9 : 0.6
          }}
        />

        {/* Name container */}
        <div
          className="relative px-8 py-3 rounded-xl border-2"
          style={{
            background: isLeipzig
              ? 'linear-gradient(180deg, #FFFFFF 0%, #F5F5F5 100%)'
              : isHSV
              ? hasScored
                ? 'linear-gradient(180deg, #0069B4 0%, #0069B4cc 100%)'
                : 'linear-gradient(180deg, #0069B4cc 0%, #0069B488 100%)'
              : hasScored
              ? `linear-gradient(180deg, #${team.color} 0%, #${team.color}cc 100%)`
              : `linear-gradient(180deg, #${team.color}dd 0%, #${team.color}99 100%)`,
            borderColor: isLeipzig ? '#DD0741' : isHSV ? '#FFFFFF' : isHeidenheim ? '#003D7A' : `#${team.alternateColor || team.color}`,
            boxShadow: hasScored
              ? isLeipzig
                ? '0 0 15px #DD0741, 0 0 25px #DD074180, 0 4px 30px #DD074190'
                : isHSV
                ? '0 0 15px #0069B4, 0 0 25px #0069B480, 0 4px 30px #0069B490'
                : `0 0 15px #${team.color}, 0 0 25px #${team.color}80, 0 4px 30px #${team.color}90`
              : isLeipzig
              ? '0 4px 25px #DD074170'
              : isHSV
              ? '0 4px 25px #0069B470'
              : `0 4px 25px #${team.color}70`,
          }}
        >
          <span
            className="text-3xl font-black uppercase tracking-widest"
            style={{
              color: isLeipzig ? '#DD0741' : isBVB ? '#000000' : '#FFFFFF',
              textShadow: isLeipzig
                ? hasScored
                  ? '0 0 8px #DD0741, 0 3px 6px rgba(0,0,0,0.3)'
                  : '0 3px 6px rgba(0,0,0,0.3)'
                : isBVB
                ? hasScored
                  ? '0 0 8px #000000, 0 3px 6px rgba(255,255,255,0.5)'
                  : '0 3px 6px rgba(255,255,255,0.5)'
                : hasScored
                ? `0 0 8px #${glowColor}, 0 3px 6px rgba(0,0,0,0.6), 0 0 30px rgba(255,255,255,0.5)`
                : '0 3px 6px rgba(0,0,0,0.6), 0 0 25px rgba(255,255,255,0.4)',
            }}
          >
            {team.shortDisplayName}
          </span>
        </div>
      </div>
    </div>
  );
}
