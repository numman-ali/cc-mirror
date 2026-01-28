/**
 * Swarm Mode Patch - Force-enable native multi-agent features in Claude Code 2.1.16+
 *
 * Native multi-agent features (swarms, TeammateTool, delegate mode, teammate coordination)
 * are gated by the `tengu_brass_pebble` statsig flag checked via a gate function.
 *
 * This module patches the gate function to bypass the statsig check and force-enable all features.
 *
 * See: docs/research/native-multiagent-gates.md
 */

export type SwarmModeState = 'enabled' | 'disabled' | 'unknown';

// The gate function checks CLAUDE_CODE_AGENT_SWARMS env var, then statsig flag
// Pattern: function XX(){if(Yz(process.env.CLAUDE_CODE_AGENT_SWARMS))return!1;return xK("tengu_brass_pebble",!1)}
const SWARM_GATE_MARKER = /tengu_brass_pebble/;

// Match the gate function definition - captures the function name
// The function has a specific pattern: checks env var, then calls xK() for statsig
const SWARM_GATE_FN_RE =
  /function\s+([a-zA-Z_$][\w$]*)\(\)\{if\([\w$]+\(process\.env\.CLAUDE_CODE_AGENT_SWARMS\)\)return!1;return\s*[\w$]+\("tengu_brass_pebble",!1\)\}/;

/**
 * Find the swarm gate function in the CLI content
 */
const findSwarmGateFunction = (content: string): { fnName: string; fullMatch: string } | null => {
  // First verify the marker exists
  if (!SWARM_GATE_MARKER.test(content)) return null;

  const match = content.match(SWARM_GATE_FN_RE);
  if (!match) return null;

  return { fnName: match[1], fullMatch: match[0] };
};

/**
 * Check if swarm mode is already patched (gate returns true unconditionally)
 */
const isAlreadyPatched = (content: string, fnName: string): boolean => {
  const patchedRe = new RegExp(`function\\s+${fnName}\\(\\)\\{return!0\\}`);
  return patchedRe.test(content);
};

/**
 * Detect the current swarm mode state in CLI content
 */
export const detectSwarmModeState = (content: string): SwarmModeState => {
  const gate = findSwarmGateFunction(content);

  if (gate) {
    // Found the original gate function - not patched
    return 'disabled';
  }

  // If the marker is gone, the gate was likely patched
  // Check for signs that swarm code exists but gate is patched
  if (!SWARM_GATE_MARKER.test(content)) {
    // Look for swarm-related code that would indicate the feature exists
    const hasSwarmCode = /TeammateTool|teammate_mailbox|launchSwarm/.test(content);
    if (hasSwarmCode) {
      // Swarm code exists but marker is gone - likely patched to enabled
      return 'enabled';
    }
    // No swarm code at all - unknown/unsupported version
    return 'unknown';
  }

  // The marker exists but the full gate function doesn't - ambiguous state
  return 'unknown';
};

/**
 * Patch the CLI to enable swarm mode
 *
 * @param content - The CLI content to patch
 * @param enable - Whether to enable (true) or could restore (false) - currently only enable supported
 * @returns The patched content and state information
 */
export const setSwarmModeEnabled = (
  content: string,
  enable: boolean
): { content: string; changed: boolean; state: SwarmModeState } => {
  if (!enable) {
    // Restoring original state is not supported - would need to store original function
    return { content, changed: false, state: detectSwarmModeState(content) };
  }

  const gate = findSwarmGateFunction(content);
  if (!gate) {
    // Check if already patched
    const currentState = detectSwarmModeState(content);
    if (currentState === 'enabled') {
      return { content, changed: false, state: 'enabled' };
    }
    return { content, changed: false, state: 'unknown' };
  }

  // Check if already patched
  if (isAlreadyPatched(content, gate.fnName)) {
    return { content, changed: false, state: 'enabled' };
  }

  // Patch the gate function to always return true
  const patched = content.replace(gate.fullMatch, `function ${gate.fnName}(){return!0}`);

  return { content: patched, changed: true, state: 'enabled' };
};

/**
 * Get information about the swarm gate for diagnostics
 */
export const getSwarmGateInfo = (
  content: string
): {
  found: boolean;
  fnName?: string;
  state: SwarmModeState;
} => {
  const gate = findSwarmGateFunction(content);
  const state = detectSwarmModeState(content);

  if (gate) {
    return { found: true, fnName: gate.fnName, state };
  }

  return { found: false, state };
};
