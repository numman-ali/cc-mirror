# TUI Module

Ink-based terminal wizard for variant management.

## Entry Point

`index.tsx` renders `<App />` from `app.tsx`.

## Structure

| Directory        | Purpose                                                   |
| ---------------- | --------------------------------------------------------- |
| `screens/`       | One component per wizard screen (17 screens)              |
| `components/ui/` | Reusable primitives (Frame, TextField, YesNoSelect, etc.) |
| `hooks/`         | Business logic (useVariantCreate, useVariantUpdate, etc.) |
| `content/`       | Static text, haikus, provider descriptions                |
| `state/`         | Type definitions for screen states                        |
| `router/`        | Route metadata (parent relationships)                     |

## Screen State Machine

Routing via `useState<string>('home')` in `app.tsx`. ESC navigation hardcoded in `useInput` handler.

Key screens:

- `home` - Main menu
- `quick-*` - Quick setup flow
- `create-*` - Full create wizard
- `manage-*` - Variant management
- `doctor` - Health check

## Hooks Pattern

Business logic extracted to hooks in `hooks/`:

```typescript
useVariantCreate({ screen, params, core, setProgressLines, setScreen, onComplete })
useVariantUpdate({ screen, selectedVariant, ... })
useUpdateAll({ screen, rootDir, binDir, ... })
```

Each hook watches `screen` state and triggers operations when appropriate screen is reached.

## UI Components

| Component          | Usage                              |
| ------------------ | ---------------------------------- |
| `Frame`            | Border wrapper with optional color |
| `Header`           | Title + subtitle                   |
| `TextField`        | Labeled text input                 |
| `YesNoSelect`      | Boolean selection                  |
| `Menu`             | General selection list             |
| `HintBar`          | Bottom help hints                  |
| `ProgressScreen`   | Shows operation progress lines     |
| `CompletionScreen` | Shows success summary              |

## Conventions

- Screen names: `{flow}-{step}` (e.g., `create-api-key`, `manage-update`)
- Done screens: `*-done` suffix
- All screens return early with `if (screen === '...')` pattern
- Ink testing: use `ink-testing-library` with helpers from `test/helpers/ink-helpers.ts`

## Known Technical Debt

- `app.tsx` is 1269 lines (monolithic)
- `state/` module exists but App uses inline useState
- ESC navigation is hardcoded switch statement
