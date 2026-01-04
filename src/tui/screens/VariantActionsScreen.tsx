/**
 * Variant Actions Screen
 */

import React, { useState } from 'react';
import { Box } from 'ink';
import { ScreenLayout } from '../components/ui/ScreenLayout.js';
import { Section } from '../components/ui/Layout.js';
import { SummaryRow } from '../components/ui/Typography.js';
import { SelectMenu } from '../components/ui/Menu.js';
import type { MenuItem } from '../components/ui/types.js';

interface VariantMeta {
  name: string;
  provider?: string;
  binaryPath: string;
  configDir: string;
  wrapperPath: string;
}

interface VariantActionsScreenProps {
  meta: VariantMeta;
  onUpdate: () => void;
  onTweak: () => void;
  onRemove: () => void;
  onConfigureModels?: () => void;
  onBack: () => void;
}

// Providers that require model mapping
const MODEL_MAPPING_PROVIDERS = ['openrouter', 'ccrouter', 'gatewayz'];

export const VariantActionsScreen: React.FC<VariantActionsScreenProps> = ({
  meta,
  onUpdate,
  onTweak,
  onRemove,
  onConfigureModels,
  onBack,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const requiresModelMapping = meta.provider && MODEL_MAPPING_PROVIDERS.includes(meta.provider);

  const actions: MenuItem[] = [
    { value: 'update', label: 'Update', description: 'Re-sync binary + patches' },
    ...(requiresModelMapping && onConfigureModels
      ? [{ value: 'models', label: 'Configure Models', description: 'Edit Opus/Sonnet/Haiku mapping' }]
      : []),
    { value: 'tweak', label: 'Customize', description: 'Open tweakcc' },
    { value: 'remove', label: 'Remove', description: 'Delete variant', icon: 'exit' as const },
    { value: 'back', label: 'Back', icon: 'back' as const },
  ];

  const handleSelect = (value: string) => {
    if (value === 'update') onUpdate();
    if (value === 'models' && onConfigureModels) onConfigureModels();
    if (value === 'tweak') onTweak();
    if (value === 'remove') onRemove();
    if (value === 'back') onBack();
  };

  const subtitle = meta.provider ? `Provider: ${meta.provider}` : undefined;

  return (
    <ScreenLayout title={meta.name} subtitle={subtitle} icon={null}>
      <Section title="Details">
        <SummaryRow label="Install" value="NPM (cli.js)" />
        <SummaryRow label="Binary" value={meta.binaryPath} />
        <SummaryRow label="Config" value={meta.configDir} />
        <SummaryRow label="Wrapper" value={meta.wrapperPath} />
      </Section>

      <Box marginY={1}>
        <SelectMenu
          items={actions}
          selectedIndex={selectedIndex}
          onIndexChange={setSelectedIndex}
          onSelect={handleSelect}
        />
      </Box>
    </ScreenLayout>
  );
};
