# Sport Plugin Template

Verwende dieses Template, um ein neues Sport-Plugin zu erstellen.

## Schritte zum Erstellen eines neuen Plugins

### 1. Template kopieren

```bash
# Windows PowerShell
Copy-Item -Recurse src\plugins\_template src\plugins\dein-sport

# Oder manuell:
# - Kopiere den _template Ordner
# - Benenne ihn um (z.B. "premier-league", "nba", "nhl")
```

### 2. Adapter implementieren (`adapter.ts`)

Der Adapter implementiert das `SportAdapter` Interface und verbindet dein Plugin mit der API deiner Sportart/Liga.

**Wichtige Methoden:**
- `fetchScoreboard()`: Lädt alle aktuellen Spiele
- `fetchGameDetails(gameId)`: Lädt Details + Statistiken für ein Spiel
- `detectScoreChange(prev, current)`: Erkennt Score-Änderungen für Celebration Videos
- `getPeriodName(period)`: Name der Spielphase (z.B. "1st Quarter", "1. Halbzeit")
- `getCompetitionName(game)`: Name des Wettbewerbs (z.B. "NFL", "Bundesliga")
- `getCelebrationTypes()`: Liste der Celebration-Typen für diesen Sport

**Beispiel-Struktur:**
```typescript
import type { SportAdapter } from '../../adapters/SportAdapter';
import type { Game, GameStats, ScoreChangeResult } from '../../types/game';

export class DeinSportAdapter implements SportAdapter {
  sport = 'dein-sport' as const;

  async fetchScoreboard(): Promise<Game[]> {
    // API-Aufruf, Daten transformieren
  }

  async fetchGameDetails(gameId: string): Promise<{ game: Game; stats: GameStats | null }> {
    // Details laden
  }

  detectScoreChange(prevGame: Game, currentGame: Game): ScoreChangeResult | null {
    // Score-Änderung erkennen
  }

  getPeriodName(period: number): string {
    // z.B. "1st Quarter", "1. Halbzeit"
  }

  getCompetitionName(game: Game): string {
    // z.B. "NFL", "Premier League"
  }

  getCelebrationTypes(): string[] {
    return ['goal', 'penalty', 'red_card'];
  }
}
```

### 3. Plugin Entry Point erstellen (`index.ts`)

Der Entry Point exportiert das Plugin-Objekt mit Manifest und Adapter.

**Wichtige Felder im Manifest:**
- `id`: Eindeutige Plugin-ID (z.B. 'premier-league')
- `version`: Plugin-Version (Semantic Versioning)
- `displayName`: Anzeigename in der UI (z.B. 'Premier League')
- `icon`: Pfad zum Icon/Logo (z.B. '/title/premier-league-logo.png')
- `celebrationTypes`: Array mit Celebration-Events (z.B. ['goal', 'penalty'])
- `competitions`: Array mit Wettbewerben (z.B. ['premier-league', 'fa-cup'])

**Beispiel:**
```typescript
import type { SportPlugin } from '../../core/plugin/types';
import { DeinSportAdapter } from './adapter';

const plugin: SportPlugin = {
  manifest: {
    id: 'dein-sport',
    version: '1.0.0',
    name: 'Dein Sport Plugin',
    displayName: 'Dein Sport',
    description: 'Beschreibung deines Sports',
    icon: '/title/dein-sport-logo.png',
    hasStats: true, // false wenn keine Statistiken verfügbar
    celebrationTypes: ['goal', 'penalty', 'red_card'],
    competitions: ['dein-sport'],
    coreVersion: '^3.0.0',
  },

  adapter: new DeinSportAdapter(),

  // Lifecycle Hooks (optional)
  async onLoad() {
    console.log('🏆 Dein Sport Plugin loaded');
  },

  async onActivate() {
    console.log('🏆 Dein Sport Plugin activated');
  },

  async onDeactivate() {
    console.log('🏆 Dein Sport Plugin deactivated');
  },
};

export default plugin;
```

### 4. Types definieren (optional `types.ts`)

Wenn dein Sport spezielle Typen benötigt, erstelle eine `types.ts` Datei:

```typescript
import type { BaseGame } from '../../types/base';

export interface DeinSportGame extends BaseGame {
  sport: 'dein-sport';
  // Dein-Sport-spezifische Felder
  currentMinute?: number;
  extraTime?: string;
}

export type DeinSportCelebrationType = 'goal' | 'penalty' | 'red_card';
```

### 5. Plugin registrieren in `src/config/plugins.ts`

Füge dein Plugin zur `PLUGIN_DEFINITIONS` Array hinzu:

```typescript
{
  manifest: {
    id: 'dein-sport',
    version: '1.0.0',
    name: 'Dein Sport Plugin',
    displayName: 'Dein Sport',
    description: 'Beschreibung',
    icon: '/title/dein-sport-logo.png',
    hasStats: false,
    celebrationTypes: ['goal', 'penalty'],
    competitions: ['dein-sport'],
    coreVersion: '^3.0.0',
  },
  loader: () => import('../plugins/dein-sport'),
},
```

### 6. Types aktualisieren in `src/types/game.ts`

Wenn du eigene Game-Typen hast, füge sie zur Union hinzu:

```typescript
// Import
import type { DeinSportGame } from '../plugins/dein-sport/types';

// Union erweitern
export type Game = NFLGame | BundesligaGame | DeinSportGame;

// Type Guard erstellen
export function isDeinSportGame(game: Game): game is DeinSportGame {
  return game.sport === 'dein-sport';
}
```

### 7. Logo/Icon hinzufügen

Platziere dein Sport-Logo in `public/title/`:
- Format: PNG mit transparentem Hintergrund
- Empfohlene Größe: 512x512px oder größer
- Beispiel: `public/title/dein-sport-logo.png`

### 8. Celebration Videos (optional)

Wenn du Celebration Videos nutzen möchtest:
1. Videos in `public/videos/dein-sport/` ablegen
2. In `src/constants/videos.ts` registrieren

### 9. Testing

```bash
npm run dev
```

- Wähle deinen Sport im Sport Selection Screen
- Überprüfe, dass Spiele korrekt geladen werden
- Teste Celebration Videos
- Teste Sport-Switching (zurück zu NFL/Bundesliga und wieder zu deinem Sport)

### 10. Build & Deploy

```bash
npm run build
npm run start:prod
```

## Beispiel-Plugins zum Nachschlagen

Schaue dir die bestehenden Plugins an:
- `src/plugins/nfl/` - Komplexes Plugin mit Statistiken und vielen Celebration Types
- `src/plugins/bundesliga/` - Einfacheres Plugin ohne Statistiken

## Hilfreiche Links

- **SportAdapter Interface**: `src/adapters/SportAdapter.ts`
- **Plugin Types**: `src/core/plugin/types.ts`
- **Base Types**: `src/types/base.ts`
- **Bestehende Game Types**: `src/types/nfl.ts`, `src/types/bundesliga.ts`

## Troubleshooting

### Plugin wird nicht in Sport Selection angezeigt
- Prüfe, ob Plugin in `src/config/plugins.ts` registriert ist
- Prüfe Browser-Konsole auf Fehler beim Plugin-Loading

### TypeScript-Fehler "SportType not assignable"
- Stelle sicher, dass deine Plugin-ID mit der ID im Manifest übereinstimmt
- Prüfe, dass die Game Union in `src/types/game.ts` deinen Game-Type enthält

### Spiele werden nicht geladen
- Prüfe `fetchScoreboard()` Implementation im Adapter
- Prüfe Browser Network Tab auf API-Fehler
- Prüfe Browser-Konsole auf Fehler

### Celebration Videos triggern nicht
- Prüfe `detectScoreChange()` Implementation
- Prüfe, dass Celebration Types im Manifest definiert sind
- Prüfe, dass Videos in `public/videos/` vorhanden sind

## Zeitaufwand

Für ein neues Plugin solltest du ca. **30-60 Minuten** einplanen:
- 20 min: Adapter-Implementation (abhängig von API-Komplexität)
- 10 min: Plugin-Manifest und Entry Point
- 10 min: Testing
- 10 min: Logo/Videos hinzufügen
