import type { SportPlugin, PluginRegistryEntry, PluginLoader, PluginManifest } from './types';

export class PluginRegistry {
  private plugins = new Map<string, PluginRegistryEntry>();
  private activePlugin: string | null = null;

  /**
   * Register a plugin (happens at app startup)
   */
  register(manifest: PluginManifest, loader: PluginLoader): void {
    if (this.plugins.has(manifest.id)) {
      throw new Error(`Plugin ${manifest.id} already registered`);
    }

    this.plugins.set(manifest.id, {
      manifest,
      loader,
      loaded: false,
    });

    console.log(`✅ Registered plugin: ${manifest.name} v${manifest.version}`);
  }

  /**
   * Load a plugin (dynamic import + lifecycle)
   */
  async load(pluginId: string): Promise<SportPlugin> {
    const entry = this.plugins.get(pluginId);
    if (!entry) {
      throw new Error(`Plugin ${pluginId} not found in registry`);
    }

    // Already loaded? Return cached
    if (entry.loaded && entry.plugin) {
      return entry.plugin;
    }

    console.log(`📦 Loading plugin: ${entry.manifest.name}...`);

    try {
      // Dynamic import
      const module = await entry.loader();
      const plugin = module.default;

      // Validate
      this.validatePlugin(plugin, entry.manifest);

      // Call onLoad hook
      if (plugin.onLoad) {
        await plugin.onLoad();
      }

      // Cache
      entry.plugin = plugin;
      entry.loaded = true;

      console.log(`✅ Loaded plugin: ${entry.manifest.name}`);
      return plugin;
    } catch (error) {
      console.error(`❌ Failed to load plugin ${pluginId}:`, error);
      throw error;
    }
  }

  /**
   * Activate a plugin (switch to this sport)
   */
  async activate(pluginId: string): Promise<SportPlugin> {
    // Deactivate current plugin
    if (this.activePlugin && this.activePlugin !== pluginId) {
      await this.deactivate(this.activePlugin);
    }

    // Load (if not already loaded)
    const plugin = await this.load(pluginId);

    // Call onActivate hook
    if (plugin.onActivate) {
      await plugin.onActivate();
    }

    this.activePlugin = pluginId;
    return plugin;
  }

  /**
   * Deactivate a plugin
   */
  async deactivate(pluginId: string): Promise<void> {
    const entry = this.plugins.get(pluginId);
    if (!entry?.plugin) return;

    if (entry.plugin.onDeactivate) {
      await entry.plugin.onDeactivate();
    }

    if (this.activePlugin === pluginId) {
      this.activePlugin = null;
    }
  }

  /**
   * Get all registered plugins (for UI discovery)
   */
  getAllPlugins(): PluginManifest[] {
    return Array.from(this.plugins.values()).map(e => e.manifest);
  }

  /**
   * Get loaded plugin
   */
  getPlugin(pluginId: string): SportPlugin | null {
    return this.plugins.get(pluginId)?.plugin || null;
  }

  /**
   * Check if plugin is loaded
   */
  isLoaded(pluginId: string): boolean {
    return this.plugins.get(pluginId)?.loaded || false;
  }

  /**
   * Validate plugin structure
   */
  private validatePlugin(plugin: SportPlugin, manifest: PluginManifest): void {
    if (!plugin.adapter) {
      throw new Error(`Plugin ${manifest.id} missing adapter`);
    }
    if (!plugin.manifest) {
      throw new Error(`Plugin ${manifest.id} missing manifest`);
    }
    if (plugin.manifest.id !== manifest.id) {
      throw new Error(`Plugin ID mismatch: ${plugin.manifest.id} vs ${manifest.id}`);
    }
  }

  /**
   * Unload all plugins (app shutdown)
   */
  async unloadAll(): Promise<void> {
    for (const entry of this.plugins.values()) {
      if (entry.plugin?.onUnload) {
        await entry.plugin.onUnload();
      }
    }
    this.plugins.clear();
  }
}

// Singleton instance
export const pluginRegistry = new PluginRegistry();
