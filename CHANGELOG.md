# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0] - 2025-01-04

### Added

- **Team Mode** - Multi-agent collaboration with shared task management
  - `--enable-team-mode` flag for create and update commands
  - Toggle team mode on/off in TUI variant management screen
  - Patches Claude Code CLI to enable `TaskCreate`, `TaskGet`, `TaskUpdate`, `TaskList` tools
  - Automatic backup of CLI before patching (`cli.js.backup`)

- **Mirror Claude Provider** - Pure Claude Code variant with enhanced features
  - No proxy - connects directly to Anthropic's API
  - Team mode enabled by default
  - Silver/chrome theme with electric blue accents
  - OAuth or API key authentication (standard Claude Code auth flow)

- **Multi-Agent Orchestrator Skill** - Automatically installed when team mode is enabled
  - "The Conductor" identity for elegant multi-agent orchestration
  - AskUserQuestion as mandatory tool (never text menus)
  - Background agents by default (`run_in_background=True`)
  - 8 domain-specific reference guides (code review, testing, devops, documentation, etc.)
  - Managed skill marker (`.cc-mirror-managed`) for safe updates without overwriting user customizations

- **Documentation**
  - `docs/features/team-mode.md` - Complete team mode guide with architecture diagrams
  - `docs/features/mirror-claude.md` - Mirror Claude provider documentation
  - `docs/architecture/overview.md` - System architecture overview
  - Updated `AGENTS.md` with team mode and orchestrator skill sections

### Changed

- Bundle script now copies skills to `dist/skills` for npm distribution
- Enhanced TUI with team mode toggle in variant actions screen
- Provider selection includes Mirror Claude with education content

## [1.0.4] - 2025-01-04

### Changed

- Removed broken ASCII art success banner from completion screen
- Streamlined Z.ai prompt pack (removed verbose setup/advanced sections)
- Simplified MiniMax prompt pack (removed redundant auth section)

## [1.0.3] - 2025-01-03

### Changed

- Removed 5 unused dependencies: `gradient-string`, `ink-big-text`, `ink-box`, `ink-gradient`, `ink-spinner`
- Production dependencies reduced from 10 to 5
- Package tarball size reduced to 88.5 kB

### Fixed

- Fixed bin path to use relative path (`./dist/cc-mirror.mjs`)
- Added missing `@eslint/js` dev dependency

## [1.0.2] - 2025-01-03

### Changed

- Upgraded to Ink 6.6.0 and React 19
- Updated all ink-\* packages to latest versions
- Fresh dependency tree with improved compatibility

## [1.0.1] - 2025-01-03

### Fixed

- Fixed npx compatibility by keeping React/Ink as external dependencies
- Resolved dynamic require and ESM bundling issues
- Bundle now properly delegates React ecosystem to npm

## [1.0.0] - 2025-01-03

### Added

- First public release
- Claude Code Router support (route to local LLMs via CCRouter)
- RouterUrlScreen for simplified CCRouter configuration
- Provider intro screens with setup guidance and feature highlights
- Feedback screen with GitHub repository links
- Beautiful README with screenshots and n-skills style formatting

### Changed

- Removed LiteLLM provider (replaced by Claude Code Router)
- CCRouter no longer requires model mapping (handled by CCRouter config)
- Simplified provider selection flow with better education
- Updated provider content to emphasize local LLM support
- Version bump to 1.0.0 for first stable release

### Fixed

- CCRouter flow no longer shows "model mapping incomplete" warning
- Settings-only updates preserve binary patches (fixes theme reset issue)
- All linting errors resolved
- React hook dependency warnings fixed

## [0.3.0] - 2025-01-02

### Added

- Colored ASCII art splash screens for each provider
  - Z.ai: Gold/amber gradient
  - MiniMax: Coral/red/orange gradient (matching brand)
  - OpenRouter: Teal/cyan gradient
  - LiteLLM: Sky blue gradient
- Async operations for live TUI progress updates
- MIT License

### Changed

- Renamed "Local LLMs" provider to "LiteLLM" throughout
- Footer layout: creator info on left, social links stacked on right
- tweakcc option now shows CLI command (avoids TUI-in-TUI conflict)
- Prepared package.json for npm publish (removed private flag, added metadata)

### Fixed

- Progress bar and step animations now update in real-time
- MiniMax colors now match official brand (coral/red, not purple)

## [0.2.0] - 2025-01-01

### Added

- Full-screen TUI wizard
- Brand theme presets (zai, minimax, openrouter, local)
- Prompt packs for enhanced system prompts
- dev-browser skill auto-installation
- Shell environment integration for Z.ai

### Changed

- Restructured to use ink for TUI
- Modular provider templates

## [0.1.0] - 2024-12-30

### Added

- Initial release
- CLI for creating Claude Code variants
- Support for Z.ai, MiniMax, OpenRouter, Local LLMs
- tweakcc integration for themes
- Variant isolation with separate config directories
