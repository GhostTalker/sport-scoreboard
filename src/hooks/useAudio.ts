import { useRef, useCallback } from 'react';
import { useSettingsStore } from '../stores/settingsStore';
import { AUDIO, PLACEHOLDER_AUDIO } from '../constants/videos';

export function useAudio() {
  const soundEffectsEnabled = useSettingsStore((state) => state.soundEffectsEnabled);
  const videoVolume = useSettingsStore((state) => state.videoVolume);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playSound = useCallback((type: 'touchdown' | 'fieldgoal' | 'crowd') => {
    if (!soundEffectsEnabled) return;

    // Try local audio first, fallback to placeholder
    const localSrc = AUDIO[type];
    const placeholderSrc = PLACEHOLDER_AUDIO[type as keyof typeof PLACEHOLDER_AUDIO];
    
    const audio = new Audio();
    audio.volume = videoVolume;
    
    // Try local file first
    audio.src = localSrc;
    audio.onerror = () => {
      // Fallback to placeholder
      if (placeholderSrc) {
        audio.src = placeholderSrc;
        audio.play().catch(console.error);
      }
    };
    
    audio.play().catch(console.error);
    audioRef.current = audio;
  }, [soundEffectsEnabled, videoVolume]);

  const stopSound = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
  }, []);

  return {
    playSound,
    stopSound,
    isEnabled: soundEffectsEnabled,
  };
}
