export const ANSI = {
  reset: '\x1b[0m',
  zaiPrimary: '\x1b[38;5;220m',
  zaiSecondary: '\x1b[38;5;214m',
  zaiAccent: '\x1b[38;5;208m',
  zaiDim: '\x1b[38;5;172m',
  mmPrimary: '\x1b[38;5;203m',
  mmSecondary: '\x1b[38;5;209m',
  mmAccent: '\x1b[38;5;208m',
  mmDim: '\x1b[38;5;167m',
  orPrimary: '\x1b[38;5;43m',
  orSecondary: '\x1b[38;5;49m',
  orAccent: '\x1b[38;5;37m',
  orDim: '\x1b[38;5;30m',
  ccrPrimary: '\x1b[38;5;39m',
  ccrSecondary: '\x1b[38;5;45m',
  ccrAccent: '\x1b[38;5;33m',
  ccrDim: '\x1b[38;5;31m',
  mirPrimary: '\x1b[38;5;252m',
  mirSecondary: '\x1b[38;5;250m',
  mirAccent: '\x1b[38;5;45m',
  mirDim: '\x1b[38;5;243m',
  defPrimary: '\x1b[38;5;255m',
  defDim: '\x1b[38;5;245m',
} as const;

export interface SplashConfig {
  key: string;
  art: string[];
  tagline: string;
  showLabel: boolean;
}

const C = ANSI;

