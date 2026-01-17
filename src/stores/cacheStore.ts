import { create } from 'zustand';

interface CacheStatus {
  isStale: boolean;
  cacheAge: number | null; // in seconds
  apiError: string | null;
  lastSuccessfulFetch: Date | null;
  isRecovering: boolean;
  retryCount: number;
}

interface CacheState extends CacheStatus {
  // Actions
  setCacheStatus: (status: Partial<CacheStatus>) => void;
  setRecovery: (isRecovering: boolean) => void;
  incrementRetry: () => void;
  resetRetry: () => void;
  clearStaleStatus: () => void;
}

export const useCacheStore = create<CacheState>((set) => ({
  isStale: false,
  cacheAge: null,
  apiError: null,
  lastSuccessfulFetch: null,
  isRecovering: false,
  retryCount: 0,

  setCacheStatus: (status) =>
    set((state) => ({
      ...state,
      ...status,
    })),

  setRecovery: (isRecovering) => set({ isRecovering }),

  incrementRetry: () =>
    set((state) => ({
      retryCount: state.retryCount + 1,
    })),

  resetRetry: () => set({ retryCount: 0 }),

  clearStaleStatus: () =>
    set({
      isStale: false,
      cacheAge: null,
      apiError: null,
      isRecovering: false,
      retryCount: 0,
      lastSuccessfulFetch: new Date(),
    }),
}));
