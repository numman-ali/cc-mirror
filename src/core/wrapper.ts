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
  // OpenRouter: Navy/Indigo gradient (brand: #284968, #6467f2)
  orPrimary: '\x1b[38;5;60m', // Navy
  orSecondary: '\x1b[38;5;68m', // Slate blue
  orAccent: '\x1b[38;5;99m', // Indigo/cornflower
  orDim: '\x1b[38;5;24m', // Deep navy
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
  // GatewayZ: Violet gradient
  gwPrimary: '\x1b[38;5;141m', // Violet
  gwSecondary: '\x1b[38;5;135m', // Soft purple
  gwAccent: '\x1b[38;5;99m', // Deep purple
  gwDim: '\x1b[38;5;60m', // Muted purple
  // Vercel: Monochrome with blue accent (brand: #0070F3)
  vcPrimary: '\x1b[38;5;255m', // White
  vcSecondary: '\x1b[38;5;250m', // Light gray
  vcAccent: '\x1b[38;5;33m', // Vercel blue
  vcDim: '\x1b[38;5;240m', // Dark gray
  // NanoGPT: Neon blue gradient
  ngPrimary: '\x1b[38;5;81m', // Neon cyan
  ngSecondary: '\x1b[38;5;75m', // Soft cyan
  ngAccent: '\x1b[38;5;69m', // Deep cyan
  ngDim: '\x1b[38;5;67m', // Muted blue
  // Ollama: Tan/Brown gradient (brand: #caad8d)
  olPrimary: '\x1b[38;5;180m', // Tan/sorrel
  olSecondary: '\x1b[38;5;223m', // Light tan
  olAccent: '\x1b[38;5;137m', // Deep brown
  olDim: '\x1b[38;5;101m', // Muted brown
  // Default: White/Gray
  defPrimary: '\x1b[38;5;255m', // White
  defDim: '\x1b[38;5;245m', // Gray
};

