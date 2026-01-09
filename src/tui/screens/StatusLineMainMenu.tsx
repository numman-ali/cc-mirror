/**
 * Status Line Main Menu
 *
 * Entry point for Status Line configuration with two paths:
 * - Configure & Install: Full ccstatusline TUI for selected variant(s)
 * - Quick Install: Apply existing config to multiple variants
 */

import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { ScreenLayout } from '../components/ui/ScreenLayout.js';
import { SelectMenu } from '../components/ui/Menu.js';
import { colors, icons, keyHints } from '../components/ui/theme.js';
import type { MenuItem } from '../components/ui/types.js';
import type { VariantEntry } from '../../core/types.js';

export interface StatusLineMainMenuProps {
  variants: VariantEntry[];
  onConfigureVariants: (variantNames: string[]) => void;
  onQuickInstall: () => void;
  onBack: () => void;
}

export const StatusLineMainMenu: React.FC<StatusLineMainMenuProps> = ({
  variants,
  onConfigureVariants,
  onQuickInstall,
  onBack,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useInput((input, key) => {
    if (key.escape) {
      onBack();
    }
  });

  const items: MenuItem[] = [
    {
      value: 'configure',
      label: 'Configure & Install',
      description: 'Full ccstatusline TUI for selected variant(s)',
      icon: 'star',
    },
    {
      value: 'quick',
      label: 'Quick Install',
      description: 'Apply existing config to multiple variants',
      icon: 'check',
    },
    {
      value: 'back',
      label: 'Back',
      icon: 'back',
    },
  ];

  const handleSelect = (value: string) => {
    if (value === 'back') {
      onBack();
    } else if (value === 'configure') {
      // For configure, we'll proceed to variant selection
      // This will be handled by the parent component navigating to the next screen
      onConfigureVariants([]);
    } else if (value === 'quick') {
      onQuickInstall();
    }
  };

  return (
    <ScreenLayout
      title="Status Line Configuration"
      subtitle="Customize your Claude Code status line"
      hints={[keyHints.navigate, keyHints.select, keyHints.back]}
    >
      <Box flexDirection="column" marginY={1}>
        <Box marginBottom={1}>
          <Text color={colors.textMuted}>
            Choose your installation path:
          </Text>
        </Box>

        <SelectMenu
          items={items}
          selectedIndex={selectedIndex}
          onIndexChange={setSelectedIndex}
          onSelect={handleSelect}
        />

        <Box marginTop={1} flexDirection="column">
          <Box marginBottom={1}>
            <Text color={colors.gold} bold>
              {icons.star} Configure & Install
            </Text>
          </Box>
          <Box marginLeft={2} flexDirection="column">
            <Text color={colors.textDim}>
              {icons.bullet} Open the full ccstatusline configuration TUI
            </Text>
            <Text color={colors.textDim}>
              {icons.bullet} Select specific variants to configure
            </Text>
            <Text color={colors.textDim}>
              {icons.bullet} Customize colors, icons, and layout options
            </Text>
          </Box>

          <Box marginBottom={1} marginTop={1}>
            <Text color={colors.success} bold>
              {icons.check} Quick Install
            </Text>
          </Box>
          <Box marginLeft={2} flexDirection="column">
            <Text color={colors.textDim}>
              {icons.bullet} Apply your existing ccstatusline config
            </Text>
            <Text color={colors.textDim}>
              {icons.bullet} Select multiple variants at once
            </Text>
            <Text color={colors.textDim}>
              {icons.bullet} Fastest way to apply consistent settings
            </Text>
          </Box>
        </Box>

        <Box marginTop={1}>
          <Text color={colors.textDim}>
            Available variants: <Text color={colors.primaryBright}>{variants.length}</Text>
          </Text>
        </Box>
      </Box>
    </ScreenLayout>
  );
};
