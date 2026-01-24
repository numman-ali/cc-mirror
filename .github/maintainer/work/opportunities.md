# Opportunity Backlog

- Docs: “MCP servers” quickstart (where config lives, variant vs project scope, `mcp add-json` examples). (ISSUE:16)
- Docs: shell integration troubleshooting (Termux/no-rc shells, PATH, wrapper locations). (ISSUE:12)
- Docs: troubleshooting page for common network/runtime failures (IPv6, proxy env vars, tmp dir, debug logs). (ISSUE:14, ISSUE:24, ISSUE:29)
- Docs: provider matrix table that is generated/verified against `test/e2e/providers.ts` to avoid drift.
- UX: when create finishes, print explicit wrapper path + “how to run” command even if shell integration fails.
- Hygiene: tag/label policy for provider PRs (require base URL + auth doc link + test plan; otherwise request info).
