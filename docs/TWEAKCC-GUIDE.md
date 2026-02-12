# tweakcc Integration Guide (cc-mirror)

This document summarizes tweakcc capabilities and concrete implementation ideas for cc-mirror variants. It is intentionally practical: you can copy/paste snippets, adopt patterns, or expand into your own presets.

## What tweakcc can do (from upstream README)

- Edit Claude Code system prompts (core prompt, tool descriptions, agent prompts, utilities, etc.)
- Create custom themes (RGB/HSL picker), and switch themes in Claude Code
- Create and manage toolsets (and use them via Claude Code’s `/toolset`)
- Style user messages (custom label, borders, colors, padding)
- Customize thinking verbs and spinner animation (phases + speed)
- Remove the input box border
- Expand thinking blocks by default
- Enable session naming commands like `/title` and `/rename`
- Configure subagent models (Plan/Explore/etc.)
- Input pattern highlighters (highlight keywords while typing)
- Table format toggles (Unicode/ASCII/markdown styles)
- Session memory and “remember” features (optional)
- Suppress installer warnings (useful when you manage Claude installs manually)
- Misc UX patches (hide startup banner, hide clawd logo, hide “Ctrl+G to edit prompt” hint, etc.)
- A large library of built-in patches, plus advanced `unpack`/`repack`/`adhoc-patch` workflows

tweakcc can patch either:

- **npm-based installs** (patches `cli.js` directly), or
- **native installs** (extracts the bundled JS from the `claude` binary, patches it, then repacks the binary).

## How cc-mirror uses tweakcc

- Per-variant config lives at:
  - `~/.cc-mirror/<variant>/tweakcc/config.json`
  - `~/.cc-mirror/<variant>/tweakcc/system-prompts/`
- Patch apply uses:
  - `TWEAKCC_CONFIG_DIR=~/.cc-mirror/<variant>/tweakcc`
  - `TWEAKCC_CC_INSTALLATION_PATH=...` (cc-mirror uses the native `~/.cc-mirror/<variant>/native/claude` binary)
- cc-mirror applies tweakcc after create/update, unless `--no-tweak`.
  - To re-apply patches without reinstalling Claude Code, run: `npx cc-mirror apply <variant>`
- cc-mirror pins the tweakcc CLI version it runs (see `src/core/constants.ts`), so updates are reproducible. (You can still manually run a different version via `npx tweakcc@latest` if you need a hotfix for a brand-new Claude Code release.)

### Tool restrictions (no toolsets)

cc-mirror intentionally does **not** manage tweakcc toolsets.

Instead, provider-specific tool restrictions (for example blocking `WebSearch` so the provider MCP can be used) are enforced via Claude Code's native `settings.json`:

- `~/.cc-mirror/<variant>/config/settings.json` → `permissions.deny`

This keeps the UX stable and avoids relying on UI-level toolset patches inside the `claude` binary.

## Manual tweakcc for a single variant

Use this when you want to manually enable optional tweakcc features (for example swarm mode or session memory) on one variant without adding new cc-mirror UI settings.

### Fast path (recommended)

```bash
npx cc-mirror tweak <variant>
```

### Direct path (explicit target)

```bash
VARIANT=<variant>
TWEAKCC_CONFIG_DIR="$HOME/.cc-mirror/$VARIANT/tweakcc" \
TWEAKCC_CC_INSTALLATION_PATH="$HOME/.cc-mirror/$VARIANT/native/claude" \
npx tweakcc@4.0.1
```

### Apply specific optional patches

```bash
VARIANT=<variant>
TWEAKCC_CONFIG_DIR="$HOME/.cc-mirror/$VARIANT/tweakcc" \
TWEAKCC_CC_INSTALLATION_PATH="$HOME/.cc-mirror/$VARIANT/native/claude" \
npx tweakcc@4.0.1 --apply --patches "<patch-a>,<patch-b>"
```

Patch names depend on your tweakcc version. Run `npx tweakcc@4.0.1 --help` (or open the tweakcc UI patch list) to confirm available patch IDs.

## Recommended implementation patterns

### 1) Theme design (brand identity)

Goal: make each provider unmistakable while keeping readability.

Implementation suggestions:

