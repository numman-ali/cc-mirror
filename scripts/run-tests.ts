import { readdir } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

const ROOT = process.cwd();
const TEST_DIR = path.join(ROOT, 'test');

const collectTestFiles = async (dir: string, out: string[]): Promise<string[]> => {
  let entries;
  try {
    entries = await readdir(dir, { withFileTypes: true });
  } catch (error) {
    const err = error as NodeJS.ErrnoException;
    if (err && err.code === 'ENOENT') {
      return out;
    }
    throw error;
  }

  for (const entry of entries) {
    if (entry.name.startsWith('.')) {
      continue;
    }

    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules') {
        continue;
      }
      await collectTestFiles(fullPath, out);
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.test.ts')) {
      out.push(fullPath);
    }
  }

  return out;
};

const testFiles: string[] = await collectTestFiles(TEST_DIR, []);
if (testFiles.length === 0) {
  console.error('No test files found under ./test.');
  process.exit(1);
}

testFiles.sort((a: string, b: string) => a.localeCompare(b));

const passThroughArgs: string[] = process.argv.slice(2);
const nodeArgs: string[] = ['--test', '--import', 'tsx'];
if (!passThroughArgs.some((arg) => arg === '--test-concurrency' || arg.startsWith('--test-concurrency='))) {
  nodeArgs.push('--test-concurrency=1');
}
nodeArgs.push(...passThroughArgs, ...testFiles);

const child = spawn(process.execPath, nodeArgs, { stdio: 'inherit' });
child.on('exit', (code, signal) => {
  if (signal) {
    process.exit(1);
  }
  process.exit(code ?? 1);
});
