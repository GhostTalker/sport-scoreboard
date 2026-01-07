import { useState } from 'react';

interface DebugPanelProps {
  onSeasonChange: (season: string) => void;
  onBackgroundChange: (background: string) => void;
}

const SEASON_TYPES = [
  'GAME DAY',
  'PRESEASON',
  'WILD CARD',
  'DIVISIONAL ROUND',
  'CONFERENCE CHAMPIONSHIP',
  'SUPER BOWL',
];

const BACKGROUND_TYPES = [
  { name: 'Default', value: 'default' },
  { name: 'Super Bowl', value: 'superbowl' },
  { name: 'Conference', value: 'conference' },
  { name: 'Playoffs', value: 'playoffs' },
  { name: 'Live', value: 'live' },
  { name: 'Final', value: 'final' },
];

export function DebugPanel({ onSeasonChange, onBackgroundChange }: DebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState('GAME DAY');
  const [selectedBackground, setSelectedBackground] = useState('default');

  const handleSeasonChange = (season: string) => {
    setSelectedSeason(season);
    onSeasonChange(season);
  };

  const handleBackgroundChange = (background: string) => {
    setSelectedBackground(background);
    onBackgroundChange(background);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg shadow-lg transition-colors"
        style={{ fontFamily: 'system-ui, sans-serif' }}
      >
        🐛 Debug
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-gray-900/95 border-2 border-purple-500 rounded-lg shadow-2xl p-4 w-80">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-bold text-lg">🐛 Debug Panel</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-white/70 hover:text-white text-xl leading-none"
        >
          ✕
        </button>
      </div>

      {/* Title Graphics Selector */}
      <div className="mb-4">
        <label className="text-white/80 text-sm font-semibold mb-2 block">
          Title Graphic
        </label>
        <div className="grid grid-cols-2 gap-2">
          {SEASON_TYPES.map((season) => (
            <button
              key={season}
              onClick={() => handleSeasonChange(season)}
              className={`px-3 py-2 rounded text-sm transition-colors ${
                selectedSeason === season
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-800 text-white/70 hover:bg-gray-700'
              }`}
            >
              {season}
            </button>
          ))}
        </div>
      </div>

      {/* Background Selector */}
      <div>
        <label className="text-white/80 text-sm font-semibold mb-2 block">
          Background Style
        </label>
        <div className="grid grid-cols-2 gap-2">
          {BACKGROUND_TYPES.map((bg) => (
            <button
              key={bg.value}
              onClick={() => handleBackgroundChange(bg.value)}
              className={`px-3 py-2 rounded text-sm transition-colors ${
                selectedBackground === bg.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-white/70 hover:bg-gray-700'
              }`}
            >
              {bg.name}
            </button>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="mt-4 pt-4 border-t border-white/10">
        <p className="text-white/50 text-xs">
          Press <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-white/70">D</kbd> to toggle
        </p>
      </div>
    </div>
  );
}
