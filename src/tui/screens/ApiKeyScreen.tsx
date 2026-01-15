/**
 * API Key Input Screen
 */

import React from 'react';
import { Box, Text } from 'ink';
import { ScreenLayout } from '../components/ui/ScreenLayout.js';
import { MaskedInput } from '../components/ui/Input.js';
import { colors, icons, keyHints } from '../components/ui/theme.js';

// Provider-specific help links and setup info
interface ProviderLinkInfo {
  apiKey: string;
  subscribe: string;
  setup?: string; // Additional setup instructions URL
  note?: string; // Brief note about what the key is used for
}

const PROVIDER_LINKS: Record<string, ProviderLinkInfo> = {
  zai: {
    apiKey: 'https://z.ai/manage-apikey/apikey-list',
    subscribe: 'https://z.ai/subscribe',
    note: 'Your Zai API key will be stored as ANTHROPIC_API_KEY for Claude Code compatibility.',
  },
  minimax: {
    apiKey: 'https://platform.minimax.io/user-center/payment/coding-plan',
    subscribe: 'https://platform.minimax.io/subscribe/coding-plan',
    note: 'Your MiniMax API key will be stored as ANTHROPIC_API_KEY for Claude Code compatibility.',
  },
  openrouter: {
    apiKey: 'https://openrouter.ai/keys',
    subscribe: 'https://openrouter.ai/account',
    note: 'Your OpenRouter key will be stored as ANTHROPIC_AUTH_TOKEN.',
  },
  nanogpt: {
    apiKey: 'https://nano-gpt.com/api',
    subscribe: 'https://nano-gpt.com',
    note: 'Your NanoGPT key will be stored as ANTHROPIC_AUTH_TOKEN.',
  },
  ccrouter: {
    apiKey: 'https://github.com/musistudio/claude-code-router',
    subscribe: 'https://github.com/musistudio/claude-code-router#installation',
    note: 'No API key needed. Models are configured in ~/.claude-code-router/config.json',
  },
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
  // Get provider-specific links
  const links = providerKey ? PROVIDER_LINKS[providerKey.toLowerCase()] : null;

  return (
    <ScreenLayout
      title="API Key"
      subtitle={`Enter your ${providerLabel} API key`}
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
            <Text color={colors.textMuted}>
              1. Subscribe: <Text color={colors.primaryBright}>{links.subscribe}</Text>
            </Text>
            <Text color={colors.textMuted}>
              2. Get key: <Text color={colors.primaryBright}>{links.apiKey}</Text>
            </Text>
            {links.setup && (
              <Text color={colors.textMuted}>
                3. Setup guide: <Text color={colors.primaryBright}>{links.setup}</Text>
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
