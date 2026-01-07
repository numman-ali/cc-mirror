import fs from 'node:fs';
import path from 'node:path';
import { getPlatform, type Platform } from './platform.js';
import { generateBashSplash, generateWindowsSplash } from './splash.js';

export type WrapperRuntime = 'native' | 'node';

export const writeWrapper = (
  wrapperPath: string,
  configDir: string,
  binaryPath: string,
  runtime: WrapperRuntime = 'node'
) => {
  const tweakDir = path.join(path.dirname(configDir), 'tweakcc');
  const execLine = runtime === 'node' ? `exec node "${binaryPath}" "$@"` : `exec "${binaryPath}" "$@"`;
  const envLoader = [
    'if command -v node >/dev/null 2>&1; then',
    '  __cc_mirror_env_file="$(mktemp)"',
    '  node - <<\'NODE\' > "$__cc_mirror_env_file" || true',
    "const fs = require('fs');",
    "const path = require('path');",
    'const dir = process.env.CLAUDE_CONFIG_DIR;',
    'if (!dir) process.exit(0);',
    "const file = path.join(dir, 'settings.json');",
    'const escape = (value) => "\'" + String(value).replace(/\'/g, "\'\\"\'\\"\'") + "\'";',
    'try {',
    '  if (fs.existsSync(file)) {',
    "    const data = JSON.parse(fs.readFileSync(file, 'utf8'));",
    "    const env = data && typeof data === 'object' ? data.env : null;",
    "    if (env && typeof env === 'object') {",
    '      for (const [key, value] of Object.entries(env)) {',
    '        if (!key) continue;',
    '        process.stdout.write(`export ${key}=${escape(value)}\n`);',
    '      }',
    '    }',
    '  }',
    '} catch {',
    '}',
    'NODE',
    '  if [[ -s "$__cc_mirror_env_file" ]]; then',
    '    source "$__cc_mirror_env_file"',
    '  fi',
    '  rm -f "$__cc_mirror_env_file" || true',
    'fi',
  ];
  const splash = generateBashSplash();
  const content = [
    '#!/usr/bin/env bash',
    'set -euo pipefail',
    `export CLAUDE_CONFIG_DIR="${configDir}"`,
    `export TWEAKCC_CONFIG_DIR="${tweakDir}"`,
    ...envLoader,
    'if [[ "${CC_MIRROR_UNSET_AUTH_TOKEN:-0}" != "0" ]]; then',
    '  unset ANTHROPIC_AUTH_TOKEN',
    'fi',
    'if [[ -n "${CLAUDE_CODE_TEAM_MODE:-}" ]]; then',
    '  __cc_git_root=$(git rev-parse --show-toplevel 2>/dev/null || pwd)',
    '  __cc_folder_name=$(basename "$__cc_git_root")',
    '  if [[ -n "${TEAM:-}" ]]; then',
    '    export CLAUDE_CODE_TEAM_NAME="${__cc_folder_name}-${TEAM}"',
    '  else',
    '    export CLAUDE_CODE_TEAM_NAME="${__cc_folder_name}"',
    '  fi',
    'elif [[ -n "${TEAM:-}" ]]; then',
    '  __cc_git_root=$(git rev-parse --show-toplevel 2>/dev/null || pwd)',
    '  __cc_folder_name=$(basename "$__cc_git_root")',
    '  export CLAUDE_CODE_TEAM_NAME="${__cc_folder_name}-${TEAM}"',
    'fi',
    ...splash,
    execLine,
    '',
  ].join('\n');
  fs.writeFileSync(wrapperPath, content, { mode: 0o755 });
};

