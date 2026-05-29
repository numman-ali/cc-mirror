/**
 * ProviderIntroScreen - Shows what's coming before configuration begins
 */

import React from 'react';
import { Box, Text, useInput } from 'ink';
import { ScreenLayout } from '../components/ui/ScreenLayout.js';
import { colors, keyHints } from '../components/ui/theme.js';
import { getProviderEducation } from '../content/providers.js';
import { getTuiProviderCapabilities, type TuiProviderCapabilities } from '../providerCapabilities.js';

export interface ProviderIntroScreenProps {
  providerKey: string;
  providerLabel: string;
  capabilities?: TuiProviderCapabilities;
  isQuickSetup?: boolean;
  onContinue: () => void;
  onBack: () => void;
}

export const ProviderIntroScreen: React.FC<ProviderIntroScreenProps> = ({
  providerKey,
  providerLabel,
  capabilities,
  isQuickSetup = false,
  onContinue,
  onBack,
}) => {
  const education = getProviderEducation(providerKey);
  const flowCapabilities = capabilities ?? getTuiProviderCapabilities(providerKey);

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

    if (!isQuickSetup) {
      steps.push('Choose a visual theme');
    }

    if (flowCapabilities.endpoint.kind === 'router-url') {
      steps.push('Configure router URL (default: localhost:3456)');
    } else if (
      !isQuickSetup &&
      flowCapabilities.endpoint.configurable &&
      flowCapabilities.endpoint.kind === 'base-url'
    ) {
      steps.push('Confirm provider base URL');
    }

    if (flowCapabilities.credential.required) {
      steps.push('Enter provider credential');
    }

    if (flowCapabilities.models.showInSetup) {
      steps.push(flowCapabilities.models.required ? 'Configure required model slots' : 'Review model slots');
    }

    if (!isQuickSetup) {
      steps.push('Optional: dev-browser skill');
      steps.push('Optional: custom env vars');
    }

    steps.push('Name your variant');
    steps.push('Review capabilities and settings');
    steps.push('Create your variant');
    if (flowCapabilities.endpoint.kind === 'none' && !flowCapabilities.credential.required) {
      steps.push('Authenticate on first run');
    }

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

      <Box flexDirection="column" marginTop={1}>
        <Text color={colors.textMuted} bold>
          Capabilities:
        </Text>
        <Box flexDirection="column" marginLeft={2} marginTop={1}>
          <Text color={colors.text}>
            <Text color={colors.success}>+</Text> Credential:{' '}
            {flowCapabilities.credential.required ? 'provider credential' : 'not required'}
          </Text>
          <Text color={colors.text}>
            <Text color={colors.success}>+</Text> Endpoint:{' '}
            {flowCapabilities.endpoint.kind === 'none' ? 'runtime default' : flowCapabilities.endpoint.kind}
          </Text>
          <Text color={colors.text}>
            <Text color={colors.success}>+</Text> Models:{' '}
            {flowCapabilities.models.required
              ? 'required slots'
              : flowCapabilities.models.showInSetup
                ? 'defaults reviewed'
                : 'provider defaults'}
          </Text>
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
        <Text color={colors.primaryBright}>Press Enter to continue</Text>
      </Box>
    </ScreenLayout>
  );
};
