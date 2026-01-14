# Changelog

All notable changes to the Sport-Scoreboard project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.1.1] - 2026-01-14

### Changed
- Updated plugin logos in settings menu (Logo_NFL.png, Logo_Bundesliga.png)
- Updated favicon to professional scoreboard icon
- Sport selection logos updated (nfl-logo.png, bundesliga-logo.png)

### Removed
- Duplicate adapter files (nflAdapter.ts, bundesligaAdapter.ts, index.ts)
- Unused SettingsSidebar component
- 530 lines of redundant code

### Technical
- Fixed all 'any' type usage with proper TypeScript interfaces
- Added comprehensive OpenLigaDB API type definitions
- Improved type safety in settings migration handler
- Added deprecation comment to scoreDetector.ts
- Code review and cleanup completed

## [3.1.0] - 2026-01-14

### Added
- Horizontal tab menu for settings (Plugins, Videos, Sound, Language, Debug)
- Sound settings overlay with volume control
- Generic sport favicon (replaced NFL-specific icon)
- Version numbering in package.json

### Changed
- Settings UI redesign: moved sidebar buttons to horizontal tab menu above content
- All special settings now accessible via overlay pattern
- Sound button opens overlay instead of inline toggle
- Improved visual consistency across all settings overlays

### Fixed
- Sidebar positioning improved (closer to main content)

## [3.0.0] - 2026-01-13

### Added
- Complete plugin system architecture
- Plugin registry with lazy loading
- Dynamic plugin management (enable/disable plugins)
- Dual language support (German/English)
- i18n translation system
- Language selector in settings
- Browser language auto-detection
- Plugin management overlay
- Celebration videos overlay
- Debug controls overlay
- Sport tabs showing only enabled plugins

### Changed
- Refactored settings panel with tab-based navigation
- Competition selector color changed from green to blue
- Logo files consolidated to `/logos` folder
- Plugin manifests updated with correct logo paths (Logo_NFL.png, Logo_Bundesliga.png)

### Technical
- Upgraded to plugin-based architecture
- Settings store version 13 (with language support)
- Celebration settings for NFL and Bundesliga plugins
- Type-safe plugin system with TypeScript

## [2.0.x] - Previous Versions

### Features
- NFL and Bundesliga support
- Real-time score updates
- Celebration videos for game events
- Multi-view and single-view modes
- Game selector
- Settings panel with debug controls
- iPad-optimized display

---

## Version History Summary

- **v3.1.1** - Code cleanup, logo updates, type safety improvements (-530 lines)
- **v3.1.0** - UI redesign with horizontal tab menu, sound overlay, generic favicon
- **v3.0.0** - Plugin system, internationalization, settings redesign
- **v2.0.x** - Dual-sport support (NFL + Bundesliga), celebration videos
- **v1.0.0** - Initial NFL scoreboard implementation
