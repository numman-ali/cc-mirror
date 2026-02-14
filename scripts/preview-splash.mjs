#!/usr/bin/env node

/* global console */

/**
 * Preview all provider splash screens
 * Run: node scripts/preview-splash.mjs
 */

// ANSI color codes
const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  // Zai: Gold/Amber gradient
  zaiPrimary: '\x1b[38;5;220m',
  zaiSecondary: '\x1b[38;5;214m',
  zaiAccent: '\x1b[38;5;208m',
  zaiDim: '\x1b[38;5;172m',
  // MiniMax: Coral/Red/Orange gradient
  mmPrimary: '\x1b[38;5;203m',
  mmSecondary: '\x1b[38;5;209m',
  mmAccent: '\x1b[38;5;208m',
  mmDim: '\x1b[38;5;167m',
  // Kimi: Teal/cyan gradient
  kmPrimary: '\x1b[38;5;81m',
  kmSecondary: '\x1b[38;5;75m',
  kmAccent: '\x1b[38;5;69m',
  kmDim: '\x1b[38;5;67m',
  // OpenRouter: Silver/Chrome gradient (ported from Mirror)
  orPrimary: '\x1b[38;5;252m',
  orSecondary: '\x1b[38;5;250m',
  orAccent: '\x1b[38;5;45m',
  orDim: '\x1b[38;5;243m',
  // CCRouter: Sky blue gradient
  ccrPrimary: '\x1b[38;5;39m',
  ccrSecondary: '\x1b[38;5;45m',
  ccrAccent: '\x1b[38;5;33m',
  ccrDim: '\x1b[38;5;31m',
  // Mirror: Silver/Chrome with electric blue
  mirPrimary: '\x1b[38;5;252m',
  mirSecondary: '\x1b[38;5;250m',
  mirAccent: '\x1b[38;5;45m',
  mirDim: '\x1b[38;5;243m',
  // GatewayZ: Violet gradient
  gwPrimary: '\x1b[38;5;141m',
  gwSecondary: '\x1b[38;5;135m',
  gwAccent: '\x1b[38;5;99m',
  gwDim: '\x1b[38;5;60m',
  // Vercel: Monochrome with blue accent
  vcPrimary: '\x1b[38;5;255m',
  vcSecondary: '\x1b[38;5;250m',
  vcAccent: '\x1b[38;5;33m',
  vcDim: '\x1b[38;5;240m',
  // NanoGPT: Aurora green/cyan gradient
  ngPrimary: '\x1b[38;5;120m',
  ngSecondary: '\x1b[38;5;51m',
  ngAccent: '\x1b[38;5;154m',
  ngDim: '\x1b[38;5;66m',
  // Ollama: Tan/Brown gradient
  olPrimary: '\x1b[38;5;180m',
  olSecondary: '\x1b[38;5;223m',
  olAccent: '\x1b[38;5;137m',
  olDim: '\x1b[38;5;101m',
};

