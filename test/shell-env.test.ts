import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ensureZaiShellEnv } from '../src/core/shell-env.js';

delete process.env.Z_AI_API_KEY;

const makeTempDir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'claude-sneakpeek-shell-env-'));

const writeSettings = (configDir: string, apiKey: string) => {
  fs.mkdirSync(configDir, { recursive: true });
  const settingsPath = path.join(configDir, 'settings.json');
  fs.writeFileSync(settingsPath, JSON.stringify({ env: { ANTHROPIC_API_KEY: apiKey } }, null, 2));
};

test('ensureZaiShellEnv skips placeholder keys', () => {
  const tempDir = makeTempDir();
  const configDir = path.join(tempDir, 'config');
  const profilePath = path.join(tempDir, '.zshrc');
  writeSettings(configDir, '<API_KEY>');

  const result = ensureZaiShellEnv({ configDir, profilePath });
  assert.equal(result.status, 'skipped');
  assert.ok(result.message?.includes('missing API key'));
  assert.equal(fs.existsSync(profilePath), false);
});

test('ensureZaiShellEnv skips when profile already has a key', () => {
  const tempDir = makeTempDir();
  const configDir = path.join(tempDir, 'config');
  const profilePath = path.join(tempDir, '.zshrc');
  writeSettings(configDir, 'new-key');
  fs.writeFileSync(profilePath, 'export Z_AI_API_KEY="existing-key"\n');

  const result = ensureZaiShellEnv({ configDir, profilePath });
  assert.equal(result.status, 'skipped');
  assert.ok(result.message?.includes('already set in shell profile'));
  const content = fs.readFileSync(profilePath, 'utf8');
  assert.ok(content.includes('existing-key'));
});

test('ensureZaiShellEnv writes a claude-sneakpeek block when missing', () => {
  const tempDir = makeTempDir();
  const configDir = path.join(tempDir, 'config');
  const profilePath = path.join(tempDir, '.zshrc');
  writeSettings(configDir, 'abc123');

  const result = ensureZaiShellEnv({ configDir, profilePath });
  assert.equal(result.status, 'updated');
  const content = fs.readFileSync(profilePath, 'utf8');
  assert.ok(content.includes('claude-sneakpeek: Z.ai env start'));
  assert.ok(content.includes('export Z_AI_API_KEY="abc123"'));
});
