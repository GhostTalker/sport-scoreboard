import { useEffect } from 'react';
import { SwipeContainer } from './components/layout/SwipeContainer';
import { MainScoreboard } from './components/scoreboard/MainScoreboard';
import { MultiGameView } from './components/scoreboard/MultiGameView';
import { StatsPanel } from './components/stats/StatsPanel';
import { SettingsPanel } from './components/settings/SettingsPanel';
import { NFLPlayoffBracket } from './components/bracket/NFLPlayoffBracket';
import { SportSelectionScreen } from './components/onboarding/SportSelectionScreen';
import { VideoOverlay } from './components/celebration/VideoOverlay';
import { useUIStore } from './stores/uiStore';
import { useSettingsStore } from './stores/settingsStore';
import { useGameData } from './hooks/useGameData';
import { useScoreChange } from './hooks/useScoreChange';
import { usePlayByPlay } from './hooks/usePlayByPlay';
import { useKeyboardNavigation } from './hooks/useKeyboardNavigation';
import { useVideoPreloader } from './hooks/useVideoPreloader';

function App() {
  const currentView = useUIStore((state) => state.currentView);
  const celebrationOverlay = useUIStore((state) => state.celebrationOverlay);
  const viewMode = useSettingsStore((state) => state.viewMode);
  const hasSelectedInitialSport = useSettingsStore((state) => state.hasSelectedInitialSport);
  const currentSport = useSettingsStore((state) => state.currentSport);

  // Preload celebration videos at app start
  const { isPreloading, progress } = useVideoPreloader();

  // Initialize game data polling
  useGameData();

  // Watch for score changes (touchdowns, field goals, safeties)
  useScoreChange();

  // Watch for play-by-play events (interceptions, sacks, fumbles)
  usePlayByPlay();

  // Keyboard navigation for desktop browsers
  useKeyboardNavigation();

  // Update document title based on current sport
  useEffect(() => {
    const sportName =
      currentSport === 'nfl' ? 'NFL' :
      currentSport === 'uefa' ? 'UEFA Champions League' :
      'Bundesliga';
    document.title = `${sportName} - Sport-Scoreboard`;
  }, [currentSport]);

  // Prevent context menu on long press
  useEffect(() => {
    const handler = (e: Event) => e.preventDefault();
    document.addEventListener('contextmenu', handler);
    return () => document.removeEventListener('contextmenu', handler);
  }, []);

  // Show sport selection screen if user hasn't selected initial sport
  if (!hasSelectedInitialSport) {
    return (
      <div className="h-full w-full bg-slate-900 text-white overflow-hidden">
        <SportSelectionScreen />
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-slate-900 text-white overflow-hidden">
      <SwipeContainer>
        {/* Main Views */}
        <div className="h-full w-full relative">
          {currentView === 'scoreboard' && viewMode === 'single' && <MainScoreboard />}
          {currentView === 'scoreboard' && viewMode === 'multi' && <MultiGameView />}
          {currentView === 'stats' && <StatsPanel />}
          {currentView === 'settings' && <SettingsPanel />}
          {currentView === 'bracket' && <NFLPlayoffBracket />}
        </div>
      </SwipeContainer>

      {/* Celebration Video Overlay - Only in SingleView */}
      {celebrationOverlay.visible && celebrationOverlay.type && viewMode === 'single' && (
        <VideoOverlay type={celebrationOverlay.type} />
      )}

      {/* Video Preload Indicator */}
      {isPreloading && (
        <div className="fixed bottom-2 right-2 bg-slate-800/80 text-xs text-slate-400 px-2 py-1 rounded">
          Videos laden... {progress}%
        </div>
      )}
    </div>
  );
}

export default App;
