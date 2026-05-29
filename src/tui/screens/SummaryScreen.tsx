/**
 * Summary/Review Screen
 */

import React, { useState } from 'react';
import { getWrapperPath } from '../../core/paths.js';
import { Box } from 'ink';
import { ScreenLayout } from '../components/ui/ScreenLayout.js';
import { Section } from '../components/ui/Layout.js';
import { SummaryRow } from '../components/ui/Typography.js';
import { SelectMenu } from '../components/ui/Menu.js';
import type { MenuItem } from '../components/ui/types.js';

interface SummaryData {
  name: string;
  providerLabel: string;
  providerKey?: string;
  brandLabel: string;
  baseUrl: string;
  apiKey: string;
  apiKeySource?: string;
  modelSonnet?: string;
  modelOpus?: string;
  modelHaiku?: string;
  rootDir: string;
  binDir: string;
  claudeVersion: string;
  usePromptPack: boolean;
  promptPackLabel?: string;
  installSkill: boolean;
  shellEnv: boolean;
  shellEnvLabel?: string;
  capabilities?: Array<{ label: string; value: string }>;
}

interface SummaryScreenProps {
  data: SummaryData;
  onConfirm: () => void;
  onBack: () => void;
  onCancel: () => void;
}

export const SummaryScreen: React.FC<SummaryScreenProps> = ({ data, onConfirm, onBack, onCancel }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const actions: MenuItem[] = [
    { value: 'confirm', label: 'Create Variant', icon: 'star' },
    { value: 'back', label: 'Back', description: 'Modify settings' },
    { value: 'cancel', label: 'Cancel', icon: 'exit' },
  ];

  const handleSelect = (value: string) => {
    if (value === 'confirm') onConfirm();
    if (value === 'back') onBack();
    if (value === 'cancel') onCancel();
  };

  return (
    <ScreenLayout title="Review Configuration" subtitle="Confirm settings before creating variant">
      <Section title="Identity">
        <SummaryRow label="Name" value={data.name} />
        <SummaryRow label="Command" value={`$ ${data.name}`} />
        <SummaryRow label="Provider" value={data.providerLabel} />
      </Section>

      <Section title="Connection">
        <SummaryRow label="Base URL" value={data.baseUrl || '(default)'} />
        <SummaryRow label="API Key" value={data.apiKey ? '••••••••' : '(not set)'} />
        {data.apiKeySource && <SummaryRow label="API key source" value={data.apiKeySource} />}
        {(data.modelSonnet || data.modelOpus || data.modelHaiku) && (
          <>
            <SummaryRow label="Model (Balanced)" value={data.modelSonnet || '(unset)'} />
            <SummaryRow label="Model (Primary)" value={data.modelOpus || '(unset)'} />
            <SummaryRow label="Model (Fast)" value={data.modelHaiku || '(unset)'} />
          </>
        )}
      </Section>

      {data.capabilities && data.capabilities.length > 0 && (
        <Section title="Capabilities">
          {data.capabilities.map((item) => (
            <SummaryRow key={item.label} label={item.label} value={item.value} />
          ))}
        </Section>
      )}

      <Section title="Installation">
        <SummaryRow label="Install type" value="Native (portable)" />
        <SummaryRow label="Runtime" value={data.claudeVersion} />
        <SummaryRow label="Prompt pack" value={data.promptPackLabel || (data.usePromptPack ? 'on' : 'off')} />
        <SummaryRow label="dev-browser skill" value={data.installSkill ? 'on' : 'off'} />
        {data.shellEnvLabel && <SummaryRow label="Shell env" value={data.shellEnvLabel} />}
      </Section>

      <Section title="Paths">
        <SummaryRow label="Root" value={data.rootDir} />
        <SummaryRow label="Wrapper" value={getWrapperPath(data.binDir, data.name)} />
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
