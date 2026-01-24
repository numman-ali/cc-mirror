# Repository Guidelines

## Project Structure

```
src/
├── cli/                    # CLI entrypoint and commands
│   ├── index.ts           # Main CLI entry
│   ├── commands/          # create, update, remove, doctor, etc.
│   └── args.ts            # Argument parsing
├── tui/                    # Ink-based TUI wizard
│   ├── app.tsx            # Main TUI application
│   ├── screens/           # Individual screen components
│   ├── components/        # Reusable UI components
│   ├── hooks/             # React hooks for business logic
│   ├── state/             # State types and management
│   └── router/            # Screen navigation
├── core/                   # Core variant management
│   ├── index.ts           # Public API (createVariant, updateVariant, etc.)
│   ├── variant-builder/   # Step-based variant creation
│   │   ├── VariantBuilder.ts
│   │   ├── VariantUpdater.ts
│   │   ├── steps/         # Build steps (PrepareDirectories, InstallNpm, etc.)
│   │   └── update-steps/  # Update steps
│   ├── prompt-pack/       # System prompt overlays
│   │   ├── providers/     # Per-provider overlays (zai.ts, minimax.ts)
│   │   ├── overlays.ts    # Overlay resolution
│   │   └── targets.ts     # Target file mapping
│   └── *.ts               # Utils (paths, fs, tweakcc, skills, etc.)
├── providers/              # Provider templates
│   └── index.ts           # Provider definitions and defaults
├── brands/                 # TweakCC brand presets
│   ├── index.ts           # Brand resolution
│   ├── types.ts           # TweakCC config types
│   ├── zai.ts             # Z.ai theme + blocked tools
│   ├── minimax.ts         # MiniMax theme + blocked tools
│   └── *.ts               # Other brand configs

test/                       # Node test runner tests
├── e2e/                   # End-to-end tests
├── tui/                   # TUI component tests
├── unit/                  # Unit tests
└── helpers/               # Test utilities

repos/                      # Upstream reference copies (vendor data, history)
├── anthropic-claude-code-*/       # Claude Code versions for comparison/reference
├── claude-code-system-prompts/    # System prompt changelog and sources
└── tweakcc/                       # TweakCC repo (prompt patching tool)

notes/                      # Research notes and deep dive documentation
├── CLI-VERSIONS.md               # Version comparison notes
├── *-DEEP-DIVE.md                # Feature research and analysis
└── RECONSTRUCTION-LEDGER.md      # Project state and decisions

docs/                       # User documentation
dist/                       # Build output (generated)
```

