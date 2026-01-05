import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { ScreenLayout } from '../components/ui/ScreenLayout.js';
import { colors, icons } from '../components/ui/theme.js';

interface Variant {
  name: string;
  provider?: string;
}

interface SyncTargetsScreenProps {
  variants: Variant[];
  sourceVariant: string;
  onConfirm: (selected: string[]) => void;
  onBack: () => void;
}

export const SyncTargetsScreen: React.FC<SyncTargetsScreenProps> = ({ variants, sourceVariant, onConfirm, onBack }) => {
  const availableVariants = variants.filter((v) => v.name !== sourceVariant);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const totalItems = availableVariants.length + 2;
  const confirmIndex = availableVariants.length;
  const backIndex = availableVariants.length + 1;

  useInput((input, key) => {
    if (key.upArrow) {
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
    }
    if (key.downArrow) {
      setSelectedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
    }
    if (input === ' ' && selectedIndex < availableVariants.length) {
      const variantName = availableVariants[selectedIndex].name;
      setSelected((prev) => {
        const next = new Set(prev);
        if (next.has(variantName)) {
          next.delete(variantName);
        } else {
          next.add(variantName);
        }
        return next;
      });
    }
    if (key.return) {
      if (selectedIndex === confirmIndex) {
        if (selected.size > 0) {
          onConfirm(Array.from(selected));
        }
      } else if (selectedIndex === backIndex) {
        onBack();
      } else if (selectedIndex < availableVariants.length) {
        const variantName = availableVariants[selectedIndex].name;
        setSelected((prev) => {
          const next = new Set(prev);
          if (next.has(variantName)) {
            next.delete(variantName);
          } else {
            next.add(variantName);
          }
          return next;
        });
      }
    }
    if (key.escape) {
      onBack();
    }
  });

  const isConfirmSelected = selectedIndex === confirmIndex;
  const isBackSelected = selectedIndex === backIndex;

  return (
    <ScreenLayout
      title="Select Target Variants"
      subtitle={`Syncing from ${sourceVariant} - Space to toggle, Enter to confirm`}
    >
      <Box flexDirection="column" marginY={1}>
        {availableVariants.length === 0 ? (
          <Text color={colors.textMuted}>No other variants available to sync to.</Text>
        ) : (
          availableVariants.map((variant, idx) => {
            const isSelected = idx === selectedIndex;
            const isChecked = selected.has(variant.name);
            return (
              <Box key={variant.name} marginBottom={0}>
                <Text color={isSelected ? colors.primary : colors.textMuted}>
                  {isSelected ? icons.pointer : icons.pointerEmpty}{' '}
                </Text>
                <Text color={isChecked ? colors.success : colors.textMuted}>{isChecked ? '[x]' : '[ ]'} </Text>
                <Text color={isSelected ? colors.text : colors.textMuted} bold={isSelected}>
                  {variant.name}
                </Text>
                {variant.provider && <Text color={colors.textMuted}> ({variant.provider})</Text>}
              </Box>
            );
          })
        )}

        <Box marginTop={1} flexDirection="column">
          <Box>
            <Text color={isConfirmSelected ? colors.primary : colors.textMuted}>
              {isConfirmSelected ? icons.pointer : icons.pointerEmpty}{' '}
            </Text>
            <Text
              color={selected.size > 0 ? (isConfirmSelected ? colors.success : colors.text) : colors.textMuted}
              bold={isConfirmSelected}
            >
              Sync to {selected.size} variant{selected.size !== 1 ? 's' : ''} {icons.arrowRight}
            </Text>
          </Box>
          <Box>
            <Text color={isBackSelected ? colors.primary : colors.textMuted}>
              {isBackSelected ? icons.pointer : icons.pointerEmpty}{' '}
            </Text>
            <Text color={isBackSelected ? colors.text : colors.textMuted} bold={isBackSelected}>
              Back {icons.arrowLeft}
            </Text>
          </Box>
        </Box>
      </Box>
    </ScreenLayout>
  );
};