const SPLASH_ART = {
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
    `${C.mmSecondary}             MiniMax ${C.mmDim}━${C.mmSecondary} AGI for All${C.reset}`,
    '',
  ],
  kimi: [
    '',
    `${C.kmDim}    ◈━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━◈${C.reset}`,
    `${C.kmSecondary}      K I M I   C O D E${C.reset}`,
    `${C.kmDim}    ◈━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━◈${C.reset}`,
    '',
    `${C.kmPrimary}    ██╗  ██╗██╗███╗   ███╗██╗${C.reset}`,
    `${C.kmPrimary}    ██║ ██╔╝██║████╗ ████║██║${C.reset}`,
    `${C.kmSecondary}    █████╔╝ ██║██╔████╔██║██║${C.reset}`,
    `${C.kmSecondary}    ██╔═██╗ ██║██║╚██╔╝██║██║${C.reset}`,
    `${C.kmAccent}    ██║  ██╗██║██║ ╚═╝ ██║██║${C.reset}`,
    `${C.kmAccent}    ╚═╝  ╚═╝╚═╝╚═╝     ╚═╝╚═╝${C.reset}`,
    '',
    `${C.kmDim}    ━━━━━━━━━━━━━━━━━${C.kmPrimary}◆${C.kmDim}━━━━━━━━━━━━━━━━━${C.reset}`,
    `${C.kmSecondary}       kimi-for-coding ${C.kmDim}━${C.kmSecondary} K2.5${C.reset}`,
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
    `${C.orDim}    ━━━━━━━━━━━━━━━━━━${C.orPrimary}◇${C.orDim}━━━━━━━━━━━━━━━━━━${C.reset}`,
    `${C.orSecondary}         One API ${C.orDim}━${C.orSecondary} Any Model${C.reset}`,
    '',
  ],
  ccrouter: [
    '',
    `${C.ccrPrimary}     ██████╗ ██████╗${C.reset}`,
    `${C.ccrPrimary}    ██╔════╝██╔════╝${C.reset}`,
    `${C.ccrSecondary}    ██║     ██║${C.reset}`,
    `${C.ccrSecondary}    ██║     ██║${C.reset}`,
    `${C.ccrAccent}    ╚██████╗╚██████╗${C.reset}`,
    `${C.ccrAccent}     ╚═════╝ ╚═════╝${C.reset}`,
    `${C.ccrPrimary}    ██████╗  ██████╗ ██╗   ██╗████████╗███████╗██████╗${C.reset}`,
    `${C.ccrPrimary}    ██╔══██╗██╔═══██╗██║   ██║╚══██╔══╝██╔════╝██╔══██╗${C.reset}`,
    `${C.ccrSecondary}    ██████╔╝██║   ██║██║   ██║   ██║   █████╗  ██████╔╝${C.reset}`,
    `${C.ccrSecondary}    ██╔══██╗██║   ██║██║   ██║   ██║   ██╔══╝  ██╔══██╗${C.reset}`,
    `${C.ccrAccent}    ██║  ██║╚██████╔╝╚██████╔╝   ██║   ███████╗██║  ██║${C.reset}`,
    `${C.ccrAccent}    ╚═╝  ╚═╝ ╚═════╝  ╚═════╝    ╚═╝   ╚══════╝╚═╝  ╚═╝${C.reset}`,
    '',
    `${C.ccrDim}    ━━━━━━━━━━━━━━━━━━${C.ccrPrimary}◆${C.ccrDim}━━━━━━━━━━━━━━━━━━${C.reset}`,
    `${C.ccrSecondary}       Any Model ${C.ccrDim}━${C.ccrSecondary} Claude Code${C.reset}`,
    '',
  ],
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
  gatewayz: [
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
  vercel: [
    '',
    `${C.vcAccent}                    ▲${C.reset}`,
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
};

const providers = ['zai', 'minimax', 'kimi', 'openrouter', 'ccrouter', 'mirror', 'gatewayz', 'vercel', 'nanogpt', 'ollama'];

console.log('\n' + C.bold + '═══════════════════════════════════════' + C.reset);
console.log(C.bold + '  CC-Mirror Provider Splash Art Preview' + C.reset);
console.log(C.bold + '═══════════════════════════════════════' + C.reset + '\n');

for (const provider of providers) {
  console.log(C.dim + '───────────────────────────────────────' + C.reset);
  console.log(C.bold + `  ${provider.toUpperCase()}` + C.reset);
  console.log(C.dim + '───────────────────────────────────────' + C.reset);

  const art = SPLASH_ART[provider];
  if (art) {
    for (const line of art) {
      console.log(line);
    }
  }
}

console.log(C.dim + '───────────────────────────────────────' + C.reset);
console.log('\n' + C.bold + 'Done! ' + C.reset + C.dim + '(' + providers.length + ' providers)' + C.reset + '\n');
