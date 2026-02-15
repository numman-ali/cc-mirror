# CC-MIRROR

<p align="center">
  <img src="./assets/cc-mirror-providers.png" alt="CC-MIRROR Provider Themes" width="800">
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/cc-mirror"><img src="https://img.shields.io/npm/v/cc-mirror.svg" alt="npm version"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
  <a href="https://twitter.com/nummanali"><img src="https://img.shields.io/twitter/follow/nummanali?style=social" alt="Twitter Follow"></a>
</p>

<h2 align="center">Run Any Model in Claude Code</h2>

<p align="center">
  Claude Code is one of the best coding harnesses out there.<br>
  CC-MIRROR lets you run <strong>Kimi, Z.ai, MiniMax, OpenRouter</strong> and more<br>
  through it — with isolated configs, custom themes, and prompt packs.<br><br>
  <strong>Pick your models. Mix and match. One command each.</strong>
</p>

---

## Quick Start

```bash
npx cc-mirror
```

The interactive wizard walks you through provider selection, API keys, and model mapping. You'll have a ready-to-run variant in under a minute.

<p align="center">
  <img src="./assets/cc-mirror-home.png" alt="CC-MIRROR Home Screen" width="600">
</p>

### Prefer the command line?

```bash
# Kimi Code
npx cc-mirror quick --provider kimi --api-key "$KIMI_API_KEY"

# Z.ai (GLM-5 / 4.7 / 4.5-Air)
npx cc-mirror quick --provider zai --api-key "$Z_AI_API_KEY"

# MiniMax (M2.5)
npx cc-mirror quick --provider minimax --api-key "$MINIMAX_API_KEY"

# Then just run it
kimi
zai
minimax
```

Each variant becomes its own CLI command — completely isolated from your main Claude Code install.

### Claude Code Version (Stable/Latest/Pin)

By default, CC-MIRROR installs the **latest** Claude Code native release. You can pin a channel or version:

```bash
# Track upstream stable channel
npx cc-mirror quick --provider kimi --api-key "$KIMI_API_KEY" --claude-version stable

# Track upstream latest channel
npx cc-mirror update kimi --claude-version latest

# Pin a specific version
npx cc-mirror update kimi --claude-version 2.1.37
```

Notes:

- `stable` and `latest` are upstream channels. `stable` may lag behind `latest` (that is normal).
- cc-mirror resolves the channel to a concrete version during install/update and stores it in `variant.json`.

---

## What is CC-MIRROR?

CC-MIRROR turns Claude Code into a **universal coding harness**. Use the agent framework you already know — tool calls, MCP servers, slash commands — with the model of your choice.

At its core, CC-MIRROR:

1. **Clones** Claude Code into isolated instances
2. **Configures** provider endpoints, model mapping, and env defaults
3. **Applies** prompt packs and tweakcc themes tuned per provider
4. **Installs** optional skills (dev-browser, opt-in)
5. **Packages** everything into a single command

Each variant is completely isolated — its own config, sessions, MCP servers, and credentials. Your main Claude Code installation stays untouched. Run them side by side, compare models, switch freely.

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ~/.cc-mirror/                                                          │
│                                                                         │
│  ├── kimi/                           ← Kimi Code (kimi-for-coding)      │
│  │   ├── native/                     Claude Code installation           │
│  │   ├── config/                     API keys, sessions, MCP servers    │
│  │   ├── tweakcc/                    Theme customization                │
│  │   └── variant.json                Metadata                           │
│  │                                                                      │
│  ├── zai/                            ← Z.ai variant (GLM models)        │
│  ├── minimax/                        ← MiniMax variant (M2.5)           │
│  └── myrouter/                       ← OpenRouter (pick any model)      │
│                                                                         │
│  Wrappers: <bin-dir>/kimi, <bin-dir>/zai, <bin-dir>/minimax, ...        │
└─────────────────────────────────────────────────────────────────────────┘
```

Default `<bin-dir>` is `~/.local/bin` on macOS/Linux and `~/.cc-mirror/bin` on Windows.

**Windows tip:** add `%USERPROFILE%\\.cc-mirror\\bin` to your `PATH`, or run the `<variant>.cmd` wrapper directly. Each wrapper has a sibling `<variant>.mjs` launcher.

---

## Providers

### Featured Providers

These providers offer dedicated coding models with first-class support in CC-MIRROR:

| Provider    | Models              | What You Get                                                    |
| ----------- | ------------------- | --------------------------------------------------------------- |
| **Kimi**    | kimi-for-coding     | Long-context coding with Kimi K2.5 — built for large codebases |
| **Z.ai**    | GLM-5, 4.7, 4.5-Air | Heavy reasoning with GLM models, bundled search and vision tools |
| **MiniMax** | MiniMax-M2.5        | Unified model across all tiers, integrated web search MCP       |

```bash
npx cc-mirror quick --provider kimi --api-key "$KIMI_API_KEY"
npx cc-mirror quick --provider zai --api-key "$Z_AI_API_KEY"
npx cc-mirror quick --provider minimax --api-key "$MINIMAX_API_KEY"
```

### Gateway & Routing Providers

Want total model freedom? These providers let you pick from hundreds of models and swap between them:

| Provider       | Models                 | Auth       | Best For                       |
| -------------- | ---------------------- | ---------- | ------------------------------ |
| **OpenRouter** | 100+ models            | Auth Token | Model flexibility, pay-per-use |
| **Vercel**     | Multi-provider gateway | Auth Token | Vercel AI Gateway              |
| **NanoGPT**    | 400+ models            | Auth Token | Simple gateway setup           |
| **GatewayZ**   | Multi-provider gateway | Auth Token | Centralized routing            |

```bash
# OpenRouter — pick any model
npx cc-mirror quick --provider openrouter --api-key "$OPENROUTER_API_KEY" \
  --model-sonnet "anthropic/claude-sonnet-4-20250514"

