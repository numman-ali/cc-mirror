/**
 * Status Line Configuration Screen
 *
 * Bridge component that wraps ccstatusline's App with variant context.
 * Handles both single-variant and multi-variant configuration flows.
 */

import React, { useState } from 'react';
import { Box, Text } from 'ink';
import { App as CcstatuslineApp } from 'ccstatusline';
import type { VariantContext } from 'ccstatusline';
import {
  getConfigDirForVariant,
  loadClaudeSettingsForVariant,
  saveClaudeSettingsForVariant,
} from 'ccstatusline';
import type { VariantEntry } from '../../core/types.js';

export interface StatusLineConfigScreenProps {
  /** All available variants */
  variants: VariantEntry[];
  /** Selected variant names for configuration */
  selectedVariants: string[];
  /** Callback when user exits the configuration */
  onBack: () => void;
}

export const StatusLineConfigScreen: React.FC<StatusLineConfigScreenProps> = ({
  variants,
  selectedVariants,
  onBack,
}) => {
  const [isCompleting, setIsCompleting] = useState(false);
  const [completionStatus, setCompletionStatus] = useState<string | null>(null);

  // Find the first selected variant to create VariantContext
  const primaryVariant = variants.find((v) => selectedVariants.includes(v.name));

  if (!primaryVariant || !primaryVariant.meta) {
    return (
      <Box flexDirection="column">
        <Text color="red">Error: No valid variant selected</Text>
      </Box>
    );
  }

  // Create VariantContext for the primary variant
  const variantContext: VariantContext = {
    variantName: primaryVariant.name,
    variantConfigDir: primaryVariant.meta.configDir,
    variantProvider: primaryVariant.meta.provider,
  };

  // Handle completion - apply config to all selected variants if multiple
  const handleComplete = async () => {
    if (selectedVariants.length <= 1 || isCompleting) {
      onBack();
      return;
    }

    setIsCompleting(true);
    setCompletionStatus('Applying configuration to all selected variants...');

    try {
      // Apply to all additional selected variants
      const additionalVariants = selectedVariants
        .filter((name) => name !== primaryVariant.name)
        .map((name) => variants.find((v) => v.name === name))
        .filter((v): v is VariantEntry => v !== undefined && v.meta !== null);

      let completed = 0;
      const total = additionalVariants.length;

      for (const variant of additionalVariants) {
        setCompletionStatus(
          `Applying to ${variant.name} (${completed + 1}/${total})...`
        );

        // Load the variant's Claude settings
        const claudeSettings = await loadClaudeSettingsForVariant(
          getConfigDirForVariant(variant.meta!.configDir)
        );

        // Update or install status line
        claudeSettings.statusLine = {
          type: 'command',
          command: 'npx -y ccstatusline@latest',
          padding: 0,
        };

        await saveClaudeSettingsForVariant(
          getConfigDirForVariant(variant.meta!.configDir),
          claudeSettings
        );

        completed++;
      }

      setCompletionStatus(
        `Configuration applied to ${total} additional variant(s)!`
      );

      // Auto-return after a short delay
      setTimeout(() => {
        onBack();
      }, 1500);
    } catch (error) {
      setCompletionStatus(
        `Error: ${error instanceof Error ? error.message : String(error)}`
      );
      setTimeout(() => {
        onBack();
      }, 3000);
    }
  };

  // If we're showing completion status, display it instead of the TUI
  if (isCompleting && completionStatus) {
    return (
      <Box flexDirection="column" paddingX={2} paddingY={1}>
        <Text color="cyan">{completionStatus}</Text>
      </Box>
    );
  }

  // Intercept the onBack to handle multi-variant completion
  const wrappedOnBack = () => {
    handleComplete();
  };

  return (
    <Box flexDirection="column">
      {/* Show multi-variant banner if applicable */}
      {selectedVariants.length > 1 && (
        <Box marginBottom={1} paddingX={1} borderStyle="round" borderColor="cyan">
          <Text color="cyan" bold>
            Configuring {selectedVariants.length} variants
          </Text>
          <Text color="gray">
            {' '}
            - Settings will be applied to all selected variants
          </Text>
        </Box>
      )}

      {/* Wrap ccstatusline App with variant context */}
      <CcstatuslineApp
        variantContext={variantContext}
        onBack={wrappedOnBack}
      />
    </Box>
  );
};
