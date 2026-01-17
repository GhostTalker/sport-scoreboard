import { useEffect, useState } from 'react';
import { useCacheStore } from '../stores/cacheStore';

export function StaleDataBanner() {
  const isStale = useCacheStore((state) => state.isStale);
  const cacheAge = useCacheStore((state) => state.cacheAge);
  const apiError = useCacheStore((state) => state.apiError);
  const lastSuccessfulFetch = useCacheStore((state) => state.lastSuccessfulFetch);
  const isRecovering = useCacheStore((state) => state.isRecovering);
  const retryCount = useCacheStore((state) => state.retryCount);

  // Animation state for recovery checkmark
  const [showRecoveryAnimation, setShowRecoveryAnimation] = useState(false);
  const [wasStale, setWasStale] = useState(false);

  // Track recovery transition
  useEffect(() => {
    if (isStale) {
      setWasStale(true);
    } else if (wasStale && !isStale) {
      // Just recovered from stale state
      setShowRecoveryAnimation(true);
      const timer = setTimeout(() => {
        setShowRecoveryAnimation(false);
        setWasStale(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isStale, wasStale]);

  // Format cache age for display
  const formatCacheAge = (seconds: number | null): string => {
    if (seconds === null) return '';
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  // Format last successful fetch time
  const formatLastFetch = (date: Date | null): string => {
    if (!date) return '';
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return 'vor wenigen Sekunden';
    if (diff < 3600) return `vor ${Math.floor(diff / 60)} Minuten`;
    if (diff < 86400) return `vor ${Math.floor(diff / 3600)} Stunden`;
    return date.toLocaleString('de-DE', {
      hour: '2-digit',
      minute: '2-digit',
      day: 'numeric',
      month: 'short',
    });
  };

  // Recovery animation banner
  if (showRecoveryAnimation) {
    return (
      <div className="fixed top-0 left-0 right-0 z-50 animate-slide-down">
        <div className="bg-gradient-to-r from-green-600 to-green-500 text-white py-2 px-4 flex items-center justify-center gap-3 shadow-lg">
          {/* Animated checkmark */}
          <div className="relative">
            <svg
              className="w-6 h-6 text-white animate-scale-in"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
                className="animate-draw-check"
              />
            </svg>
          </div>
          <span className="font-medium">
            Verbindung wiederhergestellt - Live-Daten aktiv
          </span>
        </div>
      </div>
    );
  }

  // No banner if not stale
  if (!isStale) {
    return null;
  }

  return (
    <div className="fixed top-0 left-0 right-0 z-50 animate-slide-down">
      <div className="bg-gradient-to-r from-orange-600 to-amber-500 text-white py-2 px-4 shadow-lg">
        <div className="flex items-center justify-center gap-3">
          {/* Warning icon */}
          <svg
            className="w-5 h-5 flex-shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>

          {/* Main message */}
          <div className="flex items-center gap-2">
            <span className="font-medium">
              Zeige zwischengespeicherte Daten
              {cacheAge !== null && (
                <span className="opacity-90"> ({formatCacheAge(cacheAge)} alt)</span>
              )}
              {lastSuccessfulFetch && !cacheAge && (
                <span className="opacity-90"> ({formatLastFetch(lastSuccessfulFetch)})</span>
              )}
            </span>
          </div>

          {/* Retry indicator */}
          {isRecovering && (
            <div className="flex items-center gap-2 ml-4 pl-4 border-l border-white/30">
              <div className="animate-spin w-4 h-4 border-2 border-white/30 border-t-white rounded-full" />
              <span className="text-sm opacity-90">
                Verbindungsversuch {retryCount > 0 && `(${retryCount})`}
              </span>
            </div>
          )}

          {/* Error details (if available) */}
          {apiError && (
            <div className="hidden md:block ml-4 pl-4 border-l border-white/30 text-sm opacity-75">
              {apiError}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
