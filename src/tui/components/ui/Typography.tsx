/**
 * Typography components for CLAUDE-SNEAKPEEK TUI
 */

import React from 'react';
import { Box, Text } from 'ink';
import { colors } from './theme.js';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

/**
 * Page header with title and optional subtitle
 */
export const Header: React.FC<HeaderProps> = ({ title, subtitle }) => (
  <Box flexDirection="column" marginBottom={1}>
    <Text color={colors.primary} bold>
      {title}
    </Text>
    {subtitle && <Text color={colors.textMuted}>{subtitle}</Text>}
  </Box>
);

interface TitleProps {
  children: string;
  color?: string;
}

/**
 * Section title
 */
export const Title: React.FC<TitleProps> = ({ children, color = colors.text }) => (
  <Text color={color} bold>
    {children}
  </Text>
);

interface LabelProps {
  children: string;
}

/**
 * Muted label text
 */
export const Label: React.FC<LabelProps> = ({ children }) => <Text color={colors.textMuted}>{children}</Text>;

interface ValueProps {
  children: string;
}

/**
 * Value text (white/bright)
 */
export const Value: React.FC<ValueProps> = ({ children }) => <Text color={colors.text}>{children}</Text>;

interface SummaryRowProps {
  label: string;
  value: string;
  labelWidth?: number;
}

/**
 * Summary row with label and value
 */
export const SummaryRow: React.FC<SummaryRowProps> = ({ label, value, labelWidth = 16 }) => (
  <Box>
    <Box width={labelWidth}>
      <Text color={colors.textMuted}>{label}</Text>
    </Box>
    <Text color={colors.text}>{value}</Text>
  </Box>
);

interface StatusTextProps {
  status: 'success' | 'warning' | 'error' | 'info';
  children: string;
}

/**
 * Status-colored text
 */
export const StatusText: React.FC<StatusTextProps> = ({ status, children }) => {
  const colorMap = {
    success: colors.success,
    warning: colors.warning,
    error: colors.error,
    info: colors.primary,
  };

  return <Text color={colorMap[status]}>{children}</Text>;
};

interface CodeProps {
  children: string;
}

/**
 * Code/command display
 */
export const Code: React.FC<CodeProps> = ({ children }) => (
  <Text color={colors.primary} bold>
    $ {children}
  </Text>
);
