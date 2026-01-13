import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { getTitleGraphic } from '../../constants/titleGraphics';
import type { Game, Team } from '../../types/game';
import { isNFLGame, isBundesligaGame } from '../../types/game';
import { version } from '../../../package.json';

// Track games with recent score changes (game ID -> { timestamp, scoringTeam })
type ScoreChangeMap = Map<string, { timestamp: number; scoringTeam: 'home' | 'away' | null }>;

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
        // Check if score changed and which team scored
        let scoringTeam: 'home' | 'away' | null = null;

        if (prev.home !== game.homeTeam.score && prev.away !== game.awayTeam.score) {
          // Both teams scored (unlikely but possible)
          scoringTeam = null;
        } else if (prev.home !== game.homeTeam.score) {
          scoringTeam = 'home';
        } else if (prev.away !== game.awayTeam.score) {
          scoringTeam = 'away';
        }

        if (scoringTeam !== null || (prev.home !== game.homeTeam.score || prev.away !== game.awayTeam.score)) {
          newChanges.set(game.id, { timestamp: now, scoringTeam });
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
        const filtered = new Map<string, { timestamp: number; scoringTeam: 'home' | 'away' | null }>();
        prev.forEach((data, gameId) => {
          if (data.timestamp > thirtySecondsAgo) {
            filtered.set(gameId, data);
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
  const seasonName = allGames[0]
    ? isNFLGame(allGames[0])
      ? allGames[0].seasonName || 'GAME DAY'
      : isBundesligaGame(allGames[0])
      ? allGames[0].competition === 'bundesliga'
        ? 'BUNDESLIGA'
        : allGames[0].competition === 'dfb-pokal'
        ? (() => {
            // DFB-Pokal Finale detection: only 1 game in round AND in Berlin
            const dfbGames = allGames.filter(isBundesligaGame).filter(g => g.competition === 'dfb-pokal');
            const isFinale = dfbGames.length === 1 &&
                            (allGames[0].venue?.toLowerCase().includes('berlin') || false);
            return isFinale ? 'DFB-POKAL FINALE' : 'DFB-POKAL';
          })()
        : 'DFB-POKAL'
      : 'GAME DAY'
    : 'GAME DAY';
  const titleGraphic = getTitleGraphic(seasonName);

  // Calculate dynamic sizing based on number of games
  const getLayoutConfig = (gameCount: number) => {
    if (gameCount <= 6) {
      return {
        cardHeight: 'h-[140px]',
        logoSize: 'w-16 h-16',
        logoInner: 'w-11 h-11',
        scoreSize: 'text-3xl',
        scoreMinW: 'min-w-[45px]',
        teamBoxWidth: 'w-22',
        badgeText: 'text-xs',
        gridGap: 'gap-4',
      };
    } else if (gameCount <= 10) {
      return {
        cardHeight: 'h-[130px]',
        logoSize: 'w-14 h-14',
        logoInner: 'w-9 h-9',
        scoreSize: 'text-3xl',
        scoreMinW: 'min-w-[45px]',
        teamBoxWidth: 'w-20',
        badgeText: 'text-xs',
        gridGap: 'gap-3',
      };
    } else {
      // 11+ games - compact mode
      return {
        cardHeight: 'h-[120px]',
        logoSize: 'w-12 h-12',
        logoInner: 'w-8 h-8',
        scoreSize: 'text-2xl',
        scoreMinW: 'min-w-[40px]',
        teamBoxWidth: 'w-18',
        badgeText: 'text-xs',
        gridGap: 'gap-3',
      };
    }
  };

  const layoutConfig = getLayoutConfig(allGames.length);

  const handleSelectGame = (game: Game) => {
    confirmGameSelection(game);
    setViewMode('single');
  };

  // Get recent score change data for a game
  const getScoreChangeData = (gameId: string): { hasChange: boolean; scoringTeam: 'home' | 'away' | null } => {
    const changeData = recentScoreChanges.get(gameId);
    if (!changeData) return { hasChange: false, scoringTeam: null };
    const isRecent = Date.now() - changeData.timestamp < 30000;
    return { hasChange: isRecent, scoringTeam: isRecent ? changeData.scoringTeam : null };
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
      <div className="flex-shrink-0 pt-2 pb-2 flex justify-center">
        {titleGraphic && (
          <img
            src={titleGraphic}
            alt={seasonName}
            className="h-40 w-auto object-contain drop-shadow-2xl"
            style={{
              filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.8))',
            }}
          />
        )}
      </div>

      {/* Games Grid - 2 columns */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className={`grid grid-cols-2 ${layoutConfig.gridGap} max-w-6xl mx-auto`}>
          {allGames.map((game) => {
            const scoreChangeData = getScoreChangeData(game.id);
            return (
              <GameCard
                key={game.id}
                game={game}
                onSelect={handleSelectGame}
                hasScoreChange={scoreChangeData.hasChange}
                scoringTeam={scoreChangeData.scoringTeam}
                layoutConfig={layoutConfig}
              />
            );
          })}
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
  scoringTeam: 'home' | 'away' | null;
  layoutConfig: LayoutConfig;
}

function GameCard({ game, onSelect, hasScoreChange, scoringTeam, layoutConfig }: GameCardProps) {
  const isLive = game.status === 'in_progress' || game.status === 'halftime';
  const isFinal = game.status === 'final';
  const isScheduled = game.status === 'scheduled';
  const isHalftime = game.status === 'halftime';

  // Determine team display order: Bundesliga = Home left, NFL = Away left
  const isBundesliga = isBundesligaGame(game);
  const leftTeam = isBundesliga ? game.homeTeam : game.awayTeam;
  const rightTeam = isBundesliga ? game.awayTeam : game.homeTeam;
  // Map scoringTeam to display position
  const leftScored = isBundesliga ? scoringTeam === 'home' : scoringTeam === 'away';
  const rightScored = isBundesliga ? scoringTeam === 'away' : scoringTeam === 'home';

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
              {game.clock?.periodName} {game.clock?.displayValue}
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

      {/* Teams and Score - Centered Layout with Grid for vertical alignment */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 w-full">
        {/* Left Team (Home for Bundesliga, Away for NFL) */}
        <div className="flex justify-end">
          <TeamBadge
            team={leftTeam}
            isFinal={isFinal}
            isWinner={leftTeam.score > rightTeam.score}
            layoutConfig={layoutConfig}
            hasScored={leftScored}
          />
        </div>

        {/* Score Display - Centered - Fixed width for consistency */}
        <div className="flex items-center justify-center gap-1.5 min-w-[120px] self-center">
          {/* Left Score */}
          <span
            className={`${layoutConfig.scoreSize} font-black ${layoutConfig.scoreMinW} text-right ${
              isFinal && leftTeam.score > rightTeam.score
                ? 'text-white'
                : isFinal
                ? 'text-white/50'
                : isScheduled
                ? 'text-white/30'
                : 'text-white'
            }`}
            style={{
              textShadow: isScheduled ? 'none' : `0 0 15px #${leftTeam.color}80`,
            }}
          >
            {isScheduled ? '-' : leftTeam.score}
          </span>

          {/* Separator Dots */}
          <div className="flex flex-col items-center gap-0.5">
            <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
            <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
          </div>

          {/* Right Score */}
          <span
            className={`${layoutConfig.scoreSize} font-black ${layoutConfig.scoreMinW} text-left ${
              isFinal && rightTeam.score > leftTeam.score
                ? 'text-white'
                : isFinal
                ? 'text-white/50'
                : isScheduled
                ? 'text-white/30'
                : 'text-white'
            }`}
            style={{
              textShadow: isScheduled ? 'none' : `0 0 15px #${rightTeam.color}80`,
            }}
          >
            {isScheduled ? '-' : rightTeam.score}
          </span>
        </div>

        {/* Right Team (Away for Bundesliga, Home for NFL) */}
        <div className="flex justify-start">
          <TeamBadge
            team={rightTeam}
            isFinal={isFinal}
            isWinner={rightTeam.score > leftTeam.score}
            layoutConfig={layoutConfig}
            hasScored={rightScored}
          />
        </div>
      </div>
    </button>
  );
}

interface TeamBadgeProps {
  team: Team;
  isFinal: boolean;
  isWinner: boolean;
  layoutConfig: LayoutConfig;
  hasScored: boolean;
}

function TeamBadge({ team, isFinal, isWinner, layoutConfig, hasScored }: TeamBadgeProps) {
  // Special rendering for RB Leipzig - white box with red text
  const isLeipzig = team.name.includes('Leipzig');
  // Special rendering for HSV - blue box with white text
  const isHSV = team.name.includes('HSV') || team.name.includes('Hamburger');
  // Special rendering for BVB - yellow box with black text
  const isBVB = team.name.includes('Dortmund') || team.abbreviation === 'BVB';
  // Special rendering for Heidenheim - blue border instead of red
  const isHeidenheim = team.name.includes('Heidenheim');

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
  // Special glow colors for custom teams
  const glowColor = isHSV ? '0069B4' : (isPrimaryDark ? altColor : primaryColor);

  // Dim everything for losing team in final games
  const opacity = isFinal && !isWinner ? 0.5 : 1;

  return (
    <div className={`flex flex-col items-center gap-0.5 ${layoutConfig.teamBoxWidth}`} style={{ opacity }}>
      {/* Team Logo with Glow Effect */}
      <div
        className={`relative ${layoutConfig.logoSize} rounded-full flex items-center justify-center ${hasScored ? 'animate-pulse' : ''}`}
        style={{
          background: hasScored
            ? `radial-gradient(circle, #${glowColor}90 0%, #${glowColor}50 50%, transparent 70%)`
            : `radial-gradient(circle, #${glowColor}40 0%, #${glowColor}15 50%, transparent 70%)`,
          boxShadow: hasScored
            ? `
                0 0 50px #${glowColor}90,
                0 0 80px #${glowColor}60,
                0 0 100px #${glowColor}40
              `
            : `
                0 0 25px #${glowColor}40,
                0 0 40px #${glowColor}20
              `,
        }}
      >
        {/* Outer ring */}
        <div
          className="absolute inset-0.5 rounded-full"
          style={{
            border: isHSV ? '2px solid #0069B4' : `2px solid #${primaryColor}`,
            boxShadow: hasScored
              ? `
                  0 0 20px #${glowColor}90,
                  inset 0 0 20px #${glowColor}60
                `
              : `
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
            filter: hasScored
              ? `drop-shadow(0 0 16px #${glowColor}) brightness(1.2)`
              : `drop-shadow(0 0 8px #${glowColor}80)`,
          }}
          onError={(e) => {
            // Fallback to TBD placeholder if logo fails to load
            e.currentTarget.src = '/images/tbd-logo.svg';
            e.currentTarget.onerror = null; // Prevent infinite loop
          }}
        />
      </div>

      {/* Team Name Box */}
      <div className={`relative w-full ${hasScored ? 'animate-pulse' : ''}`}>
        {/* Glow background */}
        <div
          className="absolute inset-0 blur-sm rounded"
          style={{
            backgroundColor: isLeipzig ? '#DD0741' : isHSV ? '#0069B4' : `#${team.color}`,
            opacity: hasScored ? 0.9 : 0.5,
          }}
        />

        {/* Name container */}
        <div
          className="relative px-1.5 py-0.5 rounded border w-full"
          style={{
            background: isLeipzig
              ? 'linear-gradient(180deg, #FFFFFF 0%, #F5F5F5 100%)'
              : isHSV
              ? hasScored
                ? 'linear-gradient(180deg, #0069B4 0%, #0069B4cc 100%)'
                : 'linear-gradient(180deg, #0069B4cc 0%, #0069B488 100%)'
              : hasScored
              ? `linear-gradient(180deg, #${team.color} 0%, #${team.color}cc 100%)`
              : `linear-gradient(180deg, #${team.color}cc 0%, #${team.color}88 100%)`,
            borderColor: isLeipzig ? '#DD0741' : isHSV ? '#FFFFFF' : isHeidenheim ? '#003D7A' : `#${team.alternateColor || team.color}`,
            boxShadow: hasScored
              ? isLeipzig
                ? '0 0 15px #DD0741, 0 0 25px #DD074180, 0 1px 8px #DD074150'
                : isHSV
                ? '0 0 15px #0069B4, 0 0 25px #0069B480, 0 1px 8px #0069B450'
                : `0 0 15px #${team.color}, 0 0 25px #${team.color}80, 0 1px 8px #${team.color}50`
              : isLeipzig
              ? '0 1px 8px #DD074150'
              : isHSV
              ? '0 1px 8px #0069B450'
              : `0 1px 8px #${team.color}50`,
          }}
        >
          <span
            className="text-[10px] font-bold uppercase tracking-tight block text-center truncate leading-tight"
            style={{
              color: isLeipzig ? '#DD0741' : isBVB ? '#000000' : '#FFFFFF',
              textShadow: isLeipzig
                ? hasScored
                  ? '0 0 8px #DD0741, 0 1px 2px rgba(0,0,0,0.2)'
                  : '0 1px 2px rgba(0,0,0,0.2)'
                : isBVB
                ? hasScored
                  ? '0 0 8px #000000, 0 1px 2px rgba(255,255,255,0.5)'
                  : '0 1px 2px rgba(255,255,255,0.5)'
                : isHSV
                ? hasScored
                  ? '0 0 8px #FFFFFF, 0 1px 2px rgba(0,0,0,0.5)'
                  : '0 1px 2px rgba(0,0,0,0.5)'
                : hasScored
                ? `0 0 8px #${glowColor}, 0 1px 2px rgba(0,0,0,0.5)`
                : '0 1px 2px rgba(0,0,0,0.5)',
            }}
          >
            {team.shortDisplayName}
          </span>
        </div>
      </div>
    </div>
  );
}
