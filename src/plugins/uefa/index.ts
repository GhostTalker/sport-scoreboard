import type { SportPlugin } from '../../core/plugin/types';
import { UEFAAdapter } from './adapter';

const plugin: SportPlugin = {
  manifest: {
    id: 'uefa',
    version: '1.0.0',
    name: 'UEFA Champions League Plugin',
    displayName: 'UEFA Champions League',
    description: 'European Football',
    icon: '/title/uefa-logo.png',
    hasStats: false,
    celebrationTypes: ['goal', 'penalty', 'own_goal', 'red_card', 'yellow_red_card'],
    competitions: ['champions-league'],
    coreVersion: '^3.0.0',
  },

  adapter: new UEFAAdapter(),

  async onLoad() {
    console.log('⭐ UEFA Champions League Plugin loaded');
  },

  async onActivate() {
    console.log('⭐ UEFA Champions League Plugin activated');
  },
};

export default plugin;
