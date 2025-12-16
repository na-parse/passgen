# Changelog

All notable changes to this project will be documented in this file.

## [0.2.0] - 2025-12-16

### Added
- User-configurable password generation settings (length, character requirements, symbol charset)
- Settings persistence using localStorage
- Pull-out left-side drawer for configuration interface
- Horizontal range slider for password length selection (1-64 character limit)
- Real-time validation of configuration parameters
- Reset button to restore default settings
- Settings gear icon in the "Current Ruleset" display box for improved UX
- ESC key and outside-click to close configuration drawer

### Changed
- Replaced inline configuration display with compact "Current Ruleset" summary
- Moved all configuration controls into dedicated drawer panel
- Enhanced visual feedback with hover states on settings box

### Improved
- Reduced page clutter by moving configuration options into drawer
- Better first-time user experience with visual affordances (gear icon)
- Smoother animations for drawer interactions (300ms transitions)

## [0.1.0] - 2025-12-14

### Added
- Initial project setup with Next.js 15 and React 19
- Basic password generation with configurable rules
- Display of generated passwords with click-to-copy functionality
- Dark theme with orange/yellow gradient accent colors
- Hardcoded password generation settings
- GitHub links in footer
