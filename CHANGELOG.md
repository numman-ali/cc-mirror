# Changelog

All notable changes to this project will be documented in this file.

## [1.1.5] - 2025-01-05

### Added

- **Role Detection** in orchestration skill
  - Skill now detects if it's the main orchestrator or a spawned worker
  - Workers skip orchestration and execute tasks directly
  - Prevents recursive orchestration chaos

- **Worker Agent Prompt Template**
  - Required WORKER preamble for all spawned agents
  - Clear rules: execute task, use tools directly, no sub-agents, no task management
  - Example prompts included in SKILL.md and references/tools.md

- **Tool Ownership section**
  - Clear separation: orchestrator tools vs worker tools
  - Orchestrator: TaskCreate, TaskUpdate, TaskGet, TaskList, AskUserQuestion, Task
  - Workers: Read, Write, Edit, Bash, Glob, Grep, WebFetch, WebSearch, LSP

- **Complete task lifecycle** in "What you DO"
  - Expanded from 5 to 8 steps
  - Added: Set dependencies, Find ready work (TaskList), Mark complete (TaskUpdate resolved)

### Changed

- **Flow diagram** now shows complete lifecycle
  - Added "Find Ready Work" step with TaskList
  - Added "Mark Complete" step with TaskUpdate(resolved)
  - Shows loop back to find more ready work

- **Agent scaling** is now guidance-based, not quota-based
  - Replaced "3 agents minimum is non-negotiable"
  - New table: Quick lookup (1-2), Multi-faceted (2-3), Full feature (4+ swarm)
  - "Match the swarm to the challenge"

- **Subagent Prompting Guide** in references/tools.md
  - WORKER preamble now required first element
  - "Four Elements" → "Five Elements" (added preamble)
  - All examples updated with preamble

### Fixed

- Agents no longer try to re-orchestrate when spawned
- Task lifecycle now explicitly includes resolution step
- Clearer separation between orchestrator and worker responsibilities

## [1.1.4] - 2025-01-05

### Changed

- **Renamed skill**: `multi-agent-orchestrator` → `orchestration`
  - Shorter, cleaner name
  - Updated all references in code, tests, and documentation

- **Completely rewritten orchestration skill** with enhanced personality and capabilities
  - New "Conductor on the trading floor" identity with warmth and swagger
  - Dynamic personality that adapts to user energy (excited, frustrated, curious, etc.)
  - Strict "Iron Law" enforcement: orchestrator NEVER uses Read/Write/Edit/Bash directly
  - Minimum 3 agents per request, swarm everything philosophy
  - Rich milestone celebrations and progress updates
  - Signature branding (`─── ◈ Orchestrating ──`)

- **Maximal AskUserQuestion guidance**
  - Always use 4 questions (the max) when gathering context
  - Always use 4 options per question (the max)
  - Rich descriptions with no length limit - explain trade-offs, implications, examples
  - "Be a consultant, not a waiter" philosophy

### Added

- **Auto-approve orchestration skill**: `Skill(orchestration)` added to `permissions.allow` when team mode enabled
  - No more permission prompts to load the skill

- **Team pack system prompt**: `system-prompt-orchestration-skill.md`
  - Instructs loading orchestration skill before any response

- **Skill tool override**: `tool-description-skill.md`
  - CRITICAL instruction to load orchestration skill first in every conversation

- **Domain expertise routing** preserved with rich reference files:
  - `references/patterns.md` - Fan-Out, Pipeline, Map-Reduce, Speculative patterns
  - `references/tools.md` - Enhanced tool usage with maximal questioning philosophy
  - `references/examples.md` - Complete workflow examples
  - `references/guide.md` - User-facing documentation
  - 8 domain-specific guides (software-development, code-review, testing, etc.)

### Fixed

- Orchestrator now consistently delegates to agents instead of doing work directly
- AskUserQuestion examples now show comprehensive 4-question, 4-option patterns

## [1.1.3] - 2025-01-04

### Fixed

- **useEffect infinite loop** when toggling team mode on existing variants
  - Added ref guards to all async TUI hooks to prevent concurrent execution
  - Stabilized `refreshVariants` callback with `useCallback`
  - Hooks affected: `useTeamModeToggle`, `useVariantUpdate`, `useVariantCreate`, `useModelConfig`, `useUpdateAll`

- **Team mode visibility** in configuration/summary screens
  - TUI SummaryScreen now shows team mode status before variant creation
  - CLI `printSummary` now shows team mode in all modes (quick, interactive, non-interactive)
  - Provider-specific prompt pack routing info (zai-cli vs MCP routing)

- **Skill tool examples mismatch** - Added skill clarification spec to prevent confusion
  - Prompt pack now clarifies that skill examples (commit, review-pr, pdf) are illustrative only
  - Directs users to check `<available_skills>` for actually installed skills

### Added

- **Team Pack prompt files** for enhanced team mode guidance
  - `task-management-note.md` - Clarifies TodoWrite deprecation vs Task* tools in team mode
  - `tasklist.md`, `taskupdate.md`, `task-extra-notes.md` - Enhanced Task* tool descriptions

- **TeamModeScreen** TUI component for team mode selection during variant creation

- **Comprehensive tests**
  - `test/e2e/blocked-tools.test.ts` - Tests for blocked tools configuration
  - `test/e2e/team-mode.test.ts` - E2E tests for team mode enable/disable/toggle
  - `test/provider-matrix.test.ts` - Provider feature matrix validation
  - `test/tui/TeamModeScreen.test.ts` - TeamModeScreen component tests
  - `test/tui/ModelConfigScreen.test.ts` - ModelConfigScreen component tests

### Changed

- Removed deprecated `promptPackMode` parameter (maximal mode removed, minimal is now default)
- Shell env option now only shown for zai provider in summary screens
- Team mode description now includes details: "on (orchestrator skill, TodoWrite blocked)"

## [1.1.2] - 2025-01-04

### Fixed

- Suppress verbose tweakcc output during CLI variant creation

## [1.1.1] - 2025-01-04

### Fixed

- Mirror and CCRouter providers no longer prompt for API key (they use OAuth or optional keys)
- Cleaned up CLI output formatting

### Removed

- Removed Twitter/X share URL from create output

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
