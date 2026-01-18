import type { SportPlugin } from '../../core/plugin/types';
import { TemplateSportAdapter } from './adapter';

/**
 * Template Sport Plugin
 *
 * TODO: Anpassen für deine Sportart/Liga
 * 1. Ändere die manifest-Werte (id, name, displayName, etc.)
 * 2. Passe celebrationTypes an deine Sport-Events an
 * 3. Implementiere den Adapter in adapter.ts
 * 4. Registriere das Plugin in src/config/plugins.ts
 */

const plugin: SportPlugin = {
  manifest: {
    // TODO: Eindeutige ID für dein Plugin (lowercase, kebab-case)
    id: 'template-sport',

    // TODO: Version (Semantic Versioning)
    version: '1.0.0',

    // TODO: Plugin-Name (für Logs/Debugging)
    name: 'Template Sport Plugin',

    // TODO: Anzeigename in der UI
    displayName: 'Template Sport',

    // TODO: Kurze Beschreibung
    description: 'Template für neue Sport-Plugins',

    // TODO: Pfad zum Logo/Icon (in public/title/)
    icon: '/title/template-sport-logo.png',

    // TODO: Hat dieser Sport detaillierte Statistiken?
    hasStats: false,

    // TODO: Liste der Celebration-Events für diesen Sport
    // Beispiele:
    // - NFL: ['touchdown', 'fieldgoal', 'interception', 'sack', 'fumble', 'safety']
    // - Fußball: ['goal', 'penalty', 'own_goal', 'red_card', 'yellow_red_card']
    // - Basketball: ['three_pointer', 'dunk', 'buzzer_beater']
    celebrationTypes: ['score', 'big_play'],

    // TODO: Liste der Wettbewerbe/Ligen
    // Beispiele:
    // - ['nfl'] - Nur eine Liga
    // - ['bundesliga', 'dfb-pokal'] - Mehrere Wettbewerbe
    competitions: ['template-sport'],

    // TODO: Kompatible Core-Version (normalerweise '^3.0.0')
    coreVersion: '^3.0.0',
  },

  // TODO: Instanz deines Adapters
  adapter: new TemplateSportAdapter(),

  // Lifecycle Hooks (optional)

  /**
   * Wird einmalig aufgerufen, wenn das Plugin zum ersten Mal geladen wird
   */
  async onLoad() {
    console.log('📋 Template Sport Plugin loaded');
    // TODO: Initialization logic hier (z.B. Cache setup, Config laden)
  },

  /**
   * Wird aufgerufen, wenn der User diesen Sport auswählt
   */
  async onActivate() {
    console.log('📋 Template Sport Plugin activated');
    // TODO: Activation logic hier (z.B. Event-Listener registrieren)
  },

  /**
   * Wird aufgerufen, wenn der User zu einem anderen Sport wechselt
   */
  async onDeactivate() {
    console.log('📋 Template Sport Plugin deactivated');
    // TODO: Cleanup logic hier (z.B. Event-Listener entfernen)
  },

  /**
   * Wird aufgerufen, wenn die App heruntergefahren wird (optional)
   */
  async onUnload() {
    console.log('📋 Template Sport Plugin unloaded');
    // TODO: Cleanup logic hier (z.B. Connections schließen, Cache leeren)
  },
};

export default plugin;
