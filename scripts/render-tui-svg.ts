import React from 'react';
import fs from 'node:fs';
import path from 'node:path';
import { render } from 'ink-testing-library';
import { App } from '../src/tui/app.js';

const stripAnsi = (input: string) =>
  input.replace(
    // eslint-disable-next-line no-control-regex
    /\u001b\[[0-9;]*m|\u001b\][0-9;]*\u0007|\u001b[=><]|\u001b\[?[0-9]*[A-Za-z]/g,
    ''
  );

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const renderHomeScreen = async () => {
  const app = render(
    React.createElement(App, {
      initialRootDir: '~/.claude-sneakpeek',
      initialBinDir: '~/.local/bin',
    })
  );
  await new Promise((resolve) => setTimeout(resolve, 30));
  const frame = app.lastFrame() || '';
  app.unmount();
  return stripAnsi(frame).split('\n');
};

const buildSvg = (lines: string[]) => {
  const padding = 24;
  const lineHeight = 18;
  const charWidth = 8;
  const maxLen = Math.max(...lines.map((line) => line.length), 0);
  const width = maxLen * charWidth + padding * 2;
  const height = lines.length * lineHeight + padding * 2;
  const bg = '#0b0c0f';
  const fg = '#e6e6e6';

  const text = lines
    .map((line, idx) => {
      const y = padding + (idx + 1) * lineHeight;
      return `<text x="${padding}" y="${y}" fill="${fg}">${escapeXml(line)}</text>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="claude-sneakpeek TUI">
  <rect width="${width}" height="${height}" fill="${bg}" />
  <g font-family="SFMono-Regular, Menlo, Consolas, monospace" font-size="14">
${text}
  </g>
</svg>
`;
};

const main = async () => {
  const lines = await renderHomeScreen();
  const svg = buildSvg(lines);
  const target = path.join(process.cwd(), 'docs', 'claude-sneakpeek-tree.svg');
  fs.writeFileSync(target, svg);
  console.log(`Wrote ${target}`);
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
