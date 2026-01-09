import fs from 'node:fs';
import path from 'node:path';
import { isWindows } from './paths.js';

export type WrapperRuntime = 'native' | 'node';

type SplashArt = Record<string, string[]>;

// ANSI color codes for colored ASCII art
const C = {
  reset: '\x1b[0m',
  // Zai: Gold/Amber gradient
  zaiPrimary: '\x1b[38;5;220m', // Gold
  zaiSecondary: '\x1b[38;5;214m', // Orange-gold
  zaiAccent: '\x1b[38;5;208m', // Dark orange
  zaiDim: '\x1b[38;5;172m', // Muted gold
  // MiniMax: Coral/Red/Orange gradient (from brand image)
  mmPrimary: '\x1b[38;5;203m', // Coral/salmon red
  mmSecondary: '\x1b[38;5;209m', // Light coral/orange
  mmAccent: '\x1b[38;5;208m', // Orange
  mmDim: '\x1b[38;5;167m', // Muted coral/dark red
  // OpenRouter: Cyan/Teal gradient
  orPrimary: '\x1b[38;5;43m', // Teal
  orSecondary: '\x1b[38;5;49m', // Bright teal
  orAccent: '\x1b[38;5;37m', // Deep cyan
  orDim: '\x1b[38;5;30m', // Muted teal
  // CCRouter: Sky blue gradient
  ccrPrimary: '\x1b[38;5;39m', // Sky blue
  ccrSecondary: '\x1b[38;5;45m', // Bright cyan
  ccrAccent: '\x1b[38;5;33m', // Deep blue
  ccrDim: '\x1b[38;5;31m', // Muted blue
  // Mirror: Silver/Chrome with electric blue
  mirPrimary: '\x1b[38;5;252m', // Silver/light gray
  mirSecondary: '\x1b[38;5;250m', // Platinum
  mirAccent: '\x1b[38;5;45m', // Electric cyan
  mirDim: '\x1b[38;5;243m', // Muted silver
  // Default: White/Gray
  defPrimary: '\x1b[38;5;255m', // White
  defDim: '\x1b[38;5;245m', // Gray
};

