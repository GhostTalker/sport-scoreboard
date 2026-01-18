import type { SportPlugin } from '../../core/plugin/types';
import { WorldCupAdapter } from './adapter';

const plugin: SportPlugin = {
  manifest: {
    id: 'worldcup',
    version: '1.0.0',
    name: 'FIFA World Cup Plugin',
    displayName: 'FIFA Weltmeisterschaft 2026',
    description: 'International Tournament',
    icon: '/title/worldcup-logo.png',
    hasStats: true,
    celebrationTypes: ['goal', 'penalty', 'own_goal', 'red_card', 'yellow_red_card'],
    competitions: ['fifa-worldcup'],
    coreVersion: '^3.0.0',
  },

  adapter: new WorldCupAdapter(),

  async onLoad() {
    console.log('🏆 FIFA World Cup Plugin loaded');
  },

  async onActivate() {
    console.log('🏆 FIFA World Cup Plugin activated');
  },
};

export default plugin;
