import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../../src/core/index.js';
import { makeTempDir, cleanup } from '../helpers/index.js';

test('createVariant rejects invalid variant names', () => {
  const rootDir = makeTempDir();
  const binDir = makeTempDir();
  const invalidNames = ['bad name', 'bad/name', '..', '../oops', 'bad%name', '"bad"'];

  try {
    for (const name of invalidNames) {
      assert.throws(
        () =>
          core.createVariant({
            name,
            providerKey: 'custom',
            baseUrl: 'http://localhost:4000/anthropic',
            apiKey: '',
            rootDir,
            binDir,
            noTweak: true,
            tweakccStdio: 'pipe',
          }),
        /Invalid variant name/
      );
    }
  } finally {
    cleanup(rootDir);
    cleanup(binDir);
  }
});
