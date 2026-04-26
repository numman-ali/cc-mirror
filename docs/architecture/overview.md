# 🏗️ Architecture Overview

This document explains how cc-mirror works under the hood.

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
│                                                    │  (native binary)  │     │
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
│   └── index.ts           # mirror, zai, minimax, kimi, openrouter, ccrouter, ollama, gatewayz, vercel, nanogpt
│
└── brands/                 # Theme presets
    ├── index.ts           # Brand registry
    ├── zai.ts             # Gold theme
    ├── minimax.ts         # Coral theme
    ├── kimi.ts            # Teal theme
    ├── openrouter.ts      # Chrome theme
    ├── ccrouter.ts        # Sky theme
    ├── ollama.ts          # Ember theme
    ├── gatewayz.ts        # Violet theme
    ├── vercel.ts          # Monochrome theme
    ├── nanogpt.ts         # Aurora theme
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
│   │   1. PrepareDirectoriesStep Create ~/.cc-mirror/<name>/               │ │
│   │                             │                                         │ │
│   │   2. InstallNativeStep      Download + verify native Claude Code      │ │
│   │                             │                                         │ │
│   │   3. WriteConfigStep        Write settings.json, .claude.json         │ │
│   │                             │                                         │ │
│   │   4. BrandThemeStep         Write tweakcc/config.json                 │ │
│   │                             │                                         │ │
│   │   5. BinaryPatcherStep      In-repo theme + prompt overlay patcher    │ │
│   │                             │                                         │ │
│   │   6. WrapperStep            Create <bin-dir>/<name>                   │ │
│   │                             │                                         │ │
│   │   7. ShellEnvStep           Optional shell profile env                │ │
│   │                             │                                         │ │
│   │   8. SkillInstallStep       Optional dev-browser skill                │ │
│   │                             │                                         │ │
│   │   9. FinalizeStep           Write variant.json metadata               │ │
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
│   1. RebuildUpdateStep       Reset claude/tweakcc dirs (keep config)      │
│   2. InstallNativeUpdateStep Download + verify native CC (unless settingsOnly) │
│   3. ModelOverridesStep      Update model mappings                        │
│   4. BinaryPatcherUpdateStep Re-apply theme + prompt overlays             │
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
│  ├── native/                        Claude Code native installation         │
│  │   ├── claude                      Claude Code binary                     │
│  │                                                                          │
│  ├── config/                         CLAUDE_CONFIG_DIR                      │
│  │   ├── settings.json              Env vars (API keys, base URLs)          │
│  │   ├── .claude.json               MCP servers, approvals, onboarding      │
│  │                                                                          │
│  ├── tweakcc/                        Brand theme + UI customization config │
│  │   └── config.json                Read by the in-repo binary patcher     │
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
  noPromptPack?: boolean; // Skip prompt pack overlays
}
```

### Provider Comparison

```
┌───────────────┬─────────────────────────────────────────────────────────────────────┐
│               │                         Provider Types                               │
│               ├────────────┬─────────────┬────────────┬────────────┬────────────────┤
│   Feature     │ API Key    │ Auth Token  │ Router     │ Direct     │ Description    │
│               │ (zai,      │ (openrouter,│ (ccrouter) │ (mirror)   │                │
│               │  minimax,  │  vercel,    │            │            │                │
│               │  kimi)     │  ollama,    │            │            │                │
│               │            │  nanogpt,   │            │            │                │
│               │            │  gatewayz)  │            │            │                │
├───────────────┼────────────┼─────────────┼────────────┼────────────┼────────────────┤
│ BASE_URL      │ ✓ Set      │ ✓ Set       │ ✓ Set      │ ✗ Not set  │ API endpoint   │
│ Auth          │ API_KEY    │ AUTH_TOKEN   │ Optional   │ ✗ Not set  │ Credential     │
│ Model mapping │ Auto       │ Auto/Req    │ Handled    │ ✗ Not set  │ Sonnet/Opus    │
│ Prompt pack   │ Optional   │ ✗           │ ✗          │ ✗          │ System overlays│
└───────────────┴────────────┴─────────────┴────────────┴────────────┴────────────────┘
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
exec "$HOME/.cc-mirror/zai/native/claude" "$@"
```

On Windows, the wrapper is `<bin-dir>\zai.cmd` with a sibling `<bin-dir>\zai.mjs` launcher script. Add `%USERPROFILE%\.cc-mirror\bin` to `PATH` to run wrappers without a full path.

---

## 🔙 Related

- [Provider System](provider-system.md) - Adding new providers
- [Variant Lifecycle](variant-lifecycle.md) - Detailed create/update flows
- [Mirror Claude](../features/mirror-claude.md) - Pure Claude variant
