import { useEffect } from 'react';
import { SwipeContainer } from './components/layout/SwipeContainer';
import { MainScoreboard } from './components/scoreboard/MainScoreboard';
import { StatsPanel } from './components/stats/StatsPanel';
import { SettingsPanel } from './components/settings/SettingsPanel';
import { VideoOverlay } from './components/celebration/VideoOverlay';
import { useUIStore } from './stores/uiStore';
import { useGameData } from './hooks/useGameData';
import { useScoreChange } from './hooks/useScoreChange';

function App() {
  const currentView = useUIStore((state) => state.currentView);
  const celebrationOverlay = useUIStore((state) => state.celebrationOverlay);
  
  // Initialize game data polling
  useGameData();
  
  // Watch for score changes
  useScoreChange();

  // Prevent context menu on long press
  useEffect(() => {
    const handler = (e: Event) => e.preventDefault();
    document.addEventListener('contextmenu', handler);
    return () => document.removeEventListener('contextmenu', handler);
  }, []);

  return (
    <div className="h-full w-full bg-slate-900 text-white overflow-hidden">
      <SwipeContainer>
        {/* Main Views */}
        <div className="h-full w-full relative">
          {currentView === 'scoreboard' && <MainScoreboard />}
          {currentView === 'stats' && <StatsPanel />}
          {currentView === 'settings' && <SettingsPanel />}
        </div>
      </SwipeContainer>

      {/* Celebration Video Overlay */}
      {celebrationOverlay.visible && celebrationOverlay.type && (
        <VideoOverlay type={celebrationOverlay.type} />
      )}
    </div>
  );
}

export default App;
