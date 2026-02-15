#!/usr/bin/env node

/* global console */

/**
 * Render all provider splash screens in a 3x3 grid
 * Perfect for social media screenshots
 *
 * Run: node scripts/preview-splash-grid.mjs
 */

// ANSI color codes (same as preview-splash.mjs)
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
  // OpenRouter: Silver/Chrome gradient
  orPrimary: '\x1b[38;5;252m',
  orSecondary: '\x1b[38;5;250m',
  orAccent: '\x1b[38;5;45m',
  orDim: '\x1b[38;5;243m',
  // CCRouter: Sky blue gradient
  ccrPrimary: '\x1b[38;5;39m',
  ccrSecondary: '\x1b[38;5;45m',
  ccrAccent: '\x1b[38;5;33m',
  ccrDim: '\x1b[38;5;31m',
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
  // Grid chrome
  gridDim: '\x1b[38;5;238m',
  gridMid: '\x1b[38;5;245m',
  gridBright: '\x1b[38;5;255m',
};

const SPLASH_ART = {
  kimi: [
    `${C.kmDim}◈━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━◈${C.reset}`,
    `${C.kmSecondary}  K I M I   C O D E${C.reset}`,
    `${C.kmDim}◈━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━◈${C.reset}`,
    '',
    `${C.kmPrimary}██╗  ██╗██╗███╗   ███╗██╗${C.reset}`,
    `${C.kmPrimary}██║ ██╔╝██║████╗ ████║██║${C.reset}`,
    `${C.kmSecondary}█████╔╝ ██║██╔████╔██║██║${C.reset}`,
    `${C.kmSecondary}██╔═██╗ ██║██║╚██╔╝██║██║${C.reset}`,
    `${C.kmAccent}██║  ██╗██║██║ ╚═╝ ██║██║${C.reset}`,
    `${C.kmAccent}╚═╝  ╚═╝╚═╝╚═╝     ╚═╝╚═╝${C.reset}`,
    '',
    `${C.kmDim}━━━━━━━━━━━━━━━━━${C.kmPrimary}◆${C.kmDim}━━━━━━━━━━━━━━━━━${C.reset}`,
    `${C.kmSecondary}   kimi-for-coding ${C.kmDim}━${C.kmSecondary} K2.5${C.reset}`,
  ],
  minimax: [
    `${C.mmPrimary}▁▂▃▄${C.mmSecondary}▅▆▇█${C.mmAccent}▇▆▅▄${C.mmPrimary}▃▂▁${C.mmDim}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${C.reset}`,
    '',
    `${C.mmPrimary}███╗   ███╗██╗███╗   ██╗██╗███╗   ███╗ █████╗ ██╗  ██╗${C.reset}`,
    `${C.mmPrimary}████╗ ████║██║████╗  ██║██║████╗ ████║██╔══██╗╚██╗██╔╝${C.reset}`,
    `${C.mmSecondary}██╔████╔██║██║██╔██╗ ██║██║██╔████╔██║███████║ ╚███╔╝${C.reset}`,
    `${C.mmSecondary}██║╚██╔╝██║██║██║╚██╗██║██║██║╚██╔╝██║██╔══██║ ██╔██╗${C.reset}`,
    `${C.mmAccent}██║ ╚═╝ ██║██║██║ ╚████║██║██║ ╚═╝ ██║██║  ██║██╔╝ ██╗${C.reset}`,
    `${C.mmAccent}╚═╝     ╚═╝╚═╝╚═╝  ╚═══╝╚═╝╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝${C.reset}`,
    '',
    `${C.mmDim}━━━━━━━━━━━━━━━━━━${C.mmPrimary}◆${C.mmDim}━━━━━━━━━━━━━━━━━━${C.reset}`,
    `${C.mmSecondary}         MiniMax ${C.mmDim}━${C.mmSecondary} AGI for All${C.reset}`,
  ],
  zai: [
    `${C.zaiDim}       ╭──────────╮${C.reset}`,
    `${C.zaiPrimary}████████${C.zaiDim}╯${C.zaiPrimary}╗${C.zaiDim}        │${C.reset}`,
    `${C.zaiPrimary}╚═════${C.zaiSecondary}██${C.zaiPrimary}╔╝  ${C.zaiAccent}• ${C.zaiDim}A I •${C.reset}`,
    `${C.zaiSecondary}    ██╔╝${C.zaiDim}        │${C.reset}`,
    `${C.zaiSecondary}  ██╔╝${C.zaiDim}╮         │${C.reset}`,
    `${C.zaiAccent}████████${C.zaiDim}╰─────────╯${C.reset}`,
    '',
    `${C.zaiDim}━━━━━━━━━${C.zaiPrimary}◆${C.zaiDim}━━━━━━━━━${C.reset}`,
    `${C.zaiSecondary} GLM Coding Plan${C.reset}`,
  ],
  openrouter: [
    `${C.orPrimary} ██████╗ ██████╗ ███████╗███╗   ██╗${C.reset}`,
    `${C.orPrimary}██╔═══██╗██╔══██╗██╔════╝████╗  ██║${C.reset}`,
    `${C.orSecondary}██║   ██║██████╔╝█████╗  ██╔██╗ ██║${C.reset}`,
    `${C.orSecondary}██║   ██║██╔═══╝ ██╔══╝  ██║╚██╗██║${C.reset}`,
    `${C.orAccent}╚██████╔╝██║     ███████╗██║ ╚████║${C.reset}`,
    `${C.orAccent} ╚═════╝ ╚═╝     ╚══════╝╚═╝  ╚═══╝${C.reset}`,
    `${C.orPrimary}██████╗  ██████╗ ██╗   ██╗████████╗███████╗██████╗${C.reset}`,
    `${C.orPrimary}██╔══██╗██╔═══██╗██║   ██║╚══██╔══╝██╔════╝██╔══██╗${C.reset}`,
    `${C.orSecondary}██████╔╝██║   ██║██║   ██║   ██║   █████╗  ██████╔╝${C.reset}`,
    `${C.orSecondary}██╔══██╗██║   ██║██║   ██║   ██║   ██╔══╝  ██╔══██╗${C.reset}`,
    `${C.orAccent}██║  ██║╚██████╔╝╚██████╔╝   ██║   ███████╗██║  ██║${C.reset}`,
    `${C.orAccent}╚═╝  ╚═╝ ╚═════╝  ╚═════╝    ╚═╝   ╚══════╝╚═╝  ╚═╝${C.reset}`,
    '',
    `${C.orDim}━━━━━━━━━━━━━━━━━━${C.orPrimary}◇${C.orDim}━━━━━━━━━━━━━━━━━━${C.reset}`,
    `${C.orSecondary}     One API ${C.orDim}━${C.orSecondary} Any Model${C.reset}`,
  ],
  vercel: [
    `${C.vcAccent}                ▲${C.reset}`,
    '',
    `${C.vcPrimary}██╗   ██╗███████╗██████╗  ██████╗███████╗██╗${C.reset}`,
    `${C.vcPrimary}██║   ██║██╔════╝██╔══██╗██╔════╝██╔════╝██║${C.reset}`,
    `${C.vcSecondary}██║   ██║█████╗  ██████╔╝██║     █████╗  ██║${C.reset}`,
    `${C.vcSecondary}╚██╗ ██╔╝██╔══╝  ██╔══██╗██║     ██╔══╝  ██║${C.reset}`,
    `${C.vcAccent} ╚████╔╝ ███████╗██║  ██║╚██████╗███████╗███████╗${C.reset}`,
    `${C.vcAccent}  ╚═══╝  ╚══════╝╚═╝  ╚═╝ ╚═════╝╚══════╝╚══════╝${C.reset}`,
    '',
    `${C.vcDim}━━━━━━━━━━━━━━━━━━━━━━${C.vcPrimary}◆${C.vcDim}━━━━━━━━━━━━━━━━━━━━━━${C.reset}`,
    `${C.vcSecondary}              AI Gateway${C.reset}`,
  ],
  ccrouter: [
    `${C.ccrPrimary} ██████╗ ██████╗${C.reset}`,
    `${C.ccrPrimary}██╔════╝██╔════╝${C.reset}`,
    `${C.ccrSecondary}██║     ██║${C.reset}`,
    `${C.ccrSecondary}██║     ██║${C.reset}`,
    `${C.ccrAccent}╚██████╗╚██████╗${C.reset}`,
    `${C.ccrAccent} ╚═════╝ ╚═════╝${C.reset}`,
    `${C.ccrPrimary}██████╗  ██████╗ ██╗   ██╗████████╗███████╗██████╗${C.reset}`,
    `${C.ccrPrimary}██╔══██╗██╔═══██╗██║   ██║╚══██╔══╝██╔════╝██╔══██╗${C.reset}`,
    `${C.ccrSecondary}██████╔╝██║   ██║██║   ██║   ██║   █████╗  ██████╔╝${C.reset}`,
    `${C.ccrSecondary}██╔══██╗██║   ██║██║   ██║   ██║   ██╔══╝  ██╔══██╗${C.reset}`,
    `${C.ccrAccent}██║  ██║╚██████╔╝╚██████╔╝   ██║   ███████╗██║  ██║${C.reset}`,
    `${C.ccrAccent}╚═╝  ╚═╝ ╚═════╝  ╚═════╝    ╚═╝   ╚══════╝╚═╝  ╚═╝${C.reset}`,
    '',
    `${C.ccrDim}━━━━━━━━━━━━━━━━━━${C.ccrPrimary}◆${C.ccrDim}━━━━━━━━━━━━━━━━━━${C.reset}`,
    `${C.ccrSecondary}   Any Model ${C.ccrDim}━${C.ccrSecondary} Claude Code${C.reset}`,
  ],
  nanogpt: [
    `${C.ngPrimary}███╗   ██╗ █████╗ ███╗   ██╗ ██████╗  ${C.ngAccent}██████╗ ██████╗ ████████╗${C.reset}`,
    `${C.ngPrimary}████╗  ██║██╔══██╗████╗  ██║██╔═══██╗ ${C.ngAccent}██╔════╝ ██╔══██╗╚══██╔══╝${C.reset}`,
    `${C.ngSecondary}██╔██╗ ██║███████║██╔██╗ ██║██║   ██║ ${C.ngAccent}██║  ███╗██████╔╝   ██║${C.reset}`,
    `${C.ngSecondary}██║╚██╗██║██╔══██║██║╚██╗██║██║   ██║ ${C.ngAccent}██║   ██║██╔═══╝    ██║${C.reset}`,
    `${C.ngAccent}██║ ╚████║██║  ██║██║ ╚████║╚██████╔╝ ${C.ngAccent}╚██████╔╝██║        ██║${C.reset}`,
    `${C.ngAccent}╚═╝  ╚═══╝╚═╝  ╚═╝╚═╝  ╚═══╝ ╚═════╝  ${C.ngAccent}╚═════╝ ╚═╝        ╚═╝${C.reset}`,
    '',
    `${C.ngDim}━━━━━━━━━━━━━━━━━━━━━━━${C.ngPrimary}◆${C.ngDim}━━━━━━━━━━━━━━━━━━━━━━━${C.reset}`,
    `${C.ngSecondary}          All Models ${C.ngDim}━${C.ngSecondary} No Subscription${C.reset}`,
  ],
  ollama: [
    `${C.olPrimary} ██████╗ ██╗     ██╗      █████╗ ███╗   ███╗ █████╗${C.reset}`,
    `${C.olPrimary}██╔═══██╗██║     ██║     ██╔══██╗████╗ ████║██╔══██╗${C.reset}`,
    `${C.olSecondary}██║   ██║██║     ██║     ███████║██╔████╔██║███████║${C.reset}`,
    `${C.olSecondary}██║   ██║██║     ██║     ██╔══██║██║╚██╔╝██║██╔══██║${C.reset}`,
    `${C.olAccent}╚██████╔╝███████╗███████╗██║  ██║██║ ╚═╝ ██║██║  ██║${C.reset}`,
    `${C.olAccent} ╚═════╝ ╚══════╝╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚═╝  ╚═╝${C.reset}`,
    '',
    `${C.olDim}━━━━━━━━━━━━━━━━━━━━${C.olPrimary}◆${C.olDim}━━━━━━━━━━━━━━━━━━━━${C.reset}`,
    `${C.olSecondary}          Run Models Locally${C.reset}`,
  ],
  gatewayz: [
    `${C.gwPrimary} ██████╗  █████╗ ████████╗███████╗██╗    ██╗ █████╗ ██╗   ██╗${C.gwAccent}███████╗${C.reset}`,
    `${C.gwPrimary}██╔════╝ ██╔══██╗╚══██╔══╝██╔════╝██║    ██║██╔══██╗╚██╗ ██╔╝${C.gwAccent}╚══███╔╝${C.reset}`,
    `${C.gwSecondary}██║  ███╗███████║   ██║   █████╗  ██║ █╗ ██║███████║ ╚████╔╝ ${C.gwAccent}  ███╔╝${C.reset}`,
    `${C.gwSecondary}██║   ██║██╔══██║   ██║   ██╔══╝  ██║███╗██║██╔══██║  ╚██╔╝  ${C.gwAccent} ███╔╝${C.reset}`,
    `${C.gwAccent}╚██████╔╝██║  ██║   ██║   ███████╗╚███╔███╔╝██║  ██║   ██║   ${C.gwAccent}███████╗${C.reset}`,
    `${C.gwAccent} ╚═════╝ ╚═╝  ╚═╝   ╚═╝   ╚══════╝ ╚══╝╚══╝ ╚═╝  ╚═╝   ╚═╝   ${C.gwAccent}╚══════╝${C.reset}`,
    '',
    `${C.gwDim}━━━━━━━━━━━━━━━━━━━━━━━━${C.gwPrimary}◆${C.gwDim}━━━━━━━━━━━━━━━━━━━━━━━━${C.reset}`,
    `${C.gwSecondary}                AI Gateway${C.reset}`,
  ],
};

