/**
 * ASCII Art Logo for CLAUDE-SNEAKPEEK
 *
 * Professional, memorable ASCII art with deep blue and gold theme.
 */

import React from 'react';
import { Box, Text } from 'ink';
import { colors } from './theme.js';

/**
 * Main CLAUDE-SNEAKPEEK ASCII Art Banner
 * Clean, readable design that fits within 68 characters
 */
export const LogoBanner: React.FC = () => (
  <Box flexDirection="column">
    <Text>
      <Text color={colors.logo1}>{'   ██████╗ ██████╗'}</Text>
      <Text color={colors.gold}>{'  ━━  '}</Text>
      <Text color={colors.logo2} bold>
        {'M I R R O R'}
      </Text>
    </Text>
    <Text>
      <Text color={colors.logo1}>{'  ██╔════╝██╔════╝'}</Text>
    </Text>
    <Text>
      <Text color={colors.logo1}>{'  ██║     ██║     '}</Text>
      <Text color={colors.textMuted}>{'Claude Code, Unshackled'}</Text>
    </Text>
    <Text>
      <Text color={colors.logo1}>{'  ██║     ██║     '}</Text>
      <Text color={colors.gold}>{'Multi-agent orchestration. One command.'}</Text>
    </Text>
    <Text>
      <Text color={colors.logo1}>{'  ╚██████╗╚██████╗'}</Text>
    </Text>
    <Text>
      <Text color={colors.logo1}>{'   ╚═════╝ ╚═════╝'}</Text>
    </Text>
  </Box>
);

/**
 * Compact single-line logo
 */
export const LogoCompact: React.FC = () => (
  <Box>
    <Text color={colors.logo1} bold>
      {'▓▓ '}
    </Text>
    <Text color={colors.logo2} bold>
      CC
    </Text>
    <Text color={colors.gold}>{'-'}</Text>
    <Text color={colors.logo3} bold>
      MIRROR
    </Text>
    <Text color={colors.logo1} bold>
      {' ▓▓'}
    </Text>
  </Box>
);

/**
 * Minimal inline logo
 */
export const LogoMinimal: React.FC = () => (
  <Box>
    <Text color={colors.logo1} bold>
      {'◆ '}
    </Text>
    <Text color={colors.logo2} bold>
      CC
    </Text>
    <Text color={colors.gold}>{'-'}</Text>
    <Text color={colors.logo3} bold>
      MIRROR
    </Text>
  </Box>
);

/**
 * Decorative divider with blue-gold gradient
 */
export const GoldDivider: React.FC<{ width?: number }> = ({ width = 60 }) => {
  const third = Math.floor(width / 3);
  return (
    <Box>
      <Text color={colors.logo1}>{'━'.repeat(third)}</Text>
      <Text color={colors.gold}>{'◆'}</Text>
      <Text color={colors.logo2}>{'━'.repeat(third)}</Text>
      <Text color={colors.gold}>{'◆'}</Text>
      <Text color={colors.logo1}>{'━'.repeat(third)}</Text>
    </Box>
  );
};

/**
 * Simple accent line
 */
export const AccentLine: React.FC<{ width?: number }> = ({ width = 60 }) => (
  <Box>
    <Text color={colors.border}>{'─'.repeat(width)}</Text>
  </Box>
);

/**
 * Section header with gold accent
 */
export const AccentHeader: React.FC<{ title: string; icon?: string }> = ({ title, icon }) => (
  <Box marginBottom={1}>
    <Text color={colors.gold} bold>
      {icon ? `${icon} ` : '◆ '}
    </Text>
    <Text color={colors.textBright} bold>
      {title}
    </Text>
  </Box>
);

/**
 * Decorative box header for screens
 */
export const ScreenHeader: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
  <Box flexDirection="column" marginBottom={1}>
    <Box>
      <Text color={colors.gold}>{'╔══ '}</Text>
      <Text color={colors.textBright} bold>
        {title}
      </Text>
      <Text color={colors.gold}>{' ══╗'}</Text>
    </Box>
    {subtitle && <Text color={colors.textMuted}> {subtitle}</Text>}
  </Box>
);
