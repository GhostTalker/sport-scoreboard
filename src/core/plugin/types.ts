import type { SportAdapter } from '../../adapters/SportAdapter';

/**
 * Plugin Manifest - Describes a sport plugin
 */
export interface PluginManifest {
  // Identity
  id: string;                    // 'nfl', 'bundesliga', 'premier-league'
  version: string;               // '1.0.0'
  name: string;                  // 'NFL Plugin'

  // Display
  displayName: string;           // 'NFL'
  description: string;           // 'American Football'
  icon: string;                  // '/logos/Logo_NFL.png' (for Settings/PluginManager)
  sportSelectionIcon?: string;   // '/title/nfl-logo.png' (for initial sport selection screen)

  // Capabilities
  hasStats: boolean;
  celebrationTypes: string[];
  competitions?: string[];       // ['nfl'], ['bundesliga', 'dfb-pokal']

  // Dependencies
  coreVersion: string;           // '^2.0.0' (semver)
  dependencies?: Record<string, string>;
}

/**
 * Plugin Lifecycle Hooks
 */
export interface PluginLifecycle {
  /**
   * Called once when plugin is first loaded
   */
  onLoad?(): Promise<void> | void;

  /**
   * Called when sport is selected/activated
   */
  onActivate?(): Promise<void> | void;

  /**
   * Called when switching away from this sport
   */
  onDeactivate?(): Promise<void> | void;

  /**
   * Called when plugin is unloaded (app shutdown)
   */
  onUnload?(): Promise<void> | void;
}

/**
 * Complete Plugin Definition
 */
export interface SportPlugin extends PluginLifecycle {
  manifest: PluginManifest;
  adapter: SportAdapter;
}

/**
 * Plugin Module Export - What each plugin file must export
 */
export interface PluginModule {
  default: SportPlugin;
}

/**
 * Plugin Load Function - Dynamic import wrapper
 */
export type PluginLoader = () => Promise<PluginModule>;

/**
 * Plugin Registry Entry
 */
export interface PluginRegistryEntry {
  manifest: PluginManifest;
  loader: PluginLoader;
  loaded: boolean;
  plugin?: SportPlugin;
}
