# Observed Patterns

## Recurring Issues

### Windows Path Handling

- **First seen:** 2025-12-15
- **Frequency:** 8 duplicate reports
- **Root cause:** Hardcoded `/` instead of `path.sep`
- **Resolution:** Fixed in v1.3.1
- **Prevention:** Added Windows CI

### Version Display Mismatch

- **First seen:** 2025-12-19
- **Cause:** Hardcoded version string not updated
- **Resolution:** Read from package.json dynamically

## Contributor Patterns

- Chinese-speaking user base is significant (consider i18n)
- Provider additions often arrive as multiple overlapping PRs; prefer a single “provider intake” umbrella branch/PR to reduce drift (PR:31 vs PR:4/5/21).

## Codebase Patterns

- Most bugs cluster in `src/cli/` (needs refactoring)
- Test coverage gaps in error handling paths

## UX Patterns

- Users are confused about MCP server config location and variant vs project scope.
- The dev-browser skill default was frequently questioned; now default off with opt-in (keep docs/UI aligned).
