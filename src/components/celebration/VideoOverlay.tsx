import { useEffect, useRef } from 'react';
import { useUIStore } from '../../stores/uiStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { VIDEOS, PLACEHOLDER_VIDEOS } from '../../constants/videos';

interface VideoOverlayProps {
  type: 'touchdown' | 'fieldgoal';
}

export function VideoOverlay({ type }: VideoOverlayProps) {
  const hideCelebration = useUIStore((state) => state.hideCelebration);
  const videoVolume = useSettingsStore((state) => state.videoVolume);
  const videoRef = useRef<HTMLVideoElement>(null);
  const timeoutRef = useRef<number | null>(null);

  const videoConfig = VIDEOS[type];
  const placeholderVideos = PLACEHOLDER_VIDEOS[type];

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.volume = videoVolume;

    // Try to play local video, fallback to placeholder
    video.src = videoConfig.src;
    
    video.onerror = () => {
      // Fallback to placeholder video
      if (placeholderVideos && placeholderVideos.length > 0) {
        const randomIndex = Math.floor(Math.random() * placeholderVideos.length);
        video.src = placeholderVideos[randomIndex];
        video.play().catch(console.error);
      } else {
        // No video available, just close after duration
        timeoutRef.current = window.setTimeout(hideCelebration, videoConfig.duration);
      }
    };

    video.onended = () => {
      hideCelebration();
    };

    video.play().catch((err) => {
      console.error('Video playback failed:', err);
      // Auto-close after duration if video fails
      timeoutRef.current = window.setTimeout(hideCelebration, videoConfig.duration);
    });

    // Fallback timeout in case video doesn't trigger onended
    timeoutRef.current = window.setTimeout(hideCelebration, videoConfig.duration + 1000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [type, hideCelebration, videoVolume, videoConfig, placeholderVideos]);

  // Allow tap to dismiss
  const handleTap = () => {
    hideCelebration();
  };

  return (
    <div 
      className="video-overlay flex items-center justify-center cursor-pointer"
      onClick={handleTap}
    >
      {/* Score Type Badge */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-10">
        <div className={`
          px-8 py-4 rounded-xl text-4xl font-bold text-white animate-bounce
          ${type === 'touchdown' ? 'bg-green-600' : 'bg-yellow-600'}
        `}>
          {type === 'touchdown' ? 'TOUCHDOWN!' : 'FIELD GOAL!'}
        </div>
      </div>

      {/* Video */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline
        muted={false}
      />

      {/* Tap to dismiss hint */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/50 text-sm">
        Tap anywhere to dismiss
      </div>
    </div>
  );
}
