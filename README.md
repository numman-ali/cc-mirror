# CC-MIRROR

<p align="center">
  <img src="./assets/cc-mirror-providers.png" alt="CC-MIRROR Provider Themes" width="800">
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/cc-mirror"><img src="https://img.shields.io/npm/v/cc-mirror.svg" alt="npm version"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
  <a href="https://twitter.com/nummanali"><img src="https://img.shields.io/twitter/follow/nummanali?style=social" alt="Twitter Follow"></a>
</p>

<p align="center">
  <strong>Create multiple isolated Claude Code variants with custom providers.</strong>
</p>

<p align="center">
  Run Claude Code with Z.ai, MiniMax, GatewayZ, OpenRouter, Claude Code Router, or any Anthropic-compatible API —<br>
  each with its own config, themes, and session storage.
</p>

---

<p align="center">
  <img src="./assets/cc-mirror-home.png" alt="CC-MIRROR Home Screen" width="600">
</p>

## Why CC-MIRROR?

Claude Code is powerful, but locked to Anthropic's API. **CC-MIRROR** lets you:

- **Use any provider** — Z.ai's GLM models, MiniMax-M2.1, OpenRouter's 100+ models, or route to local LLMs via Claude Code Router
- **Keep variants isolated** — Each variant has its own config, sessions, and themes
- **Switch instantly** — Run `zai` for Z.ai, `minimax` for MiniMax, `openrouter` for OpenRouter

## Features

- **Multiple Providers** — Z.ai, MiniMax, GatewayZ, OpenRouter, Claude Code Router, or custom endpoints
- **Complete Isolation** — Each variant has its own config, sessions, and themes
- **Brand Themes** — Custom color schemes per provider via [tweakcc](https://github.com/Piebald-AI/tweakcc)
- **Prompt Packs** — Enhanced system prompts for Z.ai and MiniMax
- **One-Command Updates** — Update all variants when Claude Code releases
- **Interactive TUI** — Full-screen setup wizard or CLI for automation

## Quick Start

### Installation

```bash
# Run directly with npx (opens TUI by default)
npx cc-mirror

# Or install globally
npm install -g cc-mirror
cc-mirror
```

### Interactive TUI

Running `cc-mirror` with no arguments opens the interactive TUI:

```bash
cc-mirror
```

<p align="center">
  <img src="./assets/cc-mirror-select.png" alt="Provider Selection" width="600">
</p>

### CLI Quick Setup

```bash
# Z.ai (GLM Coding Plan)
npx cc-mirror quick --provider zai --api-key "$Z_AI_API_KEY"

# MiniMax (MiniMax-M2.1)
npx cc-mirror quick --provider minimax --api-key "$MINIMAX_API_KEY"

# OpenRouter (100+ models)
npx cc-mirror quick --provider openrouter --api-key "$OPENROUTER_API_KEY" \
  --model-sonnet "anthropic/claude-3.5-sonnet" \
  --model-opus "anthropic/claude-3-opus" \
  --model-haiku "anthropic/claude-3-haiku"

# GatewayZ (OneRouter gateway)
npx cc-mirror quick --provider gatewayz --api-key "$GATEWAYZ_API_KEY" \
  --model-sonnet "claude-sonnet-4-20250514" \
  --model-opus "claude-opus-4-5-20251101" \
  --model-haiku "claude-haiku-3-5-20241022"

# Claude Code Router (local LLMs)
npx cc-mirror quick --provider ccrouter
```

## Supported Providers

| Provider       | Description                                  | Auth       | Model Mapping                                         |
| -------------- | -------------------------------------------- | ---------- | ----------------------------------------------------- |
| **Z.ai**       | GLM-4.7 via GLM Coding Plan                  | API Key    | Auto (GLM-4.7 for Sonnet/Opus, GLM-4.5-Air for Haiku) |
| **MiniMax**    | MiniMax-M2.1 via MiniMax Coding Plan         | API Key    | Auto (single model for all tiers)                     |
| **GatewayZ**   | OneRouter-compatible gateway                 | Auth Token | Required (you choose the models)                      |
| **OpenRouter** | Access 100+ models through one API           | Auth Token | Required (you choose the models)                      |
| **CCRouter**   | Route to local LLMs (Ollama, DeepSeek, etc.) | Optional   | Handled by CCRouter config                            |

## Variant Structure

Each variant is fully isolated in `~/.cc-mirror/<name>/`:

```
~/.cc-mirror/<variant>/
├── npm/              # Claude Code installation
├── config/           # CLAUDE_CONFIG_DIR
│   ├── settings.json # API keys, env overrides
│   └── .claude.json  # MCP servers, approvals
├── tweakcc/          # Theme & prompt configs
│   ├── config.json   # Brand preset
│   └── system-prompts/
└── variant.json      # Metadata

Wrapper: ~/.local/bin/<variant>
```

## Commands

```bash
# Create/manage variants
cc-mirror create [options]    # Full configuration wizard
cc-mirror quick [options]     # Fast setup with defaults
cc-mirror list                # List all variants
cc-mirror update [name]       # Update one or all variants
cc-mirror remove <name>       # Delete a variant
cc-mirror doctor              # Health check all variants
cc-mirror tweak <name>        # Launch tweakcc UI

# Run your variant
zai                           # If you named it 'zai'
minimax                       # If you named it 'minimax'
```

## CLI Options

```
--provider <name>        zai | minimax | gatewayz | openrouter | ccrouter | custom
--api-key <key>          Provider API key
--base-url <url>         Custom API endpoint
--model-sonnet <name>    Map to sonnet model (for OpenRouter)
--model-opus <name>      Map to opus model (for OpenRouter)
--model-haiku <name>     Map to haiku model (for OpenRouter)
--brand <preset>         Theme: auto | none | zai | minimax | gatewayz | openrouter | ccrouter
--root <path>            Variants root (default: ~/.cc-mirror)
--bin-dir <path>         Wrapper dir (default: ~/.local/bin)
--no-tweak               Skip tweakcc theme application
--no-prompt-pack         Skip prompt pack enhancements
--no-skill-install       Skip dev-browser skill installation
```

## Brand Themes

Each provider has an optional color theme applied via [tweakcc](https://github.com/Piebald-AI/tweakcc):

- **zai** — Dark carbon with gold accents
- **minimax** — Coral/red/orange spectrum
- **gatewayz** — Dark portal with violet/purple accents
- **openrouter** — Teal/cyan gradient
- **ccrouter** — Sky blue accents

## Updating Variants

When Claude Code releases a new version:

```bash
# Update all variants
cc-mirror update

# Update specific variant
cc-mirror update zai
```

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and guidelines.

**Want to add a provider?** Check the [Provider Guide](docs/TWEAKCC-GUIDE.md) for details.

## Related Projects

- [tweakcc](https://github.com/Piebald-AI/tweakcc) — Theme and customize Claude Code
- [Claude Code Router](https://github.com/musistudio/claude-code-router) — Route Claude Code to any LLM
- [n-skills](https://github.com/numman-ali/n-skills) — Universal skills for AI agents

## License

MIT — see [LICENSE](LICENSE)

---

<p align="center">
  <strong>Created by <a href="https://github.com/numman-ali">Numman Ali</a></strong><br>
  <a href="https://twitter.com/nummanali">@nummanali</a>
</p>
