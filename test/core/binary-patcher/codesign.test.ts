import test from 'node:test';
import assert from 'node:assert/strict';

import { tryAdhocSign } from '../../../src/core/binary-patcher/codesign.js';

test('tryAdhocSign returns no-codesign on non-darwin platforms', () => {
  if (process.platform === 'darwin') {
    // On darwin we can't reliably exercise the non-darwin branch; just skip.
    // The orchestrator's behaviour on non-darwin is exercised by the cross-platform
    // applyPatches tests (which never trigger codesign on ELF/PE).
    return;
  }
  const result = tryAdhocSign('/some/path/that/does/not/matter');
  assert.equal(result.signed, false);
  assert.equal(result.reason, 'no-codesign');
});

test('tryAdhocSign returns failed when codesign rejects the input on darwin', () => {
  if (process.platform !== 'darwin') return;
  // /etc/hosts is not a Mach-O binary; codesign should refuse.
  const result = tryAdhocSign('/etc/hosts');
  // Either failed (codesign present, refused the input) or no-codesign (CI without Xcode CLT).
  assert.equal(result.signed, false);
  assert.ok(
    result.reason === 'failed' || result.reason === 'no-codesign',
    `expected failed or no-codesign, got ${result.reason}`
  );
});
