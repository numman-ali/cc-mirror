/**
 * Status Line Quick Install Screen
 *
 * Shows current ccstatusline config preview and allows batch installation.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Box, Text } from 'ink';
import { ScreenLayout } from '../components/ui/ScreenLayout.js';
import { colors, icons, keyHints } from '../components/ui/theme.js';
import { MultiVariantSelector } from './MultiVariantSelector.js';
import type { VariantEntry } from '../../core/types.js';
import type { Settings } from 'ccstatusline';
import { loadSettings } from 'ccstatusline';
import { installStatusLineToVariants } from 'ccstatusline';

export interface StatusLineQuickInstallProps {
  variants: VariantEntry[];
  onBack: () => void;
}

type InstallState = 'selection' | 'installing' | 'complete';

interface InstallResult {
  success: string[];
  failed: Array<{path: string; error: string}>;
}

export const StatusLineQuickInstall: React.FC<StatusLineQuickInstallProps> = ({
  variants,
  onBack,
}) => {
  const [selectedVariants, setSelectedVariants] = useState<string[]>([]);
  const [installState, setInstallState] = useState<InstallState>('selection');
  const [installResult, setInstallResult] = useState<InstallResult | null>(null);
  const [config, setConfig] = useState<Settings | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);

  // Load ccstatusline config on mount
  useEffect(() => {
    loadSettings()
      .then((settings) => {
        setConfig(settings);
      })
      .catch((error) => {
        setConfigError(error instanceof Error ? error.message : String(error));
      });
  }, []);

  // Generate config preview text
  const configPreview = useMemo(() => {
    if (configError) {
      return `Error loading config: ${configError}`;
    }
    if (!config) {
      return 'Loading ccstatusline configuration...';
    }

    const lines: string[] = [];
    lines.push(`Lines configured: ${config.lines.length}`);
    lines.push(`Flex mode: ${config.flexMode}`);
    lines.push(`Compact threshold: ${config.compactThreshold}%`);
    lines.push(`Color level: ${config.colorLevel}`);
    lines.push(`Powerline: ${config.powerline.enabled ? 'enabled' : 'disabled'}`);
    if (config.powerline.enabled) {
      lines.push(`  Separators: ${config.powerline.separators.join(', ')}`);
      lines.push(`  Auto-align: ${config.powerline.autoAlign ? 'on' : 'off'}`);
    }

    // Count total widgets
    const totalWidgets = config.lines.reduce((sum: number, line: unknown[]) => sum + line.length, 0);
    lines.push(`Total widgets: ${totalWidgets}`);

    return lines.join('\n');
  }, [config, configError]);

  const handleSubmit = async () => {
    if (selectedVariants.length === 0) return;

    setInstallState('installing');

    // Get config dirs for selected variants
    const variantConfigDirs = selectedVariants
      .map((name) => variants.find((v) => v.name === name)?.meta?.configDir)
      .filter((dir): dir is string => dir !== undefined);

    try {
      const result = await installStatusLineToVariants(variantConfigDirs, false);
      setInstallResult(result);
      setInstallState('complete');
    } catch (error) {
      setInstallResult({
        success: [],
        failed: variantConfigDirs.map((dir) => ({
          path: dir,
          error: error instanceof Error ? error.message : String(error),
        })),
      });
      setInstallState('complete');
    }
  };

  // Selection state
  if (installState === 'selection') {
    return (
      <ScreenLayout
        title="Quick Install Status Line"
        subtitle="Apply existing ccstatusline config to multiple variants"
        hints={[keyHints.navigate, 'Space Toggle', 'Enter Confirm', keyHints.back]}
      >
        <Box flexDirection="column" marginY={1}>
          {/* Config Preview Section */}
          <Box flexDirection="column" marginBottom={1}>
            <Text color={colors.gold} bold>
              {icons.star} Current Configuration
            </Text>
            <Box marginLeft={2} marginTop={1}>
              <Text color={colors.textDim}>{configPreview}</Text>
            </Box>
          </Box>

          {/* Variant Selector */}
          <MultiVariantSelector
            variants={variants}
            selectedVariants={selectedVariants}
            onSelectionChange={setSelectedVariants}
            onSubmit={handleSubmit}
            onBack={onBack}
            allowMultiple={true}
          />
        </Box>
      </ScreenLayout>
    );
  }

  // Installing state
  if (installState === 'installing') {
    return (
      <ScreenLayout
        title="Installing Status Line"
        subtitle="Applying configuration to selected variants"
        hints={[]}
      >
        <Box flexDirection="column" marginY={1} alignItems="center">
          <Text color={colors.info}>Installing to {selectedVariants.length} variant(s)...</Text>
          <Box marginTop={1}>
            <Text color={colors.textMuted}>Please wait</Text>
          </Box>
        </Box>
      </ScreenLayout>
    );
  }

  // Complete state - show results
  const successCount = installResult?.success.length ?? 0;
  const failedCount = installResult?.failed.length ?? 0;

  return (
    <ScreenLayout
      title={failedCount === 0 ? `${icons.check} Installation Complete` : `${icons.warning} Installation Partial`}
      subtitle={`${successCount} succeeded, ${failedCount} failed`}
      hints={['Esc Back']}
      icon={null}
    >
      <Box flexDirection="column" marginY={1}>
        {/* Success list */}
        {installResult && installResult.success.length > 0 && (
          <Box flexDirection="column" marginBottom={1}>
            <Text color={colors.success} bold>
              {icons.check} Successfully installed ({installResult.success.length})
            </Text>
            {installResult.success.map((path, idx) => (
              <Box key={idx} marginLeft={2}>
                <Text color={colors.textMuted}>{icons.bullet} </Text>
                <Text color={colors.textDim}>{path}</Text>
              </Box>
            ))}
          </Box>
        )}

        {/* Failed list */}
        {installResult && installResult.failed.length > 0 && (
          <Box flexDirection="column" marginBottom={1}>
            <Text color={colors.error} bold>
              {icons.cross} Failed ({installResult.failed.length})
            </Text>
            {installResult.failed.map((failure, idx) => (
              <Box key={idx} marginLeft={2} flexDirection="column">
                <Box>
                  <Text color={colors.textMuted}>{icons.bullet} </Text>
                  <Text color={colors.textDim}>{failure.path}</Text>
                </Box>
                <Box marginLeft={4}>
                  <Text color={colors.error}>Error: {failure.error}</Text>
                </Box>
              </Box>
            ))}
          </Box>
        )}

        {/* Summary message */}
        <Box marginTop={1}>
          <Text color={colors.textMuted}>
            {failedCount === 0
              ? 'Status line has been installed to all selected variants.'
              : 'Some installations failed. Check the errors above and try again.'}
          </Text>
        </Box>

        {/* Back button */}
        <Box marginTop={2}>
          <Text color={colors.textDim}>Press Esc to return</Text>
        </Box>
      </Box>
    </ScreenLayout>
  );
};
