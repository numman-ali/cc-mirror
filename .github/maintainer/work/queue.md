# Maintainer Queue

## Now (ship + consolidate)

- PR:31 (`providers-gateways` branch): ship gateway providers (GatewayZ, Vercel AI Gateway, NanoGPT) + Ollama + dev-browser default off.
- After PR:31 merges: close PR:4 / PR:5 / PR:21 as duplicates (credit authors). Close PR:22 as declined (see decision 2026-01-18).

## Next (user-facing blockers)

- ISSUE:27: reproduce + root-cause the minimax crash (`EJ.has is not a function`) and produce a fix/workaround.
- ISSUE:10: add Z.ai CN endpoint support (`https://open.bigmodel.cn/api/anthropic`) or document a supported override path.

## Docs / support

- ISSUE:16 + ISSUE:12: make MCP server config location and “variant vs project” scope explicit; add a shell/Termux aliasing troubleshooting section.
- ISSUE:14: document IPv6 TLS workaround (`NODE_OPTIONS=--dns-result-order=ipv4first`) and decide whether to offer an opt-in setting.

## Watchlist

- ISSUE:29: /compact “Conversation too long” may be upstream; ask reporter to retry on v1.6.6+ and attach debug logs.
- ISSUE:24: multi-user `/tmp/claude` path conflict — needs repro + confirm whether wrapper or upstream is forcing the path.
