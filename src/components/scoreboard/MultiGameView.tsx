import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { getTitleGraphic } from '../../constants/titleGraphics';
import type { Game } from '../../types/game';

// Track games with recent score changes (game ID -> timestamp)
type ScoreChangeMap = Map<string, number>;

export function MultiGameView() {
  const availableGames = useGameStore((state) => state.availableGames);
  const confirmGameSelection = useGameStore((state) => state.confirmGameSelection);
  const setViewMode = useSettingsStore((state) => state.setViewMode);

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

  // Combine all games with live first, then scheduled, then finished
  const allGames = [...liveGames, ...scheduledGames, ...finishedGames];

  // Get the season name from the first game for the header
  const seasonName = allGames[0]?.seasonName || 'GAME DAY';
  const titleGraphic = getTitleGraphic(seasonName);

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
      <div className="flex-shrink-0 pt-4 pb-2 flex justify-center">
        {titleGraphic && (
          <img
            src={titleGraphic}
            alt={seasonName}
            className="h-24 w-auto object-contain drop-shadow-2xl"
            style={{
              filter: 'drop-shadow(0 6px 15px rgba(0,0,0,0.7))',
            }}
          />
        )}
      </div>

      {/* Games Grid - 2 columns */}
      <div className="flex-1 overflow-y-auto px-6 pb-6">
        <div className="grid grid-cols-2 gap-6 max-w-6xl mx-auto">
          {allGames.map((game) => (
            <GameCard
              key={game.id}
              game={game}
              onSelect={handleSelectGame}
              hasScoreChange={hasRecentScoreChange(game.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface GameCardProps {
  game: Game;
  onSelect: (game: Game) => void;
  hasScoreChange: boolean;
}

function GameCard({ game, onSelect, hasScoreChange }: GameCardProps) {
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
      className={`rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02] text-left ${
        hasScoreChange ? 'animate-pulse' : ''
      }`}
      style={getCardStyle()}
    >
      {/* Status Badge */}
      <div className="flex justify-center mb-4">
        {isLive && !isHalftime && (
          <div
            className="px-4 py-1.5 rounded-full text-sm font-bold tracking-wider bg-red-600/90 text-white"
            style={{ boxShadow: '0 0 20px rgba(220,38,38,0.5)' }}
          >
            <span className="inline-flex items-center gap-2">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              {game.clock.periodName} {game.clock.displayValue}
            </span>
          </div>
        )}
        {isHalftime && (
          <div
            className="px-4 py-1.5 rounded-full text-sm font-bold tracking-wider"
            style={{
              background: 'linear-gradient(180deg, rgba(234,179,8,0.8) 0%, rgba(202,138,4,0.6) 100%)',
              boxShadow: '0 0 15px rgba(234,179,8,0.3)',
            }}
          >
            <span className="text-white">HALFTIME</span>
          </div>
        )}
        {isFinal && (
          <div className="px-4 py-1.5 rounded-full text-sm font-bold tracking-wider bg-gray-600/80 text-white/90">
            FINAL
          </div>
        )}
        {isScheduled && (
          <div className="px-4 py-1.5 rounded-full text-sm font-bold tracking-wider bg-blue-600/80 text-white/90">
            {formatDate(game.startTime)} {formatTime(game.startTime)}
          </div>
        )}
      </div>

      {/* Teams and Score - Centered Layout */}
      <div className="flex items-center justify-center gap-6">
        {/* Away Team */}
        <div className="flex flex-col items-center">
          <img
            src={game.awayTeam.logo}
            alt={game.awayTeam.abbreviation}
            className="w-20 h-20 object-contain mb-2"
          />
          <span className="text-white font-bold text-lg">
            {game.awayTeam.abbreviation}
          </span>
        </div>

        {/* Score Display - Centered */}
        <div className="flex items-center gap-3">
          {!isScheduled ? (
            <>
              {/* Away Score */}
              <span
                className={`text-5xl font-black min-w-[60px] text-right ${
                  isFinal && game.awayTeam.score > game.homeTeam.score
                    ? 'text-white'
                    : isFinal
                    ? 'text-white/50'
                    : 'text-white'
                }`}
                style={{
                  textShadow: `0 0 20px #${game.awayTeam.color}80`,
                }}
              >
                {game.awayTeam.score}
              </span>

              {/* Separator Dots */}
              <div className="flex flex-col items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-white/40" />
                <div className="w-2.5 h-2.5 rounded-full bg-white/40" />
              </div>

              {/* Home Score */}
              <span
                className={`text-5xl font-black min-w-[60px] text-left ${
                  isFinal && game.homeTeam.score > game.awayTeam.score
                    ? 'text-white'
                    : isFinal
                    ? 'text-white/50'
                    : 'text-white'
                }`}
                style={{
                  textShadow: `0 0 20px #${game.homeTeam.color}80`,
                }}
              >
                {game.homeTeam.score}
              </span>
            </>
          ) : (
            <span className="text-white/30 text-3xl font-bold">@</span>
          )}
        </div>

        {/* Home Team */}
        <div className="flex flex-col items-center">
          <img
            src={game.homeTeam.logo}
            alt={game.homeTeam.abbreviation}
            className="w-20 h-20 object-contain mb-2"
          />
          <span className="text-white font-bold text-lg">
            {game.homeTeam.abbreviation}
          </span>
        </div>
      </div>

      {/* Venue for scheduled games */}
      {isScheduled && game.venue && (
        <div className="mt-3 text-center text-white/40 text-xs truncate">
          {game.venue}
        </div>
      )}
    </button>
  );
}
