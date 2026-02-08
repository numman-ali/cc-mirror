# Agent Prompts

## Consolidate provider PRs into PR:31

You are the maintainer of `cc-mirror`. Review PR:31 and confirm it fully covers PR:4 (GatewayZ), PR:21 (Vercel AI Gateway), and PR:5 (NanoGPT). If PR:31 is complete and tests pass, draft short, friendly close-comments for PR:4/5/21 that (1) thanks the author, (2) credits them, and (3) points to PR:31 as the merged implementation. Also draft a close-comment for PR:22 referencing the decision to default dev-browser off instead of adding a `--no-skills` flag.

Output:

- A coverage checklist mapping each PR to files/behavior in PR:31
- Draft close-comments for PR:4, PR:5, PR:21, PR:22 (no posting)
- Any gaps that must be fixed before merge

## Investigate ISSUE:27 minimax crash (`EJ.has is not a function`)

Reproduce ISSUE:27 on Linux using the minimax variant. Identify the code path in the upstream `cli.js` where `EJ.has` is called and determine why `EJ` is not a Set/Map. Check whether cc-mirror’s prompt pack/toolset overlay or env handling could affect that value. Propose and implement the smallest safe fix (or a workaround) and add a regression test if the fix is in cc-mirror code.

Output:

- Minimal repro steps + environment
- Root cause analysis (upstream vs cc-mirror)
- Patch + test plan

## Add Z.ai CN endpoint support (ISSUE:10)

Implement a supported way to use the Chinese GLM Coding Plan endpoint (`https://open.bigmodel.cn/api/anthropic`). Prefer a dedicated provider key if it improves UX and prevents silent misconfiguration. Update docs and tests accordingly.

Output:

- Code changes + docs changes
- Provider selection UX considerations
- Test plan (including provider-matrix update)
