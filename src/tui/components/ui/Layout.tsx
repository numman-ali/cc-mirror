/**
 * Layout components for CLAUDE-SNEAKPEEK TUI
 *
 * Uses ink's built-in Box with borderStyle for clean layouts.
 */

import React, { type ReactNode } from 'react';
import { Box, Text } from 'ink';
import { colors, keyHints } from './theme.js';

// Fixed dimensions to prevent box flickering/resizing
const FRAME_WIDTH = 76;
const FRAME_HEIGHT = 32; // Fixed height for consistency across all screens

interface FrameProps {
  children: ReactNode;
  title?: string;
  borderColor?: string;
  showFooter?: boolean;
}

/**
 * Main application frame with rounded border and fixed dimensions
 */
export const Frame: React.FC<FrameProps> = ({ children, title, borderColor = colors.border, showFooter = true }) => {
  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={borderColor}
      paddingX={2}
      paddingY={1}
      width={FRAME_WIDTH}
      minHeight={FRAME_HEIGHT}
    >
      {title && (
        <Box marginBottom={1}>
          <Text color={colors.primary} bold>
            {title}
          </Text>
        </Box>
      )}
      {children}
      {showFooter && <CreatorFooter />}
    </Box>
  );
};

/**
 * Creator footer - shown at bottom of every screen
 * Left: Creator name + CTA | Right: Social links (stacked)
 */
export const CreatorFooter: React.FC = () => (
  <Box flexDirection="column" marginTop={1}>
    <Box>
      <Text color={colors.border}>{'─'.repeat(FRAME_WIDTH - 8)}</Text>
    </Box>
    <Box flexDirection="row" justifyContent="space-between" marginTop={1}>
      <Box flexDirection="column">
        <Box>
          <Text color={colors.textDim}>Created by </Text>
          <Text color={colors.gold} bold>
            Numman Ali
          </Text>
        </Box>
        <Text color={colors.textDim}>Want features? Get in touch!</Text>
      </Box>
      <Box flexDirection="column" alignItems="flex-end">
        <Text color={colors.primaryBright}>https://x.com/nummanali</Text>
        <Text color={colors.primaryBright}>https://github.com/numman-ali</Text>
      </Box>
    </Box>
  </Box>
);

interface SectionProps {
  children: ReactNode;
  title?: string;
  marginY?: number;
}

/**
 * Section container with optional title
 */
export const Section: React.FC<SectionProps> = ({ children, title, marginY = 1 }) => (
  <Box flexDirection="column" marginY={marginY}>
    {title && (
      <Box marginBottom={1}>
        <Text color={colors.textMuted} bold>
          {title}
        </Text>
      </Box>
    )}
    {children}
  </Box>
);

interface DividerProps {
  color?: string;
  compact?: boolean;
}

/**
 * Horizontal divider line
 */
export const Divider: React.FC<DividerProps> = ({ color = colors.border, compact = false }) => {
  const width = FRAME_WIDTH - 8; // Account for padding and border

  return (
    <Box marginY={compact ? 0 : 1}>
      <Text color={color}>{'─'.repeat(width)}</Text>
    </Box>
  );
};

interface HintBarProps {
  hints?: string[];
}

/**
 * Bottom hint bar showing keyboard shortcuts
 */
export const HintBar: React.FC<HintBarProps> = ({ hints = [keyHints.navigate, keyHints.select, keyHints.back] }) => (
  <Box marginTop={1}>
    <Text color={colors.textMuted}>{hints.join('  •  ')}</Text>
  </Box>
);

interface SpacerProps {
  size?: number;
}

/**
 * Vertical spacer
 */
export const Spacer: React.FC<SpacerProps> = ({ size = 1 }) => <Box marginY={size} />;

interface RowProps {
  children: ReactNode;
  gap?: number;
}

/**
 * Horizontal row container
 */
export const Row: React.FC<RowProps> = ({ children, gap = 1 }) => (
  <Box flexDirection="row" gap={gap}>
    {children}
  </Box>
);

interface ColumnProps {
  children: ReactNode;
  gap?: number;
}

/**
 * Vertical column container
 */
export const Column: React.FC<ColumnProps> = ({ children, gap = 0 }) => (
  <Box flexDirection="column" gap={gap}>
    {children}
  </Box>
);
