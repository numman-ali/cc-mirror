import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { MAX_JSON_BYTES, readJson, writeJson } from '../../src/core/fs.js';
import { cleanup, makeTempDir } from '../helpers/index.js';

test('readJson removes prototype pollution keys', () => {
  const dir = makeTempDir('cc-mirror-fs-');

  try {
    const filePath = path.join(dir, 'settings.json');
    fs.writeFileSync(
      filePath,
      '{"env":{"ANTHROPIC_BASE_URL":"https://example.invalid"},"__proto__":{"polluted":true},"constructor":{"prototype":{"alsoPolluted":true}}}'
    );

    const parsed = readJson<Record<string, unknown>>(filePath);

    assert.deepEqual(parsed, {
      env: {
        ANTHROPIC_BASE_URL: 'https://example.invalid',
      },
    });
    assert.equal(({} as Record<string, unknown>).polluted, undefined);
    assert.equal(({} as Record<string, unknown>).alsoPolluted, undefined);
  } finally {
    cleanup(dir);
  }
});

test('readJson rejects oversized files', () => {
  const dir = makeTempDir('cc-mirror-fs-');

  try {
    const filePath = path.join(dir, 'huge.json');
    fs.writeFileSync(filePath, `{"payload":"${'x'.repeat(MAX_JSON_BYTES)}"}`);

    assert.equal(readJson(filePath), null);
  } finally {
    cleanup(dir);
  }
});

test('writeJson writes readable JSON', () => {
  const dir = makeTempDir('cc-mirror-fs-');

  try {
    const filePath = path.join(dir, 'variant.json');
    writeJson(filePath, { name: 'zai', provider: 'zai' });

    assert.deepEqual(readJson(filePath), { name: 'zai', provider: 'zai' });
  } finally {
    cleanup(dir);
  }
});
