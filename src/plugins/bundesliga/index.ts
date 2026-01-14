import type { SportPlugin } from '../../core/plugin/types';
import { BundesligaAdapter } from './adapter';

const plugin: SportPlugin = {
  manifest: {
    id: 'bundesliga',
    version: '1.0.0',
    name: 'Bundesliga Plugin',
    displayName: 'Bundesliga',
    description: 'Deutscher Fußball',
    icon: '/title/bundesliga-logo.png',
    hasStats: false,
    celebrationTypes: ['goal', 'penalty', 'own_goal', 'red_card', 'yellow_red_card'],
    competitions: ['bundesliga', 'dfb-pokal'],
    coreVersion: '^3.0.0',
  },

  adapter: new BundesligaAdapter(),

  async onLoad() {
    console.log('⚽ Bundesliga Plugin loaded');
  },

  async onActivate() {
    console.log('⚽ Bundesliga Plugin activated');
  },
};

export default plugin;
