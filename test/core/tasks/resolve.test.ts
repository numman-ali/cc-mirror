/**
 * Task Resolve Tests
 *
 * Tests for context resolution and variant/team detection.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { makeTempDir, cleanup } from '../../helpers/index.js';
import {
  detectVariantFromEnv,
  detectCurrentTeam,
  listVariantsWithTasks,
  resolveContext,
  DEFAULT_VARIANT,
  resolveTasksDir,
} from '../../../src/core/tasks/resolve.js';

test('Task Resolve', async (t) => {
  const createdDirs: string[] = [];
  const originalEnv: Record<string, string | undefined> = {};

  // Helper to set and track env vars
  const setEnv = (key: string, value: string | undefined) => {
    if (!(key in originalEnv)) {
      originalEnv[key] = process.env[key];
    }
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  };

  t.after(() => {
    // Cleanup directories
    for (const dir of createdDirs) {
      cleanup(dir);
    }
    // Restore env vars
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  });

  await t.test('detectVariantFromEnv', async (st) => {
    await st.test('returns null when CLAUDE_CONFIG_DIR not set', () => {
      setEnv('CLAUDE_CONFIG_DIR', undefined);
      const result = detectVariantFromEnv();
      assert.equal(result, null);
    });

    await st.test('extracts variant from CLAUDE_CONFIG_DIR path', () => {
      setEnv('CLAUDE_CONFIG_DIR', '/Users/test/.cc-mirror/myvariant/config');
      const result = detectVariantFromEnv();
      assert.equal(result, 'myvariant');
    });

    await st.test('handles variant names with hyphens', () => {
      setEnv('CLAUDE_CONFIG_DIR', '/home/user/.cc-mirror/my-long-variant/config');
      const result = detectVariantFromEnv();
      assert.equal(result, 'my-long-variant');
    });

    await st.test('returns null for non-matching path', () => {
      setEnv('CLAUDE_CONFIG_DIR', '/some/other/path');
      const result = detectVariantFromEnv();
      assert.equal(result, null);
    });
  });

  await t.test('detectCurrentTeam', async (st) => {
    await st.test('uses CLAUDE_CODE_TEAM_NAME when set', () => {
      setEnv('CLAUDE_CODE_TEAM_NAME', 'my-team');
      const result = detectCurrentTeam('/some/path');
      assert.equal(result, 'my-team');
      setEnv('CLAUDE_CODE_TEAM_NAME', undefined);
    });

    await st.test('falls back to directory name', () => {
      setEnv('CLAUDE_CODE_TEAM_NAME', undefined);
      setEnv('TEAM', undefined);
      const tmpDir = makeTempDir('test-project-');
      createdDirs.push(tmpDir);

      const result = detectCurrentTeam(tmpDir);
      assert.ok(result.startsWith('test-project-'));
    });

    await st.test('appends TEAM env var as suffix', () => {
      setEnv('CLAUDE_CODE_TEAM_NAME', undefined);
      setEnv('TEAM', 'alpha');
      const tmpDir = makeTempDir('myproject-');
      createdDirs.push(tmpDir);

      const result = detectCurrentTeam(tmpDir);
      assert.ok(result.includes('-alpha'));
      setEnv('TEAM', undefined);
    });
  });

  await t.test('listVariantsWithTasks', async (st) => {
    await st.test('returns empty for directory with no variants', () => {
      const tmpDir = makeTempDir();
      createdDirs.push(tmpDir);

      const result = listVariantsWithTasks(tmpDir);
      assert.deepEqual(result, []);
    });

    await st.test('returns only variants that have tasks', () => {
      const tmpDir = makeTempDir();
      createdDirs.push(tmpDir);

      // Create variant with tasks
      const variant1 = path.join(tmpDir, 'has-tasks', 'config', 'tasks', 'team1');
      fs.mkdirSync(variant1, { recursive: true });
      fs.writeFileSync(path.join(tmpDir, 'has-tasks', 'variant.json'), '{"name":"has-tasks"}');

      // Create variant without tasks
      const variant2 = path.join(tmpDir, 'no-tasks', 'config');
      fs.mkdirSync(variant2, { recursive: true });
      fs.writeFileSync(path.join(tmpDir, 'no-tasks', 'variant.json'), '{"name":"no-tasks"}');

      const result = listVariantsWithTasks(tmpDir);
      assert.deepEqual(result, ['has-tasks']);
    });
  });

  await t.test('resolveContext', async (st) => {
    await st.test('resolves with explicit variant and team', () => {
      const tmpDir = makeTempDir();
      createdDirs.push(tmpDir);

      // Create tasks directory
      const tasksDir = path.join(tmpDir, 'myvariant', 'config', 'tasks', 'myteam');
      fs.mkdirSync(tasksDir, { recursive: true });
      fs.writeFileSync(path.join(tmpDir, 'myvariant', 'variant.json'), '{"name":"myvariant"}');

      const result = resolveContext({
        rootDir: tmpDir,
        variant: 'myvariant',
        team: 'myteam',
      });

      assert.equal(result.locations.length, 1);
      assert.equal(result.locations[0].variant, 'myvariant');
      assert.equal(result.locations[0].team, 'myteam');
      assert.equal(result.locations[0].tasksDir, tasksDir);
    });

    await st.test('resolves all variants when allVariants is true', () => {
      const tmpDir = makeTempDir();
      createdDirs.push(tmpDir);

      // Create two variants with tasks
      const tasks1 = path.join(tmpDir, 'variant1', 'config', 'tasks', 'team');
      const tasks2 = path.join(tmpDir, 'variant2', 'config', 'tasks', 'team');
      fs.mkdirSync(tasks1, { recursive: true });
      fs.mkdirSync(tasks2, { recursive: true });
      fs.writeFileSync(path.join(tmpDir, 'variant1', 'variant.json'), '{"name":"variant1"}');
      fs.writeFileSync(path.join(tmpDir, 'variant2', 'variant.json'), '{"name":"variant2"}');

      const result = resolveContext({
        rootDir: tmpDir,
        allVariants: true,
        team: 'team',
      });

      assert.equal(result.locations.length, 2);
      const variants = result.locations.map((l) => l.variant);
      assert.ok(variants.includes('variant1'));
      assert.ok(variants.includes('variant2'));
    });

    await st.test('resolves all teams when allTeams is true', () => {
      const tmpDir = makeTempDir();
      createdDirs.push(tmpDir);

      // Create variant with multiple teams
      const team1 = path.join(tmpDir, 'myvariant', 'config', 'tasks', 'team-a');
      const team2 = path.join(tmpDir, 'myvariant', 'config', 'tasks', 'team-b');
      fs.mkdirSync(team1, { recursive: true });
      fs.mkdirSync(team2, { recursive: true });
      fs.writeFileSync(path.join(tmpDir, 'myvariant', 'variant.json'), '{"name":"myvariant"}');

      const result = resolveContext({
        rootDir: tmpDir,
        variant: 'myvariant',
        allTeams: true,
      });

      assert.equal(result.locations.length, 2);
      const teams = result.locations.map((l) => l.team);
      assert.ok(teams.includes('team-a'));
      assert.ok(teams.includes('team-b'));
    });

    await st.test('auto-detects variant from env', () => {
      const tmpDir = makeTempDir();
      createdDirs.push(tmpDir);

      // Create variant with tasks - use .cc-mirror pattern for env detection
      const ccMirrorDir = path.join(tmpDir, '.cc-mirror');
      const tasksDir = path.join(ccMirrorDir, 'detected', 'config', 'tasks', 'myteam');
      fs.mkdirSync(tasksDir, { recursive: true });
      fs.writeFileSync(path.join(ccMirrorDir, 'detected', 'variant.json'), '{"name":"detected"}');

      // Set env var with correct .cc-mirror pattern
      setEnv('CLAUDE_CONFIG_DIR', path.join(ccMirrorDir, 'detected', 'config'));

      const result = resolveContext({
        rootDir: ccMirrorDir, // Use .cc-mirror dir as rootDir
        team: 'myteam',
      });

      assert.equal(result.locations.length, 1);
      assert.equal(result.locations[0].variant, 'detected');

      setEnv('CLAUDE_CONFIG_DIR', undefined);
    });

    await st.test('auto-detects team from CLAUDE_CODE_TEAM_NAME', () => {
      const tmpDir = makeTempDir();
      createdDirs.push(tmpDir);

      // Create variant with specific team
      const tasksDir = path.join(tmpDir, 'myvariant', 'config', 'tasks', 'env-team');
      fs.mkdirSync(tasksDir, { recursive: true });
      fs.writeFileSync(path.join(tmpDir, 'myvariant', 'variant.json'), '{"name":"myvariant"}');

      setEnv('CLAUDE_CODE_TEAM_NAME', 'env-team');

      const result = resolveContext({
        rootDir: tmpDir,
        variant: 'myvariant',
      });

      assert.equal(result.locations.length, 1);
      assert.equal(result.locations[0].team, 'env-team');

      setEnv('CLAUDE_CODE_TEAM_NAME', undefined);
    });

    await st.test('strict scoping returns empty when detected team not found', () => {
      const tmpDir = makeTempDir();
      createdDirs.push(tmpDir);

      // Create variant with different teams
      const team1 = path.join(tmpDir, 'myvariant', 'config', 'tasks', 'actual-team');
      fs.mkdirSync(team1, { recursive: true });
      fs.writeFileSync(path.join(tmpDir, 'myvariant', 'variant.json'), '{"name":"myvariant"}');

      setEnv('CLAUDE_CODE_TEAM_NAME', 'nonexistent-team');

      const result = resolveContext({
        rootDir: tmpDir,
        variant: 'myvariant',
      });

      // With strict scoping, should return empty locations when detected team doesn't exist
      // (no fallback to all teams)
      assert.equal(result.locations.length, 0);

      setEnv('CLAUDE_CODE_TEAM_NAME', undefined);
    });

    await st.test('returns empty locations for non-existent paths', () => {
      const tmpDir = makeTempDir();
      createdDirs.push(tmpDir);

      const result = resolveContext({
        rootDir: tmpDir,
        variant: 'nonexistent',
        team: 'alsononexistent',
      });

      assert.equal(result.locations.length, 0);
    });

    await st.test('uses _default variant when no CLAUDE_CONFIG_DIR set', () => {
      const tmpDir = makeTempDir();
      createdDirs.push(tmpDir);

      // Ensure no env is set
      setEnv('CLAUDE_CONFIG_DIR', undefined);
      setEnv('CLAUDE_CODE_TEAM_NAME', 'test-team');

      const result = resolveContext({
        rootDir: tmpDir,
      });

      // Should use _default variant (no locations since no tasks exist)
      assert.equal(result.locations.length, 0);

      setEnv('CLAUDE_CODE_TEAM_NAME', undefined);
    });
  });

  await t.test('DEFAULT_VARIANT constant', async (st) => {
    await st.test('has expected value', () => {
      assert.equal(DEFAULT_VARIANT, '_default');
    });
  });

  await t.test('resolveTasksDir', async (st) => {
    await st.test('returns cc-mirror path for regular variant', () => {
      const result = resolveTasksDir('/root/.cc-mirror', 'myvariant', 'myteam');
      assert.equal(result, '/root/.cc-mirror/myvariant/config/tasks/myteam');
    });

    await st.test('returns ~/.claude path for _default variant', () => {
      const result = resolveTasksDir('/root/.cc-mirror', '_default', 'myteam');
      // Should use ~/.claude/tasks/myteam, not /root/.cc-mirror/_default/config/tasks/myteam
      assert.ok(result.includes('.claude/tasks/myteam'));
      assert.ok(!result.includes('.cc-mirror'));
    });
  });
});
