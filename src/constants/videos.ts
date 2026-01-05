// Video configuration
export const VIDEOS = {
  touchdown: {
    src: '/videos/touchdown.mp4',
    duration: 8000, // 8 seconds
    poster: '/videos/touchdown-poster.jpg',
  },
  fieldgoal: {
    src: '/videos/fieldgoal.mp4',
    duration: 5000, // 5 seconds
    poster: '/videos/fieldgoal-poster.jpg',
  },
} as const;

// Audio configuration
export const AUDIO = {
  touchdown: '/audio/touchdown.mp3',
  fieldgoal: '/audio/fieldgoal.mp3',
  crowd: '/audio/crowd.mp3',
} as const;

// Placeholder video sources (free to use)
// You can replace these with your own videos
export const PLACEHOLDER_VIDEOS = {
  // Pixabay free videos (no attribution required)
  touchdown: [
    'https://cdn.pixabay.com/video/2020/08/08/46944-449634027_large.mp4', // Fireworks
    'https://cdn.pixabay.com/video/2019/06/24/24880-344745604_large.mp4', // Celebration
  ],
  fieldgoal: [
    'https://cdn.pixabay.com/video/2021/04/03/70024-533556940_large.mp4', // Football field
  ],
};

// Placeholder audio sources (free to use)
export const PLACEHOLDER_AUDIO = {
  // Free sound effects
  touchdown: 'https://assets.mixkit.co/active_storage/sfx/2566/2566-preview.mp3', // Crowd cheer
  fieldgoal: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3', // Applause
};
