/**
 * RouterUrlScreen - Configure the CC Router URL
 */

import React from 'react';
import { Box, Text, useInput } from 'ink';
import { ScreenLayout } from '../components/ui/ScreenLayout.js';
import { TextField } from '../components/ui/Input.js';
import { colors, icons, keyHints } from '../components/ui/theme.js';

export interface RouterUrlScreenProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onBack: () => void;
}

export const RouterUrlScreen: React.FC<RouterUrlScreenProps> = ({ value, onChange, onSubmit, onBack }) => {
  useInput((input, key) => {
    if (key.escape) {
      onBack();
    }
  });

  return (
    <ScreenLayout
      title="Router URL"
      subtitle="Where is CC Router running?"
      borderColor={colors.borderGold}
      icon="star"
      hints={[keyHints.continue, keyHints.back]}
    >
      {/* Explanation */}
      <Box flexDirection="column" marginBottom={1}>
        <Box marginBottom={1}>
          <Text color={colors.gold}>{icons.star} </Text>
          <Text color={colors.text} bold>
            CC Router
          </Text>
        </Box>
        <Box marginLeft={2} flexDirection="column">
          <Text color={colors.textMuted}>CCRouter runs locally and routes requests to your configured models.</Text>
          <Text color={colors.textMuted}>Default port is 3456. Change if you use a different port.</Text>
        </Box>
      </Box>

      {/* URL Input */}
      <Box marginY={1}>
        <TextField
          label="ANTHROPIC_BASE_URL"
          value={value}
          onChange={onChange}
          onSubmit={onSubmit}
          placeholder="http://127.0.0.1:3456"
          hint="Press Enter to continue"
        />
      </Box>

      {/* Help note */}
      <Box marginTop={1}>
        <Text color={colors.textDim} dimColor>
          {icons.bullet} Models are configured in ~/.claude-code-router/config.json
        </Text>
      </Box>
    </ScreenLayout>
  );
};
