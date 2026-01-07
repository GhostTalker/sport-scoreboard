# 🏈 NFL Scoreboard

**Live NFL Scoreboard für iPad mini 6 und Video Wall Display**

Eine moderne, responsive Web-Anwendung für die Anzeige von Live-NFL-Spielen mit dynamischen Hintergründen, Team-Logos, Statistiken und deutscher Lokalisierung.

![Status](https://img.shields.io/badge/Status-Production-green)
![Version](https://img.shields.io/badge/Version-1.0.0-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## 📋 Inhaltsverzeichnis

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Screenshots](#-screenshots)
- [Installation](#-installation)
- [Verwendung](#-verwendung)
- [Deployment](#-deployment)
- [Projektstruktur](#-projektstruktur)
- [Konfiguration](#-konfiguration)
- [Development](#-development)
- [API](#-api)
- [Lizenz](#-lizenz)

---

## ✨ Features

### Kernfunktionen
- **Live-Spielstände** von ESPN API mit automatischer Aktualisierung
- **Deutsche Lokalisierung** - Datum/Uhrzeit im Format DD.MM.YYYY und 24h
- **Playoff-Erkennung** - Automatische Erkennung von Wild Card, Divisional, Championship & Super Bowl
- **Dynamische Hintergründe** - Unterschiedliche Gradient-Designs je nach Spieltyp:
  - 🏆 Super Bowl: Gold/Champagner mit Konfetti
  - 🥈 Championship: Silber/Platin mit Partikeln
  - 🔴 Live-Spiele: Rote pulsierende Energie
  - 🔵 Playoffs: Blaue Gradienten mit Partikeln
  - ⚫ Final: Gedämpfte dunkle Töne
  - 📅 Geplant: Professionelles Blau

### Display-Features
- **Custom Title-Grafiken** - Professionelle PNG-Grafiken für jeden Spieltyp:
  - 🏆 Super Bowl mit goldenem Glow
  - 🥈 Conference Championship mit silbernem Glow
  - 🔵 Divisional Round
  - 🃏 Wild Card
  - 🏈 Game Day (Regular Season)
- **Perfekte Zentrierung** - CSS Grid Layout für exakte Ausrichtung
- **Team-Logos** in 52x52px mit intelligenten Glow-Effekten
- **Team-Namen** in extra großer Schrift (text-3xl)
- **Spieluhr & Quarter** mit Live-Indikator (roter pulsierender Punkt)
- **Spielsituation** - Down, Distance, Ballbesitz
- **Statistiken** - Vollständige Team- und Spielerstatistiken

### Navigation & Steuerung
- **Pfeiltasten-Navigation** - Links/Rechts zum Wechseln zwischen Spielen
- **Swipe-Gesten** für Touch-Geräte (iPad)
- **Game-Selector** mit Spielübersicht und Zeitanzeige
- **Settings-Panel** für Favoriten-Team und weitere Optionen

### Optimiert für
- **iPad mini 6** im Landscape-Modus (Kiosk-Anzeige)
- **Video Wall** - Hochwertige Grafiken für große Displays
- **Browser-Cache** - Optimierte Performance

---

## 🛠 Tech Stack

### Frontend
- **React 18.3.1** - UI Library
- **TypeScript** - Type Safety
- **Vite 6.0** - Build Tool & Dev Server
- **Tailwind CSS 3.4** - Utility-First CSS
- **Zustand 5.0** - State Management

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

---

## 🖼 Screenshots

### Live-Spiel
Roter pulsierender Hintergrund mit Live-Indikator

### Playoff-Spiel
Blaue Energie-Partikel mit Playoff-Badge

### Super Bowl
Gold-Konfetti mit stilvollem Championship-Design

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

### Linux Server (z.B. 10.1.0.51)

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
```

### Zugriff
- **Lokal**: `http://localhost:3001`
- **Netzwerk**: `http://10.1.0.51:3001`
- **iPad**: Browser auf `http://10.1.0.51:3001` öffnen

---

## 📁 Projektstruktur

```
nfl-scoreboard/
├── public/                  # Static Assets
│   ├── videos/              # Celebration Videos
│   ├── title/               # Title Graphics (PNG)
│   │   ├── superbowl.png
│   │   ├── conference.png
│   │   ├── divisional.png
│   │   ├── wildcard.png
│   │   └── gameday.png
│   └── favicon.svg
├── server/                  # Express Backend
│   ├── index.ts             # Main Server
│   ├── routes/
│   │   └── api.ts           # API Routes
│   └── services/
│       └── espnProxy.ts     # ESPN API Proxy
├── src/                     # React Frontend
│   ├── components/
│   │   ├── scoreboard/      # Scoreboard Components
│   │   │   ├── MainScoreboard.tsx
│   │   │   ├── TeamDisplay.tsx
│   │   │   ├── GameSituation.tsx
│   │   │   └── ...
│   │   ├── settings/        # Settings Panel
│   │   │   ├── SettingsPanel.tsx
│   │   │   └── GameSelector.tsx
│   │   └── stats/           # Statistics
│   │       └── StatsPanel.tsx
│   ├── hooks/               # Custom React Hooks
│   │   ├── useGameData.ts
│   │   ├── useSwipe.ts
│   │   ├── useKeyboardNavigation.ts
│   │   └── useScoreChange.ts
│   ├── stores/              # Zustand State Management
│   │   ├── gameStore.ts
│   │   ├── settingsStore.ts
│   │   └── uiStore.ts
│   ├── services/            # API Services
│   │   └── espnApi.ts
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
/api/scoreboard?week=X     // Spielstände für Woche X
/api/schedule?week=X       // Spielplan für Woche X
/api/game/:id/summary      // Detaillierte Spiel-Infos
```

### Default Settings (src/stores/settingsStore.ts)
```typescript
favoriteTeam: 17           // New England Patriots
autoRefresh: true          // Automatische Aktualisierung
refreshInterval: 30000     // 30 Sekunden
```

### Teams (src/constants/teams.ts)
Vollständige NFL-Team-Definitionen mit:
- Team-ID
- Name, Abkürzung, Stadt
- Farben (Primary, Secondary, Alternate)
- Logo-URLs

### Title Graphics (public/title/)
Custom PNG-Grafiken für verschiedene Spieltypen:
```typescript
SUPER BOWL           → superbowl.png
CONFERENCE           → conference.png
DIVISIONAL ROUND     → divisional.png
WILD CARD            → wildcard.png
GAME DAY / Default   → gameday.png
```

**Anpassung:**
1. PNG-Datei in `public/title/` ablegen
2. `src/constants/titleGraphics.ts` aktualisieren
3. Build erstellen: `npm run build`

Siehe `public/title/README.md` für Details.

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

---

## 🔌 API

### ESPN API Integration

#### Scoreboard Endpoint
```typescript
GET /api/scoreboard?week=1

Response:
{
  "events": [{
    "id": "401671723",
    "name": "Team A at Team B",
    "date": "2024-09-09T01:20Z",
    "competitions": [{
      "competitors": [{
        "team": { "id": "17", "abbreviation": "NE", ... },
        "score": "14"
      }],
      "status": { "type": { "state": "in" } }
    }]
  }]
}
```

#### Schedule Endpoint
```typescript
GET /api/schedule?week=1

Response:
{
  "seasonName": "WILD CARD",
  "week": 19,
  "events": [...]
}
```

#### Game Summary Endpoint
```typescript
GET /api/game/401671723/summary

Response:
{
  "boxscore": {
    "teams": [{
      "statistics": [
        { "name": "totalYards", "displayValue": "342" }
      ]
    }]
  }
}
```

---

## 🐛 Bekannte Issues

### Browser Cache
- **Problem**: iPad cached manchmal alte Versionen
- **Lösung**: Hard Refresh (CMD+Shift+R) oder Cache leeren

### Live-Updates
- **Hinweis**: API aktualisiert sich alle 30 Sekunden
- **Anpassung**: In `src/hooks/useGameData.ts` Intervall ändern

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

---

## 📝 Changelog

### v1.0.1 (2025-01-07)
- ✨ **Custom Title-Grafiken** - PNG-Grafiken ersetzen Text-Titel
  - 🏆 Super Bowl mit goldenem Glow-Effekt
  - 🥈 Conference Championship mit silbernem Glow
  - 🔵 Divisional Round Grafik
  - 🃏 Wild Card Grafik
  - 🏈 Game Day Grafik für Regular Season
- ✅ Fallback zu Text wenn Grafik nicht lädt
- ✅ Automatische Grafik-Auswahl basierend auf Spieltyp
- 📚 Dokumentation für Title-Grafiken (`public/title/README.md`)

### v1.0.0 (2025-01-07)
- ✨ Initial Release
- ✅ Live NFL Scoreboard mit ESPN API
- ✅ Deutsche Lokalisierung (DD.MM.YYYY, 24h)
- ✅ Playoff-Erkennung & automatische Wochenauswahl
- ✅ Dynamische Hintergründe je nach Spieltyp
- ✅ CSS Grid für perfekte Zentrierung
- ✅ Vergrößerte Logos (52x52) & Namen (text-3xl)
- ✅ Game Selector mit Swipe-Gesten
- ✅ Statistik-Panel
- ✅ Settings-Panel
- ✅ Responsive Design für iPad mini 6
- ✅ Production-optimierter Build

---

## 🔮 Roadmap

### Geplante Features
- [x] ~~Bessere Titel-Grafiken~~ (✅ v1.0.1 - Custom PNG Graphics)
- [ ] Bessere Hintergrund-Grafiken für Video Wall
- [ ] Touchdown-Celebration-Videos
- [ ] Sound-Effekte
- [ ] Multi-Game-View (Picture-in-Picture)
- [ ] Enhanced Stats Visualisierung
- [ ] Drive Charts
- [ ] Play-by-Play Anzeige
- [ ] Theme-Customization
- [ ] Push-Benachrichtigungen

---

**Made with ❤️ for NFL Fans**
