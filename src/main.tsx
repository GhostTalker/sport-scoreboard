import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

// Plugin System
import { pluginRegistry } from './core/plugin/PluginRegistry';
import { PLUGIN_DEFINITIONS } from './config/plugins';

/**
 * Bootstrap: Register all plugins
 */
async function bootstrap() {
  console.log('🚀 Bootstrapping Sport-Scoreboard v3.0...');
  console.log('📦 Plugin definitions:', PLUGIN_DEFINITIONS.length);

  // Register plugins
  for (const { manifest, loader } of PLUGIN_DEFINITIONS) {
    console.log('  Registering plugin:', manifest.id, manifest.displayName);
    pluginRegistry.register(manifest, loader);
  }

  console.log(`✅ Registered ${PLUGIN_DEFINITIONS.length} plugins`);

  // Verify registration
  const registered = pluginRegistry.getAllPlugins();
  console.log('✅ Verification: Registry contains', registered.length, 'plugins:', registered.map(p => p.id));

  // Render app
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

// Start app
bootstrap().catch(error => {
  console.error('❌ Bootstrap failed:', error);
  document.body.innerHTML = `
    <div style="display: flex; align-items: center; justify-center: height: 100vh; background: #0a1628; color: white; font-family: sans-serif;">
      <div style="text-align: center;">
        <h1>❌ Failed to start Sport-Scoreboard</h1>
        <p>${error.message}</p>
      </div>
    </div>
  `;
});
