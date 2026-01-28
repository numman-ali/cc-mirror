import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const distDir = path.join(root, 'dist');

fs.mkdirSync(distDir, { recursive: true });

// Keep React ecosystem as external (npm will install them)
// This avoids bundling issues with dynamic imports and optional deps
const external = [
  // React ecosystem - let npm handle these
  'react',
  'react-dom',
  'ink',
  'ink-select-input',
  'ink-text-input',
  // Other dependencies
  'tweakcc',
];

// Build CLI
await build({
  entryPoints: [path.join(root, 'src', 'cli', 'index.ts')],
  outfile: path.join(distDir, 'claude-sneakpeek.mjs'),
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node18',
  external,
  banner: {
    js: '#!/usr/bin/env node',
  },
});

// Build TUI
await build({
  entryPoints: [path.join(root, 'src', 'tui', 'index.tsx')],
  outfile: path.join(distDir, 'tui.mjs'),
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node18',
  external,
});

fs.chmodSync(path.join(distDir, 'claude-sneakpeek.mjs'), 0o755);

// Copy bundled skills to dist
const skillsSrcDir = path.join(root, 'src', 'skills');
const skillsDistDir = path.join(distDir, 'skills');
if (fs.existsSync(skillsSrcDir)) {
  fs.cpSync(skillsSrcDir, skillsDistDir, { recursive: true });
  console.log('Copied skills to dist/skills');
}

console.log('Bundled to dist/claude-sneakpeek.mjs and dist/tui.mjs');
