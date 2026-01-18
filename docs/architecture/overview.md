# 🏗️ Architecture Overview

This document explains how cc-mirror works under the hood.

> **Note:** Team mode patching is legacy (cc-mirror 1.6.3 only). Current builds do not patch Claude Code.

---

## System Overview

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                              CC-MIRROR                                        │
│                                                                               │
│   ┌─────────────────┐    ┌──────────────────┐    ┌─────────────────────────┐ │
│   │                 │    │                  │    │                         │ │
│   │   CLI / TUI     │───▶│   Core Engine    │───▶│   Variant Directory     │ │
│   │                 │    │                  │    │   ~/.cc-mirror/<name>/  │ │
│   └─────────────────┘    └──────────────────┘    └─────────────────────────┘ │
│          │                       │                         │                  │
│          │                       │                         ▼                  │
│          │               ┌───────┴───────┐         ┌───────────────────┐     │
│          │               │               │         │                   │     │
│          │         ┌─────▼─────┐   ┌─────▼─────┐   │   Shell Wrapper   │     │
│          │         │ Providers │   │  Brands   │   │  <bin-dir>/       │     │
│          │         └───────────┘   └───────────┘   │                   │     │
│          │                                         └─────────┬─────────┘     │
│          │                                                   │               │
│          │                                                   ▼               │
│          │                                         ┌───────────────────┐     │
│          │                                         │                   │     │
│          └─────────────────────────────────────────│   Claude Code     │     │
│                                                    │   (npm package)   │     │
│                                                    │                   │     │
│                                                    └───────────────────┘     │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

Default `<bin-dir>` is `~/.local/bin` on macOS/Linux and `~/.cc-mirror/bin` on Windows.

---

## Directory Structure

```
src/
├── cli/                    # Command-line interface
│   ├── index.ts           # Entry point
│   ├── args.ts            # Argument parsing
│   └── commands/          # create, update, remove, doctor, etc.
│
├── tui/                    # Terminal User Interface (Ink/React)
│   ├── App.tsx            # Main TUI app
│   ├── screens/           # Home, Create, Update screens
│   ├── components/        # UI components
│   └── content/           # Provider education content
│
├── core/                   # Core variant management
│   ├── index.ts           # Public API
│   ├── types.ts           # Type definitions
│   ├── constants.ts       # Default paths, versions
│   ├── variant-builder/   # Build steps
│   │   ├── VariantBuilder.ts
│   │   ├── VariantUpdater.ts
│   │   └── steps/         # Individual build steps
│   ├── wrapper.ts         # Shell wrapper generation
│   └── prompt-pack/       # System prompt overlays
│
├── providers/              # Provider templates
│   └── index.ts           # zai, minimax, openrouter, ccrouter, mirror
│
└── brands/                 # Theme presets
    ├── index.ts           # Brand registry
    ├── zai.ts             # Gold theme
    ├── minimax.ts         # Coral theme
    ├── openrouter.ts      # Teal theme
    ├── ccrouter.ts        # Sky theme
    └── mirror.ts          # Silver/chrome theme
```

---

## Variant Lifecycle

### Create Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   npx cc-mirror create                                                      │
│         │                                                                   │
│         ▼                                                                   │
│   ┌───────────────┐                                                         │
│   │ Parse Args    │  --provider, --name, --api-key                         │
│   └───────┬───────┘                                                         │
│           │                                                                 │
│           ▼                                                                 │
│   ┌───────────────┐                                                         │
│   │ Resolve       │  Get provider template from providers/index.ts          │
│   │ Provider      │                                                         │
│   └───────┬───────┘                                                         │
│           │                                                                 │
│           ▼                                                                 │
│   ┌───────────────────────────────────────────────────────────────────────┐ │
│   │                        BUILD STEPS                                    │ │
│   │                                                                       │ │
│   │   1. CreateDirectoryStep    Create ~/.cc-mirror/<name>/               │ │
│   │                             │                                         │ │
│   │   2. InstallNpmStep         npm install @anthropic-ai/claude-code     │ │
│   │                             │                                         │ │
│   │   3. TeamModeStep (legacy)  Patch cli.js if --enable-team-mode        │ │
│   │                             │                                         │ │
│   │   4. TweakccStep            Apply brand theme via tweakcc             │ │
│   │                             │                                         │ │
│   │   5. ConfigStep             Write settings.json, .claude.json         │ │
│   │                             │                                         │ │
│   │   6. PromptPackStep         Copy system-prompt overlays               │ │
│   │                             │                                         │ │
│   │   7. WrapperStep            Create <bin-dir>/<name>                   │ │
│   │                             │                                         │ │
│   │   8. FinalizeStep           Write variant.json metadata               │ │
│   │                                                                       │ │
│   └───────────────────────────────────────────────────────────────────────┘ │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Update Flow

