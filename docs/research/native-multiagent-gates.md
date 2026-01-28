# Native Multi-Agent Feature Gates in Claude Code 2.1.16+

Research conducted: 2026-01-23
Claude Code version analyzed: 2.1.17

## Summary

Claude Code 2.1.16+ includes native multi-agent features (swarms, teammates, team coordination) that are **built into the CLI**. All features are controlled by a **single gate function** that can be patched to force-enable them.

## Feature Gate Analysis

### Primary Gate Function

In the minified CLI, **all** multi-agent features are gated by a single function:

```javascript
function i8() {
  if (Yz(process.env.CLAUDE_CODE_AGENT_SWARMS)) return !1;
  return xK("tengu_brass_pebble", !1);
}
```

Where:
- `Yz()` - Evaluates env var as "falsey" (handles string "false", "0", empty, etc.)
- `xK()` - Checks statsig feature flag with a default value

### Force-Enabling via Patch

The gate function can be patched to bypass the statsig check entirely:

```javascript
// Before patch:
function i8(){if(Yz(process.env.CLAUDE_CODE_AGENT_SWARMS))return!1;return xK("tengu_brass_pebble",!1)}

// After patch:
function i8(){return!0}
```

This is the same approach used for legacy team mode patching.

### Features Controlled by i8()

| Feature | Code Pattern | Description |
|---------|--------------|-------------|
| **TeammateTool** | `i8()?[tq2()]:[]` | Tool conditionally included in toolset |
| **Delegate mode** | `i8()?["bypassPermissions"]:["bypassPermissions","delegate"]` | Task tool mode option |
| **Swarm spawning** | `i8()` check in ExitPlanMode | launchSwarm + teammateCount params |
| **Teammate mailbox** | `i8()?[yw("teammate_mailbox",...)]` | Inter-agent messaging |
| **Task teammates** | `i8()&&H?.teammates` | Task list teammate display |

**One patch enables all features.**

### Environment Variable

Set `CLAUDE_CODE_AGENT_SWARMS=0` or `CLAUDE_CODE_AGENT_SWARMS=false` to **disable** swarm features (opt-out only, cannot force-enable).

### Statsig Flag

The `tengu_brass_pebble` flag is checked server-side. Without patching, enablement depends on:
- Subscription tier (Max, Team, Pro)
- Account age / feature rollout
- Geographic availability

## Native Multi-Agent Features

### TeammateTool

Available operations:
- `spawnTeam` - Create a new team (team = project = task list)
- `approvePlan` - Approve a teammate's plan
- `rejectPlan` - Reject a teammate's plan with feedback
- `requestShutdown` - Request a teammate to gracefully shut down

### ExitPlanMode Swarm Parameters

When `i8()` returns true, ExitPlanMode accepts:
- `launchSwarm: boolean` - Enable swarm spawning
- `teammateCount: number` - Number of teammates to spawn (1-5)

### Backend System

Two execution backends for spawning teammates:

1. **In-Process Backend** - Runs teammates in the same process
   - Used in non-interactive sessions
   - Controlled by `--teammate-mode` flag

2. **Pane Backend** - Spawns teammates in terminal panes
   - **tmux** - Primary, works inside or outside tmux sessions
   - **iTerm2** - Native iTerm2 support via `it2` CLI

### Related Environment Variables

| Variable | Purpose |
|----------|---------|
| `CLAUDE_CODE_AGENT_SWARMS` | Override swarm feature gate (set to 0/false to disable) |
| `CLAUDE_CODE_TEAM_MODE` | Enable team mode |
| `CLAUDE_CODE_TEAM_NAME` | Set team name (set by wrapper at runtime) |
| `CLAUDE_CODE_AGENT_ID` | Unique agent identifier |
| `CLAUDE_CODE_AGENT_NAME` | Human-readable agent name |
| `CLAUDE_CODE_PLAN_MODE_REQUIRED` | Require plan approval from leader |

## Implications for claude-sneakpeek

### What claude-sneakpeek Should Do

1. **Version bump**: Use Claude Code 2.1.17+ to get native features
2. **No patching needed**: Features are built-in, not patched like legacy team mode
3. **Provider configuration**: Optionally set env vars to configure behavior
4. **Documentation**: Help users understand feature availability

### What claude-sneakpeek Should NOT Do

1. **Don't try to enable statsig flags** - Server-side, can't be overridden
2. **Don't patch cli.js** - Features are native, not patched in
3. **Don't assume universal availability** - Features may be tier-gated

## Version History

| Version | Features Added |
|---------|----------------|
| 2.1.16 | Initial native multi-agent support |
| 2.1.17 | TeammateTool, swarm spawning refinements |

## Patch Implementation

claude-sneakpeek implements swarm mode patching in `src/core/variant-builder/swarm-mode-patch.ts`:

```typescript
import { setSwarmModeEnabled } from './swarm-mode-patch.js';

const result = setSwarmModeEnabled(cliContent, true);
// result.changed: boolean - whether patch was applied
// result.state: 'enabled' | 'disabled' | 'unknown'
// result.content: patched CLI content
```

### Verified Against Claude Code 2.1.17

```
Gate found: true
Function name: i8
Current state: disabled

Patch applied: true
New state: enabled
Patched function: function i8(){return!0}
```

## Verification Commands

```bash
# Check if swarm gate is present in cli.js (unpatched)
grep -o 'tengu_brass_pebble' ~/.claude-sneakpeek/<variant>/npm/node_modules/@anthropic-ai/claude-code/cli.js

# Check for TeammateTool
grep -o 'TeammateTool' ~/.claude-sneakpeek/<variant>/npm/node_modules/@anthropic-ai/claude-code/cli.js

# Verify patch was applied (should return empty if patched)
grep 'tengu_brass_pebble' ~/.claude-sneakpeek/<variant>/npm/node_modules/@anthropic-ai/claude-code/cli.js
```

## See Also

- `src/core/constants.ts` - NATIVE_MULTIAGENT_MIN_VERSION constant
- `src/core/variant-builder/swarm-mode-patch.ts` - Patch implementation
- Legacy team mode documentation (deprecated)