export const SPLASH_CONFIGS: SplashConfig[] = [
  {
    key: 'zai',
    art: [
      `${C.zaiPrimary}    ███████╗       █████╗ ██╗${C.reset}`,
      `${C.zaiPrimary}    ╚══███╔╝      ██╔══██╗██║${C.reset}`,
      `${C.zaiSecondary}      ███╔╝       ███████║██║${C.reset}`,
      `${C.zaiSecondary}     ███╔╝    ${C.zaiAccent}██╗${C.zaiSecondary} ██╔══██║██║${C.reset}`,
      `${C.zaiAccent}    ███████╗  ╚═╝ ██║  ██║██║${C.reset}`,
      `${C.zaiAccent}    ╚══════╝      ╚═╝  ╚═╝╚═╝${C.reset}`,
      '',
      `${C.zaiDim}    ━━━━━━━━━━${C.zaiPrimary}◆${C.zaiDim}━━━━━━━━━━${C.reset}`,
      `${C.zaiSecondary}      GLM Coding Plan${C.reset}`,
    ],
    tagline: 'GLM Coding Plan',
    showLabel: false,
  },
  {
    key: 'minimax',
    art: [
      `${C.mmPrimary}    ███╗   ███╗██╗███╗   ██╗██╗███╗   ███╗ █████╗ ██╗  ██╗${C.reset}`,
      `${C.mmPrimary}    ████╗ ████║██║████╗  ██║██║████╗ ████║██╔══██╗╚██╗██╔╝${C.reset}`,
      `${C.mmSecondary}    ██╔████╔██║██║██╔██╗ ██║██║██╔████╔██║███████║ ╚███╔╝${C.reset}`,
      `${C.mmSecondary}    ██║╚██╔╝██║██║██║╚██╗██║██║██║╚██╔╝██║██╔══██║ ██╔██╗${C.reset}`,
      `${C.mmAccent}    ██║ ╚═╝ ██║██║██║ ╚████║██║██║ ╚═╝ ██║██║  ██║██╔╝ ██╗${C.reset}`,
      `${C.mmAccent}    ╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝╚═╝╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝${C.reset}`,
      '',
      `${C.mmDim}    ━━━━━━━━━━━━━━━━━━${C.mmPrimary}◆${C.mmDim}━━━━━━━━━━━━━━━━━━${C.reset}`,
      `${C.mmSecondary}           MiniMax-M2.1 ${C.mmDim}━${C.mmSecondary} AGI for All${C.reset}`,
    ],
    tagline: 'MiniMax-M2.1 - AGI for All',
    showLabel: false,
  },
  {
    key: 'openrouter',
    art: [
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
    ],
    tagline: 'One API - Any Model',
    showLabel: false,
  },
  {
    key: 'ccrouter',
    art: [
      `${C.ccrPrimary}     ██████╗ ██████╗██████╗  ██████╗ ██╗   ██╗████████╗███████╗██████╗${C.reset}`,
      `${C.ccrPrimary}    ██╔════╝██╔════╝██╔══██╗██╔═══██╗██║   ██║╚══██╔══╝██╔════╝██╔══██╗${C.reset}`,
      `${C.ccrSecondary}    ██║     ██║     ██████╔╝██║   ██║██║   ██║   ██║   █████╗  ██████╔╝${C.reset}`,
      `${C.ccrSecondary}    ██║     ██║     ██╔══██╗██║   ██║██║   ██║   ██║   ██╔══╝  ██╔══██╗${C.reset}`,
      `${C.ccrAccent}    ╚██████╗╚██████╗██║  ██║╚██████╔╝╚██████╔╝   ██║   ███████╗██║  ██║${C.reset}`,
      `${C.ccrAccent}     ╚═════╝ ╚═════╝╚═╝  ╚═╝ ╚═════╝  ╚═════╝    ╚═╝   ╚══════╝╚═╝  ╚═╝${C.reset}`,
      '',
      `${C.ccrDim}    ━━━━━━━━━━━━━━━━${C.ccrPrimary}◆${C.ccrDim}━━━━━━━━━━━━━━━━${C.reset}`,
      `${C.ccrSecondary}      Claude Code Router ${C.ccrDim}━${C.ccrSecondary} Any Model${C.reset}`,
    ],
    tagline: 'Claude Code Router - Any Model',
    showLabel: false,
  },
  {
    key: 'mirror',
    art: [
      `${C.mirPrimary}    ███╗   ███╗██╗██████╗ ██████╗  ██████╗ ██████╗${C.reset}`,
      `${C.mirPrimary}    ████╗ ████║██║██╔══██╗██╔══██╗██╔═══██╗██╔══██╗${C.reset}`,
      `${C.mirSecondary}    ██╔████╔██║██║██████╔╝██████╔╝██║   ██║██████╔╝${C.reset}`,
      `${C.mirSecondary}    ██║╚██╔╝██║██║██╔══██╗██╔══██╗██║   ██║██╔══██╗${C.reset}`,
      `${C.mirAccent}    ██║ ╚═╝ ██║██║██║  ██║██║  ██║╚██████╔╝██║  ██║${C.reset}`,
      `${C.mirAccent}    ╚═╝     ╚═╝╚═╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝${C.reset}`,
      '',
      `${C.mirDim}    ━━━━━━━━━━━━${C.mirAccent}◇${C.mirDim}━━━━━━━━━━━━${C.reset}`,
      `${C.mirSecondary}      Claude ${C.mirDim}━${C.mirSecondary} Pure Reflection${C.reset}`,
    ],
    tagline: 'Claude - Pure Reflection',
    showLabel: false,
  },
];

export const DEFAULT_SPLASH: SplashConfig = {
  key: 'default',
  art: [
    `${C.defPrimary}    ██████╗ ██████╗   ${C.defDim}━━  M I R R O R${C.reset}`,
    `${C.defPrimary}   ██╔════╝██╔════╝${C.reset}`,
    `${C.defPrimary}   ██║     ██║     ${C.defDim}Claude Code Variants${C.reset}`,
    `${C.defPrimary}   ██║     ██║     ${C.defDim}Custom Providers${C.reset}`,
    `${C.defPrimary}   ╚██████╗╚██████╗${C.reset}`,
    `${C.defPrimary}    ╚═════╝ ╚═════╝${C.reset}`,
  ],
  tagline: 'Claude Code Variants',
  showLabel: true,
};

