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

| Document                                    | Description                           |
| ------------------------------------------- | ------------------------------------- |
| [Quick Start](../README.md#quick-start)     | Install and create your first variant |
| [CLI Reference](reference/cli-reference.md) | All commands, flags, and options      |

### 🤖 Features

| Document                                   | Description                          |
| ------------------------------------------ | ------------------------------------ |
| [Team Mode](features/team-mode.md)         | Legacy team mode (cc-mirror 1.6.3)   |
| [Mirror Claude](features/mirror-claude.md) | Pure Claude Code with clean defaults |
| [Brand Themes](features/brand-themes.md)   | Custom color schemes per provider    |
| [Prompt Packs](features/prompt-packs.md)   | Enhanced system prompts              |

### 🏗️ Architecture

| Document                                               | Description                        |
| ------------------------------------------------------ | ---------------------------------- |
| [Overview](architecture/overview.md)                   | How cc-mirror works under the hood |
| [Provider System](architecture/provider-system.md)     | Adding and configuring providers   |
| [Variant Lifecycle](architecture/variant-lifecycle.md) | Create, update, and remove flows   |

### 🔧 Reference

| Document                                                    | Description                |
| ----------------------------------------------------------- | -------------------------- |
| [Configuration](reference/configuration.md)                 | All config files explained |
| [Environment Variables](reference/environment-variables.md) | Env var reference          |
| [Tweakcc Guide](TWEAKCC-GUIDE.md)                           | Theme customization        |

---

## 🗺️ Quick Navigation

```
docs/
├── README.md                 ← You are here
├── features/
│   ├── team-mode.md         # 🤖 Multi-agent collaboration (legacy)
│   ├── mirror-claude.md     # 🪞 Pure Claude Code variant
│   ├── brand-themes.md      # 🎨 Custom themes
│   └── prompt-packs.md      # 📝 System prompt enhancements
├── architecture/
│   ├── overview.md          # 🏗️ System architecture
│   ├── provider-system.md   # 🔌 Provider configuration
│   └── variant-lifecycle.md # 🔄 Create/update flows
└── reference/
    ├── cli-reference.md     # 💻 CLI commands
    ├── configuration.md     # ⚙️ Config files
    └── environment-variables.md # 🔑 Env vars
```

---

## 💡 Quick Links

- **New to cc-mirror?** Start with the [Quick Start](../README.md#quick-start)
- **Want team features?** Legacy docs: [Team Mode](features/team-mode.md)
- **Pure Claude experience?** Try [Mirror Claude](features/mirror-claude.md)
- **Adding a provider?** See [Provider System](architecture/provider-system.md)

---

## 📊 Provider Comparison

```
┌──────────────┬─────────────────┬──────────────┬────────────┐
│   Provider   │     Model       │  Auth Mode   │ Prompt Pack│
├──────────────┼─────────────────┼──────────────┼────────────┤
│ zai          │ GLM-4.7         │ API Key      │ ✓ Full     │
│ minimax      │ MiniMax-M2.1    │ API Key      │ ✓ Full     │
│ openrouter   │ You choose      │ Auth Token   │ ✗          │
│ ccrouter     │ Local LLMs      │ Optional     │ ✗          │
│ mirror       │ Claude (native) │ OAuth/Key    │ ✗ Pure     │
└──────────────┴─────────────────┴──────────────┴────────────┘
```

---

<p align="center">
  <strong>Created by <a href="https://github.com/numman-ali">Numman Ali</a></strong>
</p>