- Choose a single signature accent color ("claude"/"bashBorder") and 1-2 supporting colors.
- Keep `background` and `text` high-contrast (use light backgrounds only if your terminal supports it).
- Use muted tinted backgrounds for:
  - `userMessageBackground`
  - `bashMessageBackgroundColor`
  - `memoryBackgroundColor`
- Keep `promptBorder` and `promptBorderShimmer` slightly darker than background, so focus rings show.

Example snippet (light theme with strong accents):

```
{
  "name": "MiniMax Pulse",
  "id": "minimax-pulse",
  "colors": {
    "claude": "rgb(255,77,77)",
    "claudeShimmer": "rgb(255,140,140)",
    "background": "rgb(245,245,245)",
    "text": "rgb(17,17,17)",
    "promptBorder": "rgb(229,209,255)",
    "userMessageBackground": "rgb(255,235,240)"
  }
}
```

### 2) User message display (chat banner)

Make the user label obvious and brand-consistent.

Suggested settings:

- `format`: ` [<username>] {}`
- `borderStyle`: `topBottomBold` or `topBottomDouble`
- `fitBoxToContent`: `true`

### 3) Thinking verbs + spinner

Make the "thinking" feel unique.

Ideas:

- Short, punchy verbs for fast models ("Routing", "Syncing")
- Longer verbs for more "deliberate" feel ("Calibrating", "Synthesizing")
- Spinner phases like `['·','•','◦','•']` for clean minimal rhythm

### 4) Input box + misc UX

Tweakcc can simplify the UI:

```
"inputBox": { "removeBorder": true },
  "misc": {
  "showPatchesApplied": true,
  "hideStartupBanner": false,
  "hideStartupClawd": false,
  "expandThinkingBlocks": true,
  "hideCtrlGToEdit": true
}
```

### 5) System prompts (advanced)

System prompt editing is powerful but risky. Suggested process:

- Start by editing only one prompt (core prompt) and validate behavior.
- Keep diffs small; avoid removing safety or tool instructions.
- When Claude Code updates, tweakcc will create HTML diffs for conflicts.

Suggested workflow:

1. Run tweakcc UI or open the system prompts folder.
2. Edit a single prompt file.
3. Run `tweakcc --apply` (cc-mirror does this on update).

### 6) Context limit overrides

Use `CLAUDE_CODE_CONTEXT_LIMIT` only for custom endpoints that support larger windows.

- Example: `CLAUDE_CODE_CONTEXT_LIMIT=400000`

### 7) Version compatibility and patch warnings

- tweakcc is sensitive to Claude Code versions. Patch failures are expected after CC updates.
- The `tweakcc` UI will still work even when one patch fails.

## Recommended cc-mirror UX flows

### Quick path (simple install)

- Prompt for API key
- Create variant (native install, pinned version)
- Apply brand preset + tweakcc patches
- Exit

### Advanced path

- Choose brand preset
- Optionally open tweakcc UI
- Optionally edit system prompts

## Checklist for creating a polished brand preset

- [ ] Unique theme palette with high contrast
- [ ] Distinct thinking verbs + spinner style
- [ ] User message banner formatting
- [ ] Input box border removed
- [ ] Startup banner visibility (hide or show)
- [ ] System prompt customized (optional)

## Startup ASCII art

tweakcc can **show or hide** Claude Code’s built‑in startup banner and clawd art. It does not currently support **custom** startup ASCII art. cc-mirror can optionally print a small wrapper splash when `CC_MIRROR_SPLASH=1`, and skips it for non‑TTY output or `--output-format` runs.

## Where to look in this repo

- Brand themes: `src/brands/*.ts`
- Tweakcc config writing: `src/core/tweakcc.ts`
- Variant creation: `src/core/index.ts`
- tweakcc upstream reference: `repos/tweakcc/README.md`

## Suggested roadmap (next steps)

1. **Theme polish pass**: iterate on one brand at a time, validate contrast, and tune borders/shimmers.
2. **System prompt v1**: edit only the main system prompt + 1 tool description, then validate behavior.
3. **MCP defaults**: seed provider MCP servers in `.claude.json`, then document how to manage scopes.
4. **Update flow**: add a “reapply after CC update” hint in CLI/TUI and detect patch failures early.
5. **UX polish**: add short “preview” messages in the TUI showing what will change before applying.
