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
│   Create multiple isolated Claude Code variants with custom providers        │
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

| Document                                   | Description                          |
| ------------------------------------------ | ------------------------------------ |
| [Mirror Claude](features/mirror-claude.md) | Pure Claude Code with clean defaults |

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
│   └── mirror-claude.md       # 🪞 Pure Claude Code variant
└── architecture/
    └── overview.md            # 🏗️ System architecture
```

---

## 💡 Quick Links

- **New to cc-mirror?** Start with the [Quick Start](../README.md#quick-start)
- **Pure Claude experience?** Try [Mirror Claude](features/mirror-claude.md)
- **Adding a provider?** See [Provider System](architecture/provider-system.md)

---

## 📊 Provider Comparison

```
┌──────────────┬────────────────────┬──────────────┬────────────┐
│   Provider   │       Model        │  Auth Mode   │ Prompt Pack│
├──────────────┼────────────────────┼──────────────┼────────────┤
│ zai          │ GLM-4.7            │ API Key      │ ✓ Full     │
│ minimax      │ MiniMax-M2.1       │ API Key      │ ✓ Full     │
│ kimi         │ kimi-for-coding    │ API Key      │ ✗          │
│ openrouter   │ You choose         │ Auth Token   │ ✗          │
│ ccrouter     │ Local LLMs         │ Optional     │ ✗          │
│ ollama       │ Local + cloud      │ Auth Token   │ ✗          │
│ gatewayz     │ GatewayZ gateway   │ Auth Token   │ ✗          │
│ vercel       │ Vercel gateway     │ Auth Token   │ ✗          │
│ nanogpt      │ Anthropic compat   │ Auth Token   │ ✗          │
│ mirror       │ Claude (native)    │ OAuth/Key    │ ✗ Pure     │
└──────────────┴────────────────────┴──────────────┴────────────┘
```

---

<p align="center">
  <strong>Created by <a href="https://github.com/numman-ali">Numman Ali</a></strong>
</p>
