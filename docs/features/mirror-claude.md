# 🪞 Mirror Claude

Mirror Claude is a **pure Claude Code variant** with advanced features enabled. Unlike other providers that proxy through custom APIs, Mirror connects directly to Anthropic's API while providing isolation and enhanced capabilities.

---

## Overview

```
┌────────────────────────────────────────────────────────────────────────────┐
│                                                                            │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                    PROXY PROVIDERS                                  │  │
│   │                                                                     │  │
│   │   Z.ai ──────────▶ GLM API ────────▶ GLM-5.1/5-Turbo/4.5-Air     │  │
│   │   MiniMax ────────▶ MiniMax API ───▶ MiniMax-M2.7                  │  │
│   │   Kimi ───────────▶ Kimi API ──────▶ kimi-k2.6                    │  │
│   │                                                                     │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                    GATEWAY PROVIDERS                                │  │
│   │                                                                     │  │
│   │   OpenRouter ─────▶ 100+ models (pay-per-use)                      │  │
│   │   Vercel ─────────▶ Vercel AI Gateway                              │  │
│   │   NanoGPT ────────▶ Claude Code endpoint                           │  │
│   │   GatewayZ ───────▶ Multi-provider gateway                         │  │
│   │   CC Router ──────▶ Ollama / DeepSeek / local LLMs                 │  │
│   │   Ollama ─────────▶ Local + cloud models                           │  │
│   │                                                                     │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│   ┌─────────────────────────────────────────────────────────────────────┐  │
│   │                    DIRECT PROVIDER                                  │  │
│   │                                                                     │  │
│   │   Mirror ─────────────────────────▶ Anthropic API (no proxy)       │  │
│   │                                                                     │  │
│   └─────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

**Key difference**: Mirror Claude doesn't override `ANTHROPIC_BASE_URL`, `ANTHROPIC_API_KEY`, or any model settings. You authenticate exactly like vanilla Claude Code.

---

## ⚡ Quick Start

```bash
# Create a Mirror Claude variant
npx cc-mirror create --provider mirror --name mclaude

# Run it - authenticate via normal Claude flow
mclaude
```

No API key required at setup. When you run `mclaude`, authenticate via:

1. **OAuth** - Sign in through Anthropic Console (subscription)
2. **API Key** - Set `ANTHROPIC_API_KEY` environment variable

---

## 🎯 What You Get

| Feature               | Description                                               |
| --------------------- | --------------------------------------------------------- |
| 🎨 **Premium Theme**  | Silver/chrome aesthetic with electric blue accents        |
| 📁 **Full Isolation** | Separate config and sessions                              |
| ✨ **Pure Claude**    | No prompt packs or model overrides - authentic experience |

---

## 📊 Provider Comparison

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                                                                         │
│   Feature            │ zai/minimax │ kimi     │ openrouter │ ollama   │ mirror          │
│   ───────────────────┼────────────┼──────────┼────────────┼──────────┼─────────────────│
│   Model              │ GLM / M2.7 │ K2.6     │ You choose │ Local    │ Claude (native) │
│   Auth Mode          │ Auth Token │ Auth Tok │ Auth Token │ Auth Tok │ OAuth or Key    │
│   ANTHROPIC_BASE_URL │ ✓ Set      │ ✓ Set    │ ✓ Set      │ ✓ Set    │ ✗ Not set       │
│   Model Mappings     │ ✓ Auto     │ ✓ Auto   │ ✓ Required │ Required │ ✗ Not set       │
│   Prompt Pack        │ ✓ Minimal  │ ✗        │ ✗          │ ✗        │ ✗ Pure          │
│   Config Isolation   │ ✓          │ ✓        │ ✓          │ ✓        │ ✓               │
│                                                                                         │
│   Also available: Vercel, NanoGPT, GatewayZ (auth token), CC Router (optional auth)    │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🔧 When to Use Mirror Claude

### Perfect For

- **Power users** who want isolated Claude Code instances
- **Experimentation** - isolated config for testing hooks, skills, MCP servers
- **Multiple accounts** - keep work and personal Claude sessions separate

### Not For

- **Different models** - use OpenRouter or CCRouter for alternative LLMs
- **Cost savings** - Z.ai and MiniMax offer Coding Plan subscriptions
- **Offline use** - Mirror requires Anthropic API access

---

## 🎨 Theme Preview

Mirror Claude features a distinctive silver/chrome theme:

```
┌───────────────────────────────────────────┐
│                                           │
│   Primary:    Silver    #C0C0C0           │
│   Accent:     Electric  #00D4FF           │
│   Secondary:  Purple    #6B5B95           │
│   Background: Near-black metallic         │
│                                           │
│   Thinking verbs:                         │
│   Reflecting, Refracting, Projecting,     │
│   Mirroring, Amplifying, Focusing,        │
│   Polishing, Crystallizing...             │
│                                           │
└───────────────────────────────────────────┘
```

---

## 🔑 Authentication

Mirror Claude uses standard Claude Code authentication:

### Option 1: OAuth (Anthropic Subscription)

```bash
mclaude
# Follow the OAuth prompt to sign in
```

### Option 2: API Key

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
mclaude
```

### Option 3: Console API Key

```bash
# Get your key from https://console.anthropic.com/settings/keys
mclaude
# Enter key when prompted
```

---

## 📁 Variant Structure

```
┌─────────────────────────────────────────────────────────┐
│  ~/.cc-mirror/mclaude/                                  │
│  ├── native/                 Claude Code installation   │
│  ├── config/                                            │
│  │   ├── settings.json       Minimal env (splash only)  │
│  │   ├── .claude.json        MCP servers, approvals     │
│  ├── tweakcc/                                           │
│  │   └── config.json         Mirror theme config        │
│  └── variant.json            Variant metadata           │
│                                                         │
│  Wrapper: <bin-dir>/mclaude                             │
└─────────────────────────────────────────────────────────┘
```

Default `<bin-dir>` is `~/.local/bin` on macOS/Linux and `~/.cc-mirror/bin` on Windows.

**Windows tip:** add `%USERPROFILE%\.cc-mirror\bin` to `PATH` (wrapper is `<variant>.cmd` with a sibling `<variant>.mjs` launcher).

### What Mirror Sets

```json
{
  "env": {
    "CC_MIRROR_SPLASH": "1",
    "CC_MIRROR_PROVIDER_LABEL": "Mirror Claude",
    "CC_MIRROR_SPLASH_STYLE": "mirror",
    "DISABLE_AUTOUPDATER": "1"
  }
}
```

### What Mirror Does NOT Set

- `ANTHROPIC_BASE_URL` - Uses Claude Code default
- `ANTHROPIC_API_KEY` - User authenticates normally
- `ANTHROPIC_DEFAULT_*_MODEL` - Uses Claude Code defaults

---

## 💡 Tips

### Combine with Other Features

```bash
# Mirror with shell env integration (for Zsh/Bash profile)
npx cc-mirror create --provider mirror --name mclaude --shell-env
```

### Run Multiple Mirrors

```bash
# Work account
npx cc-mirror create --provider mirror --name work-claude

# Personal account
npx cc-mirror create --provider mirror --name personal-claude

# Run each with different API keys
ANTHROPIC_API_KEY="$WORK_KEY" work-claude
ANTHROPIC_API_KEY="$PERSONAL_KEY" personal-claude
```

---

## 🔙 Related

- [Brand Themes](brand-themes.md) - Theme customization
- [Architecture Overview](../architecture/overview.md) - How cc-mirror works
