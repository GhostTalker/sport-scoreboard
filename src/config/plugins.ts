import type { PluginManifest, PluginLoader } from '../core/plugin/types';

/**
 * Plugin Definitions
 *
 * This file defines all available plugins.
 * Plugins are auto-registered at app startup.
 *
 * To add a new plugin:
 * 1. Create plugin module in src/plugins/<name>/
 * 2. Add entry here with manifest + loader
 * 3. Plugin will be auto-discovered and can be enabled/disabled in settings
 */

export interface PluginDefinition {
  manifest: PluginManifest;
  loader: PluginLoader;
}

/**
 * All available plugin definitions
 *
 * Note: We use static imports here because Vite's import.meta.glob()
 * has issues with TypeScript parsing of glob patterns containing wildcards.
 * This approach is simpler and gives better type safety.
 */
export const PLUGIN_DEFINITIONS: PluginDefinition[] = [
  // NFL Plugin
  {
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
    loader: () => import('../plugins/nfl'),
  },

  // Bundesliga Plugin
  {
    manifest: {
      id: 'bundesliga',
      version: '1.0.0',
      name: 'Bundesliga Plugin',
      displayName: 'Bundesliga',
      description: 'Deutscher Fußball',
      icon: '/logos/Logo_Bundesliga.png',
      hasStats: false,
      celebrationTypes: ['goal', 'penalty', 'own_goal', 'red_card', 'yellow_red_card'],
      competitions: ['bundesliga', 'dfb-pokal'],
      coreVersion: '^3.0.0',
    },
    loader: () => import('../plugins/bundesliga'),
  },

  // Add new plugins here...
  // {
  //   manifest: {
  //     id: 'premier-league',
  //     version: '1.0.0',
  //     name: 'Premier League Plugin',
  //     displayName: 'Premier League',
  //     description: 'English Football',
  //     icon: '/title/premier-league-logo.png',
  //     hasStats: false,
  //     celebrationTypes: ['goal', 'penalty', 'red_card'],
  //     competitions: ['premier-league'],
  //     coreVersion: '^3.0.0',
  //   },
  //   loader: () => import('../plugins/premier-league'),
  // },
];

/**
 * Get all plugin definitions (synchronous)
 */
export function getPluginDefinitions(): PluginDefinition[] {
  return PLUGIN_DEFINITIONS;
}

/**
 * Get all available plugin IDs
 */
export function getAvailablePluginIds(): string[] {
  return PLUGIN_DEFINITIONS.map(d => d.manifest.id);
}

/**
 * Type-safe SportType - auto-generated from plugin definitions
 */
export type SportType = typeof PLUGIN_DEFINITIONS[number]['manifest']['id'];
