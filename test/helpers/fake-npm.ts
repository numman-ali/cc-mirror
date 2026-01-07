/**
 * Fake NPM Helpers
 *
 * Create a mock npm command for testing variant installation
 * without actually downloading packages.
 */

import path from 'node:path';
import fs from 'node:fs';
import { makeTempDir, writeExecutable, cleanup } from './fs-helpers.js';

const isWindows = process.platform === 'win32';
const pathSeparator = isWindows ? ';' : ':';

/**
 * Create a fake npm script that creates a dummy CLI
 */
export const createFakeNpm = (dir: string) => {
  const scriptContent = `const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
let prefix = '';
for (let i = 0; i < args.length; i += 1) {
  if (args[i] === '--prefix' && args[i + 1]) {
    prefix = args[i + 1];
  }
}
if (!prefix) process.exit(1);
const pkgSpec = args[args.length - 1] || '@anthropic-ai/claude-code';
const atIndex = pkgSpec.lastIndexOf('@');
const pkgName = atIndex > 0 ? pkgSpec.slice(0, atIndex) : pkgSpec;
const cliPath = path.join(prefix, 'node_modules', ...pkgName.split('/'), 'cli.js');
fs.mkdirSync(path.dirname(cliPath), { recursive: true });
const payload = process.env.CC_MIRROR_FAKE_NPM_PAYLOAD || 'claude dummy';
const teamModeFunc = 'function sU(){return!1}';
fs.writeFileSync(cliPath, '#!/usr/bin/env node\\n' + teamModeFunc + '\\n' + 'console.log(' + JSON.stringify(payload) + ');\\n');
if (process.platform !== 'win32') fs.chmodSync(cliPath, 0o755);
`;

  if (isWindows) {
    const jsPath = path.join(dir, 'npm-fake.js');
    const cmdPath = path.join(dir, 'npm.cmd');
    fs.writeFileSync(jsPath, scriptContent);
    fs.writeFileSync(cmdPath, `@echo off\r\nnode "${jsPath}" %*\r\n`);
    return cmdPath;
  } else {
    const npmPath = path.join(dir, 'npm');
    const script = `#!/usr/bin/env node\n${scriptContent}`;
    writeExecutable(npmPath, script);
    return npmPath;
  }
};

/**
 * Execute a function with fake npm in PATH
 */
export const withFakeNpm = (fn: () => void) => {
  const binDir = makeTempDir();
  createFakeNpm(binDir);
  const previousPath = process.env.PATH || '';
  process.env.PATH = `${binDir}${pathSeparator}${previousPath}`;
  try {
    fn();
  } finally {
    process.env.PATH = previousPath;
    delete process.env.CC_MIRROR_FAKE_NPM_PAYLOAD;
    cleanup(binDir);
  }
};
