# Provider System

cc-mirror models each provider as a small template that defines:

- What **base URL** to use (`ANTHROPIC_BASE_URL`)
- What **auth mode** to use (API key vs auth token vs none)
- What **default model mapping** to set (Opus/Sonnet/Haiku)
- What **variant wrapper splash** and labels to show

The goal is to keep provider wiring predictable, while still allowing users to override anything via `settings.json`.

## Where Providers Live

- Provider definitions: `src/providers/index.ts`
- Brand presets (tweakcc config): `src/brands/*.ts`
- Brand resolution: `src/brands/index.ts`
- Prompt-pack overlays (provider-specific system-prompt hints): `src/core/prompt-pack/providers/`

## Provider Template Fields

Each provider is a `ProviderTemplate` in `src/providers/index.ts`:

- `key`, `label`, `description`
- `baseUrl`: default `ANTHROPIC_BASE_URL` (empty means "use Claude Code defaults")
- `env`: default per-variant environment values (models, splash, timeouts, etc.)
- `authMode`:
  - `apiKey`: cc-mirror writes `ANTHROPIC_API_KEY` (zai, minimax, kimi)
  - `authToken`: cc-mirror writes `ANTHROPIC_AUTH_TOKEN` (openrouter, vercel, ollama, nanogpt, gatewayz). Some providers also set `ANTHROPIC_API_KEY` via `authTokenAlsoSetsApiKey`.
  - `none`: cc-mirror does not set auth or base URL (mirror — user authenticates normally)
  - CC Router uses `authToken` with `credentialOptional: true` (optional placeholder token)
- `requiresModelMapping`: if true, CLI/TUI requires Opus/Sonnet/Haiku mapping (OpenRouter-style gateways)
- `credentialOptional`: if true, UI can skip API key entry (example: `mirror`)
- `experimental`: hides the provider from the default list
- `noPromptPack`: disables prompt-pack overlays (example: `mirror`)
- `requiresEmptyApiKey`: some gateways require `ANTHROPIC_API_KEY=''` even when using auth tokens
- `authTokenAlsoSetsApiKey`: for providers that accept either header

## How Env Is Built

cc-mirror writes per-variant env into `~/.cc-mirror/<variant>/config/settings.json`:

- Env builder: `src/providers/index.ts` (`buildEnv`)
- Config writer step: `src/core/variant-builder/steps/WriteConfigStep.ts`

High-level behavior:

- Start with `provider.env`
- Apply auth (`ANTHROPIC_API_KEY` or `ANTHROPIC_AUTH_TOKEN`) and base URL override
- Apply model overrides (Opus/Sonnet/Haiku) if specified
- Apply extra `--env KEY=VALUE` entries
- Add cc-mirror safety defaults (for per-variant installs):
  - `DISABLE_AUTOUPDATER=1`
  - `DISABLE_AUTO_MIGRATE_TO_NATIVE=1`
  - `DISABLE_INSTALLATION_CHECKS=1`

## Model Mapping

Model mapping is always expressed via Claude Code’s env vars:

- `ANTHROPIC_DEFAULT_OPUS_MODEL`
- `ANTHROPIC_DEFAULT_SONNET_MODEL`
- `ANTHROPIC_DEFAULT_HAIKU_MODEL`

Users can edit these later using:

- CLI: `cc-mirror update <name> --settings-only --model-opus ... --model-sonnet ... --model-haiku ...`
- TUI: Manage → Configure Models

## Adding A New Provider (Checklist)

1. Add provider definition to `src/providers/index.ts` (set `authMode`, `requiresModelMapping`, etc.)
2. Add brand preset to `src/brands/<provider>.ts` (theme colors, thinking verbs, tool denies)
3. Register brand in `src/brands/index.ts`
4. Add wrapper splash style and ASCII art: `src/core/wrapper.ts` + `scripts/preview-splash.mjs`
5. Add TUI education content: `src/tui/content/providers.ts`
6. Add docs + help entries (README tables, `src/cli/help.ts`, `docs/README.md` provider list)
7. Update tests:
   - Provider matrix: `test/provider-matrix.test.ts`
   - E2E creation: `test/e2e/creation.test.ts`
   - E2E providers list: `test/e2e/providers.ts`
   - E2E ASCII art: `test/e2e/ascii-art.test.ts`