const SPLASH_ART: SplashArt = {
  zai: [
    '',
    `${C.zaiPrimary}    ███████╗       █████╗ ██╗${C.reset}`,
    `${C.zaiPrimary}    ╚══███╔╝      ██╔══██╗██║${C.reset}`,
    `${C.zaiSecondary}      ███╔╝       ███████║██║${C.reset}`,
    `${C.zaiSecondary}     ███╔╝    ${C.zaiAccent}██╗${C.zaiSecondary} ██╔══██║██║${C.reset}`,
    `${C.zaiAccent}    ███████╗  ╚═╝ ██║  ██║██║${C.reset}`,
    `${C.zaiAccent}    ╚══════╝      ╚═╝  ╚═╝╚═╝${C.reset}`,
    '',
    `${C.zaiDim}    ━━━━━━━━━━${C.zaiPrimary}◆${C.zaiDim}━━━━━━━━━━${C.reset}`,
    `${C.zaiSecondary}      GLM Coding Plan${C.reset}`,
    '',
  ],
  minimax: [
    '',
    `${C.mmPrimary}    ███╗   ███╗██╗███╗   ██╗██╗███╗   ███╗ █████╗ ██╗  ██╗${C.reset}`,
    `${C.mmPrimary}    ████╗ ████║██║████╗  ██║██║████╗ ████║██╔══██╗╚██╗██╔╝${C.reset}`,
    `${C.mmSecondary}    ██╔████╔██║██║██╔██╗ ██║██║██╔████╔██║███████║ ╚███╔╝${C.reset}`,
    `${C.mmSecondary}    ██║╚██╔╝██║██║██║╚██╗██║██║██║╚██╔╝██║██╔══██║ ██╔██╗${C.reset}`,
    `${C.mmAccent}    ██║ ╚═╝ ██║██║██║ ╚████║██║██║ ╚═╝ ██║██║  ██║██╔╝ ██╗${C.reset}`,
    `${C.mmAccent}    ╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝╚═╝╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝${C.reset}`,
    '',
    `${C.mmDim}    ━━━━━━━━━━━━━━━━━━${C.mmPrimary}◆${C.mmDim}━━━━━━━━━━━━━━━━━━${C.reset}`,
    `${C.mmSecondary}           MiniMax-M2.1 ${C.mmDim}━${C.mmSecondary} AGI for All${C.reset}`,
    '',
  ],
  openrouter: [
    '',
    `${C.orPrimary}     ██████╗ ██████╗ ███████╗███╗   ██╗${C.reset}`,
    `${C.orPrimary}    ██╔═══██╗██╔══██╗██╔════╝████╗  ██║${C.reset}`,
    `${C.orSecondary}    ██║   ██║██████╔╝█████╗  ██╔██╗ ██║${C.reset}`,
    `${C.orSecondary}    ██║   ██║██╔═══╝ ██╔══╝  ██║╚██╗██║${C.reset}`,
    `${C.orAccent}    ╚██████╔╝██║     ███████╗██║ ╚████║${C.reset}`,
    `${C.orAccent}     ╚═════╝ ╚═╝     ╚══════╝╚═╝  ╚═══╝${C.reset}`,
    `${C.orPrimary}    ██████╗  ██████╗ ██╗   ██╗████████╗███████╗██████╗${C.reset}`,
    `${C.orPrimary}    ██╔══██╗██╔═══██╗██║   ██║╚══██╔══╝██╔════╝██╔══██╗${C.reset}`,
    `${C.orSecondary}    ██████╔╝██║   ██║██║   ██║   ██║   █████╗  ██████╔╝${C.reset}`,
    `${C.orSecondary}    ██╔══██╗██║   ██║██║   ██║   ██║   ██╔══╝  ██╔══██╗${C.reset}`,
    `${C.orAccent}    ██║  ██║╚██████╔╝╚██████╔╝   ██║   ███████╗██║  ██║${C.reset}`,
    `${C.orAccent}    ╚═╝  ╚═╝ ╚═════╝  ╚═════╝    ╚═╝   ╚══════╝╚═╝  ╚═╝${C.reset}`,
    '',
    `${C.orDim}    ━━━━━━━━━━━━━${C.orPrimary}◆${C.orDim}━━━━━━━━━━━━━${C.reset}`,
    `${C.orSecondary}      One API ${C.orDim}━${C.orSecondary} Any Model${C.reset}`,
    '',
  ],
  ccrouter: [
    '',
    `${C.ccrPrimary}     ██████╗ ██████╗██████╗  ██████╗ ██╗   ██╗████████╗███████╗██████╗${C.reset}`,
    `${C.ccrPrimary}    ██╔════╝██╔════╝██╔══██╗██╔═══██╗██║   ██║╚══██╔══╝██╔════╝██╔══██╗${C.reset}`,
    `${C.ccrSecondary}    ██║     ██║     ██████╔╝██║   ██║██║   ██║   ██║   █████╗  ██████╔╝${C.reset}`,
    `${C.ccrSecondary}    ██║     ██║     ██╔══██╗██║   ██║██║   ██║   ██║   ██╔══╝  ██╔══██╗${C.reset}`,
    `${C.ccrAccent}    ╚██████╗╚██████╗██║  ██║╚██████╔╝╚██████╔╝   ██║   ███████╗██║  ██║${C.reset}`,
    `${C.ccrAccent}     ╚═════╝ ╚═════╝╚═╝  ╚═╝ ╚═════╝  ╚═════╝    ╚═╝   ╚══════╝╚═╝  ╚═╝${C.reset}`,
    '',
    `${C.ccrDim}    ━━━━━━━━━━━━━━━━${C.ccrPrimary}◆${C.ccrDim}━━━━━━━━━━━━━━━━${C.reset}`,
    `${C.ccrSecondary}      Claude Code Router ${C.ccrDim}━${C.ccrSecondary} Any Model${C.reset}`,
    '',
  ],
  mirror: [
    '',
    `${C.mirPrimary}    ███╗   ███╗██╗██████╗ ██████╗  ██████╗ ██████╗${C.reset}`,
    `${C.mirPrimary}    ████╗ ████║██║██╔══██╗██╔══██╗██╔═══██╗██╔══██╗${C.reset}`,
    `${C.mirSecondary}    ██╔████╔██║██║██████╔╝██████╔╝██║   ██║██████╔╝${C.reset}`,
    `${C.mirSecondary}    ██║╚██╔╝██║██║██╔══██╗██╔══██╗██║   ██║██╔══██╗${C.reset}`,
    `${C.mirAccent}    ██║ ╚═╝ ██║██║██║  ██║██║  ██║╚██████╔╝██║  ██║${C.reset}`,
    `${C.mirAccent}    ╚═╝     ╚═╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝${C.reset}`,
    '',
    `${C.mirDim}    ━━━━━━━━━━━━${C.mirAccent}◇${C.mirDim}━━━━━━━━━━━━${C.reset}`,
    `${C.mirSecondary}      Claude ${C.mirDim}━${C.mirSecondary} Pure Reflection${C.reset}`,
    '',
  ],
  default: [
    '',
    `${C.defPrimary}    ██████╗ ██████╗   ${C.defDim}━━  M I R R O R${C.reset}`,
    `${C.defPrimary}   ██╔════╝██╔════╝${C.reset}`,
    `${C.defPrimary}   ██║     ██║     ${C.defDim}Claude Code Variants${C.reset}`,
    `${C.defPrimary}   ██║     ██║     ${C.defDim}Custom Providers${C.reset}`,
    `${C.defPrimary}   ╚██████╗╚██████╗${C.reset}`,
    `${C.defPrimary}    ╚═════╝ ╚═════╝${C.reset}`,
    '',
  ],
};

