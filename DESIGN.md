# cc-mirror Design

## Goals

- Create multiple isolated Claude Code variants, each with its own config + session store.
- Provide a **full-screen TUI** for discovery, creation, and management.
- Support unlimited providers with editable templates.
- Keep any global Claude Code install untouched.

## Architecture

```
  .-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-.
  |          ~/.cc-mirror/<variant>        |
  '-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-'
   |-- npm/              # npm install root (cli.js lives here)
   |-- config/           # CLAUDE_CONFIG_DIR
   |   |-- settings.json # env overrides
   |   '-- .claude.json  # API-key approvals + MCP server seeds
   |-- tweakcc/          # tweakcc config/backup
   |   |-- config.json   # brand preset + theme config
   |   '-- system-prompts/ # prompt fragment overlays (prompt packs)
   '-- variant.json      # metadata

  wrapper -> <bin-dir>/<variant>
```

Wrappers are installed into `<bin-dir>/<variant>` (configurable).
Default `<bin-dir>` is `~/.local/bin` on macOS/Linux and `~/.cc-mirror/bin` on Windows.

## Core Components

- `src/providers/index.ts` — provider templates and env defaults
- `src/brands/` — tweakcc brand presets (optional UI skins)
- `src/core/` — file ops, tweakcc patching, variant CRUD (split by concern)
- `src/cli/index.ts` — CLI entrypoint, launches TUI when interactive
- `src/tui/` — Ink-based TUI wizard (components + app + entrypoint)
- `tweakcc` (dependency) — applies `cli.js` patches for each variant

## TUI Flow

- **Home**: create, manage, update-all, doctor
- **Quick setup**:
  - provider template
  - API key
  - variant name (optional)
  - npm install + tweakcc
- **Create wizard** (advanced):
  - provider template
  - brand preset (optional)
  - variant name
  - base URL
  - API key
  - root + bin dirs
  - npm package (version pinned)
  - tweakcc toggle
  - provider prompt pack toggle
  - dev-browser skill install toggle
  - optional env overrides
  - summary + confirm
- **Manage**:
  - list variants
  - update / remove
- **Doctor**:
  - sanity report for binaries + wrappers

## Updating Binaries

- `cc-mirror update` re-runs `npm install` for the pinned package/version and re-applies tweakcc.

## Maintenance Checklist

- Update all variants after Claude Code upgrades: `cc-mirror update`
- Update a single variant: `cc-mirror update <name>`
- Reapply or change brand preset: `cc-mirror update <name> --brand zai`
- Adjust API keys/base URL: edit `~/.cc-mirror/<variant>/config/settings.json`
- Launch tweakcc UI for a variant: `cc-mirror tweak <name>`
- Opt out of prompt packs: `--no-prompt-pack`
- Select prompt pack mode: `--prompt-pack-mode minimal|maximal`
- Opt out of skill install: `--no-skill-install`

## Provider Extensibility

Provider templates are plain TS objects; add new providers by extending `src/providers/index.ts`.

## Auth Handling

When an API key is supplied, cc-mirror writes `ANTHROPIC_API_KEY` into the variant config
so Claude Code recognizes API-key auth during onboarding.

Wrappers also load `settings.json` env vars at launch, ensuring onboarding sees API-key auth
before Claude Code applies config env internally.

For Z.ai variants, cc-mirror also sets `Z_AI_API_KEY` to the same value by default (used by `zai-cli`), unless the user overrides it via extra env. Quick/TUI flows can also write it into the shell profile (opt out with `--no-shell-env`).

cc-mirror also stores the **last 20 characters** of the API key in
`~/.cc-mirror/<variant>/config/.claude.json` under `customApiKeyResponses.approved` so Claude Code
skips the OAuth login screen in interactive mode.

Brand presets stamp the user label for the chat banner from `CLAUDE_CODE_USER_LABEL` (fallback: OS username).

`ANTHROPIC_AUTH_TOKEN` is stripped from variant settings and wrappers; variants are API-key only to avoid auth conflicts.

MiniMax variants seed a default MCP server entry in `~/.cc-mirror/<variant>/config/.claude.json` so the coding-plan MCP is ready once you add your API key.

Z.ai variants add a deny list for known server-side MCP tools in `~/.cc-mirror/<variant>/config/settings.json`, pushing the model toward `zai-cli`.

Prompt packs (provider overlays) are injected into tweakcc prompt fragments after tweakcc runs, then re-applied so the patched binary includes provider guidance.

dev-browser is installed into `~/.cc-mirror/<variant>/config/skills/dev-browser` by default for Z.ai and MiniMax variants (opt out with `--no-skill-install`).

## Brand Presets

Brand presets are optional tweakcc configurations written into `~/.cc-mirror/<variant>/tweakcc/config.json`.
Presets are provider-aware (e.g., `zai` auto-selects the Z.ai Carbon skin, `minimax` selects MiniMax Pulse) but can be overridden via `--brand`.

## Install (npm-only)

cc-mirror always installs `@anthropic-ai/claude-code@2.0.76` into `~/.cc-mirror/<variant>/npm` and runs its `cli.js`.
Use `--npm-package` to override the package name; the version stays pinned.
