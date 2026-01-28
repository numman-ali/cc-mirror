/**
 * Input components for CLAUDE-SNEAKPEEK TUI
 */

import React from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import { colors, icons } from './theme.js';

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  mask?: string;
  hint?: string;
}

/**
 * Text input field with label
 */
export const TextField: React.FC<TextFieldProps> = ({ label, value, onChange, onSubmit, placeholder, mask, hint }) => (
  <Box flexDirection="column">
    <Text color={colors.textMuted}>{label}</Text>
    <Box marginTop={1}>
      <Text color={colors.primary}>{icons.pointer} </Text>
      <TextInput value={value} onChange={onChange} onSubmit={onSubmit} placeholder={placeholder} mask={mask} />
    </Box>
    {hint && (
      <Box marginTop={1}>
        <Text color={colors.textMuted} dimColor>
          {hint}
        </Text>
      </Box>
    )}
  </Box>
);

interface MaskedInputProps {
  label: string;
  envVarName: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

/**
 * Masked input for sensitive data like API keys
 */
export const MaskedInput: React.FC<MaskedInputProps> = ({ label, envVarName, value, onChange, onSubmit }) => (
  <Box flexDirection="column">
    <Text color={colors.textMuted}>{label}</Text>
    <Box marginTop={1}>
      <Text color={colors.textMuted}>{envVarName}: </Text>
    </Box>
    <Box marginTop={1}>
      <Text color={colors.primary}>{icons.pointer} </Text>
      <TextInput value={value} onChange={onChange} onSubmit={onSubmit} mask="•" placeholder="Enter key..." />
    </Box>
    <Box flexDirection="column" marginTop={2}>
      <Text color={colors.textMuted} dimColor>
        {icons.bullet} Stored locally in variant config
      </Text>
      <Text color={colors.textMuted} dimColor>
        {icons.bullet} Never sent to external servers
      </Text>
    </Box>
  </Box>
);
