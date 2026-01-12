import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { getTitleGraphic } from '../../constants/titleGraphics';
import type { Game, Team } from '../../types/game';
import { version } from '../../../package.json';

// Track games with recent score changes (game ID -> timestamp)
type ScoreChangeMap = Map<string, number>;

export function MultiGameView() {
  const availableGames = useGameStore((state) => state.availableGames);
  const confirmGameSelection = useGameStore((state) => state.confirmGameSelection);
  const setViewMode = useSettingsStore((state) => state.setViewMode);
  const multiViewFilters = useSettingsStore((state) => state.multiViewFilters);

  // Track previous scores to detect changes
  const previousScoresRef = useRef<Map<string, { home: number; away: number }>>(new Map());
  const [recentScoreChanges, setRecentScoreChanges] = useState<ScoreChangeMap>(new Map());

  // Detect score changes
  useEffect(() => {
    const now = Date.now();
    const newChanges = new Map(recentScoreChanges);
    let hasNewChange = false;

    availableGames.forEach((game) => {
      const prev = previousScoresRef.current.get(game.id);
      if (prev) {
        // Check if score changed
        if (prev.home !== game.homeTeam.score || prev.away !== game.awayTeam.score) {
          newChanges.set(game.id, now);
          hasNewChange = true;
        }
      }
      // Update previous scores
      previousScoresRef.current.set(game.id, {
        home: game.homeTeam.score,
        away: game.awayTeam.score,
      });
    });

    if (hasNewChange) {
      setRecentScoreChanges(newChanges);
    }
  }, [availableGames]);

  // Clean up old score changes (older than 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const thirtySecondsAgo = now - 30000;

      setRecentScoreChanges((prev) => {
        const filtered = new Map<string, number>();
        prev.forEach((timestamp, gameId) => {
          if (timestamp > thirtySecondsAgo) {
            filtered.set(gameId, timestamp);
          }
        });
        return filtered;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Group games by status
  const liveGames = availableGames.filter(g => g.status === 'in_progress' || g.status === 'halftime');
  const scheduledGames = availableGames.filter(g => g.status === 'scheduled');
  const finishedGames = availableGames.filter(g => g.status === 'final');

  // Apply filters from settings
  const filteredGames = [
    ...(multiViewFilters.showLive ? liveGames : []),
    ...(multiViewFilters.showUpcoming ? scheduledGames : []),
    ...(multiViewFilters.showFinal ? finishedGames : []),
  ];

  // Combine all games with live first, then scheduled, then finished
  const allGames = filteredGames;

  // Get the season name from the first game for the header
  const seasonName = allGames[0]?.seasonName || 'GAME DAY';
  const titleGraphic = getTitleGraphic(seasonName);

  // Calculate dynamic sizing based on number of games
  const getLayoutConfig = (gameCount: number) => {
    if (gameCount <= 6) {
      return {
        cardHeight: 'h-[165px]',
        logoSize: 'w-20 h-20',
        logoInner: 'w-14 h-14',
        scoreSize: 'text-4xl',
        scoreMinW: 'min-w-[50px]',
        teamBoxWidth: 'w-24',
        badgeText: 'text-sm',
        gridGap: 'gap-5',
      };
    } else if (gameCount <= 10) {
      return {
        cardHeight: 'h-[150px]',
        logoSize: 'w-18 h-18',
        logoInner: 'w-12 h-12',
        scoreSize: 'text-4xl',
        scoreMinW: 'min-w-[48px]',
        teamBoxWidth: 'w-22',
        badgeText: 'text-xs',
        gridGap: 'gap-4',
      };
    } else {
      // 11+ games - compact mode
      return {
        cardHeight: 'h-[135px]',
        logoSize: 'w-16 h-16',
        logoInner: 'w-11 h-11',
        scoreSize: 'text-3xl',
        scoreMinW: 'min-w-[45px]',
        teamBoxWidth: 'w-20',
        badgeText: 'text-xs',
        gridGap: 'gap-4',
      };
    }
  };

  const layoutConfig = getLayoutConfig(allGames.length);

  const handleSelectGame = (game: Game) => {
    confirmGameSelection(game);
    setViewMode('single');
  };

  // Check if a game has a recent score change
  const hasRecentScoreChange = (gameId: string): boolean => {
    const changeTime = recentScoreChanges.get(gameId);
    if (!changeTime) return false;
    return Date.now() - changeTime < 30000;
  };

  if (allGames.length === 0) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-slate-900">
        <p className="text-white/50 text-xl">Keine Spiele verfügbar</p>
      </div>
    );
  }

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
      {/* Title Graphic Header */}
      <div className="flex-shrink-0 pt-4 pb-3 flex justify-center">
        {titleGraphic && (
          <img
            src={titleGraphic}
            alt={seasonName}
            className="h-48 w-auto object-contain drop-shadow-2xl"
            style={{
              filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.8))',
            }}
          />
        )}
      </div>

      {/* Games Grid - 2 columns */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className={`grid grid-cols-2 ${layoutConfig.gridGap} max-w-6xl mx-auto`}>
          {allGames.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              onSelect={handleSelectGame}
              hasScoreChange={hasRecentScoreChange(game.id)}
              layoutConfig={layoutConfig}
            />
          ))}
        </div>
      </div>

      {/* Navigation hint - Footer */}
      <div className="flex-shrink-0 pb-2 text-center text-white/20 text-xs">
        Arrow Keys to navigate | v{version}
      </div>
    </div>
  );
}

