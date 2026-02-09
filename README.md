# CC-MIRROR

<p align="center">
  <img src="./assets/cc-mirror-providers.png" alt="CC-MIRROR Provider Themes" width="800">
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/cc-mirror"><img src="https://img.shields.io/npm/v/cc-mirror.svg" alt="npm version"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
  <a href="https://twitter.com/nummanali"><img src="https://img.shields.io/twitter/follow/nummanali?style=social" alt="Twitter Follow"></a>
</p>

<h2 align="center">Claude Code, Unshackled</h2>

<p align="center">
  Pre-configured Claude Code variants with custom providers,<br>
  prompt packs, and battle-tested enhancements.<br><br>
  <strong>One command. Instant power-up.</strong>
</p>

---

## Quick Start

```bash
# Fastest path to a configured Claude Code variant
npx cc-mirror quick --provider mirror --name mclaude

# Run it
mclaude
```

That's it. You now have a Claude Code variant ready to run.

### Claude Code Version (Stable/Latest/Pin)

By default, CC-MIRROR installs the **latest** Claude Code native release. You can pin a channel or version:

```bash
# Track upstream stable channel
npx cc-mirror quick --provider mirror --name mclaude --claude-version stable

# Track upstream latest channel
npx cc-mirror update mclaude --claude-version latest

# Pin a specific version
npx cc-mirror update mclaude --claude-version 2.1.37
```

<p align="center">
  <img src="./assets/cc-mirror-home.png" alt="CC-MIRROR Home Screen" width="600">
</p>

### Or use the interactive wizard

```bash
npx cc-mirror
```

---

## What is CC-MIRROR?

CC-MIRROR is an **opinionated Claude Code distribution**. We did the hacking — you get the superpowers.

At its core, CC-MIRROR:

1. **Clones** Claude Code into isolated instances
2. **Configures** provider endpoints, model mapping, and env defaults
3. **Applies** prompt packs and tweakcc themes
4. **Installs** optional skills (dev-browser, opt-in)
5. **Packages** everything into a single command

Each variant is completely isolated — its own config, sessions, MCP servers, and credentials. Your main Claude Code installation stays untouched.

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ~/.cc-mirror/                                                          │
│                                                                         │
│  ├── mclaude/                        ← Mirror Claude                     │
│  │   ├── native/                     Claude Code installation           │
│  │   ├── config/                     API keys, sessions, MCP servers    │
│  │   ├── tweakcc/                    Theme customization                │
│  │   └── variant.json                Metadata                           │
│  │                                                                      │
│  ├── zai/                            ← Z.ai variant (GLM models)        │
│  ├── minimax/                        ← MiniMax variant (M2.1)           │
│  └── kimi/                           ← Kimi Code variant (kimi-for-coding) │
│                                                                         │
│  Wrappers: <bin-dir>/mclaude, <bin-dir>/zai, ...                        │
└─────────────────────────────────────────────────────────────────────────┘
```

Default `<bin-dir>` is `~/.local/bin` on macOS/Linux and `~/.cc-mirror/bin` on Windows.

**Windows tip:** add `%USERPROFILE%\\.cc-mirror\\bin` to your `PATH`, or run the `<variant>.cmd` wrapper directly. Each wrapper has a sibling `<variant>.mjs` launcher.

---

## Providers

### Mirror Claude (Recommended)

The purest path to vanilla Claude Code. No proxy, no model changes — just clean isolation.

```bash
npx cc-mirror quick --provider mirror --name mclaude
```

- **Direct Anthropic API** — No proxy, authenticate normally (OAuth or API key)
- **Isolated config** — Experiment without affecting your main setup
- **Provider presets** — Clean defaults without hidden patches

### Alternative Providers

Want to use different models? CC-MIRROR supports multiple providers:

| Provider       | Models                 | Auth       | Best For                        |
| -------------- | ---------------------- | ---------- | ------------------------------- |
| **Z.ai**       | GLM-4.7, GLM-4.5-Air   | API Key    | Heavy coding with GLM reasoning |
| **MiniMax**    | MiniMax-M2.1           | API Key    | Unified model experience        |
| **Kimi**       | kimi-for-coding        | API Key    | Long-context coding (Kimi Code) |
| **OpenRouter** | 100+ models            | Auth Token | Model flexibility, pay-per-use  |
| **CCRouter**   | Ollama, DeepSeek, etc. | Optional   | Local-first development         |
| **Ollama**     | Local + cloud models   | Auth Token | Local-first + hybrid setups     |
| **GatewayZ**   | Multi-provider gateway | Auth Token | Centralized routing             |
| **Vercel**     | Multi-provider gateway | Auth Token | Vercel AI Gateway               |
| **NanoGPT**    | Claude Code endpoint   | Auth Token | Simple endpoint setup           |

```bash
# Z.ai (GLM Coding Plan)
npx cc-mirror quick --provider zai --api-key "$Z_AI_API_KEY"

