import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { installOrchestratorSkill, removeOrchestratorSkill } from '../src/core/skills.js';

const makeTempDir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'claude-sneakpeek-skills-'));

test('installOrchestratorSkill installs skill to config directory', () => {
  const tempDir = makeTempDir();
  fs.mkdirSync(tempDir, { recursive: true });

  const result = installOrchestratorSkill(tempDir);

  assert.equal(result.status, 'installed');
  assert.ok(result.path);

  // Verify skill files exist
  const skillDir = path.join(tempDir, 'skills', 'orchestration');
  assert.ok(fs.existsSync(skillDir), 'skill directory should exist');
  assert.ok(fs.existsSync(path.join(skillDir, 'SKILL.md')), 'SKILL.md should exist');
  assert.ok(fs.existsSync(path.join(skillDir, 'references')), 'references directory should exist');
  assert.ok(fs.existsSync(path.join(skillDir, '.claude-sneakpeek-managed')), 'managed marker should exist');

  fs.rmSync(tempDir, { recursive: true, force: true });
});

test('installOrchestratorSkill skips user-managed skill', () => {
  const tempDir = makeTempDir();
  const skillDir = path.join(tempDir, 'skills', 'orchestration');
  fs.mkdirSync(skillDir, { recursive: true });

  // Create a user-managed skill (no marker file)
  fs.writeFileSync(path.join(skillDir, 'SKILL.md'), '# User custom skill');

  const result = installOrchestratorSkill(tempDir);

  assert.equal(result.status, 'skipped');
  assert.ok(result.message?.includes('user-managed'));

  // Verify user's file is preserved
  const content = fs.readFileSync(path.join(skillDir, 'SKILL.md'), 'utf8');
  assert.equal(content, '# User custom skill');

  fs.rmSync(tempDir, { recursive: true, force: true });
});

test('installOrchestratorSkill updates managed skill', () => {
  const tempDir = makeTempDir();

  // First install
  const result1 = installOrchestratorSkill(tempDir);
  assert.equal(result1.status, 'installed');

  // Second install should update
  const result2 = installOrchestratorSkill(tempDir);
  assert.equal(result2.status, 'installed');

  fs.rmSync(tempDir, { recursive: true, force: true });
});

test('removeOrchestratorSkill removes managed skill', () => {
  const tempDir = makeTempDir();

  // Install first
  installOrchestratorSkill(tempDir);

  const skillDir = path.join(tempDir, 'skills', 'orchestration');
  assert.ok(fs.existsSync(skillDir), 'skill should exist before removal');

  // Remove
  const result = removeOrchestratorSkill(tempDir);
  assert.equal(result.status, 'removed');
  assert.ok(!fs.existsSync(skillDir), 'skill should not exist after removal');

  fs.rmSync(tempDir, { recursive: true, force: true });
});

test('removeOrchestratorSkill skips if skill not installed', () => {
  const tempDir = makeTempDir();
  fs.mkdirSync(tempDir, { recursive: true });

  const result = removeOrchestratorSkill(tempDir);
  assert.equal(result.status, 'skipped');
  assert.ok(result.message?.includes('not installed'));

  fs.rmSync(tempDir, { recursive: true, force: true });
});

test('removeOrchestratorSkill preserves user-managed skill', () => {
  const tempDir = makeTempDir();
  const skillDir = path.join(tempDir, 'skills', 'orchestration');
  fs.mkdirSync(skillDir, { recursive: true });

  // Create a user-managed skill (no marker file)
  fs.writeFileSync(path.join(skillDir, 'SKILL.md'), '# User custom skill');

  const result = removeOrchestratorSkill(tempDir);
  assert.equal(result.status, 'skipped');
  assert.ok(result.message?.includes('user-managed'));

  // Verify skill still exists
  assert.ok(fs.existsSync(skillDir), 'user-managed skill should be preserved');

  fs.rmSync(tempDir, { recursive: true, force: true });
});
