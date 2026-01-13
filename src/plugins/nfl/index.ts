import type { SportPlugin } from '../../core/plugin/types';
import { NFLAdapter } from './adapter';

const plugin: SportPlugin = {
  manifest: {
    id: 'nfl',
    version: '1.0.0',
    name: 'NFL Plugin',
    displayName: 'NFL',
    description: 'American Football',
    icon: '/logos/Logo_NFL.png',
    hasStats: true,
    celebrationTypes: ['touchdown', 'fieldgoal', 'interception', 'sack', 'fumble', 'safety'],
    competitions: ['nfl'],
    coreVersion: '^3.0.0',
  },

  adapter: new NFLAdapter(),

  // Lifecycle hooks
  async onLoad() {
    console.log('🏈 NFL Plugin loaded');
  },

  async onActivate() {
    console.log('🏈 NFL Plugin activated');
  },

  async onDeactivate() {
    console.log('🏈 NFL Plugin deactivated');
  },
};

export default plugin;