// ── Helpers ──────────────────────────────────────────────

/** Strip ANSI escape sequences to measure visible width */
// eslint-disable-next-line no-control-regex
const stripAnsi = (s) => s.replace(/\x1b\[[0-9;]*m/g, '');

/** Visible character width */
const visibleWidth = (s) => [...stripAnsi(s)].length;

/** Pad a colored string to a target visible width (right-pad with spaces) */
const padRight = (s, targetWidth) => {
  const w = visibleWidth(s);
  return w >= targetWidth ? s : s + ' '.repeat(targetWidth - w);
};

// ── Grid layout ─────────────────────────────────────────

// Row 1: Tall two-stack letters bookend shorter Vercel
// Row 2: First-party providers (Kimi, MiniMax, Zai)
// Row 3: Single-line wide block letters
const GRID = [
  ['openrouter', 'vercel',     'ccrouter'],
  ['kimi',       'minimax',    'zai'],
  ['nanogpt',    'ollama',     'gatewayz'],
];

const COL_GAP = 8;    // spaces between columns
const MARGIN = '  ';  // left margin for the whole grid
const ROW_GAP = 3;    // blank lines between rows

function renderGrid() {
  const output = [];
  const numCols = GRID[0].length;

  // Pre-compute each cell's art width
  const allCells = GRID.map((row) => row.map((key) => SPLASH_ART[key] || ['']));
  const allArtWidths = allCells.map((row) =>
    row.map((cell) => Math.max(...cell.map((line) => visibleWidth(line)), 0))
  );

  // Global column widths: max art width in each column across ALL rows
  const globalColWidths = Array.from({ length: numCols }, (_, col) =>
    Math.max(...allArtWidths.map((row) => row[col]))
  );

  for (let rowIdx = 0; rowIdx < GRID.length; rowIdx++) {
    const cells = allCells[rowIdx];
    const artWidths = allArtWidths[rowIdx];
    const maxHeight = Math.max(...cells.map((c) => c.length));

    // Vertically center each cell
    const centered = cells.map((cell) => {
      const topPad = Math.floor((maxHeight - cell.length) / 2);
      const bottomPad = maxHeight - cell.length - topPad;
      return [
        ...Array(topPad).fill(''),
        ...cell,
        ...Array(bottomPad).fill(''),
      ];
    });

    // Single horizontal offset per cell to center art block within global column
    const cellOffsets = cells.map((_, colIdx) =>
      Math.floor((globalColWidths[colIdx] - artWidths[colIdx]) / 2)
    );

    // Render each line across all columns
    for (let lineIdx = 0; lineIdx < maxHeight; lineIdx++) {
      let combinedLine = MARGIN;
      for (let colIdx = 0; colIdx < numCols; colIdx++) {
        const line = centered[colIdx][lineIdx] || '';
        const offsetLine = ' '.repeat(cellOffsets[colIdx]) + line;
        combinedLine += padRight(offsetLine, globalColWidths[colIdx]);
        if (colIdx < numCols - 1) {
          combinedLine += ' '.repeat(COL_GAP);
        }
      }
      output.push(combinedLine);
    }

    // Add vertical gap between rows (not after last)
    if (rowIdx < GRID.length - 1) {
      for (let i = 0; i < ROW_GAP; i++) output.push('');
    }
  }

  return output;
}

// ── Main ────────────────────────────────────────────────

console.log('');
console.log(`${MARGIN}${C.gridMid}${C.bold}cc-mirror${C.reset}${C.gridDim} — Provider Splash Gallery${C.reset}`);
console.log('');
console.log('');

const lines = renderGrid();
for (const line of lines) {
  console.log(line);
}

console.log('');
console.log('');
console.log(`${MARGIN}${C.gridDim}${GRID.flat().length} providers  •  github.com/numman-ali/cc-mirror${C.reset}`);
console.log('');
