/**
 * API Key Input Screen
 */

import React from 'react';
import { Box, Text } from 'ink';
import { ScreenLayout } from '../components/ui/ScreenLayout.js';
import { MaskedInput } from '../components/ui/Input.js';
import { colors, icons, keyHints } from '../components/ui/theme.js';
import { getProviderEducation } from '../content/providers.js';

// Provider-specific help links and setup info
interface ProviderLinkInfo {
  credential: string;
  subscribe?: string;
  docs?: string;
  github?: string;
  note?: string;
}

const getProviderLinks = (providerKey?: string): ProviderLinkInfo | null => {
  if (!providerKey) return null;
  const education = getProviderEducation(providerKey.toLowerCase());
  if (!education?.setupLinks) return null;
  return {
    credential: education.setupLinks.apiKey,
    subscribe: education.setupLinks.subscribe,
    docs: education.setupLinks.docs,
    github: education.setupLinks.github,
    note: education.setupNote,
  };
};

interface ApiKeyScreenProps {
  providerLabel: string;
  providerKey?: string;
  envVarName: string;
  value: string;
  detectedFrom?: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

export const ApiKeyScreen: React.FC<ApiKeyScreenProps> = ({
  providerLabel,
  providerKey,
  envVarName,
  value,
  detectedFrom,
  onChange,
  onSubmit,
}) => {
  const usesAuthToken = envVarName === 'ANTHROPIC_AUTH_TOKEN';
  const credentialNoun = usesAuthToken ? 'token' : 'key';
  const credentialLabel = usesAuthToken ? 'Auth Token' : 'API Key';
  // Get provider-specific links
  const links = getProviderLinks(providerKey);

  return (
    <ScreenLayout
      title={credentialLabel}
      subtitle={`Enter your ${providerLabel} ${credentialNoun}`}
      borderColor={colors.borderGold}
      icon="star"
      hints={[keyHints.continue, keyHints.back]}
    >
      {/* Help section with links */}
      {links && (
        <Box flexDirection="column" marginBottom={1}>
          <Box marginBottom={1}>
            <Text color={colors.gold}>{icons.star} </Text>
            <Text color={colors.text} bold>
              Get Started with {providerLabel}
            </Text>
          </Box>
          <Box marginLeft={2} flexDirection="column">
            {links.subscribe && (
              <Text color={colors.textMuted}>
                1. Subscribe: <Text color={colors.primaryBright}>{links.subscribe}</Text>
              </Text>
            )}
            <Text color={colors.textMuted}>
              {links.subscribe ? '2.' : '1.'} Get {credentialNoun}:{' '}
              <Text color={colors.primaryBright}>{links.credential}</Text>
            </Text>
            {links.docs && (
              <Text color={colors.textMuted}>
                Docs: <Text color={colors.primaryBright}>{links.docs}</Text>
              </Text>
            )}
            {links.github && (
              <Text color={colors.textMuted}>
                GitHub: <Text color={colors.primaryBright}>{links.github}</Text>
              </Text>
            )}
          </Box>
          {links.note && (
            <Box marginTop={1} marginLeft={2}>
              <Text color={colors.textDim} dimColor>
                {icons.bullet} {links.note}
              </Text>
            </Box>
          )}
        </Box>
      )}

      {!links && (
        <Box marginBottom={1}>
          <Text color={colors.textMuted}>{icons.bullet} Get your API key from your provider's dashboard</Text>
        </Box>
      )}

      {detectedFrom && (
        <Box marginBottom={1}>
          <Text color={colors.success}>
            {icons.check} Detected in environment: <Text bold>{detectedFrom}</Text>
          </Text>
        </Box>
      )}

      <Box marginY={1}>
        <MaskedInput
          label="Authentication"
          envVarName={envVarName}
          value={value}
          onChange={onChange}
          onSubmit={onSubmit}
        />
      </Box>
    </ScreenLayout>
  );
};
