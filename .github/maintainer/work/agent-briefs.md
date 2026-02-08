# Agent Briefs

## Brief: Consolidate provider PRs into PR:31

**Goal:** Use PR:31 as the canonical implementation for gateway providers + dev-browser default off + Ollama. After merge, close duplicate provider PRs with credit and point to the merged commit.

**Items:** PR:31, PR:4, PR:5, PR:21, PR:22, ISSUE:23

**Acceptance:**

- PR:31 merged cleanly with CI green.
- PR:4/5/21 closed as duplicates with credit and link to merged PR.
- PR:22 closed as declined (decision already logged).
- ISSUE:23 updated to reflect gateway coverage (Foundry remains open as follow-up).

## Brief: Investigate minimax crash (`EJ.has is not a function`)

**Goal:** Reproduce ISSUE:27, identify whether the root cause is upstream Claude Code vs cc-mirror overlays/toolsets, and ship a fix or documented workaround.

**Acceptance:**

- Repro steps captured + minimal failing case.
- Fix/workaround validated on Linux (and ideally macOS).
- Regression test added if fix is in cc-mirror code.

## Brief: Add Z.ai CN endpoint support

**Goal:** Address ISSUE:10 by adding a supported path for the Chinese GLM Coding Plan endpoint (`https://open.bigmodel.cn/api/anthropic`).

**Acceptance:**

- Either: new provider key (e.g., `zai-cn`) with clear labeling, or: documented/validated base-url override flow.
- Docs mention any model mapping differences.

## Brief: Docs fixes for MCP servers + shell integration

**Goal:** Address user confusion in ISSUE:16 and ISSUE:12 with explicit docs and better “create finished” output.

**Acceptance:**

- Docs show exactly where `.claude.json` lives per variant and how to add MCP servers.
- Docs include Termux/no-rc troubleshooting.
