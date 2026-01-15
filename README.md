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
  Pre-configured Claude Code variants with multi-agent orchestration,<br>
  custom providers, and battle-tested enhancements.<br><br>
  <strong>One command. Instant power-up.</strong>
</p>

---

## The Unlock

Claude Code has a hidden multi-agent capability. CC-MIRROR enables it.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                                                                             │
│   BEFORE                              AFTER                                 │
│   ══════                              ═════                                 │
│                                                                             │
│   ┌─────────────────┐                 ┌─────────────────────────────────┐   │
│   │   Claude Code   │                 │   YOUR Claude Code              │   │
│   │                 │     CC-MIRROR   │                                 │   │
│   │  • Single       │    ─────────►   │  ✓ Multi-Agent Orchestration    │   │
│   │    config       │                 │  ✓ Task-based Coordination      │   │
│   │  • No team      │                 │  ✓ Background Agent Spawning    │   │
│   │    mode         │                 │  ✓ Battle-tested Skill          │   │
│   │                 │                 │  ✓ Isolated Config              │   │
│   └─────────────────┘                 └─────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**What gets unlocked:**

| Tool         | Purpose                                                  |
| ------------ | -------------------------------------------------------- |
| `TaskCreate` | Create tasks with subject, description, and dependencies |
| `TaskGet`    | Retrieve full task details by ID                         |
| `TaskUpdate` | Update status, add comments, set blockers                |
| `TaskList`   | List all tasks with summary info                         |

Plus a **battle-tested orchestrator skill** — refined through millions of tokens of iteration — that teaches Claude how to effectively coordinate multiple agents working in parallel.

---

## Quick Start

```bash
# Fastest path to multi-agent Claude Code
npx cc-mirror quick --provider mirror --name mclaude

# Run it
mclaude
```

That's it. You now have Claude Code with team mode enabled.

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
2. **Patches** the CLI to enable hidden features (team mode)
3. **Installs** battle-tested skills (orchestrator, browser automation)
4. **Configures** provider-specific enhancements
5. **Packages** everything into a single command

Each variant is completely isolated — its own config, sessions, MCP servers, and credentials. Your main Claude Code installation stays untouched.

```
┌─────────────────────────────────────────────────────────────────────────┐
│  ~/.cc-mirror/                                                          │
│                                                                         │
│  ├── mclaude/                        ← Mirror Claude (team mode)        │
│  │   ├── npm/                        Claude Code installation           │
│  │   ├── config/                     API keys, sessions, MCP servers    │
│  │   │   ├── tasks/<team>/           Team task storage                  │
│  │   │   └── skills/orchestration/   Orchestrator skill                 │
│  │   ├── tweakcc/                    Theme customization                │
│  │   └── variant.json                Metadata                           │
│  │                                                                      │
│  ├── zai/                            ← Z.ai variant (GLM models)        │
│  └── minimax/                        ← MiniMax variant (M2.1)           │
│                                                                         │
│  Wrappers: ~/.local/bin/mclaude, ~/.local/bin/zai, ...                  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Providers

### Mirror Claude (Recommended)

The purest path to multi-agent Claude Code. No proxy, no model changes — just Claude with superpowers.

```bash
npx cc-mirror quick --provider mirror --name mclaude
```

- **Direct Anthropic API** — No proxy, authenticate normally (OAuth or API key)
- **Team mode enabled** — The hidden tools, unlocked
- **Orchestrator skill** — Battle-tested multi-agent coordination
- **Isolated config** — Experiment without affecting your main setup

### Alternative Providers

Want to use different models? CC-MIRROR supports multiple providers, all with team mode:

| Provider       | Models                 | Auth       | Best For                        |
| -------------- | ---------------------- | ---------- | ------------------------------- |
| **Z.ai**       | GLM-4.7, GLM-4.5-Air   | API Key    | Heavy coding with GLM reasoning |
| **MiniMax**    | MiniMax-M2.1           | API Key    | Unified model experience        |
| **OpenRouter** | 100+ models            | Auth Token | Model flexibility, pay-per-use  |
| **CCRouter**   | Ollama, DeepSeek, etc. | Optional   | Local-first development         |

```bash
# Z.ai (GLM Coding Plan)
npx cc-mirror quick --provider zai --api-key "$Z_AI_API_KEY"

# MiniMax (MiniMax-M2.1)
npx cc-mirror quick --provider minimax --api-key "$MINIMAX_API_KEY"

# OpenRouter (100+ models)
npx cc-mirror quick --provider openrouter --api-key "$OPENROUTER_API_KEY" \
  --model-sonnet "anthropic/claude-sonnet-4-20250514"

