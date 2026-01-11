import { useEffect, useState } from 'react';
import { VIDEOS, type CelebrationVideoType } from '../constants/videos';

// Global cache for preloaded video blob URLs
const videoCache: Map<string, string> = new Map();
let preloadStarted = false;
let preloadComplete = false;

// Preload a single video and return a blob URL
async function preloadVideo(src: string): Promise<string | null> {
  // Check if already cached
  if (videoCache.has(src)) {
    return videoCache.get(src)!;
  }

  try {
    const response = await fetch(src);
    if (!response.ok) {
      throw new Error(`Failed to fetch video: ${response.status}`);
    }
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    videoCache.set(src, blobUrl);
    return blobUrl;
  } catch (error) {
    console.warn(`[VideoPreloader] Failed to preload ${src}:`, error);
    return null;
  }
}

// Preload all local videos
async function preloadAllVideos(onProgress?: (loaded: number, total: number) => void) {
  if (preloadStarted) return;
  preloadStarted = true;

  const videoTypes = Object.keys(VIDEOS) as CelebrationVideoType[];
  const localSources = videoTypes.map(type => VIDEOS[type].src);

  let loaded = 0;
  let successful = 0;

  // Preload all local videos
  for (const src of localSources) {
    const result = await preloadVideo(src);
    loaded++;
    if (result) successful++;
    onProgress?.(loaded, localSources.length);
  }

  preloadComplete = true;
}

// Get cached blob URL for a video source
export function getCachedVideoUrl(src: string): string {
  return videoCache.get(src) || src;
}

// Check if a video is cached
export function isVideoCached(src: string): boolean {
  return videoCache.has(src);
}

// Hook to trigger preloading and track progress
export function useVideoPreloader() {
  const [progress, setProgress] = useState({ loaded: 0, total: 0 });
  const [isComplete, setIsComplete] = useState(preloadComplete);

  useEffect(() => {
    if (preloadComplete) {
      setIsComplete(true);
      return;
    }

    preloadAllVideos((loaded, total) => {
      setProgress({ loaded, total });
    }).then(() => {
      setIsComplete(true);
    });
  }, []);

  return {
    isPreloading: !isComplete && progress.total > 0,
    isComplete,
    progress: progress.total > 0 ? Math.round((progress.loaded / progress.total) * 100) : 0,
    loaded: progress.loaded,
    total: progress.total,
  };
}
