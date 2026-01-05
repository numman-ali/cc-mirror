# Variant Builder

Step-based orchestration for variant create/update. Eliminates sync/async duplication.

## Architecture

```
VariantBuilder
  ├── initContext(params) → BuildContext
  ├── build() → sync execution
  └── buildAsync() → async execution with progress

VariantUpdater (same pattern for updates)
```

## BuildStep Interface

```typescript
interface BuildStep {
  name: string;
  execute(ctx: BuildContext): void;
  executeAsync(ctx: BuildContext): Promise<void>;
}
```

## Build Order (10 steps)

| #   | Step                   | Creates                                                    |
| --- | ---------------------- | ---------------------------------------------------------- |
| 1   | PrepareDirectoriesStep | `variantDir/`, `configDir/`, `tweakDir/`, `npmDir/`        |
| 2   | InstallNpmStep         | `npm/node_modules/@anthropic-ai/claude-code/`              |
| 3   | WriteConfigStep        | `config/settings.json`, `config/.claude.json`              |
| 4   | BrandThemeStep         | `tweakcc/config.json` (must precede TeamModeStep)          |
| 5   | TeamModeStep           | Patches `cli.js` for Task\* tools, configures team toolset |
| 6   | TweakccStep            | Applies theme + prompt pack to `tweakcc/system-prompts/`   |
| 7   | WrapperStep            | `~/.local/bin/<name>` wrapper script                       |
| 8   | ShellEnvStep           | `~/.zshrc` or `~/.bashrc` (zai only)                       |
| 9   | SkillInstallStep       | `config/skills/` (zai/minimax only)                        |
| 10  | FinalizeStep           | `variant.json` metadata                                    |

## Adding a Step

1. Create `steps/NewStep.ts` implementing `BuildStep`
2. Add to `this.steps` array in `VariantBuilder` constructor
3. Order matters - BrandTheme must precede TeamMode

## BuildContext

```typescript
interface BuildContext {
  params: CreateVariantParams;
  provider: ProviderTemplate;
  paths: BuildPaths; // variantDir, configDir, tweakDir, etc.
  prefs: BuildPreferences; // promptPackEnabled, skillInstallEnabled, etc.
  state: BuildState; // binaryPath, notes, meta (accumulated)
  report: ReportFn; // Progress callback
  isAsync: boolean;
}
```

## Anti-Patterns

- **Never skip BrandThemeStep before TeamModeStep** - team toolset needs `tweakcc/config.json`
- **Never modify `this.steps` at runtime** - order is fixed at construction
