/**
 * Provider Select Screen
 */

import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { ScreenLayout } from '../components/ui/ScreenLayout.js';
import { ProviderCard } from '../components/ui/Menu.js';
import { colors, icons, keyHints } from '../components/ui/theme.js';
import { getProviderEducation } from '../content/providers.js';

interface Provider {
  key: string;
  label: string;
  description: string;
  baseUrl?: string;
  experimental?: boolean;
}

interface ProviderSelectScreenProps {
  providers: Provider[];
  onSelect: (key: string) => void;
}

export const ProviderSelectScreen: React.FC<ProviderSelectScreenProps> = ({ providers, onSelect }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  // Get current selected provider and its education
  const currentProvider = providers[selectedIndex];
  const education = currentProvider ? getProviderEducation(currentProvider.key) : null;

  // Find next non-experimental provider index
  const findNextSelectable = (current: number, direction: 1 | -1): number => {
    let next = current;
    for (let i = 0; i < providers.length; i++) {
      next =
        direction === 1 ? (next < providers.length - 1 ? next + 1 : 0) : next > 0 ? next - 1 : providers.length - 1;
      if (!providers[next]?.experimental) return next;
    }
    return current; // No non-experimental found, stay put
  };

  useInput((input, key) => {
    if (key.upArrow) {
      setSelectedIndex((prev) => findNextSelectable(prev, -1));
    }
    if (key.downArrow) {
      setSelectedIndex((prev) => findNextSelectable(prev, 1));
    }
    if (key.return) {
      const provider = providers[selectedIndex];
      if (provider && !provider.experimental) {
        onSelect(provider.key);
      }
    }
    // Toggle details with ? key
    if (input === '?') {
      setShowDetails((prev) => !prev);
    }
  });

  return (
    <ScreenLayout
      title="Select Provider"
      subtitle="Pick a provider preset for Claude Code"
      hints={[keyHints.continue, showDetails ? '? Hide details' : '? Show details']}
    >
      {/* Help text */}
      <Box marginBottom={1} flexDirection="column">
        <Text color={colors.textMuted}>
          {icons.star} <Text color={colors.gold}>Mirror Claude</Text> is the fastest path to vanilla Claude Code
        </Text>
        <Text color={colors.textMuted}>
          {icons.bullet} Alternative providers for different models (GLM, MiniMax, etc.)
        </Text>
      </Box>

      <Box flexDirection="column" marginY={1}>
        {providers.map((provider, idx) => {
          const providerEducation = getProviderEducation(provider.key);
          const docsUrl = providerEducation?.setupLinks?.docs;
          return (
            <ProviderCard
              key={provider.key}
              provider={provider}
              selected={idx === selectedIndex && !provider.experimental}
              disabled={provider.experimental}
              docsUrl={docsUrl}
            />
          );
        })}
      </Box>

      {/* Details panel - shows when ? is pressed */}
      {showDetails && education && (
        <Box flexDirection="column" marginTop={1} paddingX={1}>
          <Box marginBottom={1}>
            <Text color={colors.gold}>{icons.star} </Text>
            <Text color={colors.text} bold>
              {education.headline}
            </Text>
          </Box>

          {/* Features */}
          <Box flexDirection="column" marginLeft={2}>
            {education.features.map((feature, i) => (
              <Text key={i} color={colors.textMuted}>
                {icons.bullet} {feature}
              </Text>
            ))}
          </Box>

          {/* Setup note */}
          {education.setupNote && (
            <Box marginTop={1} marginLeft={2}>
              <Text color={colors.textDim}>
                {icons.pointer} <Text italic>{education.setupNote}</Text>
              </Text>
            </Box>
          )}

          {/* Setup links */}
          {education.setupLinks && (
            <Box flexDirection="column" marginTop={1} marginLeft={2}>
              <Text color={colors.textMuted}>
                Subscribe: <Text color={colors.primaryBright}>{education.setupLinks.subscribe}</Text>
              </Text>
              {education.setupLinks.docs && (
                <Text color={colors.textMuted}>
                  Docs: <Text color={colors.primaryBright}>{education.setupLinks.docs}</Text>
                </Text>
              )}
              {education.setupLinks.github && (
                <Text color={colors.textMuted}>
                  GitHub: <Text color={colors.primaryBright}>{education.setupLinks.github}</Text>
                </Text>
              )}
            </Box>
          )}

          {/* Best for */}
          <Box marginTop={1} marginLeft={2}>
            <Text color={colors.textDim}>
              Best for: <Text color={colors.text}>{education.bestFor}</Text>
            </Text>
          </Box>
        </Box>
      )}
    </ScreenLayout>
  );
};