```
npx cc-mirror update <name>
        │
        ▼
┌───────────────┐
│ Load Variant  │  Read variant.json for existing config
│ Metadata      │
└───────┬───────┘
        │
        ▼
┌───────────────────────────────────────────────────────────────────────────┐
│                        UPDATE STEPS                                       │
│                                                                           │
│   1. InstallNpmUpdateStep    Reinstall npm package (unless settingsOnly)  │
│   2. TeamModeUpdateStep      Legacy team mode cleanup (cc-mirror 1.6.3)   │
│   3. ModelOverridesStep      Update model mappings                        │
│   4. TweakccUpdateStep       Re-apply theme                               │
│   5. WrapperUpdateStep       Regenerate wrapper script                    │
│   6. ConfigUpdateStep        Update settings.json                         │
│   7. ShellEnvUpdateStep      Update shell env integration                 │
│   8. SkillInstallUpdateStep  Update installed skills                      │
│   9. FinalizeUpdateStep      Update variant.json                          │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

---

## Variant Directory Structure

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│  ~/.cc-mirror/<variant>/                                                    │
│                                                                             │
│  ├── npm/                           Claude Code npm installation            │
│  │   └── node_modules/                                                      │
│  │       └── @anthropic-ai/                                                 │
│  │           └── claude-code/                                               │
│  │               ├── cli.js          Main CLI (unpatched in current builds) │
│  │               └── cli.js.backup   Original backup                        │
│  │                                                                          │
│  ├── config/                         CLAUDE_CONFIG_DIR                      │
│  │   ├── settings.json              Env vars (API keys, base URLs)          │
│  │   ├── .claude.json               MCP servers, approvals, onboarding      │
│  │   └── tasks/                     Team mode task storage (legacy)         │
│  │       └── <team_name>/                                                   │
│  │           ├── 1.json             Task files                              │
│  │           └── 2.json                                                     │
│  │                                                                          │
│  ├── tweakcc/                        tweakcc configuration                  │
│  │   ├── config.json                Theme and UI customization              │
│  │   └── system-prompts/            Prompt pack overlays                    │
│  │                                                                          │
│  └── variant.json                    Variant metadata                       │
│                                                                             │
│  Wrapper: <bin-dir>/<variant>        Shell wrapper script                   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Provider System

Providers define how cc-mirror connects to different APIs.

```typescript
interface ProviderTemplate {
  key: string; // e.g., 'zai', 'mirror'
  label: string; // Display name
  description: string; // Short description
  baseUrl: string; // API endpoint (empty for mirror)
  env: Record<string, string | number>; // Extra env vars

  // Auth handling
  apiKeyLabel?: string; // Prompt label for API key
  authMode?: 'apiKey' | 'authToken' | 'none';
  credentialOptional?: boolean;

  // Feature flags
  enablesTeamMode?: boolean; // Legacy: auto-enable team mode (cc-mirror 1.6.3)
  noPromptPack?: boolean; // Skip prompt pack overlays
}
```

### Provider Comparison

```
┌───────────────┬────────────────────────────────────────────────────────────┐
│               │                    Provider Types                          │
│               ├────────────┬────────────┬────────────┬────────────────────┤
│   Feature     │ Proxy      │ Router     │ Direct     │ Description        │
│               │ (zai,      │ (ccrouter) │ (mirror)   │                    │
│               │ minimax,   │            │            │                    │
│               │ openrouter)│            │            │                    │
├───────────────┼────────────┼────────────┼────────────┼────────────────────┤
│ BASE_URL      │ ✓ Set      │ ✓ Set      │ ✗ Not set  │ API endpoint       │
│ API_KEY       │ ✓ Set      │ Optional   │ ✗ Not set  │ Auth credential    │
│ Model mapping │ Auto/Req   │ Handled    │ ✗ Not set  │ Sonnet/Opus/Haiku  │
│ Prompt pack   │ Optional   │ ✗          │ ✗          │ System overlays    │
│ Team mode     │ Optional   │ Optional   │ ✓ Default  │ Task tools         │
└───────────────┴────────────┴────────────┴────────────┴────────────────────┘
```

---

## Shell Wrapper

The wrapper script makes variants accessible as commands:

```bash
#!/bin/bash
# <bin-dir>/zai

# Show splash art (if TTY and enabled)
if [ -t 1 ] && [ "${CC_MIRROR_SPLASH:-1}" != "0" ]; then
  # ASCII art here...
fi

# Set Claude Code config directory
export CLAUDE_CONFIG_DIR="$HOME/.cc-mirror/zai/config"

# Load environment from settings.json
# (API keys, base URLs, model mappings)

# Run Claude Code
exec "$HOME/.cc-mirror/zai/npm/node_modules/.bin/claude" "$@"
```

On Windows, the wrapper is `<bin-dir>\\zai.cmd` with a sibling `<bin-dir>\\zai.mjs` launcher script. Add `%USERPROFILE%\\.cc-mirror\\bin` to `PATH` to run wrappers without a full path.

---

## Team Mode Patching

Team mode is enabled by patching a function in `cli.js`:

```javascript
// Original (disabled)
function sU() {
  return !1;
}

// Patched (enabled)
function sU() {
  return !0;
}
```

### Patch Steps (Legacy: cc-mirror 1.6.3)

1. **Backup**: Copy `cli.js` to `cli.js.backup`
2. **Patch**: Replace `function sU(){return!1}` with `function sU(){return!0}`
3. **Verify**: Confirm the patch was applied

### When Patching Occurs (Legacy)

| Trigger | Condition                                     |
| ------- | --------------------------------------------- |
| Create  | `--enable-team-mode` flag (legacy)            |
| Create  | Provider has `enablesTeamMode: true` (legacy) |
| Update  | `--enable-team-mode` flag (legacy)            |
| Update  | Existing variant has `teamModeEnabled: true`  |

---

## 🔙 Related

- [Provider System](provider-system.md) - Adding new providers
- [Variant Lifecycle](variant-lifecycle.md) - Detailed create/update flows
- [Team Mode](../features/team-mode.md) - Legacy team mode documentation
- [Mirror Claude](../features/mirror-claude.md) - Pure Claude variant