# Claude Code Router (local LLMs)
npx cc-mirror quick --provider ccrouter
```

---

## The Orchestrator Skill

When team mode is enabled, CC-MIRROR installs an **orchestrator skill** that teaches Claude how to coordinate work effectively.

### The Conductor Identity

Claude becomes "The Conductor" — a warm, capable orchestrator who transforms ambitious requests into elegant execution:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│    You are the Conductor. Users bring the vision.               │
│    You orchestrate the symphony of agents that makes it real.   │
│                                                                 │
│    Complex work should feel effortless.                         │
│    That's your gift to every user.                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### What It Provides

| Aspect                 | What Claude Learns                               |
| ---------------------- | ------------------------------------------------ |
| **Task Graph**         | Decompose work into tasks with dependencies      |
| **Parallel Execution** | Fan-out, pipeline, map-reduce patterns           |
| **Background Agents**  | Spawn agents that work while you continue        |
| **Smart Prompting**    | Context, scope, constraints, output expectations |
| **Progress Updates**   | Milestone celebrations, warm professional tone   |

### Example Flow

```
User: "Build me a REST API for todo management with tests"

Claude (The Conductor):
├── Clarifies requirements (AskUserQuestion with rich options)
├── Creates task graph with dependencies
├── Spawns background agents for parallel work:
│   ├── Agent 1: Database schema
│   ├── Agent 2: API routes (blocked by schema)
│   └── Agent 3: Test setup
├── Continues working while agents execute
├── Synthesizes results
└── Delivers unified output
```

> [Full Team Mode Documentation](docs/features/team-mode.md)

---

## Project-Scoped Tasks

Tasks are automatically isolated by project folder — no cross-project pollution:

```bash
cd ~/projects/api && mclaude      # Team: mclaude-api
cd ~/projects/frontend && mclaude # Team: mclaude-frontend

# Multiple teams in the same project
TEAM=backend mclaude   # Team: mclaude-myproject-backend
TEAM=frontend mclaude  # Team: mclaude-myproject-frontend
```

### CLI Task Management

Manage team tasks from the command line:

```bash
npx cc-mirror tasks                    # List open tasks
npx cc-mirror tasks --ready            # List ready tasks (open + not blocked)
npx cc-mirror tasks --json             # JSON output for automation
npx cc-mirror tasks show 18            # Show task details
npx cc-mirror tasks create             # Create new task
npx cc-mirror tasks update 5 --status resolved
npx cc-mirror tasks graph              # Visualize dependencies
npx cc-mirror tasks graph --json       # Graph as JSON for programmatic use
npx cc-mirror tasks clean --resolved   # Cleanup done tasks
```

---

## Disabling Team Mode

Team mode is enabled by default on all variants. If you want vanilla Claude Code behavior:

```bash
# Create without team mode
npx cc-mirror create --provider mirror --name vanilla --no-team-mode

# Disable on existing variant
npx cc-mirror update myvariant --disable-team-mode
```

Or toggle via the TUI: **Manage Variants → Toggle Team Mode**

---

## All Commands

```bash
# Create & manage variants
npx cc-mirror                     # Interactive TUI
npx cc-mirror quick [options]     # Fast setup with defaults
npx cc-mirror create [options]    # Full configuration wizard
npx cc-mirror list                # List all variants
npx cc-mirror update [name]       # Update one or all variants
npx cc-mirror remove <name>       # Delete a variant
npx cc-mirror doctor              # Health check all variants
npx cc-mirror tweak <name>        # Launch tweakcc customization

# Task management
npx cc-mirror tasks               # List open tasks
npx cc-mirror tasks show <id>     # Show task details
npx cc-mirror tasks create        # Create new task
npx cc-mirror tasks update <id>   # Update task
npx cc-mirror tasks delete <id>   # Delete task
npx cc-mirror tasks archive <id>  # Archive task
npx cc-mirror tasks clean         # Bulk cleanup
npx cc-mirror tasks graph         # Visualize dependencies

# Launch your variant
mclaude                           # Run Mirror Claude
zai                               # Run Z.ai variant
minimax                           # Run MiniMax variant
```

---

## CLI Options

```
--provider <name>        mirror | zai | minimax | openrouter | ccrouter | custom
--name <name>            Variant name (becomes the CLI command)
--api-key <key>          Provider API key
--base-url <url>         Custom API endpoint
--model-sonnet <name>    Map to sonnet model
--model-opus <name>      Map to opus model
--model-haiku <name>     Map to haiku model
--brand <preset>         Theme: auto | zai | minimax | openrouter | ccrouter | mirror
--no-team-mode           Disable team mode (not recommended)
--no-tweak               Skip tweakcc theme
--no-prompt-pack         Skip provider prompt pack
```

---

## Brand Themes

Each provider includes a custom color theme via [tweakcc](https://github.com/Piebald-AI/tweakcc):

| Brand          | Style                            |
| -------------- | -------------------------------- |
| **mirror**     | Silver/chrome with electric blue |
| **zai**        | Dark carbon with gold accents    |
| **minimax**    | Coral/red/orange spectrum        |
| **openrouter** | Teal/cyan gradient               |
| **ccrouter**   | Sky blue accents                 |

---

## Documentation

| Document                                        | Description                         |
| ----------------------------------------------- | ----------------------------------- |
| [Team Mode](docs/features/team-mode.md)         | Multi-agent collaboration deep dive |
| [Mirror Claude](docs/features/mirror-claude.md) | Pure Claude Code with superpowers   |
| [Architecture](docs/architecture/overview.md)   | How CC-MIRROR works under the hood  |
| [Full Documentation](docs/README.md)            | Complete documentation index        |

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
