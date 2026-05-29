# Provider System

cc-mirror models each provider as a small template that defines:

- What **base URL** to use
- What **auth mode** to use (API key vs auth token vs none)
- What **default model slots** to set (Primary/Balanced/Fast)
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
- `baseUrl`: default provider endpoint
- `env`: default per-variant environment values (models, splash, timeouts, etc.)
- `authMode`:
  - `apiKey`: cc-mirror writes the legacy API-key slot
  - `authToken`: cc-mirror writes the auth-token slot (zai, minimax, kimi, openrouter, vercel, ollama, nanogpt, gatewayz). Some providers also set the legacy API-key slot via `authTokenAlsoSetsApiKey`.
  - `none`: cc-mirror does not set auth or base URL (mirror — user authenticates normally)
  - CC Router uses `authToken` with `credentialOptional: true` (optional placeholder token)
- `requiresModelMapping`: if true, CLI/TUI requires Primary/Balanced/Fast mapping (OpenRouter-style gateways)
- `credentialOptional`: if true, UI can skip API key entry (example: `mirror`)
- `experimental`: hides the provider from the default list
- `noPromptPack`: disables prompt-pack overlays (example: `mirror`)
- `requiresEmptyApiKey`: some gateways require the legacy API-key slot to be empty even when using auth tokens
- `authTokenAlsoSetsApiKey`: for providers that accept either header

## How Env Is Built

cc-mirror writes per-variant env into `~/.cc-mirror/<variant>/config/settings.json`:

- Env builder: `src/providers/index.ts` (`buildEnv`)
- Config writer step: `src/core/variant-builder/steps/WriteConfigStep.ts`

High-level behavior:

- Start with `provider.env`
- Apply auth and base URL override
- Apply model overrides (Primary/Balanced/Fast) if specified
- Apply extra `--env KEY=VALUE` entries
- Add cc-mirror safety defaults (for per-variant installs):
  - `DISABLE_UPDATES=1`
  - `DISABLE_AUTOUPDATER=1`
  - `DISABLE_INSTALLATION_CHECKS=1`
  - `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1`
  - `DISABLE_TELEMETRY=1`
  - `DISABLE_ERROR_REPORTING=1`
  - `ENABLE_TOOL_SEARCH=false`
  - `CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY=0`

## Update Policy

`cc-mirror update <name>` refreshes cc-mirror-managed defaults to the current provider profile while preserving user-owned data. Managed defaults include provider base URLs, defaulted model slots, update/install/privacy flags, provider-managed MCP servers, provider-required deny rules, and managed tweakcc startup/banner settings.

Credentials and custom env keys are preserved. Explicit `--model-*` overrides passed during update become the new model aliases for that variant.

## Model Slots

Model slots are stored in the runtime model alias env vars:

- `ANTHROPIC_DEFAULT_OPUS_MODEL`
- `ANTHROPIC_DEFAULT_SONNET_MODEL`
- `ANTHROPIC_DEFAULT_HAIKU_MODEL`

Startup/default model selection is written to top-level `settings.json` `model` where supported, instead of forcing
`ANTHROPIC_MODEL` for new installs.

Users can edit these later using:

- CLI: `cc-mirror update <name> --settings-only --model-opus ... --model-sonnet ... --model-haiku ...`
- TUI: Manage -> Configure Models

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
