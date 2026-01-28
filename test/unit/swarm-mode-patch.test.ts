import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  detectSwarmModeState,
  setSwarmModeEnabled,
  getSwarmGateInfo,
} from '../../src/core/variant-builder/swarm-mode-patch.js';

describe('swarm-mode-patch', () => {
  // Realistic gate function pattern from Claude Code 2.1.17
  const UNPATCHED_GATE = `function i8(){if(Yz(process.env.CLAUDE_CODE_AGENT_SWARMS))return!1;return xK("tengu_brass_pebble",!1)}`;
  const PATCHED_GATE = `function i8(){return!0}`;

  // Simulated CLI content with the gate function
  const makeCliContent = (gate: string) =>
    `var someCode=123;${gate}var moreCode=456;function teammate(){return i8()&&doStuff()}`;

  describe('detectSwarmModeState', () => {
    it('returns disabled when unpatched gate function is found', () => {
      const content = makeCliContent(UNPATCHED_GATE);
      assert.strictEqual(detectSwarmModeState(content), 'disabled');
    });

    it('returns unknown when no marker is found', () => {
      const content = 'function foo(){return!0}var bar=123;';
      assert.strictEqual(detectSwarmModeState(content), 'unknown');
    });

    it('returns unknown when marker exists but no gate function pattern', () => {
      // Has the marker string but not the full gate function pattern
      const content = 'var x="tengu_brass_pebble";function foo(){return!1}';
      assert.strictEqual(detectSwarmModeState(content), 'unknown');
    });
  });

  describe('setSwarmModeEnabled', () => {
    it('patches the gate function to return true', () => {
      const content = makeCliContent(UNPATCHED_GATE);
      const result = setSwarmModeEnabled(content, true);

      assert.strictEqual(result.changed, true);
      assert.strictEqual(result.state, 'enabled');
      assert.ok(result.content.includes('function i8(){return!0}'));
      assert.ok(!result.content.includes('tengu_brass_pebble'));
    });

    it('does not change already patched content', () => {
      const content = makeCliContent(PATCHED_GATE);
      // Add the marker somewhere else so detectSwarmModeState can find it
      const contentWithMarker = content + ';var marker="tengu_brass_pebble"';
      const result = setSwarmModeEnabled(contentWithMarker, true);

      // Should detect as enabled (or unknown) and not change
      assert.strictEqual(result.changed, false);
    });

    it('returns unchanged when enable=false (restore not supported)', () => {
      const content = makeCliContent(UNPATCHED_GATE);
      const result = setSwarmModeEnabled(content, false);

      assert.strictEqual(result.changed, false);
      assert.strictEqual(result.state, 'disabled');
      assert.strictEqual(result.content, content);
    });

    it('handles different function names', () => {
      const gateWithDifferentName = `function xY7(){if(Yz(process.env.CLAUDE_CODE_AGENT_SWARMS))return!1;return xK("tengu_brass_pebble",!1)}`;
      const content = `var a=1;${gateWithDifferentName}var b=2;`;
      const result = setSwarmModeEnabled(content, true);

      assert.strictEqual(result.changed, true);
      assert.strictEqual(result.state, 'enabled');
      assert.ok(result.content.includes('function xY7(){return!0}'));
    });
  });

  describe('getSwarmGateInfo', () => {
    it('returns gate info when found', () => {
      const content = makeCliContent(UNPATCHED_GATE);
      const info = getSwarmGateInfo(content);

      assert.strictEqual(info.found, true);
      assert.strictEqual(info.fnName, 'i8');
      assert.strictEqual(info.state, 'disabled');
    });

    it('returns not found when gate is missing', () => {
      const content = 'function foo(){return!0}';
      const info = getSwarmGateInfo(content);

      assert.strictEqual(info.found, false);
      assert.strictEqual(info.state, 'unknown');
    });
  });

  describe('real CLI content patterns', () => {
    it('handles whitespace variations in gate function', () => {
      // Sometimes minifiers add/remove whitespace differently
      const gateWithSpace = `function i8(){if(Yz(process.env.CLAUDE_CODE_AGENT_SWARMS))return!1;return xK("tengu_brass_pebble",!1)}`;
      const content = makeCliContent(gateWithSpace);
      const result = setSwarmModeEnabled(content, true);

      assert.strictEqual(result.changed, true);
      assert.strictEqual(result.state, 'enabled');
    });
  });
});
