# tweakcc Integration Guide (claude-sneakpeek)

This document summarizes tweakcc capabilities and concrete implementation ideas for claude-sneakpeek variants. It is intentionally practical: you can copy/paste snippets, adopt patterns, or expand into your own presets.

## What tweakcc can do (from upstream README)

- Edit Claude Code system prompts (core prompt, tool descriptions, agent prompts, utilities, etc.)
- Create custom toolsets
- Name/rename sessions in Claude Code (tweakcc enables /title and /rename)
- Create custom themes with RGB/HSL picker
- Customize thinking verbs ("Thinking..." spinner text)
- Customize thinking spinner animation phases + speed
- Style user messages in chat history
- Remove ASCII border from input box
- Expand thinking blocks by default
- Indicate patched status in banner (optional)
- Show startup banner / clawd (configurable)
- Fix spinner freeze when `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` is set
- Allow custom context window size (env `CLAUDE_CODE_CONTEXT_LIMIT`)

tweakcc patches the Claude Code `cli.js` from the npm install.

## How claude-sneakpeek uses tweakcc

- Per-variant config lives at:
  - `~/.claude-sneakpeek/<variant>/tweakcc/config.json`
  - `~/.claude-sneakpeek/<variant>/tweakcc/system-prompts/`
- Patch apply uses:
  - `TWEAKCC_CONFIG_DIR=~/.claude-sneakpeek/<variant>/tweakcc`
  - `TWEAKCC_CC_INSTALLATION_PATH=~/.claude-sneakpeek/<variant>/npm/node_modules/@anthropic-ai/claude-code/cli.js`
- claude-sneakpeek applies tweakcc after create/update, unless `--no-tweak`.

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

### 4) Toolsets

Preconfigure toolsets so brand variants are scoped:

```
"toolsets": [
  { "name": "minimax", "allowedTools": "*" }
],
"defaultToolset": "minimax",
"planModeToolset": "minimax"
```

### 5) Input box + misc UX

Tweakcc can simplify the UI:

```
"inputBox": { "removeBorder": true },
  "misc": {
  "showPatchesApplied": true,
  "hideStartupBanner": false,
  "hideStartupClawd": false,
  "expandThinkingBlocks": true,
  "hideCtrlGToEditPrompt": true
}
```

### 6) System prompts (advanced)

System prompt editing is powerful but risky. Suggested process:

- Start by editing only one prompt (core prompt) and validate behavior.
- Keep diffs small; avoid removing safety or tool instructions.
- When Claude Code updates, tweakcc will create HTML diffs for conflicts.

Suggested workflow:

1. Run tweakcc UI or open the system prompts folder.
2. Edit a single prompt file.
3. Run `tweakcc --apply` (claude-sneakpeek does this on update).

### 7) Context limit overrides

Use `CLAUDE_CODE_CONTEXT_LIMIT` only for custom endpoints that support larger windows.

- Example: `CLAUDE_CODE_CONTEXT_LIMIT=400000`

### 8) Version compatibility and patch warnings

- tweakcc is sensitive to Claude Code versions. Patch failures are expected after CC updates.
- The `tweakcc` UI will still work even when one patch fails.

## Recommended claude-sneakpeek UX flows

### Quick path (simple install)

- Prompt for API key
- Create variant (npm install, pinned version)
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
- [ ] Toolset default set to provider
- [ ] Input box border removed
- [ ] Startup banner visibility (hide or show)
- [ ] System prompt customized (optional)

## Startup ASCII art

tweakcc can **show or hide** Claude Code’s built‑in startup banner and clawd art. It does not currently support **custom** startup ASCII art. claude-sneakpeek can optionally print a small wrapper splash when `CLAUDE_SNEAKPEEK_SPLASH=1`, and skips it for non‑TTY output or `--output-format` runs.

## Where to look in this repo

- Brand themes: `src/brands/*.ts`
- Tweakcc config writing: `src/core/tweakcc.ts`
- Variant creation: `src/core/index.ts`
- tweakcc upstream reference: `repos/tweakcc/README.md`

## Suggested roadmap (next steps)

1. **Theme polish pass**: iterate on one brand at a time, validate contrast, and tune borders/shimmers.
2. **System prompt v1**: edit only the main system prompt + 1 tool description, then validate behavior.
3. **Toolset tightening**: define provider-specific toolsets (e.g., restrict web or bash for certain endpoints).
4. **MCP defaults**: seed provider MCP servers in `.claude.json`, then document how to manage scopes.
5. **Update flow**: add a “reapply after CC update” hint in CLI/TUI and detect patch failures early.
6. **UX polish**: add short “preview” messages in the TUI showing what will change before applying.