const SPLASH_ART: SplashArt = {
  // Z.ai: Stylized Z with orbital ring motif
  zai: [
    '',
    `${C.zaiDim}           ╭──────────╮${C.reset}`,
    `${C.zaiPrimary}    ████████${C.zaiDim}╯${C.zaiPrimary}╗${C.zaiDim}        │${C.reset}`,
    `${C.zaiPrimary}    ╚═════${C.zaiSecondary}██${C.zaiPrimary}╔╝  ${C.zaiAccent}• ${C.zaiDim}A I •${C.reset}`,
    `${C.zaiSecondary}        ██╔╝${C.zaiDim}        │${C.reset}`,
    `${C.zaiSecondary}      ██╔╝${C.zaiDim}╮         │${C.reset}`,
    `${C.zaiAccent}    ████████${C.zaiDim}╰─────────╯${C.reset}`,
    '',
    `${C.zaiDim}    ━━━━━━━━━${C.zaiPrimary}◆${C.zaiDim}━━━━━━━━━${C.reset}`,
    `${C.zaiSecondary}     GLM Coding Plan${C.reset}`,
    '',
  ],
  // MiniMax: Wave + block letters
  minimax: [
    '',
    `${C.mmDim}    ${C.mmPrimary}▁▂▃▄${C.mmSecondary}▅▆▇█${C.mmAccent}▇▆▅▄${C.mmPrimary}▃▂▁${C.mmDim}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${C.reset}`,
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
  // OpenRouter: Stacked block letters
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
  // CCRouter: Converging arrows funnel
  ccrouter: [
    '',
    `${C.ccrSecondary}    ◈ GPT${C.ccrDim}━━━━━━━━━━╮${C.reset}`,
    `${C.ccrSecondary}    ◈ Claude${C.ccrDim}━━━━━━━┤${C.reset}`,
    `${C.ccrSecondary}    ◈ Gemini${C.ccrDim}━━━━━━━┤    ${C.ccrPrimary}╔════════════╗${C.reset}`,
    `${C.ccrSecondary}    ◈ Llama${C.ccrDim}━━━━━━━━┼━━━━${C.ccrPrimary}║${C.ccrAccent}  CC ROUTER ${C.ccrPrimary}║${C.ccrDim}━━━━▶ ${C.ccrAccent}Claude Code${C.reset}`,
    `${C.ccrSecondary}    ◈ Mistral${C.ccrDim}━━━━━━┤    ${C.ccrPrimary}╚════════════╝${C.reset}`,
    `${C.ccrSecondary}    ◈ Qwen${C.ccrDim}━━━━━━━━━┤${C.reset}`,
    `${C.ccrSecondary}    ◈ DeepSeek${C.ccrDim}━━━━━╯${C.reset}`,
    '',
    `${C.ccrDim}    ━━━━━━━━━━━━━━${C.ccrPrimary}◆${C.ccrDim}━━━━━━━━━━━━━━${C.reset}`,
    `${C.ccrSecondary}       Any Model → Claude Code${C.reset}`,
    '',
  ],
  // Mirror: Infinity mirror nested boxes
  mirror: [
    '',
    `${C.mirDim}    ┌─────────────────────────────┐${C.reset}`,
    `${C.mirDim}    │  ${C.mirSecondary}┌───────────────────────┐${C.mirDim}  │${C.reset}`,
    `${C.mirDim}    │  ${C.mirSecondary}│  ${C.mirPrimary}┌─────────────────┐${C.mirSecondary}  │${C.mirDim}  │${C.reset}`,
    `${C.mirDim}    │  ${C.mirSecondary}│  ${C.mirPrimary}│  ${C.mirAccent}┌───────────┐${C.mirPrimary}  │${C.mirSecondary}  │${C.mirDim}  │${C.reset}`,
    `${C.mirDim}    │  ${C.mirSecondary}│  ${C.mirPrimary}│  ${C.mirAccent}│  MIRROR   │${C.mirPrimary}  │${C.mirSecondary}  │${C.mirDim}  │${C.reset}`,
    `${C.mirDim}    │  ${C.mirSecondary}│  ${C.mirPrimary}│  ${C.mirAccent}└───────────┘${C.mirPrimary}  │${C.mirSecondary}  │${C.mirDim}  │${C.reset}`,
    `${C.mirDim}    │  ${C.mirSecondary}│  ${C.mirPrimary}└─────────────────┘${C.mirSecondary}  │${C.mirDim}  │${C.reset}`,
    `${C.mirDim}    │  ${C.mirSecondary}└───────────────────────┘${C.mirDim}  │${C.reset}`,
    `${C.mirDim}    └─────────────────────────────┘${C.reset}`,
    '',
    `${C.mirDim}    ━━━━━━━━━━━━${C.mirPrimary}◇${C.mirDim}━━━━━━━━━━━━${C.reset}`,
    `${C.mirSecondary}         Pure Reflection${C.reset}`,
    '',
  ],
  // GatewayZ: Wormhole + block letters
  gatewayz: [
    '',
    `${C.gwDim}    ○━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━○${C.reset}`,
    `${C.gwDim}     ╲${C.gwSecondary}░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░${C.gwDim}╱${C.reset}`,
    `${C.gwDim}      ╲${C.gwPrimary}▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓${C.gwDim}╱${C.reset}`,
    `${C.gwDim}       ╲${C.gwAccent}   ◈ ━━━━━━━━━━━━━━ GATEWAY Z ━━━━━━━━━━━━━━ ◈   ${C.gwDim}╱${C.reset}`,
    `${C.gwDim}      ╱${C.gwPrimary}▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓${C.gwDim}╲${C.reset}`,
    `${C.gwDim}     ╱${C.gwSecondary}░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░${C.gwDim}╲${C.reset}`,
    `${C.gwDim}    ○━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━○${C.reset}`,
    '',
    `${C.gwPrimary}     ██████╗  █████╗ ████████╗███████╗██╗    ██╗ █████╗ ██╗   ██╗${C.gwAccent}███████╗${C.reset}`,
    `${C.gwPrimary}    ██╔════╝ ██╔══██╗╚══██╔══╝██╔════╝██║    ██║██╔══██╗╚██╗ ██╔╝${C.gwAccent}╚══███╔╝${C.reset}`,
    `${C.gwSecondary}    ██║  ███╗███████║   ██║   █████╗  ██║ █╗ ██║███████║ ╚████╔╝ ${C.gwAccent}  ███╔╝${C.reset}`,
    `${C.gwSecondary}    ██║   ██║██╔══██║   ██║   ██╔══╝  ██║███╗██║██╔══██║  ╚██╔╝  ${C.gwAccent} ███╔╝${C.reset}`,
    `${C.gwAccent}    ╚██████╔╝██║  ██║   ██║   ███████╗╚███╔███╔╝██║  ██║   ██║   ${C.gwAccent}███████╗${C.reset}`,
    `${C.gwAccent}     ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚══════╝ ╚══╝╚══╝ ╚═╝  ╚═╝   ╚═╝   ${C.gwAccent}╚══════╝${C.reset}`,
    '',
    `${C.gwDim}    ━━━━━━━━━━━━━━━━━━━━━━━━${C.gwPrimary}◆${C.gwDim}━━━━━━━━━━━━━━━━━━━━━━━━${C.reset}`,
    `${C.gwSecondary}                    AI Gateway${C.reset}`,
    '',
  ],
  // Vercel: Edge network + block letters
  vercel: [
    '',
    `${C.vcDim}       ◈ SFO${C.vcDim}━━━╮${C.reset}`,
    `${C.vcDim}       ◈ IAD${C.vcDim}━━━┤${C.reset}`,
    `${C.vcDim}       ◈ LHR${C.vcDim}━━━┼━━━${C.vcPrimary}╔══════════╗${C.reset}`,
    `${C.vcSecondary}       ◈ SIN${C.vcDim}━━━┼━━━${C.vcPrimary}║   ${C.vcAccent}▲${C.vcPrimary}      ║${C.vcDim}━━━▶ ${C.vcAccent}Edge${C.reset}`,
    `${C.vcDim}       ◈ SYD${C.vcDim}━━━┼━━━${C.vcPrimary}╚══════════╝${C.reset}`,
    `${C.vcDim}       ◈ NRT${C.vcDim}━━━┤${C.reset}`,
    `${C.vcDim}       ◈ FRA${C.vcDim}━━━╯${C.reset}`,
    '',
    `${C.vcPrimary}    ██╗   ██╗███████╗██████╗  ██████╗███████╗██╗${C.reset}`,
    `${C.vcPrimary}    ██║   ██║██╔════╝██╔══██╗██╔════╝██╔════╝██║${C.reset}`,
    `${C.vcSecondary}    ██║   ██║█████╗  ██████╔╝██║     █████╗  ██║${C.reset}`,
    `${C.vcSecondary}    ╚██╗ ██╔╝██╔══╝  ██╔══██╗██║     ██╔══╝  ██║${C.reset}`,
    `${C.vcAccent}     ╚████╔╝ ███████╗██║  ██║╚██████╗███████╗███████╗${C.reset}`,
    `${C.vcAccent}      ╚═══╝  ╚══════╝╚═╝  ╚═╝ ╚═════╝╚══════╝╚══════╝${C.reset}`,
    '',
    `${C.vcDim}    ━━━━━━━━━━━━━━━━━━━━━━${C.vcPrimary}◆${C.vcDim}━━━━━━━━━━━━━━━━━━━━━━${C.reset}`,
    `${C.vcSecondary}                  AI Gateway${C.reset}`,
    '',
  ],
  // NanoGPT: Block letters
  nanogpt: [
    '',
    `${C.ngPrimary}    ███╗   ██╗ █████╗ ███╗   ██╗ ██████╗  ${C.ngAccent}██████╗ ██████╗ ████████╗${C.reset}`,
    `${C.ngPrimary}    ████╗  ██║██╔══██╗████╗  ██║██╔═══██╗ ${C.ngAccent}██╔════╝ ██╔══██╗╚══██╔══╝${C.reset}`,
    `${C.ngSecondary}    ██╔██╗ ██║███████║██╔██╗ ██║██║   ██║ ${C.ngAccent}██║  ███╗██████╔╝   ██║${C.reset}`,
    `${C.ngSecondary}    ██║╚██╗██║██╔══██║██║╚██╗██║██║   ██║ ${C.ngAccent}██║   ██║██╔═══╝    ██║${C.reset}`,
    `${C.ngAccent}    ██║ ╚████║██║  ██║██║ ╚████║╚██████╔╝ ${C.ngAccent}╚██████╔╝██║        ██║${C.reset}`,
    `${C.ngAccent}    ╚═╝  ╚═══╝╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝  ${C.ngAccent}╚═════╝ ╚═╝        ╚═╝${C.reset}`,
    '',
    `${C.ngDim}    ━━━━━━━━━━━━━━━━━━━━━━━${C.ngPrimary}◆${C.ngDim}━━━━━━━━━━━━━━━━━━━━━━━${C.reset}`,
    `${C.ngSecondary}              All Models ${C.ngDim}━${C.ngSecondary} No Subscription${C.reset}`,
    '',
  ],
  // Ollama: Block letters
  ollama: [
    '',
    `${C.olPrimary}     ██████╗ ██╗     ██╗      █████╗ ███╗   ███╗ █████╗${C.reset}`,
    `${C.olPrimary}    ██╔═══██╗██║     ██║     ██╔══██╗████╗ ████║██╔══██╗${C.reset}`,
    `${C.olSecondary}    ██║   ██║██║     ██║     ███████║██╔████╔██║███████║${C.reset}`,
    `${C.olSecondary}    ██║   ██║██║     ██║     ██╔══██║██║╚██╔╝██║██╔══██║${C.reset}`,
    `${C.olAccent}    ╚██████╔╝███████╗███████╗██║  ██║██║ ╚═╝ ██║██║  ██║${C.reset}`,
    `${C.olAccent}     ╚═════╝ ╚══════╝╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝${C.reset}`,
    '',
    `${C.olDim}    ━━━━━━━━━━━━━━━━━━━━${C.olPrimary}◆${C.olDim}━━━━━━━━━━━━━━━━━━━━${C.reset}`,
    `${C.olSecondary}              Run Models Locally${C.reset}`,
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

const KNOWN_SPLASH_STYLES = [
  'zai',
  'minimax',
  'openrouter',
  'ccrouter',
  'mirror',
  'gatewayz',
  'vercel',
  'nanogpt',
  'ollama',
];

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
    "if ((process.env.CC_MIRROR_ALLOW_CLAUDE_INSTALL || '0') === '0') {",
    '  const cmd = args[0];',
    "  if (cmd === 'install' || cmd === 'update' || cmd === 'upgrade') {",
    "    process.stderr.write('cc-mirror: blocked \"claude ' + cmd + '\" to avoid modifying your global Claude Code install.\\n');",
    '    process.stderr.write(\'cc-mirror: use "cc-mirror update <variant> --claude-version latest" instead.\\n\');',
    "    process.stderr.write('cc-mirror: set CC_MIRROR_ALLOW_CLAUDE_INSTALL=1 to bypass.\\n');",
    '    process.exit(1);',
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
    '      gatewayz)',
    "        cat <<'CCMGW'",
    ...SPLASH_ART.gatewayz,
    'CCMGW',
    '        __cc_show_label="0"',
    '        ;;',
    '      vercel)',
    "        cat <<'CCMVC'",
    ...SPLASH_ART.vercel,
    'CCMVC',
    '        __cc_show_label="0"',
    '        ;;',
    '      nanogpt)',
    "        cat <<'CCMNG'",
    ...SPLASH_ART.nanogpt,
    'CCMNG',
    '        __cc_show_label="0"',
    '        ;;',
    '      ollama)',
    "        cat <<'CCMOL'",
    ...SPLASH_ART.ollama,
    'CCMOL',
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

  const blockUpstreamInstall = [
    'if [[ "${CC_MIRROR_ALLOW_CLAUDE_INSTALL:-0}" == "0" ]]; then',
    '  case "${1:-}" in',
    '    install|update|upgrade)',
    '      echo "cc-mirror: blocked \\"claude $1\\" to avoid modifying your global Claude Code install." >&2',
    '      echo "cc-mirror: use \\"cc-mirror update <variant> --claude-version latest\\" instead." >&2',
    '      echo "cc-mirror: set CC_MIRROR_ALLOW_CLAUDE_INSTALL=1 to bypass." >&2',
    '      exit 1',
    '      ;;',
    '  esac',
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
    ...blockUpstreamInstall,
    ...splash,
    execLine,
    '',
  ].join('\n');

  fs.writeFileSync(wrapperPath, content, { mode: 0o755 });
};
