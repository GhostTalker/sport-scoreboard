import { useState, useEffect } from 'react';
import { pluginRegistry } from '../core/plugin/PluginRegistry';
import type { SportPlugin, PluginManifest } from '../core/plugin/types';
import { useSettingsStore } from '../stores/settingsStore';

/**
 * Hook to get current active plugin
 */
export function useCurrentPlugin(): SportPlugin | null {
  const currentSport = useSettingsStore(state => state.currentSport);
  const [plugin, setPlugin] = useState<SportPlugin | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function loadPlugin() {
      if (!currentSport) {
        setPlugin(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const loadedPlugin = await pluginRegistry.activate(currentSport);
        if (!cancelled) {
          setPlugin(loadedPlugin);
        }
      } catch (error) {
        console.error(`Failed to load plugin ${currentSport}:`, error);
        if (!cancelled) {
          setPlugin(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadPlugin();

    return () => {
      cancelled = true;
    };
  }, [currentSport]);

  return loading ? null : plugin;
}

/**
 * Hook to get all available plugins (for sport selection)
 */
export function useAvailablePlugins(): PluginManifest[] {
  const [plugins, setPlugins] = useState<PluginManifest[]>([]);

  useEffect(() => {
    const available = pluginRegistry.getAllPlugins();
    console.log('[useAvailablePlugins] Registry returned:', available.length, 'plugins', available);
    setPlugins(available);
  }, []);

  console.log('[useAvailablePlugins] Returning:', plugins.length, 'plugins');
  return plugins;
}
