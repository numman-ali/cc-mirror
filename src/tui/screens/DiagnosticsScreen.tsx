/**
 * Diagnostics/Doctor Screen
 */

import React, { useState } from 'react';
import { Box, Text } from 'ink';
import { ScreenLayout } from '../components/ui/ScreenLayout.js';
import { HealthCheck } from '../components/ui/Progress.js';
import { EmptyVariantsArt } from '../components/ui/AsciiArt.js';
import { colors, keyHints } from '../components/ui/theme.js';
import { SelectMenu } from '../components/ui/Menu.js';
import type { MenuItem } from '../components/ui/types.js';

interface HealthCheckItem {
  name: string;
  ok: boolean;
  details?: {
    binary: boolean;
    wrapper: boolean;
    config: boolean;
  };
}

interface DiagnosticsScreenProps {
  report: HealthCheckItem[];
  onDone: () => void;
}

export const DiagnosticsScreen: React.FC<DiagnosticsScreenProps> = ({
  report,
  onDone,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Build menu items
  const menuItems: MenuItem[] = [
    { value: 'done', label: 'Back to Home', icon: 'back' },
  ];

  // Handle menu selection
  const handleMenuSelect = (value: string) => {
    if (value === 'done') {
      onDone();
    }
  };

  const healthyCount = report.filter((r) => r.ok).length;
  const issueCount = report.length - healthyCount;

  // Border color based on health status
  const borderColor = issueCount > 0 ? colors.warning : colors.success;

  return (
    <ScreenLayout
      title="Diagnostics"
      subtitle="Health check results"
      borderColor={borderColor}
      hints={[keyHints.select + ' Navigate', 'Enter Select', keyHints.back]}
    >
      <Box flexDirection="column" marginY={1}>
        {report.length === 0 ? (
          <EmptyVariantsArt />
        ) : (
          report.map((item) => <HealthCheck key={item.name} name={item.name} ok={item.ok} details={item.details} />)
        )}
      </Box>

      <Box marginTop={1}>
        <Text color={colors.textMuted}>Total: {report.length}</Text>
        <Text color={colors.textMuted}> | </Text>
        <Text color={colors.success}>Healthy: {healthyCount}</Text>
        <Text color={colors.textMuted}> | </Text>
        <Text color={issueCount > 0 ? colors.warning : colors.textMuted}>Issues: {issueCount}</Text>
      </Box>

      <Box marginTop={2} flexDirection="column">
        <Text color={colors.textMuted} bold={true}>Actions</Text>
        <Box marginTop={1}>
          <SelectMenu
            items={menuItems}
            selectedIndex={selectedIndex}
            onIndexChange={setSelectedIndex}
            onSelect={handleMenuSelect}
          />
        </Box>
      </Box>
    </ScreenLayout>
  );
};
