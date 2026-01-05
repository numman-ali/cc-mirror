import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { ScreenLayout } from '../components/ui/ScreenLayout.js';
import { VariantCard } from '../components/ui/Menu.js';
import { EmptyVariantsArt } from '../components/ui/AsciiArt.js';
import { colors, icons } from '../components/ui/theme.js';

interface Variant {
  name: string;
  provider?: string;
  wrapperPath?: string;
}

interface SyncSourceScreenProps {
  variants: Variant[];
  onSelect: (name: string) => void;
  onBack: () => void;
}

export const SyncSourceScreen: React.FC<SyncSourceScreenProps> = ({ variants, onSelect, onBack }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const totalItems = variants.length + 1;

  useInput((input, key) => {
    if (key.upArrow) {
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
    }
    if (key.downArrow) {
      setSelectedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
    }
    if (key.return) {
      if (selectedIndex === variants.length) {
        onBack();
      } else if (variants[selectedIndex]) {
        onSelect(variants[selectedIndex].name);
      }
    }
    if (key.escape) {
      onBack();
    }
  });

  const isBackSelected = selectedIndex === variants.length;

  return (
    <ScreenLayout title="Sync Variants" subtitle="Select source variant to copy config from">
      <Box flexDirection="column" marginY={1}>
        {variants.length === 0 ? (
          <EmptyVariantsArt />
        ) : (
          variants.map((variant, idx) => (
            <VariantCard
              key={variant.name}
              name={variant.name}
              provider={variant.provider}
              path={variant.wrapperPath}
              selected={idx === selectedIndex}
            />
          ))
        )}

        <Box marginTop={1}>
          <Text color={isBackSelected ? colors.primary : colors.textMuted}>
            {isBackSelected ? icons.pointer : icons.pointerEmpty}{' '}
          </Text>
          <Text color={isBackSelected ? colors.text : colors.textMuted} bold={isBackSelected}>
            Back {icons.arrowLeft}
          </Text>
        </Box>
      </Box>
    </ScreenLayout>
  );
};
