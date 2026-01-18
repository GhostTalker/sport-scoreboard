// Video configuration
export const VIDEOS = {
  // NFL celebrations
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
  interception: {
    src: '/videos/interception.mp4',
    duration: 5000, // 5 seconds
    poster: '/videos/interception-poster.jpg',
  },
  sack: {
    src: '/videos/sack.mp4',
    duration: 4000, // 4 seconds
    poster: '/videos/sack-poster.jpg',
  },
  fumble: {
    src: '/videos/fumble.mp4',
    duration: 4000, // 4 seconds
    poster: '/videos/fumble-poster.jpg',
  },
  safety: {
    src: '/videos/safety.mp4',
    duration: 5000, // 5 seconds
    poster: '/videos/safety-poster.jpg',
  },

  // Bundesliga celebrations
  goal: {
    src: '/videos/goal.mp4',
    duration: 6000, // 6 seconds
    poster: '/videos/goal-poster.jpg',
  },
  penalty: {
    src: '/videos/penalty.mp4',
    duration: 6000, // 6 seconds
    poster: '/videos/penalty-poster.jpg',
  },
  own_goal: {
    src: '/videos/own_goal.mp4',
    duration: 5000, // 5 seconds
    poster: '/videos/own_goal-poster.jpg',
  },
  red_card: {
    src: '/videos/red_card.mp4',
    duration: 5000, // 5 seconds
    poster: '/videos/red_card-poster.jpg',
  },
  yellow_red_card: {
    src: '/videos/yellow_red_card.mp4',
    duration: 5000, // 5 seconds
    poster: '/videos/yellow_red_card-poster.jpg',
  },
} as const;

// All celebration types
export type CelebrationVideoType = keyof typeof VIDEOS;

// Audio configuration
export const AUDIO = {
  touchdown: '/audio/touchdown.mp3',
  fieldgoal: '/audio/fieldgoal.mp3',
  interception: '/audio/interception.mp3',
  sack: '/audio/sack.mp3',
  fumble: '/audio/fumble.mp3',
  safety: '/audio/safety.mp3',
  crowd: '/audio/crowd.mp3',
} as const;

// Placeholder video sources (free to use)
// You can replace these with your own videos
export const PLACEHOLDER_VIDEOS: Record<CelebrationVideoType, string[]> = {
  // NFL - Pixabay free videos (no attribution required)
  touchdown: [
    'https://cdn.pixabay.com/video/2020/08/08/46944-449634027_large.mp4', // Fireworks
    'https://cdn.pixabay.com/video/2019/06/24/24880-344745604_large.mp4', // Celebration
  ],
  fieldgoal: [
    'https://cdn.pixabay.com/video/2021/04/03/70024-533556940_large.mp4', // Football field
  ],
  interception: [
    'https://cdn.pixabay.com/video/2020/05/25/40107-424176365_large.mp4', // Action
  ],
  sack: [
    'https://cdn.pixabay.com/video/2019/09/11/26963-360345416_large.mp4', // Impact
  ],
  fumble: [
    'https://cdn.pixabay.com/video/2020/05/25/40107-424176365_large.mp4', // Chaos
  ],
  safety: [
    'https://cdn.pixabay.com/video/2020/08/08/46944-449634027_large.mp4', // Celebration
  ],

  // Bundesliga - Soccer celebrations
  goal: [
    'https://cdn.pixabay.com/video/2020/08/08/46944-449634027_large.mp4', // Celebration
  ],
  penalty: [
    'https://cdn.pixabay.com/video/2019/06/24/24880-344745604_large.mp4', // Celebration
  ],
  own_goal: [
    'https://cdn.pixabay.com/video/2020/05/25/40107-424176365_large.mp4', // Action
  ],
  red_card: [
    'https://cdn.pixabay.com/video/2019/09/11/26963-360345416_large.mp4', // Impact
  ],
  yellow_red_card: [
    'https://cdn.pixabay.com/video/2019/09/11/26963-360345416_large.mp4', // Impact
  ],
};

// Placeholder audio sources (free to use)
export const PLACEHOLDER_AUDIO = {
  // Free sound effects
  touchdown: 'https://assets.mixkit.co/active_storage/sfx/2566/2566-preview.mp3', // Crowd cheer
  fieldgoal: 'https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3', // Applause
  interception: 'https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3', // Crowd reaction
  sack: 'https://assets.mixkit.co/active_storage/sfx/2567/2567-preview.mp3', // Hit sound
  fumble: 'https://assets.mixkit.co/active_storage/sfx/2569/2569-preview.mp3', // Gasp
  safety: 'https://assets.mixkit.co/active_storage/sfx/2566/2566-preview.mp3', // Crowd cheer
};
