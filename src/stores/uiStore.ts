import { create } from 'zustand';
import type { CelebrationType } from '../types/game';

type View = 'scoreboard' | 'stats' | 'settings' | 'bracket';

interface CelebrationOverlay {
  visible: boolean;
  type: CelebrationType | null;
}

interface UIState {
  // Current view
  currentView: View;
  
  // Celebration overlay
  celebrationOverlay: CelebrationOverlay;
  
  // Debug mode
  debugMode: boolean;
  
  // Actions
  setView: (view: View) => void;
  showCelebration: (type: CelebrationType) => void;
  hideCelebration: () => void;
  toggleDebugMode: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  currentView: 'scoreboard',
  celebrationOverlay: {
    visible: false,
    type: null,
  },
  debugMode: false,

  setView: (view) => set({ currentView: view }),

  showCelebration: (type) =>
    set({
      celebrationOverlay: {
        visible: true,
        type,
      },
    }),

  hideCelebration: () =>
    set({
      celebrationOverlay: {
        visible: false,
        type: null,
      },
    }),

  toggleDebugMode: () => set((state) => ({ debugMode: !state.debugMode })),
}));
