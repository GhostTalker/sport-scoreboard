# 🏈 NFL Scoreboard

**Live NFL Scoreboard für iPad mini 6 und Video Wall Display**

Eine moderne, responsive Web-Anwendung für die Anzeige von Live-NFL-Spielen mit dynamischen Hintergründen, Team-Logos, Statistiken, Celebration-Videos und deutscher Lokalisierung.

![Status](https://img.shields.io/badge/Status-Production-green)
![Version](https://img.shields.io/badge/Version-1.2.9-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## 📋 Inhaltsverzeichnis

- [Screenshots](#-screenshots)
- [Features](#-features)
- [Bedienung](#-bedienung)
- [Tech Stack](#-tech-stack)
- [Installation](#-installation)
- [Verwendung](#-verwendung)
- [Deployment](#-deployment)
- [Projektstruktur](#-projektstruktur)
- [Konfiguration](#-konfiguration)
- [Development](#-development)
- [API](#-api)
- [Lizenz](#-lizenz)

---

## 🖼 Screenshots

### SingleView - Live Game
Detaillierte Ansicht eines laufenden Spiels mit Live-Indikator, Spieluhr und Spielsituation.

![SingleView - Upcoming Game](public/screenshots/singleview_upcomming.png)

### SingleView - Final Game
Endergebnis mit Gewinner-Hervorhebung und Zusammenfassung.

![SingleView - Final Game](public/screenshots/singleview_final.png)

### MultiView - All Games
Übersicht aller Spiele mit dynamischer Kartengröße und Filtern.

![MultiView](public/screenshots/multiview.png)

---

## ✨ Features

### 🎮 Anzeigemodi

#### SingleView
- **Vollbild-Ansicht** eines einzelnen Spiels
- **Große Team-Logos** mit dynamischen Glow-Effekten basierend auf Team-Farben
- **Team-Namen** in großer, gut lesbarer Schrift
- **Live-Spieluhr** mit Quarter/Period-Anzeige und pulsierendem Indikator
- **Spielsituation** - Down, Distance, Yard-Line, Ballbesitz mit Team-Logo
- **Detaillierte Statistiken** - Team Stats, Player Stats, Drive Charts
- **Dynamische Hintergründe** je nach Spielstatus und -typ

#### MultiView
- **Alle Spiele auf einen Blick** in einem 2-Spalten-Grid
- **Dynamische Kartengröße** - passt sich der Anzahl der Spiele an:
  - 1-6 Spiele: Große Karten (165px) mit größeren Logos
  - 7-10 Spiele: Mittlere Karten (150px)
  - 11+ Spiele: Kompakte Karten (135px)
- **Filter-Optionen** - Live, Upcoming, Final Games
- **Score-Change-Erkennung** - Karten mit kürzlichen Änderungen leuchten rot
- **Status-Badges** - Live, Halftime, Final, Scheduled
- **Direkte Spielauswahl** - Klick auf Karte wechselt zu SingleView

### 🎉 Celebration Features

- **Automatische Celebration-Videos** bei Score-Änderungen:
  - 🏈 Touchdown (6, 7, 8 Punkte)
  - 🥅 Field Goal (3 Punkte)
  - 🛡️ Safety (2 Punkte)
  - 🏃 Interception Return TD
  - 💥 Sack
  - 🎾 Fumble Recovery
- **Individuelle Kontrolle** - Videos können einzeln aktiviert/deaktiviert werden
- **Lautstärke-Regelung** - Einstellbarer Video-Sound (0-100%)
- **Sound-Effekte** - Separate Audio-Effekte für große Plays

### 🎨 Visuelle Features

#### Custom Title-Grafiken
Professionelle PNG-Grafiken für jeden Spieltyp:
- 🏆 **Super Bowl** mit goldenem Glow
- 🥈 **Conference Championship** mit silbernem Glow
- 🔵 **Divisional Round**
- 🃏 **Wild Card**
- 🏈 **Game Day** (Regular Season)

#### Dynamische Hintergründe
Unterschiedliche Gradient-Designs je nach Spieltyp:
- 🏆 **Super Bowl**: Gold/Champagner mit Konfetti-Animation
- 🥈 **Championship**: Silber/Platin mit Partikeln
- 🔴 **Live-Spiele**: Rote pulsierende Energie-Overlay
- 🔵 **Playoffs**: Blaue Gradienten mit Partikel-Effekten
- ⚫ **Final**: Gedämpfte dunkle Töne
- 📅 **Geplant**: Professionelles Blau

#### Team-Darstellung
- **Intelligente Glow-Effekte** - Automatische Erkennung dunkler Farben und Verwendung der Alternativ-Farbe
- **Team-Farb-Boxen** - Namen in Team-Farben mit Glow-Hintergrund
- **Gewinner-Hervorhebung** - Bei finalen Spielen wird das Gewinnerteam hervorgehoben
- **Transparenz-Effekte** - Verlierer-Team wird bei finalen Spielen gedimmt

### 🎯 Daten & Updates

- **Live-Aktualisierung** von ESPN API:
  - Live-Spiele: 10 Sekunden
  - Geplante Spiele: 1 Minute
  - Finale Spiele: 5 Minuten
- **Automatische Playoff-Erkennung** - Wild Card, Divisional, Championship & Super Bowl
- **Deutsche Lokalisierung** - Datum/Uhrzeit im Format DD.MM.YYYY und 24h
- **Intelligente Wochenauswahl** - Automatisches Durchsuchen mehrerer Wochen bei leeren Spieltagen
- **Server-Side Caching** - Reduziert API-Calls (15s TTL für Live-Daten, 5m für Spielpläne)

### ⚙️ Einstellungen & Anpassungen

#### Game Selection
- **Manuelle Spielauswahl** mit Vorschau-Karten
- **Filter nach Status** - Live, Upcoming, Final
- **2-Spalten-Layout** für bessere Übersicht
- **Status-Anzeige** mit Icons und Zeitangaben
- **Automatische Live-Erkennung** - Zeigt automatisch das erste Live-Spiel

#### Display Options
- **View Mode Toggle** - SingleView / MultiView
- **MultiView Filters** - Separate Filter für Live/Upcoming/Final Games
- **Celebration Videos** - Einzeln aktivierbar/deaktivierbar
- **Sound Control** - Sound-Effekte und Video-Lautstärke

#### Debug Mode
- **Score Manipulation** - Für Testzwecke
- **Status Changes** - Spielstatus ändern
- **Quick Testing** - Schnelles Testen von Celebrations und UI-Änderungen

### 📱 Navigation & Steuerung

- **Pfeiltasten-Navigation**:
  - ⬅️ Links: Vorheriges Spiel / Zurück zu Scoreboard
  - ➡️ Rechts: Nächstes Spiel / Zu Statistiken / Zu Settings
  - ESC: Zurück zu Scoreboard
- **Swipe-Gesten** für Touch-Geräte (iPad):
  - Swipe Links: Vorheriges Spiel
  - Swipe Rechts: Nächstes Spiel
- **Klick/Touch-Navigation**:
  - MultiView: Spiel-Karten anklicken
  - Settings: Spiel-Auswahl, Filter, Optionen

### 🖥 Optimiert für

- **iPad mini 6** im Landscape-Modus (1024x768)
- **Video Wall** - Hochwertige Grafiken für große Displays
- **Alle modernen Browser** - Chrome, Safari, Firefox, Edge
- **Touch-Optimiert** - Große Touch-Targets, Swipe-Gesten
- **Performance** - Optimierte Rendering-Performance, Browser-Cache

---

## 🎮 Bedienung

### Erste Schritte

1. **App öffnen** - Browser auf `http://<SERVER-IP>:3001` öffnen
2. **Automatische Anzeige** - App zeigt automatisch das erste Live-Spiel oder das nächste anstehende Spiel
3. **Navigation** - Verwende Pfeiltasten (Desktop) oder Swipe-Gesten (iPad) zum Wechseln zwischen Ansichten

### View Modes

#### SingleView (Standard)
- **Hauptansicht**: Zeigt ein einzelnes Spiel im Vollbild
- **Navigation**:
  - Rechts-Taste → Statistik-Panel
  - Rechts-Taste → Settings
  - Links-Taste → Zurück
- **Live-Updates**: Automatische Aktualisierung alle 10 Sekunden bei Live-Spielen

#### MultiView
- **Übersicht**: Alle Spiele auf einen Blick
- **Filter**: Live, Upcoming, Final Games über Settings steuerbar
- **Auswahl**: Klick auf Spiel-Karte wechselt zu SingleView
- **Score Changes**: Karten mit kürzlichen Score-Änderungen leuchten rot

### Settings-Menü

Zugriff über Pfeiltaste rechts (2x) oder Settings-Button:

#### View Mode
- **SingleView**: Zeigt ein einzelnes Spiel detailliert
- **MultiView**: Übersicht aller Spiele

#### MultiView Filters
Nur für MultiView-Modus:
- ✅ **Live**: Zeigt laufende Spiele und Halftime
- ✅ **Upcoming**: Zeigt geplante, zukünftige Spiele
- ✅ **Final**: Zeigt beendete Spiele

#### Select Game
- **Spiel-Auswahl**: Liste aller verfügbaren Spiele
- **2-Spalten-Layout**: Bessere Übersicht
- **Filter**: Respektiert MultiView Filter-Einstellungen
- **Status-Anzeige**: Live, Upcoming, Final mit Icons
- **Direkte Anzeige**: Ausgewähltes Spiel wird sofort angezeigt

#### Sound
- **Sound Effects**: Aktiviert/Deaktiviert Audio-Effekte für Touchdowns, Field Goals
- **Video Volume**: Lautstärke für Celebration-Videos (0-100%)

#### Celebration Videos
Individuelle Kontrolle für jedes Video:
- 🏈 **Touchdown**: 6, 7, 8 Punkte
- 🥅 **Field Goal**: 3 Punkte
- 🛡️ **Safety**: 2 Punkte
- 🏃 **Interception**: Interception Return TD
- 💥 **Sack**: Quarterback Sack
- 🎾 **Fumble**: Fumble Recovery

#### Debug Mode
Für Entwickler und Testing:
- **Score Manipulation**: +/- Punkte für Teams
- **Status Changes**: Spielstatus ändern (Pre, Live, Final)
- **Quick Testing**: Celebration-Videos und UI-Änderungen testen

### Keyboard Shortcuts

| Taste | Funktion |
|-------|----------|
| ⬅️ | Vorheriges Spiel / Zurück |
| ➡️ | Nächstes Spiel / Statistiken / Settings |
| ESC | Zurück zu Scoreboard |

### Touch Gesten (iPad)

| Geste | Funktion |
|-------|----------|
| Swipe Links | Vorheriges Spiel |
| Swipe Rechts | Nächstes Spiel |
| Tap Spiel-Karte | Spiel auswählen (MultiView) |

### Tipps & Tricks

1. **Cache leeren**: Bei Problemen Hard-Refresh (CMD+Shift+R) oder Cache leeren
2. **Automatische Live-Anzeige**: App wechselt automatisch zum ersten Live-Spiel
3. **Manuelle Auswahl**: Über Settings → Select Game ein bestimmtes Spiel fixieren
4. **MultiView für Übersicht**: Ideal um alle Spiele im Blick zu haben
5. **SingleView für Details**: Beste Ansicht für ein einzelnes Spiel mit allen Details
6. **Celebration Videos**: Bei Problemen einzelne Videos deaktivieren
7. **Filter nutzen**: In MultiView nur relevante Spiele anzeigen (z.B. nur Live)

---

## 🛠 Tech Stack

### Frontend
- **React 18.3.1** - UI Library
- **TypeScript** - Type Safety
- **Vite 6.0** - Build Tool & Dev Server
- **Tailwind CSS 3.4** - Utility-First CSS
- **Zustand 5.0** - State Management mit Persist Middleware

### Backend
- **Express 4.21** - Proxy Server
- **Node.js** - Runtime
- **TSX** - TypeScript Execution

### APIs & Services
- **ESPN API** - Live NFL Daten
  - `/scoreboard` - Aktuelle Spielstände
  - `/schedule` - Saisonplan & Playoff-Wochen
  - `/summary` - Detaillierte Spiel-Statistiken

### Tools & DevOps
- **ESLint** - Code Linting
- **PostCSS & Autoprefixer** - CSS Processing
- **Concurrently** - Parallele Skript-Ausführung
- **Git** - Version Control
- **PM2** - Process Manager für Production

---

## 📦 Installation

### Voraussetzungen
- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **Git**

### Schritt 1: Repository klonen
```bash
git clone https://github.com/GhostTalker/nfl-scoreboard.git
cd nfl-scoreboard
```

### Schritt 2: Dependencies installieren
```bash
npm install
```

---

## 🚀 Verwendung

### Development-Modus
Startet Vite Dev Server (Port 5173) + Express Proxy (Port 3001):

```bash
npm run start
```

Öffne Browser: `http://localhost:5173`

### Production Build
```bash
npm run build
```

Output: `dist/` Verzeichnis

### Production Server starten
```bash
NODE_ENV=production npm run start:prod
```

Server läuft auf: `http://localhost:3001`

---

## 🌐 Deployment

### Automatisches Deployment (Empfohlen)

Das Projekt enthält ein Deployment-Script für schnelle Updates:

```bash
# Auf dem Server
cd /srv/GhostGit/nfl-scoreboard
./deploy.sh
```

Das Script führt automatisch aus:
1. `git pull origin master` - Neueste Änderungen holen
2. `npm install` - Dependencies aktualisieren
3. `npm run build` - Production Build erstellen
4. `pm2 restart ecosystem.config.cjs` - Server neu starten

### Manuelles Deployment

#### Initial Setup
```bash
# SSH zum Server
ssh user@linux-server

# Projekt klonen
cd /srv/GhostGit
git clone https://github.com/GhostTalker/nfl-scoreboard.git
cd nfl-scoreboard

# Dependencies installieren
npm install

# Build erstellen
npm run build
```

#### Production starten
```bash
NODE_ENV=production npm run start:prod
```

#### Update-Prozess
```bash
cd /srv/GhostGit/nfl-scoreboard
git pull
npm install
npm run build
NODE_ENV=production npm run start:prod
```

#### Mit PM2 (Empfohlen)
```bash
# PM2 installieren
npm install -g pm2

# App starten
pm2 start npm --name "nfl-scoreboard" -- run start:prod

# Auto-Start bei Server-Neustart
pm2 startup
pm2 save

# Status prüfen
pm2 list
pm2 logs nfl-scoreboard
```

### Zugriff
- **Lokal**: `http://localhost:3001`
- **Netzwerk**: `http://<YOUR-SERVER-IP>:3001`
- **iPad**: Browser auf `http://<YOUR-SERVER-IP>:3001` öffnen

---

## 📁 Projektstruktur

```
nfl-scoreboard/
├── public/                  # Static Assets
│   ├── videos/              # Celebration Videos
│   │   ├── touchdown.mp4
│   │   ├── fieldgoal.mp4
│   │   ├── interception.mp4
│   │   ├── sack.mp4
│   │   ├── fumble.mp4
│   │   └── safety.mp4
│   ├── title/               # Title Graphics (PNG)
│   │   ├── superbowl.png
│   │   ├── conference.png
│   │   ├── divisional.png
│   │   ├── wildcard.png
│   │   └── gameday.png
│   ├── screenshots/         # App Screenshots
│   │   ├── singleview_upcomming.png
│   │   ├── singleview_final.png
│   │   └── multiview.png
│   └── favicon.svg
├── server/                  # Express Backend
│   ├── index.ts             # Main Server
│   ├── routes/
│   │   └── api.ts           # API Routes
│   └── services/
│       └── espnProxy.ts     # ESPN API Proxy mit Caching
├── src/                     # React Frontend
│   ├── components/
│   │   ├── scoreboard/      # Scoreboard Components
│   │   │   ├── MainScoreboard.tsx
│   │   │   ├── MultiGameView.tsx
│   │   │   ├── TeamDisplay.tsx
│   │   │   ├── GameSituation.tsx
│   │   │   └── VideoOverlay.tsx
│   │   ├── settings/        # Settings Panel
│   │   │   ├── SettingsPanel.tsx
│   │   │   ├── GameSelector.tsx
│   │   │   ├── CelebrationSettings.tsx
│   │   │   └── DebugControls.tsx
│   │   └── stats/           # Statistics
│   │       └── StatsPanel.tsx
│   ├── hooks/               # Custom React Hooks
│   │   ├── useGameData.ts
│   │   ├── useSwipe.ts
│   │   ├── useKeyboardNavigation.ts
│   │   └── useScoreChange.ts
│   ├── stores/              # Zustand State Management
│   │   ├── gameStore.ts     # Game Data & Selection
│   │   ├── settingsStore.ts # User Settings & Preferences
│   │   └── uiStore.ts       # UI State & View Mode
│   ├── services/            # API Services
│   │   └── espnApi.ts       # ESPN API Integration
│   ├── types/               # TypeScript Types
│   │   ├── game.ts
│   │   ├── stats.ts
│   │   └── settings.ts
│   ├── constants/           # Constants
│   │   ├── teams.ts
│   │   ├── videos.ts
│   │   ├── titleGraphics.ts
│   │   └── api.ts
│   ├── utils/               # Utility Functions
│   ├── App.tsx              # Main App Component
│   ├── main.tsx             # Entry Point
│   └── index.css            # Global Styles
├── dist/                    # Build Output (gitignored)
├── node_modules/            # Dependencies (gitignored)
├── deploy.sh                # Deployment Script
├── ecosystem.config.cjs     # PM2 Configuration
├── package.json             # NPM Config
├── tsconfig.json            # TypeScript Config
├── vite.config.ts           # Vite Config
├── tailwind.config.js       # Tailwind Config
├── eslint.config.js         # ESLint Config
└── README.md                # This file
```

---

## ⚙️ Konfiguration

### Environment Variables
Keine Environment-Variablen erforderlich. Alle Konfigurationen sind in Code-Dateien.

### API Endpoints (server/routes/api.ts)
```typescript
GET /api/scoreboard                    // Aktuelle Woche
GET /api/scoreboard?week=X             // Spezifische Woche
GET /api/schedule?year=Y&week=X        // Spielplan
GET /api/game/:id                      // Game Details
GET /api/health                        // Health Check + Cache Stats
```

### Default Settings (src/types/settings.ts)
```typescript
primaryTeamId: '17'               // New England Patriots
soundEffectsEnabled: true         // Sound-Effekte aktiviert
videoVolume: 0.8                  // 80% Lautstärke
viewMode: 'single'                // SingleView als Standard
multiViewFilters: {
  showLive: true,                 // Live-Spiele anzeigen
  showUpcoming: true,             // Geplante Spiele anzeigen
  showFinal: true                 // Finale Spiele anzeigen
}
celebrationVideos: {
  touchdown: true,
  fieldgoal: true,
  interception: true,
  sack: true,
  fumble: true,
  safety: true
}
```

### Cache Configuration (server/services/espnProxy.ts)
```typescript
Live Data TTL: 15 Sekunden
Schedule Data TTL: 5 Minuten
```

### Polling Intervals (src/hooks/useGameData.ts)
```typescript
Live Games: 10 Sekunden
Scheduled Games: 1 Minute
Final Games: 5 Minuten
```

---

## 💻 Development

### Dev Server starten
```bash
npm run dev
# oder
npm run start  # Startet auch Express Proxy
```

### Linting
```bash
npm run lint
```

### Build
```bash
npm run build
```

### TypeScript Check
```bash
npx tsc --noEmit
```

### Code Style Guidelines
- **Imports**: Standard Library → Third-Party → Local
- **Naming**: camelCase für Variablen/Funktionen, PascalCase für Components
- **TypeScript**: Explizite Types, kein `any`
- **Components**: Functional Components mit Hooks
- **State**: Zustand für globalen State, useState für lokalen State
- **Tailwind**: Utility-First, keine custom CSS außer absolut notwendig

---

## 🔌 API

### ESPN API Integration

Die App nutzt die ESPN API für Live-Daten. Der Express-Server fungiert als Proxy mit Server-Side Caching.

#### Scoreboard Endpoint
```typescript
GET /api/scoreboard?week=1

Response:
{
  "events": [{
    "id": "401671723",
    "name": "Team A at Team B",
    "date": "2024-09-09T01:20Z",
    "seasonName": "WILD CARD",
    "competitions": [{
      "competitors": [{
        "team": { "id": "17", "abbreviation": "NE", ... },
        "score": "14"
      }],
      "status": {
        "type": { "state": "in", "completed": false },
        "period": 3,
        "displayClock": "12:34"
      }
    }]
  }]
}
```

#### Game Details Endpoint
```typescript
GET /api/game/401671723

Response:
{
  "boxscore": {
    "teams": [{
      "team": { "id": "17", ... },
      "statistics": [
        { "name": "totalYards", "displayValue": "342" },
        { "name": "passingYards", "displayValue": "245" }
      ]
    }]
  },
  "drives": { ... }
}
```

---

## 🐛 Bekannte Issues & Lösungen

### Browser Cache auf iPad
- **Problem**: iPad cached manchmal alte Versionen aggressiv
- **Lösung**:
  1. Hard Refresh: Safari-Einstellungen → Verlauf löschen
  2. Privater Modus nutzen
  3. "Ohne Inhaltsblocker" beim Reload-Button (gedrückt halten)

### Live-Updates verzögert
- **Hinweis**: API aktualisiert sich basierend auf Spielstatus
- **Normal**: 10 Sekunden für Live, 1 Minute für Scheduled
- **Anpassung**: In `src/hooks/useGameData.ts` Intervall ändern

### Celebration-Videos spielen nicht
- **Mögliche Ursachen**:
  1. Browser-Autoplay-Policy
  2. Videos nicht im `public/videos/` Ordner
  3. Video-Format nicht unterstützt
- **Lösung**:
  1. User-Interaktion erforderlich (erste Aktion)
  2. Videos im richtigen Ordner ablegen
  3. MP4-Format verwenden (H.264 Codec)

---

## 🤝 Contributing

Contributions sind willkommen! Bitte:

1. Fork das Repository
2. Erstelle einen Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit deine Changes (`git commit -m 'Add: AmazingFeature'`)
4. Push zum Branch (`git push origin feature/AmazingFeature`)
5. Öffne einen Pull Request

### Commit Message Format
```
feat(scope): add new feature
fix(scope): fix bug
docs: update README
style: format code
refactor: restructure code
test: add tests
chore: update dependencies
```

---

## 📄 Lizenz

Dieses Projekt ist unter der **MIT License** lizenziert.

---

## 👤 Autor

**GhostTalker**

- GitHub: [@GhostTalker](https://github.com/GhostTalker)
- Repository: [nfl-scoreboard](https://github.com/GhostTalker/nfl-scoreboard)

---

## 🙏 Danksagungen

- **ESPN API** für die Live-Daten
- **React Team** für das großartige Framework
- **Tailwind CSS** für das Utility-First CSS Framework
- **Vite** für den blitzschnellen Build-Prozess
- **Zustand** für einfaches State Management

---

## 📝 Changelog

### v1.2.9 (2025-01-12)
- 🎯 **MultiView Enhancements**
  - ✅ Perfekte vertikale und horizontale Zentrierung auf allen Geräten (inkl. iPad)
  - ✅ Filter immer sichtbar im Settings-Menü
  - ✅ Größeres Title Graphic (h-48) für bessere Sichtbarkeit
- 🔧 **Bug Fixes**
  - ✅ Zentrierung auf iPad korrigiert
  - ✅ MultiView-Filter jetzt immer sichtbar, nicht nur im Multi-Modus

### v1.2.8 (2025-01-12)
- 🎯 **Layout Improvements**
  - ✅ Vertikale Zentrierung in MultiView Game Cards
  - ✅ Horizontale Skalierung beim Hover (scale-x)
  - ✅ Optimierte Ausrichtung für iPad

### v1.2.7 (2025-01-12)
- 🎨 **Visual Updates**
  - ✅ Größeres Title Graphic in MultiView (h-40)

### v1.2.6 (2025-01-12)
- 🔧 **Game Selector Fixes**
  - ✅ Einheitliche Boxgrößen für alle Spiele
  - ✅ Horizontaler Scrollbalken verhindert

### v1.2.5 (2025-01-12)
- 🎨 **Game Selector Improvements**
  - ✅ Größere Logos (10x10) statt Abkürzungen
  - ✅ Ausgeschriebene Team-Namen (shortDisplayName)
  - ✅ Bessere Lesbarkeit durch mehr Padding

### v1.2.4 (2025-01-12)
- 🎯 **Filter & Layout**
  - ✅ MultiView-Filter auf Game Selector angewendet
  - ✅ "Single Game" zu "SingleView" umbenannt
  - ✅ Kompakte 2-Spalten-Ansicht in Game Selector

### v1.2.3 (2025-01-12)
- 🎨 **Naming & UX**
  - ✅ "All Games" zu "MultiView" umbenannt
  - ✅ Filter horizontal unter MultiView-Button angeordnet

### v1.2.2 (2025-01-12)
- 🎯 **MultiView Features**
  - ✅ Filter in Settings verschoben (Live, Upcoming, Final)
  - ✅ Dynamische Box-Größen basierend auf Spielanzahl
  - ✅ Persistente Filter-Einstellungen

### v1.2.1 (2025-01-12)
- 🎮 **MultiView Mode**
  - ✅ Alle Spiele auf einen Blick
  - ✅ 2-Spalten-Grid-Layout
  - ✅ Kompaktes Design für bis zu 14 Spiele
  - ✅ Score-Change-Erkennung mit roter Highlight
  - ✅ Auto-Close Settings beim View-Mode-Wechsel

### v1.0.1 (2025-01-07)
- ✨ **Custom Title-Grafiken** - PNG-Grafiken ersetzen Text-Titel
  - 🏆 Super Bowl mit goldenem Glow-Effekt
  - 🥈 Conference Championship mit silbernem Glow
  - 🔵 Divisional Round Grafik
  - 🃏 Wild Card Grafik
  - 🏈 Game Day Grafik für Regular Season
- ✅ Fallback zu Text wenn Grafik nicht lädt
- ✅ Automatische Grafik-Auswahl basierend auf Spieltyp

### v1.0.0 (2025-01-07)
- ✨ Initial Release
- ✅ Live NFL Scoreboard mit ESPN API
- ✅ Deutsche Lokalisierung (DD.MM.YYYY, 24h)
- ✅ Playoff-Erkennung & automatische Wochenauswahl
- ✅ Dynamische Hintergründe je nach Spieltyp
- ✅ CSS Grid für perfekte Zentrierung
- ✅ Vergrößerte Logos & Namen
- ✅ Game Selector mit Swipe-Gesten
- ✅ Statistik-Panel
- ✅ Settings-Panel
- ✅ Responsive Design für iPad mini 6
- ✅ Production-optimierter Build

---

## 🔮 Roadmap

### Implementiert ✅
- [x] ~~Custom PNG Title Graphics~~ (v1.0.1)
- [x] ~~Celebration Videos~~ (v1.1.0)
- [x] ~~Sound-Effekte~~ (v1.1.0)
- [x] ~~Multi-Game-View~~ (v1.2.1)
- [x] ~~Individual Celebration Control~~ (v1.2.0)
- [x] ~~Game Filters~~ (v1.2.2)

### Geplante Features 🚧
- [ ] Bessere Hintergrund-Grafiken für Video Wall
- [ ] Enhanced Stats Visualisierung
- [ ] Drive Charts
- [ ] Play-by-Play Anzeige mit Timeline
- [ ] Theme-Customization
- [ ] Push-Benachrichtigungen bei Score-Changes
- [ ] Favoriten-Team Highlighting
- [ ] Game Replay / Highlight Clips
- [ ] Social Media Integration

---

**Made with ❤️ for NFL Fans**
