/**
 * Multi-Variant Selector Screen
 *
 * Allows selecting multiple variants with checkboxes (batch install)
 * or single variant selection (single-variant config).
 */

import React, { useState, useMemo } from 'react';
import { Box, Text, useInput } from 'ink';
import { ScreenLayout } from '../components/ui/ScreenLayout.js';
import { colors, icons, keyHints } from '../components/ui/theme.js';
import type { VariantEntry } from '../../core/types.js';

export interface MultiVariantSelectorProps {
  variants: VariantEntry[];
  selectedVariants: string[];
  onSelectionChange: (selected: string[]) => void;
  onSubmit: () => void;
  onBack: () => void;
  allowMultiple: boolean; // true for batch install, false for single-variant config
}

export const MultiVariantSelector: React.FC<MultiVariantSelectorProps> = ({
  variants,
  selectedVariants,
  onSelectionChange,
  onSubmit,
  onBack,
  allowMultiple,
}) => {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const totalItems = variants.length + 1; // +1 for back button
  const isBackFocused = focusedIndex === variants.length;

  // Generate keyboard hints based on mode
  const hints = useMemo(() => {
    const baseHints: string[] = [keyHints.navigate];
    if (allowMultiple) {
      baseHints.push('Space Toggle');
      baseHints.push('Enter Confirm');
    } else {
      baseHints.push('Enter Select');
    }
    baseHints.push(keyHints.back);
    return baseHints;
  }, [allowMultiple]);

  useInput((input, key) => {
    // Navigation
    if (key.upArrow) {
      setFocusedIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
    }
    if (key.downArrow) {
      setFocusedIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
    }

    // Back functionality
    if (key.escape) {
      onBack();
      return;
    }

    // Handle back button selection
    if (isBackFocused) {
      if (key.return || input === ' ') {
        onBack();
      }
      return;
    }

    // Handle variant selection
    const focusedVariant = variants[focusedIndex];
    if (!focusedVariant) return;

    // Toggle selection with Space or Enter (in multiple mode)
    if (input === ' ') {
      const isSelected = selectedVariants.includes(focusedVariant.name);
      let newSelected: string[];

      if (isSelected) {
        newSelected = selectedVariants.filter((v) => v !== focusedVariant.name);
      } else {
        if (allowMultiple) {
          newSelected = [...selectedVariants, focusedVariant.name];
        } else {
          // Single selection mode: replace selection
          newSelected = [focusedVariant.name];
        }
      }

      onSelectionChange(newSelected);
    }

    // Submit with Enter (in multiple mode)
    if (key.return && allowMultiple) {
      if (selectedVariants.length > 0) {
        onSubmit();
      }
    }

    // Single selection mode: select and submit immediately
    if (key.return && !allowMultiple) {
      onSelectionChange([focusedVariant.name]);
      onSubmit();
    }
  });

  const getTitle = () => (allowMultiple ? 'Select Variants' : 'Select Variant');
  const getSubtitle = () =>
    allowMultiple
      ? `Choose variants to install (${selectedVariants.length} selected)`
      : 'Choose a variant to configure';

  return (
    <ScreenLayout title={getTitle()} subtitle={getSubtitle()} hints={hints}>
      <Box flexDirection="column" marginY={1}>
        {variants.length === 0 ? (
          <Box marginLeft={2}>
            <Text color={colors.textMuted}>No variants available</Text>
          </Box>
        ) : (
          variants.map((variant, idx) => {
            const isSelected = selectedVariants.includes(variant.name);
            const isFocused = idx === focusedIndex;

            return (
              <VariantRow
                key={variant.name}
                variant={variant}
                isSelected={isSelected}
                isFocused={isFocused}
                allowMultiple={allowMultiple}
              />
            );
          })
        )}

        {/* Back button */}
        <Box marginTop={1}>
          <Text color={isBackFocused ? colors.gold : colors.textMuted}>
            {isBackFocused ? icons.pointer : icons.pointerEmpty}{' '}
          </Text>
          <Text color={isBackFocused ? colors.text : colors.textMuted} bold={isBackFocused}>
            Back {icons.arrowLeft}
          </Text>
        </Box>
      </Box>
    </ScreenLayout>
  );
};

interface VariantRowProps {
  variant: VariantEntry;
  isSelected: boolean;
  isFocused: boolean;
  allowMultiple: boolean;
}

const VariantRow: React.FC<VariantRowProps> = ({ variant, isSelected, isFocused, allowMultiple }) => {
  const pointer = isFocused ? icons.pointer : icons.pointerEmpty;

  // Selection indicator
  const getSelectionIndicator = () => {
    if (allowMultiple) {
      // Checkbox mode
      return (
        <Text color={isSelected ? colors.success : colors.textDim}>
          {isSelected ? `[${icons.check}]` : '[ ]'}
        </Text>
      );
    } else {
      // Radio mode
      return (
        <Text color={isSelected ? colors.success : colors.textDim}>
          {isSelected ? `[${icons.check}]` : '( )'}
        </Text>
      );
    }
  };

  return (
    <Box flexDirection="column" marginBottom={1}>
      <Box>
        <Text color={isFocused ? colors.gold : colors.textMuted}>{pointer} </Text>
        {getSelectionIndicator()}
        <Text color={isFocused ? colors.text : colors.textMuted} bold={isFocused}>
          {' '}
          {variant.name}
        </Text>
        {isSelected && (
          <Text color={colors.success}> {icons.check}</Text>
        )}
      </Box>

      {/* Show provider info if available */}
      {variant.meta && (
        <Box marginLeft={5}>
          <Text color={colors.textMuted}>
            Provider: <Text color={colors.primaryBright}>{variant.meta.provider}</Text>
          </Text>
          {variant.meta.brand && (
            <Text color={colors.textMuted}>
              {' '}| Brand: <Text color={colors.gold}>{variant.meta.brand}</Text>
            </Text>
          )}
        </Box>
      )}

      {/* Show created/updated info if available */}
      {variant.meta && variant.meta.createdAt && (
        <Box marginLeft={5}>
          <Text color={colors.textDim} dimColor>
            Created: {new Date(variant.meta.createdAt).toLocaleDateString()}
            {variant.meta.updatedAt && ` | Updated: ${new Date(variant.meta.updatedAt).toLocaleDateString()}`}
          </Text>
        </Box>
      )}
    </Box>
  );
};
