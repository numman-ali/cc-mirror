# CC-MIRROR

<p align="center">
  <img src="./assets/cc-mirror-providers.png" alt="CC-MIRROR Provider Themes" width="800">
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/cc-mirror"><img src="https://img.shields.io/npm/v/cc-mirror.svg" alt="npm version"></a>
  <a href="https://opensource.org/licenses/MIT"><img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="License: MIT"></a>
  <a href="https://twitter.com/nummanali"><img src="https://img.shields.io/twitter/follow/nummanali?style=social" alt="Twitter Follow"></a>
</p>

<h2 align="center">Provider-native coding variants</h2>

<p align="center">
  Pre-configured coding variants with custom providers,<br>
  prompt packs, and battle-tested enhancements.<br><br>
  <strong>One command. Instant power-up.</strong>
</p>

---

## Contributions

cc-mirror is maintained as issues-first. Please open issues with provider docs, reproduction steps, and patch/design links; external pull requests are not accepted directly.

---

## Quick Start

```bash
# Fastest path to a configured provider-native variant
npx cc-mirror quick --provider mirror --name mirror

# Run it
mirror
```

That's it. You now have an isolated coding variant ready to run.

### Runtime Version (Stable/Latest/Pin)

By default, CC-MIRROR installs the **latest** native runtime release. You can pin a channel or version:

```bash
# Track upstream stable channel
npx cc-mirror quick --provider mirror --name mirror --claude-version stable

# Track upstream latest channel
npx cc-mirror update mirror --claude-version latest

# Pin a specific version
npx cc-mirror update mirror --claude-version 2.1.37
```

Notes:

- `stable` and `latest` are upstream channels. `stable` may lag behind `latest` (that is normal).
- cc-mirror resolves the channel to a concrete version during install/update and stores it in `variant.json`.

### Update Policy

`npx cc-mirror update [name]` refreshes the native runtime install and cc-mirror-managed defaults for that variant, including provider endpoints, model slots, update/install/privacy flags, provider-managed MCP servers, and managed tweakcc startup/banner settings. Credentials and custom env keys are preserved.

Managed variants default to cc-mirror-controlled updates, disabled upstream install checks, privacy-oriented hosted-provider traffic settings, and hidden upstream startup branding where tweakcc can control it.

<p align="center">
  <img src="./assets/cc-mirror-home.png" alt="CC-MIRROR Home Screen" width="600">
</p>

### Or use the interactive wizard

```bash
npx cc-mirror
```

---

## What is CC-MIRROR?

CC-MIRROR is an **opinionated provider-native coding distribution**. We did the wiring; you get the useful defaults.

At its core, CC-MIRROR:

1. **Creates** isolated runtime instances
2. **Configures** provider endpoints, model slots, and env defaults
3. **Applies** prompt packs and tweakcc themes
4. **Installs** optional skills (dev-browser, opt-in)
5. **Packages** everything into a single command