const KNOWN_SPLASH_STYLES = ['zai', 'minimax', 'openrouter', 'ccrouter', 'mirror'];

const buildWindowsWrapperScript = (opts: {
  configDir: string;
  tweakDir: string;
  binaryPath: string;
  runtime: WrapperRuntime;
}): string => {
  const splashJson = JSON.stringify(SPLASH_ART);
  const stylesJson = JSON.stringify(KNOWN_SPLASH_STYLES);

  const lines = [
    "import fs from 'node:fs';",
    "import path from 'node:path';",
    "import { spawnSync } from 'node:child_process';",
    "import os from 'node:os';",
    '',
    `const configDir = ${JSON.stringify(opts.configDir)};`,
    `const tweakDir = ${JSON.stringify(opts.tweakDir)};`,
    `const binaryPath = ${JSON.stringify(opts.binaryPath)};`,
    `const runtime = ${JSON.stringify(opts.runtime)};`,
    'const args = process.argv.slice(2);',
    '',
    'process.env.CLAUDE_CONFIG_DIR = configDir;',
    'process.env.TWEAKCC_CONFIG_DIR = tweakDir;',
    '',
    'const loadSettingsEnv = () => {',
    "  const file = path.join(configDir, 'settings.json');",
    '  try {',
    '    if (!fs.existsSync(file)) return;',
    "    const data = JSON.parse(fs.readFileSync(file, 'utf8'));",
    "    const env = data && typeof data === 'object' ? data.env : null;",
    "    if (env && typeof env === 'object') {",
    '      for (const [key, value] of Object.entries(env)) {',
    '        if (!key) continue;',
    '        process.env[key] = String(value);',
    '      }',
    '    }',
    '  } catch {',
    '    // ignore malformed settings',
    '  }',
    '};',
    'loadSettingsEnv();',
    '',
    "if ((process.env.CC_MIRROR_UNSET_AUTH_TOKEN || '0') !== '0') {",
    '  delete process.env.ANTHROPIC_AUTH_TOKEN;',
    '}',
    '',
    '// Dynamic team name: purely directory-based, with optional TEAM modifier',
    '// Check for CLAUDE_CODE_TEAM_MODE (not TEAM_NAME) to avoid Claude Code overwriting',
    'const teamMode = process.env.CLAUDE_CODE_TEAM_MODE;',
    'const teamModifier = process.env.TEAM;',
    'if (teamMode || teamModifier) {',
    '  let gitRoot = process.cwd();',
    '  try {',
    "    const result = spawnSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' });",
    '    if (result.status === 0 && result.stdout.trim()) {',
    '      gitRoot = result.stdout.trim();',
    '    }',
    '  } catch {',
    '    // ignore',
    '  }',
    '  const folderName = path.basename(gitRoot || process.cwd());',
    '  if (teamMode) {',
    "    process.env.CLAUDE_CODE_TEAM_NAME = teamModifier ? folderName + '-' + teamModifier : folderName;",
    '  } else if (teamModifier) {',
    "    process.env.CLAUDE_CODE_TEAM_NAME = folderName + '-' + teamModifier;",
    '  }',
    '}',
    '',
    "const splashEnabled = (process.env.CC_MIRROR_SPLASH || '0') !== '0';",
    "const skipSplash = args.join(' ').includes('--output-format');",
    'const shouldSplash = splashEnabled && Boolean(process.stdout.isTTY) && !skipSplash;',
    `const splashArt = ${splashJson};`,
    `const knownStyles = new Set(${stylesJson});`,
    'if (shouldSplash) {',
    "  const style = process.env.CC_MIRROR_SPLASH_STYLE || 'default';",
    "  const label = process.env.CC_MIRROR_PROVIDER_LABEL || 'cc-mirror';",
    "  const resolvedStyle = knownStyles.has(style) ? style : 'default';",
    '  const art = splashArt[resolvedStyle] || [];',
    "  process.stdout.write('\\n');",
    '  if (art.length > 0) {',
    "    process.stdout.write(art.join('\\n'));",
    '  }',
    '  if (knownStyles.has(style)) {',
    "    process.stdout.write('\\n');",
    '  } else {',
    "    process.stdout.write('\\n        ' + label + '\\n\\n');",
    '  }',
    '}',
    '',
    "const execArgs = runtime === 'node' ? [binaryPath, ...args] : args;",
    "const execCmd = runtime === 'node' ? process.execPath : binaryPath;",
    'const result = spawnSync(execCmd, execArgs, { stdio: "inherit", env: process.env });',
    'if (typeof result.status === "number") {',
    '  process.exit(result.status);',
    '}',
    'if (result.signal) {',
    '  const code = (os.constants?.signals && os.constants.signals[result.signal])',
    '    ? 128 + os.constants.signals[result.signal]',
    '    : 1;',
    '  process.exit(code);',
    '}',
    'process.exit(1);',
    '',
  ];

  return lines.join('\n');
};

