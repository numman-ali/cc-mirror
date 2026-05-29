/**
 * Environment Variables Editor Screen
 *
 * Allows users to add custom KEY=VALUE environment entries.
 */

import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { ScreenLayout } from '../components/ui/ScreenLayout.js';
import { colors, icons, keyHints } from '../components/ui/theme.js';

interface EnvEditorScreenProps {
  /** Current environment entries */
  envEntries: string[];
  /** Callback when user adds a new entry */
  onAdd: (entry: string) => void;
  /** Callback when user finishes editing */
  onDone: () => void;
}

export const EnvEditorScreen: React.FC<EnvEditorScreenProps> = ({ envEntries, onAdd, onDone }) => {
  const [inputBuffer, setInputBuffer] = useState('');

  useInput((input, key) => {
    // Handle enter to submit
    if (key.return) {
      const trimmed = inputBuffer.trim();
      if (!trimmed) {
        // Empty input means done
        onDone();
        return;
      }
      onAdd(trimmed);
      setInputBuffer('');
      return;
    }

    // Handle escape to go back
    if (key.escape) {
      onDone();
      return;
    }

    // Handle backspace
    if (key.backspace || key.delete) {
      setInputBuffer((prev) => prev.slice(0, -1));
      return;
    }

    // Handle regular character input
    if (input && !key.ctrl && !key.meta) {
      setInputBuffer((prev) => prev + input);
    }
  });

  return (
    <ScreenLayout
      title="Custom Environment"
      subtitle="Auto-injected when running your variant"
      hints={[keyHints.continue, 'Empty line to finish', keyHints.back]}
    >
      {/* Instructions */}
      <Box flexDirection="column" marginBottom={1}>
        <Text color={colors.textMuted}>
          These environment variables will be auto-injected when running your variant.
        </Text>
        <Text color={colors.textDim}>Edit only values you intentionally want to own.</Text>
      </Box>

      <Box marginBottom={1}>
        <Text color={colors.textMuted}>{icons.bullet} Format: KEY=VALUE (e.g., MY_VAR=my_value)</Text>
      </Box>

      {/* Current entries */}
      <Box flexDirection="column" marginY={1}>
        <Text color={colors.textMuted} bold>
          Current entries:
        </Text>
        <Box flexDirection="column" marginTop={1} marginLeft={2}>
          {envEntries.length === 0 ? (
            <Text color={colors.textDim}>(none)</Text>
          ) : (
            envEntries.map((entry) => (
              <Text key={entry} color={colors.text}>
                {icons.check} {entry}
              </Text>
            ))
          )}
        </Box>
      </Box>

      {/* Input field */}
      <Box flexDirection="column" marginY={1}>
        <Text color={colors.textMuted} bold>
          Add entry:
        </Text>
        <Box marginTop={1}>
          <Text color={colors.primary}>{icons.pointer} </Text>
          <Text color={colors.text}>{inputBuffer}</Text>
          <Text color={colors.primary}>│</Text>
        </Box>
      </Box>

      {/* Hint */}
      <Box marginTop={1}>
        <Text color={colors.textDim}>Press Enter on empty line to finish adding entries.</Text>
      </Box>
    </ScreenLayout>
  );
};
