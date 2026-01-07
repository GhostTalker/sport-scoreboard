# 🐛 Debug-Modus Anleitung

## Aktivierung

### Methode 1: Tastatur
Drücke die **`D`**-Taste um den Debug-Modus zu aktivieren/deaktivieren.

### Methode 2: Click
Klicke auf den **"🐛 Debug"** Button unten rechts.

---

## Features

### 1. Title Graphics Testen
Wechsle zwischen verschiedenen Titel-Grafiken ohne ein echtes Spiel zu haben:

- **GAME DAY** - Regular Season Grafik
- **PRESEASON** - Preseason Grafik (nutzt auch gameday.png)
- **WILD CARD** - Wildcard Round Grafik
- **DIVISIONAL ROUND** - Divisional Round Grafik
- **CONFERENCE CHAMPIONSHIP** - Conference Championship Grafik
- **SUPER BOWL** - Super Bowl Grafik

**Verwendung:**
1. Öffne Debug-Panel (Taste `D`)
2. Klicke auf eine der Optionen unter "Title Graphic"
3. Die Grafik ändert sich sofort

---

### 2. Background Styles Testen
Teste verschiedene Hintergrund-Stile unabhängig vom Spieltyp:

- **Default** - Normaler blauer Hintergrund
- **Super Bowl** - Gold-Gradient mit Konfetti-Partikeln
- **Conference** - Silber-Gradient mit Partikeln
- **Playoffs** - Blauer Playoff-Gradient
- **Live** - Roter pulsierender Live-Hintergrund
- **Final** - Dunkler gedämpfter Final-Hintergrund

**Verwendung:**
1. Öffne Debug-Panel (Taste `D`)
2. Klicke auf eine der Optionen unter "Background Style"
3. Der Hintergrund ändert sich sofort

---

## Kombinationen

Du kannst Title Graphics und Backgrounds **unabhängig** kombinieren:

### Beispiele:
```
Title: SUPER BOWL + Background: Default
→ Zeigt Super Bowl Grafik auf normalem Hintergrund

Title: GAME DAY + Background: Super Bowl
→ Zeigt Game Day Grafik auf Super Bowl Hintergrund

Title: WILD CARD + Background: Live
→ Zeigt Wild Card Grafik auf Live-Hintergrund
```

---

## Deaktivierung

### Methode 1: Tastatur
Drücke erneut **`D`** zum Schließen.

### Methode 2: Click
Klicke auf das **✕** oben rechts im Debug-Panel.

---

## Position

Das Debug-Panel erscheint:
- **Position:** Unten rechts
- **Z-Index:** 50 (über allem)
- **Größe:** 320px breit

---

## Hinweise

### Production-Modus:
Der Debug-Modus ist auch in Production verfügbar (nützlich für Live-Tests).

### Tastenkombination:
Die `D`-Taste funktioniert global - du musst nicht im Input-Feld sein.

### Persistence:
Debug-Einstellungen bleiben aktiv bis:
- Du sie änderst
- Du die Seite neu lädst
- Du den Debug-Modus schließt

---

## Verwendungszwecke

### 1. Grafik-Design
Teste wie verschiedene Title-Grafiken aussehen ohne auf echte Spiele zu warten.

### 2. Background-Design
Prüfe ob Hintergründe gut mit verschiedenen Grafiken harmonieren.

### 3. Video Wall Testing
Teste verschiedene Kombinationen für optimale Video Wall Darstellung.

### 4. Screenshots
Erstelle Screenshots von allen Varianten für Dokumentation.

---

## Tastenkürzel

| Taste | Aktion |
|-------|--------|
| `D` | Debug-Modus toggle |
| `←` | Vorheriges Spiel |
| `→` | Nächstes Spiel |

---

## Beispiel-Workflow

```
1. Drücke D → Debug-Panel öffnet sich
2. Klicke "SUPER BOWL" → Grafik ändert sich
3. Klicke "Super Bowl" (Background) → Hintergrund ändert sich
4. Prüfe wie es aussieht
5. Klicke "WILD CARD" → Teste andere Grafik
6. Klicke "Live" → Teste anderen Hintergrund
7. Drücke D → Debug-Panel schließen
```

---

## Troubleshooting

### Debug-Panel öffnet nicht:
- Prüfe ob du wirklich `D` (nicht Shift+D) drückst
- Prüfe Browser-Konsole auf Fehler

### Grafik ändert sich nicht:
- Stelle sicher, dass die PNG-Datei existiert in `public/title/`
- Prüfe Browser-Netzwerk-Tab ob Grafik geladen wird

### Hintergrund ändert sich nicht:
- Manche Hintergründe sind subtil - prüfe genau
- Lade Seite neu falls nötig

---

**Viel Spaß beim Testen! 🎨**
