import { useState, useEffect } from 'react';
import { useGameStore } from '../../stores/gameStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { TeamDisplay } from './TeamDisplay';
import { GameSituation } from './GameSituation';
import { getTitleGraphic } from '../../constants/titleGraphics';
import { DebugPanel } from '../debug/DebugPanel';
import { MainScoreboardSkeleton } from '../LoadingSkeleton';
import { version } from '../../../package.json';
import { isNFLGame, isBundesligaGame, isUEFAGame } from '../../types/game';

export function MainScoreboard() {
  const currentGame = useGameStore((state) => state.currentGame);
  const availableGames = useGameStore((state) => state.availableGames);
  const scoringTeam = useGameStore((state) => state.scoringTeam);
  const scoringTimestamp = useGameStore((state) => state.scoringTimestamp);
  const isLoading = useGameStore((state) => state.isLoading);
  const error = useGameStore((state) => state.error);

  // Debug mode state
  const [debugMode, setDebugMode] = useState(false);
  const [debugSeason, setDebugSeason] = useState<string | null>(null);
  const [debugBackground, setDebugBackground] = useState<string | null>(null);

  // Force re-render to update scoring glow effect timer
  const [, setTick] = useState(0);
  useEffect(() => {
    if (scoringTimestamp) {
      const interval = setInterval(() => {
        setTick((t) => t + 1);
      }, 100); // Update every 100ms for smooth animation
      return () => clearInterval(interval);
    }
  }, [scoringTimestamp]);

  // Toggle debug mode with 'D' key
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'd' || e.key === 'D') {
        setDebugMode((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  if (isLoading && !currentGame) {
    return <MainScoreboardSkeleton />;
  }

  if (error && !currentGame) {
    return <ErrorState message={error} />;
  }

  if (!currentGame) {
    return <NoGameState />;
  }

  // Use debug season if active, otherwise use actual game data
  const effectiveSeason = debugSeason || (
    isNFLGame(currentGame)
      ? currentGame.seasonName
      : isUEFAGame(currentGame)
      ? currentGame.round?.toUpperCase() || 'LEAGUE PHASE' // UEFA: use round name
      : currentGame.competition === 'bundesliga'
      ? 'BUNDESLIGA'
      : currentGame.competition === 'dfb-pokal'
      ? (() => {
          // DFB-Pokal Finale detection: only 1 game in round AND in Berlin
          const dfbGames = availableGames.filter(g =>
            !isNFLGame(g) && g.competition === 'dfb-pokal'
          );
          const isFinale = dfbGames.length === 1 &&
                          (currentGame.venue?.toLowerCase().includes('berlin') || false);
          return isFinale ? 'DFB-POKAL FINALE' : 'DFB-POKAL';
        })()
      : undefined
  );
  
  // Determine background style based on game type (or debug override)
  const isSuperBowl = debugBackground === 'superbowl' || effectiveSeason === 'SUPER BOWL';
  const isConference = debugBackground === 'conference' || effectiveSeason === 'CONFERENCE CHAMPIONSHIP';
  const isPlayoffs = debugBackground === 'playoffs' || (effectiveSeason && !['GAME DAY', 'PRESEASON'].includes(effectiveSeason));
  const isLive = debugBackground === 'live' || currentGame.status === 'in_progress' || currentGame.status === 'halftime';
  const isFinal = debugBackground === 'final' || currentGame.status === 'final';

  // Dynamic background based on game context
  const getBackgroundStyle = () => {
    if (isSuperBowl) {
      return {
        background: `
          radial-gradient(ellipse at top left, rgba(212,175,55,0.25) 0%, transparent 50%),
          radial-gradient(ellipse at top right, rgba(255,215,0,0.2) 0%, transparent 50%),
          radial-gradient(ellipse at bottom, rgba(170,140,40,0.2) 0%, transparent 50%),
          linear-gradient(135deg, #1a1410 0%, #2d2416 25%, #1a1410 50%, #2d2416 75%, #1a1410 100%)
        `,
      };
    }
    
    if (isConference) {
      return {
        background: `
          radial-gradient(ellipse at top, rgba(180,180,200,0.2) 0%, transparent 50%),
          radial-gradient(ellipse at bottom, rgba(140,140,160,0.15) 0%, transparent 50%),
          linear-gradient(135deg, #1a1c20 0%, #252830 25%, #1a1c20 50%, #252830 75%, #1a1c20 100%)
        `,
      };
    }
    
    if (isLive) {
      return {
        background: `
          radial-gradient(ellipse at top, rgba(30,58,138,0.4) 0%, transparent 40%),
          radial-gradient(ellipse at bottom left, rgba(37,99,235,0.3) 0%, transparent 50%),
          radial-gradient(ellipse at bottom right, rgba(29,78,216,0.35) 0%, transparent 50%),
          linear-gradient(135deg, #0a0f1e 0%, #121a2e 25%, #0a0f1e 50%, #121a2e 75%, #0a0f1e 100%)
        `,
      };
    }
    
    if (isFinal) {
      return {
        background: `
          radial-gradient(ellipse at top, rgba(100,100,120,0.15) 0%, transparent 50%),
          linear-gradient(180deg, #0a0e14 0%, #12161c 50%, #0a0e14 100%)
        `,
      };
    }
    
    if (isPlayoffs) {
      return {
        background: `
          radial-gradient(ellipse at top, rgba(59,130,246,0.3) 0%, transparent 50%),
          radial-gradient(ellipse at bottom, rgba(37,99,235,0.25) 0%, transparent 50%),
          linear-gradient(135deg, #0a1628 0%, #1a2f4a 25%, #0a1628 50%, #1a2f4a 75%, #0a1628 100%)
        `,
      };
    }
    
    // Default (scheduled/regular season)
    return {
      background: `
        radial-gradient(ellipse at top, #1a2744 0%, transparent 50%),
        radial-gradient(ellipse at bottom, #0d1f3c 0%, transparent 50%),
        linear-gradient(180deg, #0a1628 0%, #152238 50%, #0a1628 100%)
      `,
    };
  };

  return (
    <div 
      className="h-full w-full flex flex-col items-center justify-center relative overflow-hidden transition-all duration-1000"
      style={getBackgroundStyle()}
    >
      {/* Dynamic particle effects */}
      {isSuperBowl && <SuperBowlParticles />}
      {isConference && <ChampionshipParticles />}
      {isLive && <LiveGameParticles />}
      {isPlayoffs && !isSuperBowl && !isConference && <PlayoffParticles />}
      {!isPlayoffs && !isLive && <DefaultParticles />}

      {/* Top glow effect - changes with context */}
      <div 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-40 pointer-events-none transition-all duration-1000"
        style={{
          background: isSuperBowl
            ? 'radial-gradient(ellipse, rgba(255,215,0,0.25) 0%, transparent 70%)'
            : isConference
            ? 'radial-gradient(ellipse, rgba(200,200,220,0.2) 0%, transparent 70%)'
            : isLive
            ? 'radial-gradient(ellipse, rgba(37,99,235,0.3) 0%, transparent 70%)'
            : isPlayoffs
            ? 'radial-gradient(ellipse, rgba(59,130,246,0.2) 0%, transparent 70%)'
            : 'radial-gradient(ellipse, rgba(255,200,100,0.15) 0%, transparent 70%)',
        }}
      />

      {/* Season/Round Header - Title only, no LIVE/Venue info (shown below score) */}
      <GameHeader
        seasonName={effectiveSeason}
        status={currentGame.status}
        startTime={currentGame.startTime}
        venue={currentGame.venue}
        broadcast={currentGame.broadcast}
        hideDateTime={true}
      />

      {/* Main Score Display - Grid with items-start for precise logo-score alignment */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-start w-full max-w-7xl px-8 gap-10 mt-32">
        {/* Home Team - Left side for Bundesliga, Away for NFL */}
        <div className="flex justify-end">
          <TeamDisplay
            team={isBundesligaGame(currentGame) ? currentGame.homeTeam : currentGame.awayTeam}
            hasScored={isBundesligaGame(currentGame)
              ? (scoringTeam === 'home' && scoringTimestamp !== null && Date.now() - scoringTimestamp < 30000)
              : (scoringTeam === 'away' && scoringTimestamp !== null && Date.now() - scoringTimestamp < 30000)}
          />
        </div>

        {/* Center Section - Score or Start Time - Offset to align with logo center */}
        {/* Logo is 208px (w-52 h-52), center at 104px. ScoreBox is 144px (h-36), center at 72px */}
        {/* Offset: 104px - 72px = 32px (mt-8) to align centers */}
        {currentGame.status === 'scheduled' ? (
          // Show start time for upcoming games - align with logo center
          <div className="flex flex-col items-center gap-3 mt-8">
            <div className="flex flex-col items-center">
              <span className="text-xs text-white/50 uppercase tracking-wider mb-2">Kickoff</span>
              <span className="text-5xl font-black text-white font-mono">
                {currentGame.startTime ? new Date(currentGame.startTime).toLocaleTimeString('de-DE', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                }) : 'TBD'}
              </span>
              {/* Date */}
              {currentGame.startTime && (
                <span className="text-sm text-white/60 mt-1">
                  {(() => {
                    const date = new Date(currentGame.startTime);
                    const now = new Date();
                    const isToday = date.toDateString() === now.toDateString();
                    const tomorrow = new Date(now);
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    const isTomorrow = date.toDateString() === tomorrow.toDateString();
                    
                    if (isToday) return 'HEUTE';
                    if (isTomorrow) return 'MORGEN';
                    return date.toLocaleDateString('de-DE', { 
                      weekday: 'short',
                      day: 'numeric',
                      month: 'numeric',
                    }).toUpperCase();
                  })()}
                </span>
              )}
            </div>
            {/* Broadcast & Venue */}
            {(currentGame.broadcast || currentGame.venue) && (
              <div className="flex flex-col items-center gap-1 text-sm text-white/40">
                {currentGame.broadcast && (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>{currentGame.broadcast}</span>
                  </div>
                )}
                {currentGame.venue && (
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="truncate max-w-md">{currentGame.venue}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          // Show score and clock for live/final games - align score with logo center
          <div className="flex flex-col items-center gap-4 mt-8">
            {/* Score Display */}
            <div className="flex items-center gap-3">
              {/* First Score (Home for Bundesliga, Away for NFL) */}
              <ScoreBox
                score={isBundesligaGame(currentGame) ? currentGame.homeTeam.score : currentGame.awayTeam.score}
                teamColor={isBundesligaGame(currentGame) ? currentGame.homeTeam.color : currentGame.awayTeam.color}
              />

              {/* Separator */}
              <div className="flex flex-col items-center gap-1">
                <div className="w-3 h-3 rounded-full bg-white/40" />
                <div className="w-3 h-3 rounded-full bg-white/40" />
              </div>

              {/* Second Score (Away for Bundesliga, Home for NFL) */}
              <ScoreBox
                score={isBundesligaGame(currentGame) ? currentGame.awayTeam.score : currentGame.homeTeam.score}
                teamColor={isBundesligaGame(currentGame) ? currentGame.awayTeam.color : currentGame.homeTeam.color}
              />
            </div>

            {/* Game Clock or Final */}
            {currentGame.status === 'final' ? (
              // Show FINAL badge
              <div 
                className="px-8 py-3 rounded-xl"
                style={{
                  background: 'linear-gradient(180deg, rgba(100,100,100,0.6) 0%, rgba(80,80,80,0.4) 100%)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <span className="text-3xl font-black text-white uppercase tracking-wider">
                  Final
                </span>
              </div>
            ) : currentGame.status === 'halftime' ? (
              // Show Halftime badge
              <div
                className="px-8 py-3 rounded-xl"
                style={{
                  background: 'linear-gradient(180deg, rgba(234,179,8,0.6) 0%, rgba(202,138,4,0.4) 100%)',
                  boxShadow: '0 4px 20px rgba(234,179,8,0.3), inset 0 1px 0 rgba(255,255,255,0.2)',
                  border: '1px solid rgba(234,179,8,0.5)',
                }}
              >
                <span className="text-3xl font-black text-white uppercase tracking-wider">
                  Halftime
                </span>
              </div>
            ) : (
              // Show game clock for live games
              <>
                {/* NFL: Horizontal layout */}
                {isNFLGame(currentGame) && (
                  <div
                    className="flex items-center gap-4 px-6 py-3 rounded-xl"
                    style={{
                      background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.4) 100%)',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    {/* Quarter */}
                    <div className="flex flex-col items-center">
                      <span className="text-xs text-white/50 uppercase tracking-wider">Quarter</span>
                      <span className="text-3xl font-black text-white">
                        {currentGame.clock?.periodName || '-'}
                      </span>
                    </div>

                    {/* Divider */}
                    <div className="w-px h-12 bg-white/20" />

                    {/* Time */}
                    <div className="flex flex-col items-center">
                      <span className="text-xs text-white/50 uppercase tracking-wider">Time</span>
                      <div className="flex items-center gap-2">
                        <span className="text-3xl font-black text-white font-mono">
                          {currentGame.clock.displayValue || '0:00'}
                        </span>
                        {currentGame.status === 'in_progress' && (
                          <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Bundesliga: Compact vertical layout with additional info */}
                {isBundesligaGame(currentGame) && (
                  <div className="flex flex-col gap-1.5">
                    {/* Time and Period - Combined compact box */}
                    <div
                      className="flex items-center gap-4 px-5 py-2 rounded-xl"
                      style={{
                        background: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.4) 100%)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}
                    >
                      {/* Time */}
                      <div className="flex items-center gap-2">
                        <span className="text-4xl font-black text-white font-mono">
                          {currentGame.clock.displayValue || '0\''}
                        </span>
                        {currentGame.status === 'in_progress' && (
                          <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
                          </span>
                        )}
                      </div>

                      {/* Divider */}
                      <div className="w-px h-8 bg-white/20" />

                      {/* Period */}
                      <span className="text-lg font-bold text-white/80">
                        {currentGame.clock?.periodName || '-'}
                      </span>
                    </div>

                    {/* Halftime Score (if available and past halftime) */}
                    {currentGame.halftimeScore && currentGame.clock.period !== 'first_half' && (
                      <div className="flex justify-center">
                        <span className="text-xs text-white/40 px-3 py-0.5 rounded-full bg-white/5">
                          HZ: {currentGame.halftimeScore.home} - {currentGame.halftimeScore.away}
                        </span>
                      </div>
                    )}

                    {/* Last Scorer (if goals exist) */}
                    {currentGame.goals && currentGame.goals.length > 0 && (() => {
                      const lastGoal = currentGame.goals[currentGame.goals.length - 1];
                      const scorerInfo = lastGoal.isPenalty ? '(P)' : lastGoal.isOwnGoal ? '(ET)' : '';
                      return (
                        <div className="flex justify-center">
                          <div className="flex items-center gap-1.5 text-xs text-white/50 px-3 py-0.5 rounded-full bg-white/5">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
                              <circle cx="12" cy="12" r="4" fill="currentColor" />
                            </svg>
                            <span className="truncate max-w-[180px]">
                              {lastGoal.scorerName} ({lastGoal.minute}') {scorerInfo}
                            </span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Away Team - Right side for Bundesliga, Home for NFL */}
        <div className="flex justify-start">
          <TeamDisplay
            team={isBundesligaGame(currentGame) ? currentGame.awayTeam : currentGame.homeTeam}
            hasScored={isBundesligaGame(currentGame)
              ? (scoringTeam === 'away' && scoringTimestamp !== null && Date.now() - scoringTimestamp < 30000)
              : (scoringTeam === 'home' && scoringTimestamp !== null && Date.now() - scoringTimestamp < 30000)}
          />
        </div>
      </div>

      {/* Game Situation */}
      {isNFLGame(currentGame) && currentGame.situation && currentGame.status === 'in_progress' && (
        <div className="mt-6">
          <GameSituation
            situation={currentGame.situation}
            homeTeam={currentGame.homeTeam}
            awayTeam={currentGame.awayTeam}
          />
        </div>
      )}

      {/* Bottom Info Section - LIVE badge, Matchday, and Venue/Broadcast */}
      <div className="absolute bottom-12 left-0 right-0 flex flex-col items-center gap-2">
        {/* LIVE Badge for in-progress games */}
        {(currentGame.status === 'in_progress' || currentGame.status === 'halftime') && (
          <div
            className="px-4 py-1 rounded-full text-sm font-bold tracking-wider bg-red-600/90 text-white"
            style={{ boxShadow: '0 0 20px rgba(220,38,38,0.5)' }}
          >
            <span className="inline-flex items-center gap-2">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
              LIVE
            </span>
          </div>
        )}

        {/* Competition & Matchday for Bundesliga */}
        {isBundesligaGame(currentGame) && (
          <div className="flex items-center gap-2 text-sm text-white/50 font-medium">
            <span>{currentGame.competition === 'bundesliga' ? 'Bundesliga' : 'DFB-Pokal'}</span>
            <span className="text-white/30">•</span>
            <span>{currentGame.matchday}. Spieltag</span>
          </div>
        )}

        {/* Venue & Broadcast Info */}
        {(currentGame.broadcast || currentGame.venue) && (
          <div className="flex items-center gap-3 text-sm text-white/40">
            {currentGame.broadcast && (
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                <span>{currentGame.broadcast}</span>
              </div>
            )}
            {currentGame.broadcast && currentGame.venue && (
              <span className="text-white/20">•</span>
            )}
            {currentGame.venue && (
              <div className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="truncate max-w-xs">{currentGame.venue}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation hint - very subtle */}
      <div className="absolute bottom-3 left-0 right-0 text-center text-white/20 text-xs">
        Arrow Keys to navigate | v{version}
      </div>
      
      {/* Debug Panel */}
      {debugMode && (
        <DebugPanel
          onSeasonChange={(season) => setDebugSeason(season)}
          onBackgroundChange={(bg) => setDebugBackground(bg)}
        />
      )}
    </div>
  );
}

interface ScoreBoxProps {
  score: number;
  teamColor: string;
}

function ScoreBox({ score, teamColor }: ScoreBoxProps) {
  return (
    <div 
      className="relative w-28 h-36 rounded-xl flex items-center justify-center overflow-hidden"
      style={{
        background: 'linear-gradient(180deg, rgba(20,20,30,0.95) 0%, rgba(10,10,20,0.98) 100%)',
        boxShadow: `
          0 0 30px rgba(0,0,0,0.8),
          inset 0 0 20px rgba(0,0,0,0.5),
          0 0 60px #${teamColor}30
        `,
        border: '3px solid rgba(255,255,255,0.15)',
      }}
    >
      {/* Inner glow from team color */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          background: `radial-gradient(circle at center, #${teamColor} 0%, transparent 70%)`,
        }}
      />
      
      {/* Score number */}
      <span 
        className="text-7xl font-black text-white relative z-10"
        style={{
          textShadow: `0 0 30px #${teamColor}, 0 4px 8px rgba(0,0,0,0.8)`,
        }}
      >
        {score}
      </span>
      
      {/* Bottom accent line */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-1"
        style={{
          background: `linear-gradient(90deg, transparent, #${teamColor}, transparent)`,
        }}
      />
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="h-full w-full flex items-center justify-center bg-slate-900">
      <div className="flex flex-col items-center gap-4 text-center p-8">
        <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center">
          <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <p className="text-white text-xl">Error loading game data</p>
        <p className="text-white/50">{message}</p>
      </div>
    </div>
  );
}

function NoGameState() {
  const availableGames = useGameStore((state) => state.availableGames);
  const confirmGameSelection = useGameStore((state) => state.confirmGameSelection);
  const currentSport = useSettingsStore((state) => state.currentSport);

  const handleSelectGame = (game: any) => {
    confirmGameSelection(game);
  };

  // Group games by status
  const liveGames = availableGames.filter(g => g.status === 'in_progress' || g.status === 'halftime');
  const scheduledGames = availableGames.filter(g => g.status === 'scheduled');
  const finishedGames = availableGames.filter(g => g.status === 'final');

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return { date: '', time: 'TBD' };
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    const time = date.toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    });

    if (isToday) return { date: 'HEUTE', time };

    const dateFormatted = date.toLocaleDateString('de-DE', {
      weekday: 'short',
      day: 'numeric',
      month: 'numeric',
    }).toUpperCase();
    return { date: dateFormatted, time };
  };

  return (
    <div className="h-full w-full flex flex-col items-center justify-center bg-slate-900 p-8 overflow-y-auto">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-white mb-2">
            {currentSport === 'nfl'
              ? '🏈 NFL Scoreboard'
              : currentSport === 'uefa'
              ? '⭐ UEFA Champions League'
              : '⚽ Bundesliga Scoreboard'}
          </h1>
          <p className="text-white/60 text-lg">Wählen Sie ein Spiel aus</p>
        </div>

        {/* Live Games */}
        {liveGames.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3 px-4">
              <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
              <span className="text-red-400 text-lg font-bold uppercase tracking-wider">Live</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {liveGames.map((game) => (
                <button
                  key={game.id}
                  onClick={() => handleSelectGame(game)}
                  className="bg-gradient-to-br from-red-900/40 to-red-800/30 hover:from-red-800/50 hover:to-red-700/40 border-2 border-red-500/50 hover:border-red-400 rounded-xl p-4 transition-all hover:scale-[1.02] text-left"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-red-400 text-sm font-bold">{game.clock?.periodName} {game.clock?.displayValue}</span>
                    <span className="text-xs text-white/40">{isNFLGame(game) && game.seasonName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <img src={game.awayTeam.logo} alt={game.awayTeam.abbreviation} className="w-12 h-12" />
                      <div>
                        <div className="text-white font-bold">{game.awayTeam.abbreviation}</div>
                        <div className="text-2xl font-black text-white">{game.awayTeam.score}</div>
                      </div>
                    </div>
                    <div className="text-white/50 text-lg mx-4">@</div>
                    <div className="flex items-center gap-3 flex-1 justify-end">
                      <div className="text-right">
                        <div className="text-white font-bold">{game.homeTeam.abbreviation}</div>
                        <div className="text-2xl font-black text-white">{game.homeTeam.score}</div>
                      </div>
                      <img src={game.homeTeam.logo} alt={game.homeTeam.abbreviation} className="w-12 h-12" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Scheduled Games */}
        {scheduledGames.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3 px-4">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-blue-400 text-lg font-bold uppercase tracking-wider">Anstehend</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scheduledGames.map((game) => {
                const dateTime = formatDateTime(game.startTime);
                return (
                  <button
                    key={game.id}
                    onClick={() => handleSelectGame(game)}
                    className="bg-slate-800/50 hover:bg-slate-700/50 border-2 border-slate-700 hover:border-blue-500 rounded-xl p-4 transition-all hover:scale-[1.02] text-left"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-blue-400 text-sm font-bold">{dateTime.date} {dateTime.time}</span>
                      <span className="text-xs text-white/40">{isNFLGame(game) && game.seasonName}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img src={game.awayTeam.logo} alt={game.awayTeam.abbreviation} className="w-10 h-10" />
                        <span className="text-white font-bold">{game.awayTeam.abbreviation}</span>
                      </div>
                      <span className="text-white/50">@</span>
                      <div className="flex items-center gap-3">
                        <span className="text-white font-bold">{game.homeTeam.abbreviation}</span>
                        <img src={game.homeTeam.logo} alt={game.homeTeam.abbreviation} className="w-10 h-10" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Finished Games */}
        {finishedGames.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3 px-4">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-gray-400 text-lg font-bold uppercase tracking-wider">Beendet</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {finishedGames.map((game) => (
                <button
                  key={game.id}
                  onClick={() => handleSelectGame(game)}
                  className="bg-slate-800/30 hover:bg-slate-700/30 border-2 border-slate-700/50 hover:border-gray-500 rounded-xl p-4 transition-all hover:scale-[1.02] text-left"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-gray-400 text-sm font-bold">FINAL</span>
                    <span className="text-xs text-white/40">{isNFLGame(game) && game.seasonName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1">
                      <img src={game.awayTeam.logo} alt={game.awayTeam.abbreviation} className="w-10 h-10" />
                      <div>
                        <div className="text-white/80 font-bold">{game.awayTeam.abbreviation}</div>
                        <div className="text-xl font-black text-white">{game.awayTeam.score}</div>
                      </div>
                    </div>
                    <div className="text-white/50 mx-4">@</div>
                    <div className="flex items-center gap-3 flex-1 justify-end">
                      <div className="text-right">
                        <div className="text-white/80 font-bold">{game.homeTeam.abbreviation}</div>
                        <div className="text-xl font-black text-white">{game.homeTeam.score}</div>
                      </div>
                      <img src={game.homeTeam.logo} alt={game.homeTeam.abbreviation} className="w-10 h-10" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {availableGames.length === 0 && (
          <div className="text-center text-white/50 py-12">
            <p>Keine Spiele verfügbar</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface GameHeaderProps {
  seasonName?: string;
  status: string;
  startTime?: string;
  venue?: string;
  broadcast?: string;
  hideDateTime?: boolean;
}

function GameHeader({ seasonName, status, startTime, venue, broadcast, hideDateTime }: GameHeaderProps) {
  // Determine style based on round importance
  const isPlayoffs = seasonName && seasonName !== 'GAME DAY' && seasonName !== 'PRESEASON';
  const isSuperBowl = seasonName === 'SUPER BOWL';
  const isConference = seasonName === 'CONFERENCE CHAMPIONSHIP';
  const isFinal = status === 'final';
  const isLive = status === 'in_progress' || status === 'halftime';
  const isScheduled = status === 'scheduled';

  // Format date for German locale
  const formatDateGerman = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = date.toDateString() === tomorrow.toDateString();
    
    const time = date.toLocaleTimeString('de-DE', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
    
    if (isToday) {
      return { date: 'HEUTE', time };
    } else if (isYesterday) {
      return { date: 'GESTERN', time };
    } else if (isTomorrow) {
      return { date: 'MORGEN', time };
    } else {
      const dateFormatted = date.toLocaleDateString('de-DE', { 
        weekday: 'short',
        day: 'numeric',
        month: 'numeric',
      }).toUpperCase();
      return { date: dateFormatted, time };
    }
  };

  // Format date/time for display
  const getDateTimeDisplay = () => {
    if (startTime) {
      const { date, time } = formatDateGerman(startTime);
      
      if (isFinal) {
        return `FINAL • ${date}`;
      }
      if (isLive) {
        return 'LIVE';
      }
      if (isScheduled) {
        return `${date} ${time}`;
      }
    }
    
    // Fallback if no startTime
    if (isFinal) return 'FINAL';
    if (isLive) return 'LIVE';
    
    return null;
  };

  const dateTimeDisplay = getDateTimeDisplay();
  
  // Build venue/broadcast info line
  const venueInfo = [broadcast, venue].filter(Boolean).join(' • ');

  const titleGraphic = getTitleGraphic(seasonName);

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1">
      {/* Season/Round Name - Title Graphic */}
      {seasonName && titleGraphic && (
        <div className="flex flex-col items-center gap-1">
          {/* Title Graphic with Glow Effect */}
          <div className="relative">
            {/* Glow effect for important games */}
            {isSuperBowl && (
              <div 
                className="absolute inset-0 animate-pulse opacity-60 blur-2xl"
                style={{
                  background: 'radial-gradient(circle, rgba(255,215,0,0.8) 0%, transparent 70%)',
                }}
              />
            )}
            {isConference && (
              <div 
                className="absolute inset-0 animate-pulse opacity-50 blur-2xl"
                style={{
                  background: 'radial-gradient(circle, rgba(200,200,220,0.7) 0%, transparent 70%)',
                }}
              />
            )}
            {isPlayoffs && !isSuperBowl && !isConference && (
              <div 
                className="absolute inset-0 blur-2xl opacity-40"
                style={{
                  background: 'radial-gradient(circle, rgba(59,130,246,0.6) 0%, transparent 70%)',
                }}
              />
            )}
            
            {/* Title Image */}
            <img
              src={titleGraphic}
              alt={seasonName}
              className="relative w-auto object-contain drop-shadow-2xl"
              style={{
                height: isSuperBowl ? '280px' : '350px',
                maxWidth: '900px',
                filter: isSuperBowl 
                  ? 'drop-shadow(0 0 30px rgba(255,215,0,0.8)) drop-shadow(0 8px 20px rgba(0,0,0,0.9))'
                  : isPlayoffs
                  ? 'drop-shadow(0 0 20px rgba(100,150,255,0.6)) drop-shadow(0 6px 15px rgba(0,0,0,0.8))'
                  : 'drop-shadow(0 6px 15px rgba(0,0,0,0.7))',
              }}
              onError={(e) => {
                // Fallback to text if image fails to load
                const img = e.currentTarget;
                img.style.display = 'none';
                const fallback = img.nextElementSibling as HTMLElement;
                if (fallback) fallback.classList.remove('hidden');
              }}
            />
            
            {/* Fallback Text (hidden by default) */}
            <div 
              className="hidden relative px-20 py-6 rounded-2xl"
              style={{
                background: isSuperBowl 
                  ? 'linear-gradient(180deg, rgba(212,175,55,0.95) 0%, rgba(170,140,40,0.85) 100%)'
                  : isConference
                  ? 'linear-gradient(180deg, rgba(180,180,180,0.95) 0%, rgba(140,140,140,0.85) 100%)'
                  : isPlayoffs
                  ? 'linear-gradient(180deg, rgba(50,100,200,0.95) 0%, rgba(30,70,150,0.85) 100%)'
                  : 'linear-gradient(180deg, rgba(40,60,80,0.9) 0%, rgba(30,45,60,0.8) 100%)',
                boxShadow: isSuperBowl
                  ? '0 0 80px rgba(212,175,55,0.9), inset 0 3px 0 rgba(255,255,255,0.5)'
                  : isPlayoffs
                  ? '0 0 60px rgba(50,100,200,0.8), inset 0 3px 0 rgba(255,255,255,0.4)'
                  : '0 8px 40px rgba(0,0,0,0.7), inset 0 3px 0 rgba(255,255,255,0.2)',
                border: isSuperBowl
                  ? '5px solid rgba(255,215,0,0.95)'
                  : isConference
                  ? '4px solid rgba(200,200,200,0.8)'
                  : isPlayoffs
                  ? '4px solid rgba(70,120,220,0.7)'
                  : '3px solid rgba(255,255,255,0.25)',
              }}
            >
              <span 
                className={`relative text-5xl font-black uppercase tracking-[0.35em] ${
                  isSuperBowl ? 'text-white' : isPlayoffs ? 'text-white' : 'text-white/90'
                }`}
                style={{
                  fontFamily: 'Impact, "Arial Black", sans-serif',
                  textShadow: isSuperBowl 
                    ? '0 0 40px rgba(255,215,0,1), 0 6px 12px rgba(0,0,0,0.8), 3px 3px 0 rgba(0,0,0,0.6)'
                    : isPlayoffs
                    ? '0 0 30px rgba(100,150,255,0.7), 0 4px 8px rgba(0,0,0,0.7), 3px 3px 0 rgba(0,0,0,0.5)'
                    : '0 4px 8px rgba(0,0,0,0.7), 3px 3px 0 rgba(0,0,0,0.5)',
                  letterSpacing: '0.15em',
                }}
              >
                {seasonName}
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* Date/Time or Status + Venue/Broadcast */}
      <div className="flex flex-col items-center gap-0.5">
        {!hideDateTime && dateTimeDisplay && (
          <div 
            className={`px-4 py-1 rounded-full text-sm font-bold tracking-wider ${
              isFinal 
                ? 'bg-gray-600/80 text-white/90' 
                : isLive 
                ? 'bg-red-600/90 text-white' 
                : 'bg-blue-600/80 text-white/90'
            }`}
            style={{
              boxShadow: isLive ? '0 0 20px rgba(220,38,38,0.5)' : undefined,
            }}
          >
            {isLive && (
              <span className="inline-flex items-center gap-2">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                {dateTimeDisplay}
              </span>
            )}
            {!isLive && dateTimeDisplay}
          </div>
        )}
        
        {/* Venue & Broadcast Info - only show for scheduled if hideDateTime is true */}
        {!hideDateTime && venueInfo && (
          <span className="text-white/40 text-xs tracking-wide">
            {venueInfo}
          </span>
        )}
      </div>
    </div>
  );
}

// Particle effect components
function SuperBowlParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Gold confetti effect */}
      {[...Array(20)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-full animate-pulse"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            backgroundColor: i % 3 === 0 ? 'rgba(255,215,0,0.4)' : i % 3 === 1 ? 'rgba(212,175,55,0.3)' : 'rgba(255,255,255,0.2)',
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${2 + Math.random() * 2}s`,
          }}
        />
      ))}
    </div>
  );
}

function ChampionshipParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Silver/platinum particles */}
      {[...Array(15)].map((_, i) => (
        <div
          key={i}
          className="absolute w-1.5 h-1.5 rounded-full animate-pulse"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            backgroundColor: `rgba(${180 + Math.random() * 75}, ${180 + Math.random() * 75}, ${200 + Math.random() * 55}, ${0.2 + Math.random() * 0.2})`,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${2 + Math.random() * 3}s`,
          }}
        />
      ))}
    </div>
  );
}

function LiveGameParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Pulsing blue energy particles */}
      {[...Array(12)].map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full animate-ping"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${4 + Math.random() * 8}px`,
            height: `${4 + Math.random() * 8}px`,
            backgroundColor: i % 2 === 0 ? 'rgba(37,99,235,0.35)' : 'rgba(29,78,216,0.3)',
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${1.5 + Math.random() * 1.5}s`,
          }}
        />
      ))}
    </div>
  );
}

function PlayoffParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Blue energy particles */}
      {[...Array(15)].map((_, i) => (
        <div
          key={i}
          className="absolute w-2 h-2 rounded-full animate-pulse"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            backgroundColor: i % 2 === 0 ? 'rgba(59,130,246,0.3)' : 'rgba(37,99,235,0.25)',
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${2 + Math.random() * 2}s`,
          }}
        />
      ))}
    </div>
  );
}

function DefaultParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Subtle stars */}
      <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white/20 rounded-full animate-pulse" />
      <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-white/30 rounded-full animate-ping" />
      <div className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-white/20 rounded-full animate-pulse" />
      <div className="absolute top-1/2 right-1/4 w-1 h-1 bg-white/25 rounded-full animate-ping" />
    </div>
  );
}
