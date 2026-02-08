# Decision Log

## 2026-01

### [ISSUE:42] Deferred - Version requirements

**Date:** 2026-01-15
**Decision:** Defer to post-1.0
**Reasoning:** Good feature but adds complexity. Want to stabilize core first.

### [PR:38] Closed - Implemented fix

**Date:** 2026-01-16
**Decision:** Closed after maintainer implementation
**Reasoning:** Fixes critical bug affecting all Windows users. Tests pass.

### [ISSUE:30] Closed - Stale

**Date:** 2026-01-16
**Decision:** Closed without action
**Reasoning:** No response to info request for 60 days.

### Team mode removal in current releases

**Date:** 2026-01-18
**Decision:** Team mode is out of scope for current releases (only supported in 1.6.3).
**Reasoning:** Maintenance cost outweighs value; focus on provider expansion and stability.

### [ISSUE:8] Deferred - Sync Variants

**Date:** 2026-01-18
**Decision:** Defer Sync Variants to a later milestone.
**Reasoning:** High complexity; prioritize provider expansion and core stability first.

### [PR:22] Declined - --no-skills flag

**Date:** 2026-01-18
**Decision:** Do not add a dedicated flag; dev-browser defaults to off with opt-in.
**Reasoning:** Team mode removed; simpler default and UI toggle avoids extra CLI surface area.

### Ollama provider intake

**Date:** 2026-01-18
**Decision:** Add Ollama provider (Anthropic compatibility; local + cloud).
**Reasoning:** Local-first demand and clear compatibility docs make this a high-leverage addition.

### Gateway provider PR consolidation (PR:31)

**Date:** 2026-01-23
**Decision:** Consolidate gateway provider work into PR:31; close PR:4 / PR:5 / PR:21 as duplicates after merge (with credit).
**Reasoning:** Multiple overlapping provider PRs increase drift risk. One canonical implementation keeps auth/env semantics consistent and centralizes tests + docs.
