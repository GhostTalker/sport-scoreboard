import type { SportPlugin } from '../../core/plugin/types';
import { EuroAdapter } from './adapter';

const plugin: SportPlugin = {
  manifest: {
    id: 'euro',
    version: '1.0.0',
    name: 'UEFA Euro Plugin',
    displayName: 'UEFA Europameisterschaft 2020',
    description: 'European Tournament',
    icon: '/title/euro-logo.png',
    hasStats: true,
    celebrationTypes: ['goal', 'penalty', 'own_goal', 'red_card', 'yellow_red_card'],
    competitions: ['uefa-euro'],
    coreVersion: '^3.0.0',
  },

  adapter: new EuroAdapter(),

  async onLoad() {
    console.log('🏆 UEFA Euro Plugin loaded');
  },

  async onActivate() {
    console.log('🏆 UEFA Euro Plugin activated');
  },
};

export default plugin;