const writeWindowsWrapper = (opts: {
  wrapperPath: string;
  configDir: string;
  tweakDir: string;
  binaryPath: string;
  runtime: WrapperRuntime;
}) => {
  const parsed = path.parse(opts.wrapperPath);
  const basePath = parsed.ext ? path.join(parsed.dir, parsed.name) : opts.wrapperPath;
  const cmdPath = parsed.ext ? opts.wrapperPath : `${opts.wrapperPath}.cmd`;
  const scriptPath = `${basePath}.mjs`;
  const scriptFilename = `${parsed.name}.mjs`;

  const scriptContent = buildWindowsWrapperScript({
    configDir: opts.configDir,
    tweakDir: opts.tweakDir,
    binaryPath: opts.binaryPath,
    runtime: opts.runtime,
  });

  const cmdLines = ['@echo off', 'setlocal', `node "%~dp0${scriptFilename}" %*`, ''];

  fs.writeFileSync(scriptPath, scriptContent, { encoding: 'utf8' });
  fs.writeFileSync(cmdPath, cmdLines.join('\r\n'), { encoding: 'utf8' });
};

export const writeWrapper = (
  wrapperPath: string,
  configDir: string,
  binaryPath: string,
  runtime: WrapperRuntime = 'node'
) => {
  const tweakDir = path.join(path.dirname(configDir), 'tweakcc');
  if (isWindows) {
    writeWindowsWrapper({ wrapperPath, configDir, tweakDir, binaryPath, runtime });
    return;
  }

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
    '        process.stdout.write(`export ${key}=${escape(value)}\\n`);',
    '      }',
    '    }',
    '  }',
    '} catch {',
    '  // ignore malformed settings',
    '}',
    'NODE',
    '  if [[ -s "$__cc_mirror_env_file" ]]; then',
    '    # shellcheck disable=SC1090',
    '    source "$__cc_mirror_env_file"',
    '  fi',
    '  rm -f "$__cc_mirror_env_file" || true',
    'fi',
  ];

  const splash = [
    'if [[ "${CC_MIRROR_SPLASH:-0}" != "0" ]] && [[ -t 1 ]]; then',
    '  if [[ "$*" != *"--output-format"* ]]; then',
    '    __cc_label="${CC_MIRROR_PROVIDER_LABEL:-cc-mirror}"',
    '    __cc_style="${CC_MIRROR_SPLASH_STYLE:-default}"',
    '    __cc_show_label="1"',
    '    printf "\\n"',
    '    case "$__cc_style" in',
    '      zai)',
    "        cat <<'CCMZAI'",
    ...SPLASH_ART.zai,
    'CCMZAI',
    '        __cc_show_label="0"',
    '        ;;',
    '      minimax)',
    "        cat <<'CCMMIN'",
    ...SPLASH_ART.minimax,
    'CCMMIN',
    '        __cc_show_label="0"',
    '        ;;',
    '      openrouter)',
    "        cat <<'CCMORT'",
    ...SPLASH_ART.openrouter,
    'CCMORT',
    '        __cc_show_label="0"',
    '        ;;',
    '      ccrouter)',
    "        cat <<'CCMCCR'",
    ...SPLASH_ART.ccrouter,
    'CCMCCR',
    '        __cc_show_label="0"',
    '        ;;',
    '      mirror)',
    "        cat <<'CCMMIR'",
    ...SPLASH_ART.mirror,
    'CCMMIR',
    '        __cc_show_label="0"',
    '        ;;',
    '      *)',
    "        cat <<'CCMGEN'",
    ...SPLASH_ART.default,
    'CCMGEN',
    '        ;;',
    '    esac',
    '    if [[ "$__cc_show_label" == "1" ]]; then',
    '      printf "        %s\\n\\n" "$__cc_label"',
    '    else',
    '      printf "\\n"',
    '    fi',
    '  fi',
    'fi',
  ];

  const content = [
    '#!/usr/bin/env bash',
    'set -euo pipefail',
    `export CLAUDE_CONFIG_DIR="${configDir}"`,
    `export TWEAKCC_CONFIG_DIR="${tweakDir}"`,
    ...envLoader,
    'if [[ "${CC_MIRROR_UNSET_AUTH_TOKEN:-0}" != "0" ]]; then',
    '  unset ANTHROPIC_AUTH_TOKEN',
    'fi',
    '# Dynamic team name: purely directory-based, with optional TEAM modifier',
    '# Check for CLAUDE_CODE_TEAM_MODE (not TEAM_NAME) to avoid Claude Code overwriting',
    'if [[ -n "${CLAUDE_CODE_TEAM_MODE:-}" ]]; then',
    '  __cc_git_root=$(git rev-parse --show-toplevel 2>/dev/null || pwd)',
    '  __cc_folder_name=$(basename "$__cc_git_root")',
    '  if [[ -n "${TEAM:-}" ]]; then',
    '    # Folder name + TEAM modifier',
    '    export CLAUDE_CODE_TEAM_NAME="${__cc_folder_name}-${TEAM}"',
    '  else',
    '    # Just folder name (pure directory-based)',
    '    export CLAUDE_CODE_TEAM_NAME="${__cc_folder_name}"',
    '  fi',
    'elif [[ -n "${TEAM:-}" ]]; then',
    '  # TEAM env var set without team mode in settings - use folder + TEAM',
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
