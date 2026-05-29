/**
 * CLI Doctor Output Tests
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { printDoctor, sanitizeDoctorText, type ProviderDoctorReportItem } from '../../src/cli/doctor.js';

// Capture console.log output
function captureOutput(fn: () => void): string[] {
  const logs: string[] = [];
  const originalLog = console.log;
  console.log = (...args: unknown[]) => logs.push(args.join(' '));
  try {
    fn();
  } finally {
    console.log = originalLog;
  }
  return logs;
}

test('printDoctor prints empty message for no variants', () => {
  const output = captureOutput(() => printDoctor([]));
  assert.deepEqual(output, ['No variants found.']);
});

test('printDoctor prints healthy variants with checkmark', () => {
  const report = [
    { name: 'alpha', ok: true, binaryPath: '/tmp/alpha', wrapperPath: '/tmp/bin/alpha' },
    { name: 'beta', ok: true, binaryPath: '/tmp/beta', wrapperPath: '/tmp/bin/beta' },
  ];

  const output = captureOutput(() => printDoctor(report));

  assert.equal(output.length, 2);
  assert.ok(output[0].includes('✓'));
  assert.ok(output[0].includes('alpha'));
  assert.ok(output[1].includes('✓'));
  assert.ok(output[1].includes('beta'));
});

test('printDoctor prints unhealthy variants with X and details', () => {
  const report = [{ name: 'broken', ok: false, binaryPath: '/tmp/broken', wrapperPath: '/tmp/bin/broken' }];

  const output = captureOutput(() => printDoctor(report));

  assert.equal(output.length, 3);
  assert.ok(output[0].includes('✗'));
  assert.ok(output[0].includes('broken'));
  assert.ok(output[1].includes('binary:'));
  assert.ok(output[1].includes('/tmp/broken'));
  assert.ok(output[2].includes('wrapper:'));
  assert.ok(output[2].includes('/tmp/bin/broken'));
});

test('printDoctor shows missing for undefined binaryPath', () => {
  const report = [{ name: 'missing', ok: false, wrapperPath: '/tmp/bin/missing' }];

  const output = captureOutput(() => printDoctor(report));

  assert.equal(output.length, 3);
  assert.ok(output[1].includes('missing'));
});

test('printDoctor handles mixed healthy and unhealthy', () => {
  const report = [
    { name: 'good', ok: true, binaryPath: '/tmp/good', wrapperPath: '/tmp/bin/good' },
    { name: 'bad', ok: false, binaryPath: '/tmp/bad', wrapperPath: '/tmp/bin/bad' },
  ];

  const output = captureOutput(() => printDoctor(report));

  // good: 1 line, bad: 3 lines (status + binary + wrapper)
  assert.equal(output.length, 4);
  assert.ok(output[0].includes('✓'));
  assert.ok(output[0].includes('good'));
  assert.ok(output[1].includes('✗'));
  assert.ok(output[1].includes('bad'));
});

test('printDoctor prints provider runtime and capability findings', () => {
  const report: ProviderDoctorReportItem[] = [
    {
      name: 'minimax',
      provider: 'minimax',
      ok: true,
      binaryPath: '/tmp/minimax',
      wrapperPath: '/tmp/bin/minimax',
      runtime: {
        ok: false,
        settings: 'present',
        claudeConfig: 'present',
        auth: {
          mode: 'authToken',
          ok: false,
          requiredEnv: ['ANTHROPIC_AUTH_TOKEN'],
          presentEnv: [],
          missingEnv: ['ANTHROPIC_AUTH_TOKEN'],
          placeholderEnv: [],
          emptyEnv: [],
          apiKeyMustBeEmpty: true,
          apiKeyEmpty: true,
        },
        baseUrl: {
          required: true,
          present: true,
        },
        modelMapping: {
          required: false,
          present: [],
          missing: [],
        },
        profile: {
          required: false,
          status: 'not-applicable',
        },
      },
      capabilities: {
        ok: false,
        providerContract: 'provider-template',
        permissions: {
          ok: false,
          requiredDeny: ['WebSearch'],
          presentDeny: [],
          missingDeny: ['WebSearch'],
        },
        mcp: {
          ok: true,
          expectedServers: ['MiniMax'],
          configuredServers: ['MiniMax'],
          missingServers: [],
        },
      },
      findings: [
        {
          code: 'missing-required-env',
          severity: 'error',
          area: 'runtime',
          message: 'missing required env var ANTHROPIC_AUTH_TOKEN',
        },
      ],
    },
  ];

  const output = captureOutput(() => printDoctor(report));

  assert.ok(output[0].includes('minimax'));
  assert.ok(output[0].includes('(minimax)'));
  assert.ok(output.some((line) => line.includes('runtime:')));
  assert.ok(output.some((line) => line.includes('capabilities:')));
  assert.ok(output.some((line) => line.includes('missing required env var ANTHROPIC_AUTH_TOKEN')));
});

test('sanitizeDoctorText redacts known secret values and secret assignments', () => {
  const text = [
    'ANTHROPIC_AUTH_TOKEN=secret-token',
    'stderr mentions secret-token directly',
    'MINIMAX_API_KEY="another-secret"',
  ].join('\n');

  const sanitized = sanitizeDoctorText(text, ['secret-token', 'another-secret']);

  assert.equal(sanitized.includes('secret-token'), false);
  assert.equal(sanitized.includes('another-secret'), false);
  assert.ok(sanitized.includes('<redacted>'));
});