# MiniMax (MiniMax-M2.1)
npx cc-mirror quick --provider minimax --api-key "$MINIMAX_API_KEY"

# Kimi Code (kimi-for-coding)
npx cc-mirror quick --provider kimi --api-key "$KIMI_API_KEY"

# OpenRouter (100+ models)
npx cc-mirror quick --provider openrouter --api-key "$OPENROUTER_API_KEY" \
  --model-sonnet "anthropic/claude-sonnet-4-20250514"

# Claude Code Router (local LLMs)
npx cc-mirror quick --provider ccrouter

# Ollama
npx cc-mirror quick --provider ollama --api-key "ollama" \
  --model-sonnet "qwen3-coder" --model-opus "qwen3-coder" --model-haiku "qwen3-coder"

# GatewayZ
npx cc-mirror quick --provider gatewayz --api-key "$GATEWAYZ_API_KEY" \
  --model-sonnet "claude-3-5-sonnet-20241022"

# Vercel AI Gateway
npx cc-mirror quick --provider vercel --api-key "$VERCEL_AI_GATEWAY_KEY" \
  --model-sonnet "anthropic/claude-3-5-sonnet-20241022"

# NanoGPT
npx cc-mirror quick --provider nanogpt --api-key "$NANOGPT_API_KEY"
```

---

## All Commands

```bash
# Create & manage variants
npx cc-mirror                     # Interactive TUI
npx cc-mirror quick [options]     # Fast setup with defaults
npx cc-mirror create [options]    # Full configuration wizard
npx cc-mirror list                # List all variants
npx cc-mirror update [name]       # Update one or all variants
npx cc-mirror apply <name>        # Re-apply tweakcc patches (no reinstall)
npx cc-mirror remove <name>       # Delete a variant
npx cc-mirror doctor              # Health check all variants
npx cc-mirror tweak <name>        # Launch tweakcc customization

# Launch your variant
mclaude                           # Run Mirror Claude
zai                               # Run Z.ai variant
minimax                           # Run MiniMax variant
kimi                              # Run Kimi Code variant
```

---

## CLI Options

```
--provider <name>        mirror | zai | minimax | kimi | openrouter | ccrouter | ollama | gatewayz | vercel | nanogpt | custom
--name <name>            Variant name (becomes the CLI command)
--api-key <key>          Provider API key
--base-url <url>         Custom API endpoint
--model-sonnet <name>    Map to sonnet model
--model-opus <name>      Map to opus model
--model-haiku <name>     Map to haiku model
--brand <preset>         Theme: auto | mirror | zai | minimax | kimi | openrouter | ccrouter | ollama | gatewayz | vercel | nanogpt
--no-tweak               Skip tweakcc theme
--no-prompt-pack         Skip provider prompt pack
--verbose               Show full tweakcc output during update
```

---

## Brand Themes

Each provider includes a custom color theme via [tweakcc](https://github.com/Piebald-AI/tweakcc):

| Brand          | Style                            |
| -------------- | -------------------------------- |
| **mirror**     | Silver/chrome with electric blue |
| **zai**        | Dark carbon with gold accents    |
| **minimax**    | Coral/red/orange spectrum        |
| **kimi**       | Aurora green + cyan accents      |
| **openrouter** | Teal/cyan gradient               |
| **ccrouter**   | Sky blue accents                 |
| **ollama**     | Warm ember/orange palette        |
| **gatewayz**   | Violet gradients                 |
| **vercel**     | Monochrome with green accents    |
| **nanogpt**    | Neon blue + pink accents         |

---

## Documentation

| Document                                        | Description                          |
| ----------------------------------------------- | ------------------------------------ |
| [Mirror Claude](docs/features/mirror-claude.md) | Pure Claude Code with clean defaults |
| [Architecture](docs/architecture/overview.md)   | How CC-MIRROR works under the hood   |
| [Full Documentation](docs/README.md)            | Complete documentation index         |

---

## Related Projects

- [tweakcc](https://github.com/Piebald-AI/tweakcc) — Theme and customize Claude Code
- [Claude Code Router](https://github.com/musistudio/claude-code-router) — Route Claude Code to any LLM
- [n-skills](https://github.com/numman-ali/n-skills) — Universal skills for AI agents

---

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup.

**Want to add a provider?** Check the [Provider Guide](docs/TWEAKCC-GUIDE.md).

---

## License

MIT — see [LICENSE](LICENSE)

---

<p align="center">
  <strong>Created by <a href="https://github.com/numman-ali">Numman Ali</a></strong><br>
  <a href="https://twitter.com/nummanali">@nummanali</a>
</p>