interface LayoutConfig {
  cardHeight: string;
  logoSize: string;
  logoInner: string;
  scoreSize: string;
  scoreMinW: string;
  teamBoxWidth: string;
  badgeText: string;
  gridGap: string;
}

interface GameCardProps {
  game: Game;
  onSelect: (game: Game) => void;
  hasScoreChange: boolean;
  layoutConfig: LayoutConfig;
}

function GameCard({ game, onSelect, hasScoreChange, layoutConfig }: GameCardProps) {
  const isLive = game.status === 'in_progress' || game.status === 'halftime';
  const isFinal = game.status === 'final';
  const isScheduled = game.status === 'scheduled';
  const isHalftime = game.status === 'halftime';

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return 'TBD';
    return new Date(dateStr).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    if (isToday) return 'HEUTE';
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (date.toDateString() === tomorrow.toDateString()) return 'MORGEN';
    return date.toLocaleDateString('de-DE', {
      weekday: 'short',
      day: 'numeric',
      month: 'numeric',
    }).toUpperCase();
  };

  // Get background style based on game status
  const getCardStyle = () => {
    const baseStyle = {
      background: '',
      border: '',
      boxShadow: '',
    };

    if (isFinal) {
      baseStyle.background = 'linear-gradient(180deg, rgba(30,35,45,0.95) 0%, rgba(20,25,35,0.98) 100%)';
      baseStyle.border = '2px solid rgba(100,100,120,0.3)';
      baseStyle.boxShadow = '0 8px 32px rgba(0,0,0,0.4)';
    } else {
      // Live and Scheduled both use blue
      baseStyle.background = 'linear-gradient(180deg, rgba(25,35,55,0.95) 0%, rgba(15,25,45,0.98) 100%)';
      baseStyle.border = '2px solid rgba(59,130,246,0.3)';
      baseStyle.boxShadow = '0 8px 32px rgba(0,0,0,0.4)';
    }

    // Add red glow for score changes
    if (hasScoreChange) {
      baseStyle.boxShadow = '0 0 40px rgba(220,38,38,0.6), 0 0 80px rgba(220,38,38,0.3), 0 8px 32px rgba(0,0,0,0.4)';
      baseStyle.border = '2px solid rgba(220,38,38,0.7)';
    }

    return baseStyle;
  };

  return (
    <button
      onClick={() => onSelect(game)}
      className={`rounded-xl px-2 transition-all duration-300 hover:scale-x-[1.02] ${layoutConfig.cardHeight} flex flex-col justify-center items-center ${
        hasScoreChange ? 'animate-pulse' : ''
      }`}
      style={getCardStyle()}
    >
      {/* Status Badge */}
      <div className="flex justify-center mb-0.5 w-full">
        {isLive && !isHalftime && (
          <div
            className={`px-3 py-1 rounded-full ${layoutConfig.badgeText} font-bold tracking-wide bg-red-600/90 text-white`}
            style={{ boxShadow: '0 0 15px rgba(220,38,38,0.5)' }}
          >
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
              {game.clock.periodName} {game.clock.displayValue}
            </span>
          </div>
        )}
        {isHalftime && (
          <div
            className={`px-3 py-1 rounded-full ${layoutConfig.badgeText} font-bold tracking-wide`}
            style={{
              background: 'linear-gradient(180deg, rgba(234,179,8,0.8) 0%, rgba(202,138,4,0.6) 100%)',
              boxShadow: '0 0 12px rgba(234,179,8,0.3)',
            }}
          >
            <span className="text-white">HALFTIME</span>
          </div>
        )}
        {isFinal && (
          <div className={`px-3 py-1 rounded-full ${layoutConfig.badgeText} font-bold tracking-wide bg-gray-600/80 text-white/90`}>
            FINAL
          </div>
        )}
        {isScheduled && (
          <div className={`px-3 py-1 rounded-full ${layoutConfig.badgeText} font-bold tracking-wide bg-blue-600/80 text-white/90`}>
            {formatDate(game.startTime)} {formatTime(game.startTime)}
          </div>
        )}
      </div>

      {/* Teams and Score - Centered Layout */}
      <div className="flex items-center justify-center gap-3 w-full">
        {/* Away Team */}
        <TeamBadge team={game.awayTeam} isFinal={isFinal} isWinner={game.awayTeam.score > game.homeTeam.score} layoutConfig={layoutConfig} />

        {/* Score Display - Centered - Fixed width for consistency */}
        <div className="flex items-center justify-center gap-1.5 min-w-[120px]">
          {/* Away Score */}
          <span
            className={`${layoutConfig.scoreSize} font-black ${layoutConfig.scoreMinW} text-right ${
              isFinal && game.awayTeam.score > game.homeTeam.score
                ? 'text-white'
                : isFinal
                ? 'text-white/50'
                : isScheduled
                ? 'text-white/30'
                : 'text-white'
            }`}
            style={{
              textShadow: isScheduled ? 'none' : `0 0 15px #${game.awayTeam.color}80`,
            }}
          >
            {isScheduled ? '-' : game.awayTeam.score}
          </span>

          {/* Separator Dots */}
          <div className="flex flex-col items-center gap-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
            <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
          </div>

          {/* Home Score */}
          <span
            className={`${layoutConfig.scoreSize} font-black ${layoutConfig.scoreMinW} text-left ${
              isFinal && game.homeTeam.score > game.awayTeam.score
                ? 'text-white'
                : isFinal
                ? 'text-white/50'
                : isScheduled
                ? 'text-white/30'
                : 'text-white'
            }`}
            style={{
              textShadow: isScheduled ? 'none' : `0 0 15px #${game.homeTeam.color}80`,
            }}
          >
            {isScheduled ? '-' : game.homeTeam.score}
          </span>
        </div>

        {/* Home Team */}
        <TeamBadge team={game.homeTeam} isFinal={isFinal} isWinner={game.homeTeam.score > game.awayTeam.score} layoutConfig={layoutConfig} />
      </div>
    </button>
  );
}

