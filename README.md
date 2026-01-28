# claude-sneakpeek

Get a parallel build of Claude Code that unlocks feature-flagged capabilities like swarm mode.

Demo video of swarm mode in action: https://x.com/NicerInPerson/status/2014989679796347375

This installs a completely isolated instance of Claude Code—separate config, sessions, MCP servers, and credentials. Your existing Claude Code installation is untouched.

## Install

```bash
npx @realmikekelly/claude-sneakpeek quick --name claudesp
```

Add `~/.local/bin` to your PATH if not already (macOS/Linux):

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc && source ~/.zshrc
```

Then run `claudesp` to launch.

## What gets unlocked?

Features that are built into Claude Code but not yet publicly released:

- **Swarm mode** — Native multi-agent orchestration with `TeammateTool`
- **Delegate mode** — Task tool can spawn background agents
- **Team coordination** — Teammate messaging and task ownership

## Commands

```bash
npx @realmikekelly/claude-sneakpeek quick --name claudesp   # Install
npx @realmikekelly/claude-sneakpeek update claudesp         # Update
npx @realmikekelly/claude-sneakpeek remove claudesp         # Uninstall
```

## Where things live

```
~/.claude-sneakpeek/claudesp/
├── npm/           # Patched Claude Code
├── config/        # Isolated config, sessions, MCP servers
└── variant.json

~/.local/bin/claudesp   # Wrapper script
```

## Alternative providers

Supports Z.ai, MiniMax, OpenRouter, and local models via cc-mirror. See [docs/providers.md](docs/providers.md).

## Credits

Fork of [cc-mirror](https://github.com/numman-ali/cc-mirror) by Numman Ali.

## License

MIT
