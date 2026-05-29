# Changelog

This repository tracks changes primarily through Git history.

## v2.2.0

### Highlights

- **Provider-native defaults** — Added capability profiles so create/update/doctor/TUI use one source of truth for provider auth, endpoints, models, privacy flags, MCP servers, and managed settings.
- **Latest provider models** — Updated Kimi to `kimi-k2.6`, MiniMax to `MiniMax-M2.7`, and Z.ai to GLM-5.1/5-Turbo/4.5-Air defaults.
- **Managed updates** — `cc-mirror update` now refreshes cc-mirror-owned defaults to the latest profile while preserving credentials and custom env.
- **Cleaner variant UI** — Suppresses upstream launch promos, startup version branding, update/install checks, nonessential traffic, and stale model picker entries for managed variants.
- **TweakCC hardening** — Validates patched native output, retries with latest TweakCC where appropriate, removes brittle patch defaults, and restores a working runtime when patching fails.
- **Kimi launch fix** — Removes stale auth-token unsetting during update and defaults Kimi to Moonshot's Anthropic-compatible endpoint.
- **Doctor upgrades** — Adds provider capability drift checks for auth, model mappings, MCP servers, permissions, managed env, and shell profile wiring without leaking secrets.
- **Security hardening** — Safely parses config JSON with prototype-key stripping and size limits across core config readers, doctor, TUI, and wrapper-generated env loaders.
- **MCP docs** — Clarifies variant-scoped MCP setup, `--scope user`, project `.mcp.json`, and how cc-mirror preserves user-added servers.
- **Contribution policy** — Moves the project to issue-first external contributions and restricts new pull request creation to collaborators.

## v2.0.1

### Fixes

- **Windows tweakcc execution** — Invoke `tweakcc` via `cmd.exe` + `npx.cmd` so variant creation/update works reliably when `npx` isn’t directly executable.
- **Windows PATH + tilde handling** — Better `~` expansion (supports `~\\`) and `list` now expands tilde before reading variants.
- **Docs** — Fixed Windows PATH examples (avoid double-escaped backslashes).

### CI / Dev

- **CI** — Added a Windows end-to-end smoke test on every PR (bundle + quick create + list/doctor + wrapper).
- **Tests** — Added regression coverage for Windows tweakcc execution and tilde expansion.
- **Lint** — Fixed a macOS CI failure caused by an unused variable in `scripts/preview-splash-grid.mjs`.

## v2.0.0

### Breaking Changes

- **Native-only installs** — Removed npm-based Claude Code installation entirely. All variants now use the native binary. Existing `npm/` directories are ignored; run `cc-mirror update` to migrate.
- **Team mode removed** — The team mode feature has been removed to reduce complexity.
- **Prompt pack mode** — Only `minimal` mode is supported. The `maximal` mode has been deprecated.

### New Providers

- **Kimi Code** — Moonshot AI's long-context coding assistant (kimi-for-coding / K2.5)
- **Ollama** — Local model runner with Anthropic-compatible API
- **GatewayZ** — Multi-provider AI gateway
- **Vercel AI Gateway** — Vercel's multi-provider gateway
- **NanoGPT** — Pay-per-token Claude Code endpoint
- **CC Router** — Route Claude Code to any LLM (Ollama, DeepSeek, etc.)

### Features

- **Unique brand themes for every provider** — Each provider has its own color palette, ASCII splash art, and custom thinking verbs
- **Adaptive diff palettes** — Diff colors now match each brand's color scheme for better readability
- **Model overrides in TUI** — Configure Sonnet/Opus/Haiku model mappings for all providers via the interactive wizard
- **`--claude-version` support** — Pin or update native Claude Code versions (`stable`, `latest`, or specific version)
- **Default to latest channel** — New variants track the `latest` Claude Code release by default
- **`--model` convenience flag** — Set all model tiers at once from CLI
- **Social media grid preview** — `scripts/preview-splash-grid.mjs` renders a 3x3 grid of all provider splash banners

### Improvements

- **OpenRouter Chrome theme** — Upgraded from navy to polished silver/chrome aesthetic
- **CC Router renamed** — "Claude Code Router" shortened to "CC Router" across UI
- **Mirror provider hidden** — Now marked as experimental (development reference only)
- **Tool denies via settings.json** — Provider tool restrictions moved from tweakcc toolsets to `settings.json` `permissions.deny` for reliability
- **Simplified splash art** — Cleaner, tighter ASCII art for OpenRouter, Vercel, CCRouter, and GatewayZ
- **Long API key paste fix** — TUI masked input now preserves full key across multiple paste chunks
- **Provider list viewport** — Constrained scrolling for cleaner TUI navigation

### Internal

- Legacy tweakcc toolset migration for existing variants
- Dark theme enforced as default for Rust native module compatibility
- Normalized variant metadata schema