# Vercel AI Gateway
npx cc-mirror quick --provider vercel --api-key "$VERCEL_AI_GATEWAY_KEY" \
  --model-sonnet "anthropic/claude-3-5-sonnet-20241022"

# NanoGPT
npx cc-mirror quick --provider nanogpt --api-key "$NANOGPT_API_KEY"

# GatewayZ
npx cc-mirror quick --provider gatewayz --api-key "$GATEWAYZ_API_KEY" \
  --model-sonnet "claude-3-5-sonnet-20241022"
```

### Local & Self-Hosted

Run models on your own hardware:

| Provider     | Models               | Auth     | Best For                      |
| ------------ | -------------------- | -------- | ----------------------------- |
| **Ollama**   | Local + cloud models | Auth Token | Local-first + hybrid setups |
| **CCRouter** | Ollama, DeepSeek, etc. | Optional | Local-first development     |

```bash
# Ollama
npx cc-mirror quick --provider ollama --api-key "ollama" \
  --model-sonnet "qwen3-coder" --model-opus "qwen3-coder" --model-haiku "qwen3-coder"

# CC Router (local LLMs)
npx cc-mirror quick --provider ccrouter
```

### Mirror Claude

Want a clean, isolated copy of vanilla Claude Code? The `mirror` provider gives you exactly that — no proxy, no model changes, just a separate config directory. Useful for testing or running multiple Claude Code instances side by side.

```bash
npx cc-mirror quick --provider mirror --name mclaude
mclaude
```

### Provider Setup Links

| Provider       | Subscribe                                                     | Get Key/Token                                                    | Docs                                                             |
| -------------- | ------------------------------------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------- |
| **Kimi**       | https://www.kimi.com/code                                     | https://www.kimi.com/code/console                                | https://www.kimi.com/code/docs/en/more/third-party-agents.html   |
| **MiniMax**    | https://platform.minimax.io/subscribe/coding-plan             | https://platform.minimax.io/user-center/payment/coding-plan      | https://platform.minimax.io/docs                                 |
| **Z.ai**       | https://z.ai/subscribe                                        | https://z.ai/manage-apikey/apikey-list                           | https://z.ai/docs                                                |
| **OpenRouter** | https://openrouter.ai/account                                 | https://openrouter.ai/keys                                       | https://openrouter.ai/docs                                       |
| **Vercel**     | https://vercel.com/ai                                         | https://vercel.com/account/tokens                                | https://vercel.com/docs/ai-gateway                               |
| **Ollama**     | https://ollama.com                                            | https://ollama.com                                               | https://docs.ollama.com/api/anthropic-compatibility              |
| **NanoGPT**    | https://nano-gpt.com                                          | https://nano-gpt.com                                             | https://docs.nano-gpt.com/docs/anthropic-compatibility           |
| **CCRouter**   | https://github.com/musistudio/claude-code-router#installation | https://github.com/musistudio/claude-code-router#2-configuration | https://github.com/musistudio/claude-code-router#2-configuration |
| **GatewayZ**   | https://gatewayz.ai                                           | https://gatewayz.ai                                              | https://docs.gatewayz.ai/docs/anthropic-compatibility            |

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
kimi                              # Run Kimi Code variant
zai                               # Run Z.ai variant
minimax                           # Run MiniMax variant
```

---

## CLI Options

```
--provider <name>        kimi | minimax | zai | openrouter | vercel | ollama | nanogpt | ccrouter | mirror | gatewayz | custom
--name <name>            Variant name (becomes the CLI command)
--api-key <key>          Provider API key
--base-url <url>         Custom API endpoint
--model-sonnet <name>    Map to sonnet model
--model-opus <name>      Map to opus model
--model-haiku <name>     Map to haiku model
--brand <preset>         Theme: auto | kimi | minimax | zai | openrouter | vercel | ollama | nanogpt | ccrouter | mirror | gatewayz
--no-tweak               Skip tweakcc theme
--no-prompt-pack         Skip provider prompt pack
--verbose               Show full tweakcc output during update
```

---

## Brand Themes

Each provider includes a custom color theme via [tweakcc](https://github.com/Piebald-AI/tweakcc):

| Brand          | Style                            |
| -------------- | -------------------------------- |
| **kimi**       | Teal/cyan gradient               |
| **minimax**    | Coral/red/orange spectrum        |
| **zai**        | Dark carbon with gold accents    |
| **openrouter** | Silver/chrome with electric blue |
| **vercel**     | Monochrome with green accents    |
| **ollama**     | Warm sandstone with earthy tones |
| **nanogpt**    | Aurora green + cyan accents      |
| **ccrouter**   | Sky blue accents                 |
| **gatewayz**   | Violet gradients                 |

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
