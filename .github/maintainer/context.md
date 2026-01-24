# Project Context

## Vision
cc-mirror provides isolated Claude Code variants that connect to multiple AI providers. The goal is fast, reliable provider switching with consistent UX, clear configuration, and minimal breakage across upstream Claude Code updates.

## Current Priorities
1. Expand provider coverage with verified auth/base URLs and minimal UX friction.
2. Keep core flows stable across Claude Code updates (minimax/zai compatibility).
3. Improve documentation for config layout, wrapper usage, and MCP server setup.

## Success Metrics
- Adoption: increasing provider variants created per release.
- Quality: fewer crash/blocker bugs and reduced support churn.

## Areas

| Area | Status | Notes |
|------|--------|-------|
| `src/core/` | Stable | High scrutiny for changes |
| `src/cli/` | Active | Moderate churn okay |
| `src/tui/` | Active | UX changes welcome |
| `docs/` | Needs work | Prioritize config + onboarding clarity |

## Contribution Guidelines
- External PRs are reference implementations; maintainer implements changes directly.
- Provide a test plan and verified provider documentation links for provider PRs.

## Tone
Friendly, direct, and technical. No vague promises.

## Out of Scope
- Team mode (removed in latest releases; only supported in 1.6.3).
- Merging external PRs directly.
