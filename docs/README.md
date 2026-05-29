# CC-MIRROR Documentation

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│   ╭─────╮╭─────╮    ╭───╮╭───╮╭───╮╭───────╮╭───────╮╭───────╮╭───────╮     │
│   │ ╭───╯│ ╭───╯    │ ╭╮╯│ ╭─╯╰─╮ ││ ╭─╮ ╭─╯│ ╭─╮ ╭─╯│ ╭───╮ ││ ╭─╮ ╭─╯     │
│   │ │    │ │   ╭────│ ││ │ │  ╭─╯ ││ ╰─╯ │  │ ╰─╯ │  │ │   │ ││ ╰─╯ │       │
│   │ ╰───╮│ ╰───╯    │ ╰╯╭╯ ╰──╯ ╭─╯│ ╭─╮ │  │ ╭─╮ │  │ ╰───╯ ││ ╭─╮ │       │
│   ╰─────╯╰─────╯    ╰───╯╰──────╯  ╰─╯ ╰─╯  ╰─╯ ╰─╯  ╰───────╯╰─╯ ╰─╯       │
│                                                                              │
│   Create multiple isolated coding variants with custom providers             │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

## 📚 Documentation Index

### ⚡ Getting Started

| Document                                | Description                           |
| --------------------------------------- | ------------------------------------- |
| [Quick Start](../README.md#quick-start) | Install and create your first variant |
| [CLI Options](../README.md#cli-options) | Commands, flags, and options          |

### 🤖 Features

| Document                            | Description                          |
| ----------------------------------- | ------------------------------------ |
| [Mirror](features/mirror-claude.md) | Isolated runtime with clean defaults |

### 🏗️ Architecture

| Document                             | Description                        |
| ------------------------------------ | ---------------------------------- |
| [Overview](architecture/overview.md) | How cc-mirror works under the hood |

### 🔧 Reference

| Document                          | Description         |
| --------------------------------- | ------------------- |
| [Tweakcc Guide](TWEAKCC-GUIDE.md) | Theme customization |

---

## 🗺️ Quick Navigation

```
docs/
├── README.md                 ← You are here
├── TWEAKCC-GUIDE.md           # 🔧 tweakcc integration notes
├── features/
│   └── mirror-claude.md       # Mirror variant
└── architecture/
    └── overview.md            # 🏗️ System architecture
```

---

## 💡 Quick Links

- **New to cc-mirror?** Start with the [Quick Start](../README.md#quick-start)
- **Clean isolated runtime?** Try [Mirror](features/mirror-claude.md)
- **Adding a provider?** See [Provider System](architecture/provider-system.md)

---

## 📊 Provider Comparison

```
┌──────────────┬────────────────────┬──────────────┬────────────┐
│   Provider   │       Model        │  Auth Mode   │ Prompt Pack│
├──────────────┼────────────────────┼──────────────┼────────────┤
│ kimi         │ kimi-k2.6          │ Auth Token   │ ✗          │
│ minimax      │ MiniMax-M2.7       │ Auth Token   │ ✓ Full     │
│ zai          │ GLM-5.1/5-Turbo/4.5-Air │ Auth Token   │ ✓ Full     │
│ openrouter   │ You choose         │ Auth Token   │ ✗          │
│ vercel       │ Vercel gateway     │ Auth Token   │ ✗          │
│ ollama       │ Local + cloud      │ Auth Token   │ ✗          │
│ nanogpt      │ GPT-5.2 / Gemini   │ Auth Token   │ ✗          │
│ ccrouter     │ Local LLMs         │ Optional     │ ✗          │
│ mirror       │ Runtime default    │ OAuth/Key    │ ✗ Pure     │
│ gatewayz     │ GatewayZ gateway   │ Auth Token   │ ✗          │
└──────────────┴────────────────────┴──────────────┴────────────┘
```

---

## 🔗 Provider Setup Links

| Provider     | Subscribe                                                     | Get Key/Token                                                    | Docs                                                             |
| ------------ | ------------------------------------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------- |
| `kimi`       | https://www.kimi.com/code                                     | https://www.kimi.com/code/console                                | https://platform.kimi.ai/docs/guide/agent-support                |
| `minimax`    | https://platform.minimax.io/subscribe/coding-plan             | https://platform.minimax.io/user-center/payment/coding-plan      | https://platform.minimax.io/docs                                 |
| `zai`        | https://z.ai/subscribe                                        | https://z.ai/manage-apikey/apikey-list                           | https://z.ai/docs                                                |
| `openrouter` | https://openrouter.ai/account                                 | https://openrouter.ai/keys                                       | https://openrouter.ai/docs                                       |
| `vercel`     | https://vercel.com/ai                                         | https://vercel.com/account/tokens                                | https://vercel.com/docs/ai-gateway                               |
| `ollama`     | https://ollama.com                                            | https://ollama.com                                               | https://docs.ollama.com/api/anthropic-compatibility              |
| `nanogpt`    | https://nano-gpt.com                                          | https://nano-gpt.com                                             | https://docs.nano-gpt.com/integrations                           |
| `ccrouter`   | https://github.com/musistudio/claude-code-router#installation | https://github.com/musistudio/claude-code-router#2-configuration | https://github.com/musistudio/claude-code-router#2-configuration |
| `gatewayz`   | https://gatewayz.ai                                           | https://gatewayz.ai                                              | https://docs.gatewayz.ai/docs/anthropic-compatibility            |

---

<p align="center">
  <strong>Created by <a href="https://github.com/numman-ali">Numman Ali</a></strong>
</p>
