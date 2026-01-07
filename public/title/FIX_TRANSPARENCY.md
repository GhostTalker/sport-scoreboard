# ⚠️ Transparenz-Problem bei Wild Card & Super Bowl

## Problem

Die Grafiken `wildcard.png` und `superbowl.png` zeigen immer noch ein **graues Schachbrett-Muster** im Hintergrund.

## Ursache

Das Schachbrett-Muster ist **in die Grafik eingebrannt** (als Teil der Pixel-Daten), nicht als separate transparente Schicht. Dies passiert, wenn:

1. Screenshot von einem Grafikprogramm gemacht wurde (das Schachbrett zeigt Transparenz an)
2. Oder Export mit "Hintergrund einbeziehen" erfolgte
3. Oder Grafik wurde über Schachbrett-Hintergrund gerendert

## Lösung

Die Grafiken müssen aus der **Original-Quelle neu exportiert** werden:

### Schritt 1: Original öffnen
- Öffne die Original-Datei in Photoshop/GIMP/Illustrator/Figma
- Stelle sicher, dass es die ORIGINALE Vektorgrafik ist (nicht PNG)

### Schritt 2: Hintergrund entfernen
- Lösche alle Hintergrund-Layer komplett
- Oder stelle Hintergrund-Layer auf unsichtbar
- Nur die Titel-Grafik selbst sollte sichtbar sein

### Schritt 3: Korrekt exportieren

#### In Photoshop:
```
File → Export → Export As...
Format: PNG
✓ Transparency (aktiviert!)
Background: None
Save
```

#### In GIMP:
```
File → Export As...
Format: PNG
✓ Save background color (DEAKTIVIERT!)
Export
```

#### In Illustrator:
```
File → Export → Export As...
Format: PNG
Background: Transparent (nicht White!)
Resolution: 300 PPI
Export
```

#### In Figma:
```
Select Layer → Export
Format: PNG
✓ Preview zeigt Schachbrett = GUT!
(Aber exportiere, nicht Screenshot!)
Export
```

### Schritt 4: Überprüfen
- Öffne die exportierte PNG in einem Viewer
- Hintergrund sollte transparent sein (kein Schachbrett!)
- Wenn du Schachbrett siehst = FALSCH exportiert

### Schritt 5: Ersetzen
```bash
# Kopiere neue PNGs nach:
public/title/wildcard.png
public/title/superbowl.png

# Build neu erstellen:
npm run build
```

---

## Alternative: Grafik-Dateien bereitstellen

Wenn du die Original-Quelldateien hast (AI, PSD, FIG, SVG), kann ich sie für dich korrekt exportieren:

**Datei-Formate:**
- `.ai` (Adobe Illustrator)
- `.psd` (Photoshop)
- `.fig` (Figma)
- `.svg` (Vektor)
- `.pdf` (Vektor)

**Lege sie ab in:**
```
public/title/sources/wildcard.ai
public/title/sources/superbowl.psd
```

---

## Warum Python-Script nicht funktioniert

Das Python-Script kann nur **echte graue Pixel** entfernen. Wenn das Schachbrett eingebrannt ist als:
- Textur
- Gemixte Pixel
- Anti-Aliasing-Artefakte

...dann kann es nicht automatisch entfernt werden, ohne die Grafik selbst zu beschädigen.

---

## Schnelltest

**Ist es eingebrannt?**

1. Öffne `wildcard.png` oder `superbowl.png` in einem Bild-Viewer
2. Wenn du das Schachbrett **im Viewer** siehst = EINGEBRANNT ❌
3. Wenn der Hintergrund transparent ist = GUT ✅

In Windows:
- Rechtsklick → Öffnen mit → Paint 3D
- Paint 3D zeigt Schachbrett bei Transparenz

In Mac:
- Öffne in Preview
- Transparent = grau/weiß kariert

---

## Status

**Verarbeitungs-Versuche:**

| Grafik | Durchgang 1 | Durchgang 2 | Durchgang 3 |
|--------|-------------|-------------|-------------|
| wildcard.png | 20,564 Pixel (1.3%) | 64,948 Pixel (4.1%) | 36,240 Pixel (2.3%) |
| superbowl.png | 41,953 Pixel (2.7%) | 71,447 Pixel (4.5%) | 55,061 Pixel (3.5%) |

**Maximale Entfernung erreicht!** Weitere Verarbeitung würde die Grafik beschädigen.

---

## Kontakt

Falls du Hilfe beim Export brauchst oder die Original-Dateien nicht findest, lass es mich wissen!
