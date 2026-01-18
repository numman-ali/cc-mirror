/**
 * ProviderIntroScreen - Shows what's coming before configuration begins
 */

import React from 'react';
import { Box, Text, useInput } from 'ink';
import { ScreenLayout } from '../components/ui/ScreenLayout.js';
import { colors, keyHints } from '../components/ui/theme.js';
import { getProviderEducation } from '../content/providers.js';

export interface ProviderIntroScreenProps {
  providerKey: string;
  providerLabel: string;
  isQuickSetup?: boolean;
  onContinue: () => void;
  onBack: () => void;
}

export const ProviderIntroScreen: React.FC<ProviderIntroScreenProps> = ({
  providerKey,
  providerLabel,
  isQuickSetup = false,
  onContinue,
  onBack,
}) => {
  const education = getProviderEducation(providerKey);

  useInput((input, key) => {
    if (key.escape) {
      onBack();
    } else if (key.return || input === ' ') {
      onContinue();
    }
  });

  // Build the steps list based on provider and flow type
  const buildSteps = (): string[] => {
    const steps: string[] = [];

    // CCRouter is special - no API key, no models (configured in ~/.claude-code-router/config.json)
    if (providerKey === 'ccrouter') {
      steps.push('Configure router URL (default: localhost:3456)');
      if (!isQuickSetup) {
        steps.push('Choose a visual theme');
        steps.push('Optional: dev-browser skill');
      }
      steps.push('Name your variant');
      steps.push('Create!');
      return steps;
    }

    // Mirror is special - no API key at setup, uses normal Claude auth
    if (providerKey === 'mirror') {
      if (!isQuickSetup) {
        steps.push('Choose a visual theme');
        steps.push('Optional: dev-browser skill');
      }
      steps.push('Name your variant');
      steps.push('Create your variant');
      steps.push('Authenticate via Claude Code (OAuth or API key)');
      return steps;
    }

    // Standard providers
    steps.push('Enter your API key');

    // Model mapping (if required)
    if (education?.requiresMapping) {
      steps.push('Configure model aliases');
    }

    // Quick vs full flow differences
    if (!isQuickSetup) {
      steps.push('Choose a visual theme');

      // Prompt pack (zai/minimax only)
      if (education?.hasPromptPack) {
        steps.push('Enable/disable prompt pack');
      }

      steps.push('Optional: dev-browser skill');
      steps.push('Optional: custom env vars');
    }

    // Final step
    steps.push('Create your variant');

    return steps;
  };

  const steps = buildSteps();

  return (
    <ScreenLayout
      title={`Setting up ${providerLabel}`}
      subtitle={education?.tagline || 'Configure your variant'}
      hints={[keyHints.back, 'Enter Continue']}
    >
      {/* Provider headline */}
      {education?.headline && (
        <Box marginBottom={1}>
          <Text color={colors.primaryBright} bold>
            {education.headline}
          </Text>
        </Box>
      )}

      {/* What you're about to do */}
      <Box flexDirection="column" marginBottom={1}>
        <Text color={colors.textMuted} bold>
          {isQuickSetup ? "Quick setup — here's what we'll do:" : "Full wizard — here's what's coming:"}
        </Text>
        <Box flexDirection="column" marginLeft={2} marginTop={1}>
          {steps.map((step, index) => (
            <Text key={index} color={colors.text}>
              <Text color={colors.textDim}>{index + 1}.</Text> {step}
            </Text>
          ))}
        </Box>
      </Box>

      {/* Key features */}
      {education?.features && education.features.length > 0 && (
        <Box flexDirection="column" marginTop={1}>
          <Text color={colors.textMuted} bold>
            What you get:
          </Text>
          <Box flexDirection="column" marginLeft={2} marginTop={1}>
            {education.features.slice(0, 4).map((feature, index) => (
              <Text key={index} color={colors.text}>
                <Text color={colors.success}>+</Text> {feature}
              </Text>
            ))}
          </Box>
        </Box>
      )}

      {/* Setup note */}
      {education?.setupNote && (
        <Box marginTop={1}>
          <Text color={colors.textDim} italic>
            {education.setupNote}
          </Text>
        </Box>
      )}

      {/* Provider docs/GitHub link */}
      {education?.setupLinks?.github && (
        <Box marginTop={1}>
          <Text color={colors.primaryBright}>GitHub: {education.setupLinks.github}</Text>
        </Box>
      )}
      {education?.setupLinks?.docs && !education?.setupLinks?.github && (
        <Box marginTop={1}>
          <Text color={colors.primaryBright}>Docs: {education.setupLinks.docs}</Text>
        </Box>
      )}

      {/* Continue prompt */}
      <Box marginTop={2}>
        <Text color={colors.primaryBright}>Press Enter to continue →</Text>
      </Box>
    </ScreenLayout>
  );
};
