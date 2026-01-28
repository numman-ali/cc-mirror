/**
 * Progress components for CLAUDE-SNEAKPEEK TUI
 */

import React, { useState, useEffect } from 'react';
import { Box, Text, useStdout } from 'ink';
import { colors, icons, spinnerFrames } from './theme.js';
import type { Step } from './types.js';

/**
 * Hook for animated spinner
 */
export const useSpinner = (interval = 80): string => {
  const [frame, setFrame] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setFrame((prev) => (prev + 1) % spinnerFrames.length);
    }, interval);
    return () => clearInterval(timer);
  }, [interval]);

  return spinnerFrames[frame];
};

interface ProgressBarProps {
  percent: number;
  width?: number;
  showPercent?: boolean;
}

/**
 * Progress bar with percentage
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({ percent, width: customWidth, showPercent = true }) => {
  const { stdout } = useStdout();
  const maxWidth = customWidth || (stdout?.columns ? Math.min(stdout.columns - 20, 50) : 40);

  const clampedPercent = Math.max(0, Math.min(100, percent));
  const filled = Math.floor((clampedPercent / 100) * maxWidth);
  const empty = maxWidth - filled;

  return (
    <Box>
      <Text color={colors.primary}>{icons.progressFull.repeat(filled)}</Text>
      <Text color={colors.textMuted}>{icons.progressEmpty.repeat(empty)}</Text>
      {showPercent && <Text color={colors.text}> {Math.round(clampedPercent)}%</Text>}
    </Box>
  );
};

interface SpinnerProps {
  label?: string;
}

/**
 * Loading spinner with optional label
 */
export const Spinner: React.FC<SpinnerProps> = ({ label }) => {
  const frame = useSpinner();

  return (
    <Box>
      <Text color={colors.primary}>{frame} </Text>
      {label && <Text color={colors.text}>{label}</Text>}
    </Box>
  );
};

interface StepListProps {
  steps: Step[];
}

/**
 * Step list with status indicators
 */
export const StepList: React.FC<StepListProps> = ({ steps }) => {
  const spinner = useSpinner();

  return (
    <Box flexDirection="column">
      {steps.map((step, idx) => {
        let icon: string;
        let color: string;

        switch (step.status) {
          case 'complete':
            icon = icons.check;
            color = colors.success;
            break;
          case 'active':
            icon = spinner;
            color = colors.primary;
            break;
          case 'error':
            icon = icons.cross;
            color = colors.error;
            break;
          default:
            icon = icons.bullet;
            color = colors.textMuted;
        }

        return (
          <Box key={idx}>
            <Text color={color}>{icon} </Text>
            <Text color={step.status === 'pending' ? colors.textMuted : colors.text}>{step.label}</Text>
          </Box>
        );
      })}
    </Box>
  );
};

interface HealthCheckProps {
  name: string;
  ok: boolean;
  details?: {
    binary: boolean;
    wrapper: boolean;
    config: boolean;
  };
}

/**
 * Health check result display
 */
export const HealthCheck: React.FC<HealthCheckProps> = ({ name, ok, details }) => (
  <Box flexDirection="column" marginBottom={1}>
    <Box>
      <Text color={ok ? colors.success : colors.warning}>{ok ? icons.check : icons.warning} </Text>
      <Text color={colors.text} bold>
        {name}
      </Text>
      <Text color={ok ? colors.success : colors.warning}> {ok ? 'OK' : 'Issues'}</Text>
    </Box>
    {details && (
      <Box marginLeft={3}>
        <Text color={colors.textMuted} dimColor>
          Binary: {details.binary ? icons.check : icons.cross}
          {'  '}Wrapper: {details.wrapper ? icons.check : icons.cross}
          {'  '}Config: {details.config ? icons.check : icons.cross}
        </Text>
      </Box>
    )}
  </Box>
);
