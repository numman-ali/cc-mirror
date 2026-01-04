import fs from 'node:fs';
import path from 'node:path';

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
    'CCMZAI',
    '        __cc_show_label="0"',
    '        ;;',
    '      minimax)',
    "        cat <<'CCMMIN'",
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
    'CCMMIN',
    '        __cc_show_label="0"',
    '        ;;',
    '      openrouter)',
    "        cat <<'CCMORT'",
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
    'CCMORT',
    '        __cc_show_label="0"',
    '        ;;',
    '      ccrouter)',
    "        cat <<'CCMCCR'",
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
    'CCMCCR',
    '        __cc_show_label="0"',
    '        ;;',
    '      mirror)',
    "        cat <<'CCMMIR'",
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
    'CCMMIR',
    '        __cc_show_label="0"',
    '        ;;',
    '      *)',
    "        cat <<'CCMGEN'",
    '',
    `${C.defPrimary}    ██████╗ ██████╗   ${C.defDim}━━  M I R R O R${C.reset}`,
    `${C.defPrimary}   ██╔════╝██╔════╝${C.reset}`,
    `${C.defPrimary}   ██║     ██║     ${C.defDim}Claude Code Variants${C.reset}`,
    `${C.defPrimary}   ██║     ██║     ${C.defDim}Custom Providers${C.reset}`,
    `${C.defPrimary}   ╚██████╗╚██████╗${C.reset}`,
    `${C.defPrimary}    ╚═════╝ ╚═════╝${C.reset}`,
    '',
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
    ...splash,
    execLine,
    '',
  ].join('\n');
  fs.writeFileSync(wrapperPath, content, { mode: 0o755 });
};