interface TeamBadgeProps {
  team: Team;
  isFinal: boolean;
  isWinner: boolean;
  layoutConfig: LayoutConfig;
}

function TeamBadge({ team, isFinal, isWinner, layoutConfig }: TeamBadgeProps) {
  // Check if the primary color is too dark (for glow visibility)
  const hexToRgbSum = (hex: string) => {
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    return r + g + b;
  };

  const primaryColor = team.color;
  const altColor = team.alternateColor || 'ffffff';
  const isPrimaryDark = hexToRgbSum(primaryColor) < 180;
  const glowColor = isPrimaryDark ? altColor : primaryColor;

  // Dim everything for losing team in final games
  const opacity = isFinal && !isWinner ? 0.5 : 1;

  return (
    <div className={`flex flex-col items-center gap-1 ${layoutConfig.teamBoxWidth}`} style={{ opacity }}>
      {/* Team Logo with Glow Effect */}
      <div
        className={`relative ${layoutConfig.logoSize} rounded-full flex items-center justify-center`}
        style={{
          background: `radial-gradient(circle, #${glowColor}40 0%, #${glowColor}15 50%, transparent 70%)`,
          boxShadow: `
            0 0 25px #${glowColor}40,
            0 0 40px #${glowColor}20
          `,
        }}
      >
        {/* Outer ring */}
        <div
          className="absolute inset-0.5 rounded-full"
          style={{
            border: `2px solid #${primaryColor}`,
            boxShadow: `
              0 0 12px #${glowColor}60,
              inset 0 0 12px #${glowColor}30
            `,
          }}
        />

        <img
          src={team.logo}
          alt={team.abbreviation}
          className={`${layoutConfig.logoInner} object-contain relative z-10`}
          style={{
            filter: `drop-shadow(0 0 8px #${glowColor}80)`,
          }}
        />
      </div>

      {/* Team Name Box */}
      <div className="relative w-full">
        {/* Glow background */}
        <div
          className="absolute inset-0 blur-sm opacity-50 rounded"
          style={{ backgroundColor: `#${team.color}` }}
        />

        {/* Name container */}
        <div
          className="relative px-1.5 py-0.5 rounded border w-full"
          style={{
            background: `linear-gradient(180deg, #${team.color}cc 0%, #${team.color}88 100%)`,
            borderColor: `#${team.alternateColor || team.color}`,
            boxShadow: `0 1px 8px #${team.color}50`,
          }}
        >
          <span
            className="text-[10px] font-bold text-white uppercase tracking-tight block text-center truncate leading-tight"
            style={{
              textShadow: '0 1px 2px rgba(0,0,0,0.5)',
            }}
          >
            {team.shortDisplayName}
          </span>
        </div>
      </div>
    </div>
  );
}
