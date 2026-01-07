# Title Graphics

This directory contains the title graphics used for different game types in the NFL Scoreboard.

## Files

| Filename | Used For | Dimensions |
|----------|----------|------------|
| `superbowl.png` | Super Bowl | Recommended: 800x200px |
| `conference.png` | Conference Championship | Recommended: 800x200px |
| `divisional.png` | Divisional Round | Recommended: 800x200px |
| `wildcard.png` | Wild Card Round | Recommended: 800x200px |
| `gameday.png` | Regular Season / Default | Recommended: 800x200px |

## Mapping

The graphics are automatically selected based on the `seasonName` value from ESPN API:

- **SUPER BOWL** → `superbowl.png`
- **CONFERENCE CHAMPIONSHIP** → `conference.png`
- **DIVISIONAL ROUND** → `divisional.png`
- **WILD CARD** → `wildcard.png`
- **GAME DAY** / **PRESEASON** / Default → `gameday.png`

## Implementation

See `src/constants/titleGraphics.ts` for the mapping logic.

The graphics are displayed in `src/components/scoreboard/MainScoreboard.tsx` with:
- Dynamic glow effects based on game importance
- Drop shadows for depth
- Fallback to text if image fails to load
- Automatic height scaling (h-32, ~128px height)

## Adding New Graphics

1. Add your PNG file to this directory
2. Update `src/constants/titleGraphics.ts` with the mapping
3. Run `npm run build` to copy the file to `dist/title/`

## Notes

- Graphics are automatically copied from `public/title/` to `dist/title/` during build
- PNG format recommended for transparency support
- Keep file sizes reasonable for web delivery (< 3MB recommended)
- Use transparent backgrounds for best visual effect