export const getSplashConfig = (key: string): SplashConfig =>
  SPLASH_CONFIGS.find((s) => s.key === key) ?? DEFAULT_SPLASH;

const escapeForBatch = (line: string): string => {
  return line
    .replace(/\|/g, '^|')
    .replace(/</g, '^<')
    .replace(/>/g, '^>')
    .replace(/&/g, '^&')
    .replace(/%/g, '%%')
    .replace(/\^(\[|\])/g, '^^$1');
};

export const generateBashSplash = (): string[] => {
  const lines: string[] = [
    'if [[ "${CC_MIRROR_SPLASH:-0}" != "0" ]] && [[ -t 1 ]]; then',
    '  if [[ "$*" != *"--output-format"* ]]; then',
    '    __cc_label="${CC_MIRROR_PROVIDER_LABEL:-cc-mirror}"',
    '    __cc_style="${CC_MIRROR_SPLASH_STYLE:-default}"',
    '    __cc_show_label="1"',
    '    printf "\\n"',
    '    case "$__cc_style" in',
  ];

  for (const config of SPLASH_CONFIGS) {
    const heredocName = `CCM${config.key.toUpperCase().slice(0, 3)}`;
    lines.push(`      ${config.key})`);
    lines.push(`        cat <<'${heredocName}'`);
    lines.push('');
    for (const artLine of config.art) {
      lines.push(artLine);
    }
    lines.push('');
    lines.push(heredocName);
    if (!config.showLabel) {
      lines.push('        __cc_show_label="0"');
    }
    lines.push('        ;;');
  }

  lines.push('      *)');
  lines.push("        cat <<'CCMGEN'");
  lines.push('');
  for (const artLine of DEFAULT_SPLASH.art) {
    lines.push(artLine);
  }
  lines.push('');
  lines.push('CCMGEN');
  lines.push('        ;;');
  lines.push('    esac');
  lines.push('    if [[ "$__cc_show_label" == "1" ]]; then');
  lines.push('      printf "        %s\\n\\n" "$__cc_label"');
  lines.push('    else');
  lines.push('      printf "\\n"');
  lines.push('    fi');
  lines.push('  fi');
  lines.push('fi');

  return lines;
};

export const generateWindowsSplash = (): string[] => {
  const lines: string[] = [
    'if not defined CC_MIRROR_SPLASH goto :skip_splash',
    'if "%CC_MIRROR_SPLASH%"=="0" goto :skip_splash',
    '',
    'echo %* | findstr /C:"--output-format" >nul && goto :skip_splash',
    '',
    'set "__cc_label=%CC_MIRROR_PROVIDER_LABEL%"',
    'if not defined __cc_label set "__cc_label=cc-mirror"',
    'set "__cc_style=%CC_MIRROR_SPLASH_STYLE%"',
    'if not defined __cc_style set "__cc_style=default"',
    'set "__cc_show_label=1"',
    'echo.',
  ];

  for (const config of SPLASH_CONFIGS) {
    lines.push(`if "!__cc_style!"=="${config.key}" (`);
    for (const artLine of config.art) {
      if (artLine === '') {
        lines.push('  echo.');
      } else {
        lines.push(`  echo ${escapeForBatch(artLine)}`);
      }
    }
    lines.push('  echo.');
    if (!config.showLabel) {
      lines.push('  set "__cc_show_label=0"');
    }
    lines.push('  goto :splash_done');
    lines.push(')');
  }

  lines.push('');
  for (const artLine of DEFAULT_SPLASH.art) {
    if (artLine === '') {
      lines.push('echo.');
    } else {
      lines.push(`echo ${escapeForBatch(artLine)}`);
    }
  }
  lines.push('echo.');
  lines.push('');
  lines.push(':splash_done');
  lines.push('if "!__cc_show_label!"=="1" (');
  lines.push('  echo         !__cc_label!');
  lines.push('  echo.');
  lines.push(')');
  lines.push('');
  lines.push(':skip_splash');

  return lines;
};
