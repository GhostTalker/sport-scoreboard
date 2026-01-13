# Plugin-System v3.0 - Dokumentation

## Übersicht

Das Sport-Scoreboard v3.0 implementiert ein vollständiges Plugin-System, das es ermöglicht, Sportarten und Ligen als dynamisch ladbare Module hinzuzufügen.

## Architektur

### Komponenten

1. **Plugin Registry** (`src/core/plugin/PluginRegistry.ts`)
   - Singleton-Instanz für Plugin-Verwaltung
   - Registriert, lädt und aktiviert Plugins
   - Lifecycle-Management (onLoad, onActivate, onDeactivate, onUnload)

2. **Plugin-Definitionen** (`src/config/plugins.ts`)
   - Zentrale Registrierung aller Plugins
   - Auto-generierte `SportType` aus Plugin-IDs
   - Dynamic Imports für Code Splitting

3. **Plugin-Module** (`src/plugins/`)
   - Jedes Plugin ist ein eigenständiges Modul
   - Enthält Adapter, Manifest und optionale Types
   - NFL und Bundesliga als Referenz-Implementierungen

4. **React Hooks** (`src/hooks/usePlugin.ts`)
   - `useCurrentPlugin()`: Aktuelles aktives Plugin
   - `useAvailablePlugins()`: Alle registrierten Plugins

### Plugin-Struktur

```
src/plugins/<sport-name>/
├── index.ts          # Plugin Entry Point (Manifest + Lifecycle)
├── adapter.ts        # SportAdapter Implementation
├── types.ts          # Sport-spezifische Types (optional)
└── constants.ts      # Konstanten (optional)
```

## Neue Liga hinzufügen

### Zeit: ~30 Minuten

### Schritte:

1. **Template kopieren**
   ```bash
   cp -r src/plugins/_template src/plugins/dein-sport
   ```

2. **Adapter implementieren** (`adapter.ts`)
   - `fetchScoreboard()`: Spiele laden
   - `fetchGameDetails()`: Details + Statistiken
   - `detectScoreChange()`: Score-Änderungen erkennen
   - `getPeriodName()`: Spielphase-Namen
   - `getCelebrationTypes()`: Celebration-Events

3. **Manifest anpassen** (`index.ts`)
   - `id`: Eindeutige Plugin-ID
   - `displayName`: Name in der UI
   - `icon`: Logo-Pfad
   - `celebrationTypes`: Event-Liste

4. **In Registry registrieren** (`src/config/plugins.ts`)
   ```typescript
   {
     manifest: { id: 'dein-sport', ... },
     loader: () => import('../plugins/dein-sport'),
   }
   ```

5. **Types erweitern** (`src/types/game.ts`)
   ```typescript
   export type Game = NFLGame | BundesligaGame | DeinSportGame;
   ```

6. **Logo hinzufügen**
   - `public/title/dein-sport-logo.png` (512x512px, transparent)

7. **Testen**
   ```bash
   npm run dev
   ```

## Breaking Changes von v2.0

### Code-Änderungen erforderlich:

1. **SportType ist jetzt auto-generiert**
   ```typescript
   // VORHER (v2.0)
   export type SportType = 'nfl' | 'bundesliga';

   // NACHHER (v3.0)
   import type { SportType } from '../config/plugins';
   // SportType wird automatisch aus PLUGIN_DEFINITIONS generiert
   ```

2. **Adapter-Zugriff ist jetzt async**
   ```typescript
   // VORHER (v2.0)
   const adapter = getSportAdapter(currentSport);
   const games = await adapter.fetchScoreboard();

   // NACHHER (v3.0)
   const plugin = useCurrentPlugin();
   const adapter = plugin?.adapter;
   if (!adapter) return;
   const games = await adapter.fetchScoreboard();
   ```

3. **Import-Pfade geändert**
   ```typescript
   // VORHER
   import { NFLAdapter } from '../adapters/nflAdapter';

   // NACHHER
   import { NFLAdapter } from '../plugins/nfl/adapter';
   ```

## Technische Details

### Code Splitting