Each variant is completely isolated — its own config, sessions, MCP servers, and credentials. Your main installation stays untouched.

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ~/.cc-mirror/                                                          │
│                                                                         │
│  ├── mirror/                         ← Mirror variant                    │
│  │   ├── native/                     Runtime installation               │
│  │   ├── config/                     API keys, sessions, MCP servers    │
│  │   ├── tweakcc/                    Theme customization                │
│  │   └── variant.json                Metadata                           │
│  │                                                                      │
│  ├── zai/                            ← Z.ai variant (GLM models)        │
│  ├── minimax/                        ← MiniMax variant (M2.7)           │
│  └── kimi/                           ← Kimi Code variant (K2.6)          │
│                                                                         │
│  Wrappers: <bin-dir>/mirror, <bin-dir>/zai, ...                         │
└─────────────────────────────────────────────────────────────────────────┘
```

Default `<bin-dir>` is `~/.local/bin` on macOS/Linux and `~/.cc-mirror/bin` on Windows.

**Windows tip:** add `%USERPROFILE%\.cc-mirror\bin` to your `PATH`, or run the `<variant>.cmd` wrapper directly. Each wrapper has a sibling `<variant>.mjs` launcher.

### MCP Servers

Each variant has its own Claude Code config directory. Add MCP servers to:

```text
~/.cc-mirror/<variant>/config/.claude.json
```

cc-mirror keeps provider-managed MCP servers up to date during `npx cc-mirror update`, while preserving unrelated user-added MCP servers in the same file.

For a server that should load in every project for one variant, run the variant wrapper with user scope:

```bash
openrouter mcp add-json airtable '{"command":"npx","args":["@rashidazarang/airtable-mcp"],"env":{"AIRTABLE_TOKEN":"","AIRTABLE_BASE_ID":""}}' --scope user
openrouter mcp list
```

For a server that should live with the current project, use `--scope project`; Claude Code will write `.mcp.json` in that project. The default local scope is project-specific but private, so a server added from one working directory may not appear from another.

---

## Providers

### Mirror

The clean default runtime path. No proxy, no model changes — just isolation and privacy defaults.

```bash
npx cc-mirror quick --provider mirror --name mirror
```

- **No proxy** — Authenticate normally inside the isolated config
- **Isolated config** — Experiment without affecting your main setup
- **Provider presets** — Clean defaults without hidden patches

### Alternative Providers

Want to use different models? CC-MIRROR supports multiple providers:

| Provider       | Models                    | Auth       | Best For                        |
| -------------- | ------------------------- | ---------- | ------------------------------- |
| **Kimi**       | kimi-k2.6                 | Auth Token | Long-context coding (Kimi Code) |
| **MiniMax**    | MiniMax-M2.7              | Auth Token | Unified model experience        |
| **Z.ai**       | GLM-5.1, 5-Turbo, 4.5-Air | Auth Token | Heavy coding with GLM reasoning |
| **OpenRouter** | 100+ models               | Auth Token | Model flexibility, pay-per-use  |
| **Vercel**     | Multi-provider gateway    | Auth Token | Vercel AI Gateway               |
| **Ollama**     | Local + cloud models      | Auth Token | Local-first + hybrid setups     |
| **NanoGPT**    | GPT-5.2 / Gemini 3 Flash  | Auth Token | Pay-as-you-go model access      |
| **CCRouter**   | Ollama, DeepSeek, etc.    | Optional   | Local-first development         |
| **GatewayZ**   | Multi-provider gateway    | Auth Token | Centralized routing             |

### Provider Setup Links

| Provider       | Subscribe                                                     | Get Key/Token                                                    | Docs                                                             |
| -------------- | ------------------------------------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------- |
| **Kimi**       | https://www.kimi.com/code                                     | https://www.kimi.com/code/console                                | https://platform.kimi.ai/docs/guide/agent-support                |
| **MiniMax**    | https://platform.minimax.io/subscribe/coding-plan             | https://platform.minimax.io/user-center/payment/coding-plan      | https://platform.minimax.io/docs                                 |
| **Z.ai**       | https://z.ai/subscribe                                        | https://z.ai/manage-apikey/apikey-list                           | https://z.ai/docs                                                |
| **OpenRouter** | https://openrouter.ai/account                                 | https://openrouter.ai/keys                                       | https://openrouter.ai/docs                                       |
| **Vercel**     | https://vercel.com/ai                                         | https://vercel.com/account/tokens                                | https://vercel.com/docs/ai-gateway                               |
| **Ollama**     | https://ollama.com                                            | https://ollama.com                                               | https://docs.ollama.com/api/anthropic-compatibility              |
| **NanoGPT**    | https://nano-gpt.com                                          | https://nano-gpt.com                                             | https://docs.nano-gpt.com/integrations                           |
| **CCRouter**   | https://github.com/musistudio/claude-code-router#installation | https://github.com/musistudio/claude-code-router#2-configuration | https://github.com/musistudio/claude-code-router#2-configuration |
| **GatewayZ**   | https://gatewayz.ai                                           | https://gatewayz.ai                                              | https://docs.gatewayz.ai/docs/anthropic-compatibility            |

```bash
# Kimi Code (K2.6)
npx cc-mirror quick --provider kimi --api-key "$KIMI_API_KEY"

# MiniMax (MiniMax-M2.7)
npx cc-mirror quick --provider minimax --api-key "$MINIMAX_API_KEY"

# Z.ai (GLM-5.1/5-Turbo/4.5-Air)
npx cc-mirror quick --provider zai --api-key "$Z_AI_API_KEY"

# OpenRouter (100+ models)
npx cc-mirror quick --provider openrouter --api-key "$OPENROUTER_API_KEY" \
  --model-sonnet "provider/balanced-coding-model"

# Vercel AI Gateway
npx cc-mirror quick --provider vercel --api-key "$VERCEL_AI_GATEWAY_KEY" \
  --model-sonnet "provider/balanced-coding-model"

# Ollama
npx cc-mirror quick --provider ollama --api-key "ollama" \
  --model-sonnet "qwen3.5" --model-opus "qwen3.5" --model-haiku "qwen3.5"

# NanoGPT
npx cc-mirror quick --provider nanogpt --api-key "$NANOGPT_API_KEY"

# CC Router (local LLMs)
npx cc-mirror quick --provider ccrouter

# GatewayZ
npx cc-mirror quick --provider gatewayz --api-key "$GATEWAYZ_API_KEY" \
  --model-sonnet "provider/balanced-coding-model"
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
mirror                            # Run Mirror
zai                               # Run Z.ai variant
minimax                           # Run MiniMax variant
kimi                              # Run Kimi Code variant
```

---

## CLI Options

```
--provider <name>        kimi | minimax | zai | openrouter | vercel | ollama | nanogpt | ccrouter | mirror | gatewayz | custom
--name <name>            Variant name (becomes the CLI command)
--api-key <key>          Provider API key
--base-url <url>         Custom API endpoint
--model-sonnet <name>    Map Balanced model slot
--model-opus <name>      Map Primary model slot
--model-haiku <name>     Map Fast model slot
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

| Document                                      | Description                          |
| --------------------------------------------- | ------------------------------------ |
| [Mirror](docs/features/mirror-claude.md)      | Isolated runtime with clean defaults |
| [Architecture](docs/architecture/overview.md) | How CC-MIRROR works under the hood   |
| [Full Documentation](docs/README.md)          | Complete documentation index         |

---

## Related Projects

- [tweakcc](https://github.com/Piebald-AI/tweakcc) — Theme and customize the runtime
- [Claude Code Router](https://github.com/musistudio/claude-code-router) — Local and gateway routing for coding agents
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