## Build, Test, and Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Run CLI from TypeScript sources
npm run tui          # Launch TUI wizard
npm test             # Run all tests
npm run typecheck    # TypeScript check without emit
npm run bundle       # Build dist/cc-mirror.mjs
npm run render:tui-svg  # Regenerate docs/cc-mirror-tree.svg
```

## Coding Conventions

- **TypeScript + ESM**: Use `import`/`export`, avoid CommonJS
- **Formatting**: 2-space indent, single quotes, semicolons
- **Tests**: Name as `*.test.ts`, place in `test/` mirroring `src/` structure
- **New files**: Place in relevant `src/<area>/` folder

## Runtime Layout & Config Flow

### Variant Directory Structure

```
~/.cc-mirror/<variant>/
├── config/
│   ├── settings.json       # Env overrides (API keys, base URLs, model defaults)
│   ├── .claude.json        # API-key approvals + onboarding/theme + MCP servers
├── tweakcc/
│   ├── config.json         # Brand preset + theme list + toolsets
│   └── system-prompts/     # Prompt-pack overlays (after tweakcc apply)
├── npm/
│   └── node_modules/@anthropic-ai/claude-code/cli.js
└── variant.json            # Metadata
```

### Wrapper Script

Location: `<bin-dir>/<variant>` (macOS/Linux) or `<bin-dir>/<variant>.cmd` (Windows)

Default `<bin-dir>` is `~/.local/bin` on macOS/Linux and `~/.cc-mirror/bin` on Windows.

- Sets `CLAUDE_CONFIG_DIR` to variant config
- Loads `settings.json` into env at runtime
- Shows provider splash ASCII art when TTY and `CC_MIRROR_SPLASH != 0`
- Auto-update disable: `DISABLE_AUTOUPDATER=1` in settings.json env

### Provider Auth Modes

| Provider             | Auth Mode  | Key Variable                |
| -------------------- | ---------- | --------------------------- |
| zai, minimax, custom | API Key    | `ANTHROPIC_API_KEY`         |
| openrouter           | Auth Token | `ANTHROPIC_AUTH_TOKEN`      |
| ccrouter             | Optional   | placeholder token           |
| mirror               | None       | user authenticates normally |

### Model Mapping (env vars)

- `ANTHROPIC_DEFAULT_SONNET_MODEL`
- `ANTHROPIC_DEFAULT_OPUS_MODEL`
- `ANTHROPIC_DEFAULT_HAIKU_MODEL`
- Optional: `ANTHROPIC_SMALL_FAST_MODEL`, `ANTHROPIC_MODEL`, `CLAUDE_CODE_SUBAGENT_MODEL`

## Provider Blocked Tools

Providers can block tools via TweakCC toolsets. Defined in `src/brands/*.ts`.

**zai blocked tools:**

```typescript
export const ZAI_BLOCKED_TOOLS = [
  'mcp__4_5v_mcp__analyze_image', // Server-injected
  'mcp__milk_tea_server__claim_milk_tea_coupon',
  'mcp__web_reader__webReader',
  'WebSearch', // Use zai-cli search
  'WebFetch', // Use zai-cli read
];
```

**minimax blocked tools:**

```typescript
export const MINIMAX_BLOCKED_TOOLS = [
  'WebSearch', // Use mcp__MiniMax__web_search
];
```

## Prompt Pack

- Only `minimal` mode supported (maximal deprecated)
- Per-provider overlays in `src/core/prompt-pack/providers/`
- Applied to `tweakcc/system-prompts/` via TweakCC
- Overlays are sanitized to strip backticks (tweakcc template literal issue)

## Common Development Tasks

| Task                        | Location                                                |
| --------------------------- | ------------------------------------------------------- |
| Add/update provider         | `src/providers/index.ts`                                |
| Add/update brand theme      | `src/brands/*.ts`                                       |
| Add blocked tools           | `src/brands/zai.ts` or `minimax.ts` → `*_BLOCKED_TOOLS` |
| Modify prompt pack overlays | `src/core/prompt-pack/providers/*.ts`                   |
| Add build step              | `src/core/variant-builder/steps/`                       |
| Add TUI screen              | `src/tui/screens/` + `app.tsx` + `router/routes.ts`     |

## Debugging & Verification

### Config Inspection

```bash
# Variant config
cat ~/.cc-mirror/<variant>/config/settings.json
cat ~/.cc-mirror/<variant>/config/.claude.json
cat ~/.cc-mirror/<variant>/variant.json

# TweakCC config
cat ~/.cc-mirror/<variant>/tweakcc/config.json

# Wrapper script
cat <bin-dir>/<variant>
```

### Health Check

```bash
npx cc-mirror doctor
```

### Reference Files

- **Upstream CLI references**: `repos/anthropic-claude-code-*/cli.js` (multiple versions for comparison)
- **System prompt sources**: `repos/claude-code-system-prompts/` (includes CHANGELOG.md)
- **Research notes**: `notes/` (deep dives, version analysis, design decisions)
- **Applied prompts**: `~/.cc-mirror/<variant>/tweakcc/system-prompts/`
- **Debug logs**: `~/.cc-mirror/<variant>/config/debug/*.txt`

### CLI Feature Gates

```bash
# Search for feature flags in cli.js
rg "tengu_prompt_suggestion|promptSuggestionEnabled" ~/.cc-mirror/<variant>/npm/node_modules/@anthropic-ai/claude-code/cli.js

# Check cached gates
cat ~/.cc-mirror/<variant>/config/.claude.json | jq '.statsig'
```

## ZAI CLI (for Z.ai variants)

```bash
# Available commands
npx zai-cli --help
npx zai-cli vision --help
npx zai-cli search --help
npx zai-cli read --help
npx zai-cli repo --help

# Examples
npx zai-cli search "React 19 new features" --count 5
npx zai-cli read https://docs.example.com/api
npx zai-cli vision analyze ./screenshot.png "What errors?"
npx zai-cli repo search facebook/react "server components"
```

Requires `Z_AI_API_KEY` in environment.

## Manual Debug Flow (Create Variant)

1. Run: `npm run dev -- create --provider zai --name test-zai --api-key <key>`
2. Verify `variant.json` exists
3. Verify `.claude.json` has `hasCompletedOnboarding` + `theme`
4. Run wrapper in TTY and confirm splash + no onboarding prompt
5. Use `npx cc-mirror update test-zai` to validate update flow

## Testing

```bash
npm test                                    # All tests
npm test -- --test-name-pattern="E2E"      # E2E tests only
npm test -- --test-name-pattern="TUI"      # TUI tests only
```

Key test files:

- `test/e2e/creation.test.ts` - Variant creation for all providers
- `test/e2e/blocked-tools.test.ts` - Provider blocked tools
- `test/tui/*.test.tsx` - TUI component tests

## Architecture Notes

- **Step-based builds**: Each step is isolated, can be sync or async
- **Build order**: PrepareDirectories → InstallNpm → WriteConfig → BrandTheme → Tweakcc → Wrapper → ShellEnv → SkillInstall → Finalize

## Documentation

- `README.md` - User-facing documentation
- `DESIGN.md` - Architecture design document
- `docs/features/mirror-claude.md` - Mirror provider guide
- `docs/architecture/overview.md` - Architecture overview
- `docs/RECONSTRUCTION-LEDGER.md` - Current state + decisions

<skills_system priority="1">

## Available Skills

<!-- SKILLS_TABLE_START -->
<usage>
When users ask you to perform tasks, check if any of the available skills below can help complete the task more effectively. Skills provide specialized capabilities and domain knowledge.

How to use skills:

- Invoke: `npx openskills read <skill-name>` (run in your shell)
  - For multiple: `npx openskills read skill-one,skill-two`
- The skill content will load with detailed instructions on how to complete the task
- Base directory provided in output for resolving bundled resources (references/, scripts/, assets/)

Usage notes:

- Only use skills listed in <available_skills> below
- Do not invoke a skill that is already loaded in your context
- Each skill invocation is stateless
  </usage>

<available_skills>

<skill>
<name>open-source-maintainer</name>
<description>End-to-end GitHub repository maintenance for open-source projects. Use when asked to triage issues, review PRs, analyze contributor activity, generate maintenance reports, or maintain a repository. Triggers include "triage", "maintain", "review PRs", "analyze issues", "repo maintenance", "what needs attention", "open source maintenance", or any request to understand and act on GitHub issues/PRs. Supports human-in-the-loop workflows with persistent memory across sessions.</description>
<location>project</location>
</skill>

</available_skills>

<!-- SKILLS_TABLE_END -->

</skills_system>
