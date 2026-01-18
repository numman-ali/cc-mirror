import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { commandExists } from './paths.js';

const npmCommand = 'npm';
const npmShell = process.platform === 'win32';

const NPM_PACKAGE_PATTERN = /^(?:@[\w.-]+\/)?[\w.-]+$/;
const NPM_VERSION_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._+-]*$/;

const assertValidNpmPackage = (value: string) => {
  if (!value || !NPM_PACKAGE_PATTERN.test(value)) {
    throw new Error(`Invalid npm package "${value}". Use a normal package name like "@scope/name" or "name".`);
  }
};

const assertValidNpmVersion = (value: string) => {
  if (!value) return;
  if (!NPM_VERSION_PATTERN.test(value)) {
    throw new Error(`Invalid npm version "${value}". Use a specific version or dist-tag (letters, digits, ., -, +).`);
  }
};

const assertSafeNpmInputs = (npmPackage: string, npmVersion: string) => {
  assertValidNpmPackage(npmPackage);
  assertValidNpmVersion(npmVersion);
};

const quoteCmdArg = (value: string) => {
  if (value.length === 0) return '""';
  if (value.includes('"')) {
    throw new Error(`Invalid value "${value}". Double quotes are not supported.`);
  }
  return `"${value}"`;
};

const buildWindowsNpmCommand = (npmDir: string, pkgSpec: string) => {
  const args = ['install', '--prefix', npmDir, '--no-save', pkgSpec];
  return [npmCommand, ...args.map(quoteCmdArg)].join(' ');
};

export const resolveNpmCliPath = (npmDir: string, npmPackage: string): string => {
  const packageParts = npmPackage.split('/');
  return path.join(npmDir, 'node_modules', ...packageParts, 'cli.js');
};

export const installNpmClaude = (params: {
  npmDir: string;
  npmPackage: string;
  npmVersion: string;
  stdio?: 'inherit' | 'pipe';
}): { cliPath: string } => {
  assertSafeNpmInputs(params.npmPackage, params.npmVersion);
  if (!commandExists(npmCommand)) {
    throw new Error('npm is required for npm-based installs.');
  }

  const stdio = params.stdio ?? 'inherit';
  const pkgSpec = params.npmVersion ? `${params.npmPackage}@${params.npmVersion}` : params.npmPackage;
  const npmArgs = ['install', '--prefix', params.npmDir, '--no-save', pkgSpec];
  const result = npmShell
    ? spawnSync(buildWindowsNpmCommand(params.npmDir, pkgSpec), {
        stdio: 'pipe',
        encoding: 'utf8',
        shell: true,
      })
    : spawnSync(npmCommand, npmArgs, {
        stdio: 'pipe',
        encoding: 'utf8',
      });

  if (stdio === 'inherit') {
    if (result.stdout) process.stdout.write(result.stdout);
    if (result.stderr) process.stderr.write(result.stderr);
  }

  if (result.status !== 0) {
    const output = `${result.stderr ?? ''}\n${result.stdout ?? ''}`.trim();
    const errorMessage = result.error ? `\n${result.error.message}` : '';
    const tail = output.length > 0 ? `\n${output}` : '';
    throw new Error(`npm install failed for ${pkgSpec}.${errorMessage}${tail}`);
  }

  const cliPath = resolveNpmCliPath(params.npmDir, params.npmPackage);
  if (!fs.existsSync(cliPath)) {
    throw new Error(`npm install succeeded but cli.js was not found at ${cliPath}`);
  }

  return { cliPath };
};

/**
 * Async version of installNpmClaude - allows React to re-render between steps
 */
export const installNpmClaudeAsync = (params: {
  npmDir: string;
  npmPackage: string;
  npmVersion: string;
  stdio?: 'inherit' | 'pipe';
}): Promise<{ cliPath: string }> => {
  return new Promise((resolve, reject) => {
    try {
      assertSafeNpmInputs(params.npmPackage, params.npmVersion);
    } catch (error) {
      reject(error);
      return;
    }
    if (!commandExists(npmCommand)) {
      reject(new Error('npm is required for npm-based installs.'));
      return;
    }

    const stdio = params.stdio ?? 'inherit';
    const pkgSpec = params.npmVersion ? `${params.npmPackage}@${params.npmVersion}` : params.npmPackage;
    const npmArgs = ['install', '--prefix', params.npmDir, '--no-save', pkgSpec];
    const child = npmShell
      ? spawn(buildWindowsNpmCommand(params.npmDir, pkgSpec), {
          stdio: 'pipe',
          shell: true,
        })
      : spawn(npmCommand, npmArgs, {
          stdio: 'pipe',
        });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
      if (stdio === 'inherit') process.stdout.write(data);
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
      if (stdio === 'inherit') process.stderr.write(data);
    });

    child.on('close', (code) => {
      if (code !== 0) {
        const output = `${stderr}\n${stdout}`.trim();
        const tail = output.length > 0 ? `\n${output}` : '';
        reject(new Error(`npm install failed for ${pkgSpec}.${tail}`));
        return;
      }

      const cliPath = resolveNpmCliPath(params.npmDir, params.npmPackage);
      if (!fs.existsSync(cliPath)) {
        reject(new Error(`npm install succeeded but cli.js was not found at ${cliPath}`));
        return;
      }

      resolve({ cliPath });
    });

    child.on('error', (err) => {
      reject(new Error(`Failed to spawn npm: ${err.message}`));
    });
  });
};
