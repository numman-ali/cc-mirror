/**
 * FeedbackScreen - Links, issues, and contribution info
 */

import React from 'react';
import { Box, Text, useInput } from 'ink';
import { ScreenLayout } from '../components/ui/ScreenLayout.js';
import { colors, keyHints } from '../components/ui/theme.js';

interface FeedbackScreenProps {
  onBack: () => void;
}

export const FeedbackScreen: React.FC<FeedbackScreenProps> = ({ onBack }) => {
  useInput((input, key) => {
    if (key.escape || key.return) {
      onBack();
    }
  });

  return (
    <ScreenLayout title="Feedback & Contributions" subtitle="Help make CLAUDE-SNEAKPEEK better" hints={[keyHints.back]}>
      <Box flexDirection="column" marginBottom={1}>
        <Text color={colors.textMuted}>
          CLAUDE-SNEAKPEEK is open source and welcomes contributions, bug reports, and feature requests.
        </Text>
      </Box>

      <Box flexDirection="column" marginY={1}>
        <Text color={colors.text} bold>
          Links:
        </Text>
        <Box flexDirection="column" marginLeft={2} marginTop={1}>
          <Text color={colors.textMuted}>
            GitHub: <Text color={colors.primaryBright}>https://github.com/mikekelly/claude-sneakpeek</Text>
          </Text>
          <Text color={colors.textMuted}>
            Issues: <Text color={colors.primaryBright}>https://github.com/mikekelly/claude-sneakpeek/issues</Text>
          </Text>
        </Box>
      </Box>

      <Box flexDirection="column" marginY={1}>
        <Text color={colors.text} bold>
          Provider PRs Welcome:
        </Text>
        <Box flexDirection="column" marginLeft={2} marginTop={1}>
          <Text color={colors.textDim}>Want to improve OpenRouter or Claude Code Router support?</Text>
          <Text color={colors.textDim}>PRs for better model mappings, transformers, and docs are appreciated.</Text>
        </Box>
      </Box>
    </ScreenLayout>
  );
};