export const writeWindowsWrapper = (
  wrapperPath: string,
  configDir: string,
  binaryPath: string,
  runtime: WrapperRuntime = 'node'
) => {
  const tweakDir = path.join(path.dirname(configDir), 'tweakcc');
  const execLine = runtime === 'node' ? `node "${binaryPath}" %*` : `"${binaryPath}" %*`;
  const splash = generateWindowsSplash();

  const envLoaderScriptPath = path.join(path.dirname(configDir), 'env-loader.js').replace(/\\/g, '/');
  let envLoader: string[] = [];
  if (runtime === 'node') {
    const envLoaderScriptContent = [
      'const fs = require("fs");',
      'const path = require("path");',
      'const dir = process.env.CLAUDE_CONFIG_DIR;',
      'if (!dir) process.exit(0);',
      'const file = path.join(dir, "settings.json");',
      'try {',
      '  if (fs.existsSync(file)) {',
      '    const data = JSON.parse(fs.readFileSync(file, "utf8"));',
      '    const env = data && typeof data === "object" ? data.env : null;',
      '    if (env && typeof env === "object") {',
      '      for (const [key, value] of Object.entries(env)) {',
      '        if (!key) continue;',
      '        const escaped = String(value).replace(/%/g, "%%").replace(/"/g, "");',
      '        console.log("set \\"" + key + "=" + escaped + "\\"");',
      '      }',
      '    }',
      '  }',
      '} catch {}',
    ].join('\n');
    fs.writeFileSync(envLoaderScriptPath.replace(/\//g, path.sep), envLoaderScriptContent);

    envLoader = [
      'where node >nul 2>&1 && (',
      `  for /f "delims=" %%i in ('node "${envLoaderScriptPath}" 2^>nul') do %%i`,
      ')',
    ];
  }

  const lines = [
    '@echo off',
    'setlocal EnableDelayedExpansion',
    '',
    `set "CLAUDE_CONFIG_DIR=${configDir}"`,
    `set "TWEAKCC_CONFIG_DIR=${tweakDir}"`,
    '',
    ...envLoader,
    '',
    'if defined CC_MIRROR_UNSET_AUTH_TOKEN (',
    '  if not "%CC_MIRROR_UNSET_AUTH_TOKEN%"=="0" (',
    '    set "ANTHROPIC_AUTH_TOKEN="',
    '  )',
    ')',
    '',
    'if defined CLAUDE_CODE_TEAM_MODE (',
    '  for /f "delims=" %%i in (\'git rev-parse --show-toplevel 2^>nul ^|^| cd\') do set "__cc_git_root=%%i"',
    '  for %%i in ("!__cc_git_root!") do set "__cc_folder_name=%%~ni"',
    '  if defined TEAM (',
    '    set "CLAUDE_CODE_TEAM_NAME=!__cc_folder_name!-!TEAM!"',
    '  ) else (',
    '    set "CLAUDE_CODE_TEAM_NAME=!__cc_folder_name!"',
    '  )',
    ') else if defined TEAM (',
    '  for /f "delims=" %%i in (\'git rev-parse --show-toplevel 2^>nul ^|^| cd\') do set "__cc_git_root=%%i"',
    '  for %%i in ("!__cc_git_root!") do set "__cc_folder_name=%%~ni"',
    '  set "CLAUDE_CODE_TEAM_NAME=!__cc_folder_name!-!TEAM!"',
    ')',
    '',
    ...splash,
    '',
    execLine,
  ];

  const content = lines.join('\r\n');
  fs.writeFileSync(wrapperPath, content);

  const bashWrapperPath = wrapperPath.replace(/\.cmd$/, '');
  if (bashWrapperPath !== wrapperPath) {
    const bashWrapper = ['#!/bin/bash', `exec cmd //c "$(cygpath -w "$0").cmd" "$@"`].join('\n');
    fs.writeFileSync(bashWrapperPath, bashWrapper, { mode: 0o755 });
  }
};

export const writeWrapperForPlatform = (
  wrapperPath: string,
  configDir: string,
  binaryPath: string,
  runtime: WrapperRuntime = 'node',
  platform: Platform = getPlatform()
) => {
  if (platform === 'win32') {
    writeWindowsWrapper(wrapperPath, configDir, binaryPath, runtime);
  } else {
    writeWrapper(wrapperPath, configDir, binaryPath, runtime);
  }
};
