# Core Module

Public API for variant management. All CLI/TUI operations flow through `index.ts`.

## Public API

| Export                                     | Purpose                                                  |
| ------------------------------------------ | -------------------------------------------------------- |
| `createVariant()` / `createVariantAsync()` | Build new variant (sync for CLI, async for TUI progress) |
| `updateVariant()` / `updateVariantAsync()` | Reinstall npm + reapply config                           |
| `removeVariant()`                          | Delete variant directory                                 |
| `doctor()`                                 | Health check all variants                                |
| `listVariants()`                           | Enumerate `~/.cc-mirror/`                                |
| `tweakVariant()`                           | Launch tweakcc UI                                        |

## Module Map

| File               | Role                                               |
| ------------------ | -------------------------------------------------- |
| `constants.ts`     | `DEFAULT_ROOT`, `DEFAULT_BIN_DIR`, `DEFAULT_NPM_*` |
| `paths.ts`         | `expandTilde()` helper                             |
| `fs.ts`            | `ensureDir()`, `writeJsonFile()`                   |
| `variants.ts`      | Load/list variant metadata                         |
| `wrapper.ts`       | Generate wrapper shell scripts                     |
| `tweakcc.ts`       | TweakCC config management                          |
| `claude-config.ts` | `.claude.json` generation                          |
| `install.ts`       | npm package installation                           |
| `prompt-pack.ts`   | Provider prompt overlay resolution                 |
| `skills.ts`        | Skill installation (dev-browser)                   |
| `shell-env.ts`     | Write API keys to shell profile                    |

## Subdirectories

- `variant-builder/` - Step-based build orchestration (see its AGENTS.md)
- `prompt-pack/` - Per-provider system prompt overlays

## Conventions

- Sync functions for CLI, async variants for TUI (yields to event loop)
- All paths resolved via `expandTilde()` before use
- Errors thrown as `Error` with descriptive message