Vite erstellt automatisch separate Chunks für Plugins:
- Main Bundle: ~238 KB (~69 KB gzipped)
- Plugin-spezifischer Code wird lazy geladen
- Nur das aktive Plugin wird geladen

### Type Safety

- `SportType` wird zur Compile-Zeit aus Plugins generiert
- Discriminated Union für `Game` Type
- Type Guards für Runtime Type Checking

### Lifecycle Hooks

```typescript
{
  onLoad?(): Promise<void>;      // Einmalig beim ersten Laden
  onActivate?(): Promise<void>;  // Beim Sport-Wechsel
  onDeactivate?(): Promise<void>; // Beim Wegwechseln
  onUnload?(): Promise<void>;    // Bei App-Shutdown
}
```

### Plugin Validation

Die Registry validiert:
- Plugin-Struktur (Manifest + Adapter vorhanden)
- ID-Konsistenz (manifest.id === registered ID)
- Core-Version-Kompatibilität

## Vorhandene Plugins

### NFL Plugin (`src/plugins/nfl/`)
- **API:** ESPN API
- **Stats:** Ja (Team + Player Stats)
- **Celebrations:** 6 Types (touchdown, fieldgoal, interception, sack, fumble, safety)
- **Competitions:** NFL

### Bundesliga Plugin (`src/plugins/bundesliga/`)
- **API:** OpenLigaDB
- **Stats:** Nein
- **Celebrations:** 5 Types (goal, penalty, own_goal, red_card, yellow_red_card)
- **Competitions:** Bundesliga, DFB-Pokal

## Migration von v2.0 zu v3.0

### Automatische Änderungen:
- [x] Plugin Core Infrastructure erstellt
- [x] NFL + Bundesliga als Plugins migriert
- [x] UI-Komponenten auf Plugin-System umgestellt
- [x] Type-System angepasst

### Manuelle Änderungen (falls Custom Code):
Wenn du Custom-Code hast der `getSportAdapter()` nutzt:
1. Ersetze durch `useCurrentPlugin()` Hook
2. Füge Null-Check hinzu (`if (!plugin?.adapter) return`)
3. Update Import-Pfade

## Performance

| Metrik | v2.0 | v3.0 | Änderung |
|--------|------|------|----------|
| Build Zeit | ~3s | ~3-4s | +~1s |
| Bundle Size (gzipped) | ~68 KB | ~69 KB | +1 KB |
| Initial Load | Alle Sports | Nur Core | ⚡ Schneller |
| Sport Switch | Instant | Lazy Load | ~100ms |

## Troubleshooting

### "Plugin not found in registry"
- Prüfe, ob Plugin in `src/config/plugins.ts` registriert ist
- Check Browser Console für Fehler

### TypeScript Error: "SportType not assignable"
- Stelle sicher, dass Plugin-ID in `PLUGIN_DEFINITIONS` enthalten ist
- Rebuild: `npm run build`

### Spiele werden nicht geladen
- Prüfe `fetchScoreboard()` Implementation
- Check Browser Network Tab
- Prüfe API-Endpunkte im Adapter

### Celebration Videos triggern nicht
- Prüfe `detectScoreChange()` Implementation
- Stelle sicher, dass Celebration Types im Manifest definiert sind
- Check, dass Videos in `public/videos/` vorhanden sind

## Bekannte Issues

### Fehlende Grafiken (nicht blockierend)
- TBD-Platzhalter-Logo fehlt
- NFC/AFC Conference Logos fehlen
- **Lösung:** Grafiken in `public/title/` ablegen

## Nächste Schritte

Mögliche Erweiterungen:
1. Premier League Plugin
2. NBA Plugin
3. NHL Plugin
4. UCL (Champions League) Plugin

Jedes neue Plugin: ~30-60 Minuten Aufwand.

## Support

Siehe auch:
- `src/plugins/_template/README.md` - Detaillierte Anleitung
- `src/core/plugin/types.ts` - Plugin Interfaces
- `src/adapters/SportAdapter.ts` - Adapter Interface

---

**Version:** 3.0.0
**Datum:** 2026-01-13
**Status:** ✅ Produktionsbereit
