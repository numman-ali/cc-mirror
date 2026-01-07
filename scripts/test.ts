import { spawn } from 'node:child_process';
import { readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

function findTestFiles(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      files.push(...findTestFiles(fullPath));
    } else if (entry.endsWith('.test.ts')) {
      files.push(fullPath);
    }
  }
  return files;
}

const testDir = process.argv[2] || 'test';
const files = findTestFiles(testDir);

if (files.length === 0) {
  console.error('No test files found');
  process.exit(1);
}

const watchMode = process.argv.includes('--watch');
const args = ['--test', ...(watchMode ? ['--watch'] : []), '--import', 'tsx', ...files];

const child = spawn('node', args, { stdio: 'inherit', shell: false });
child.on('close', (code) => process.exit(code ?? 0));
