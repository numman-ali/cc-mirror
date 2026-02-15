# Changelog

This repository tracks changes primarily through Git history.

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
