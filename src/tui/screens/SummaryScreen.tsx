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
  npmPackage: string;
  npmVersion: string;
  usePromptPack: boolean;
  promptPackMode: 'minimal' | 'maximal';
  installSkill: boolean;
  enableTeamMode: boolean;
  teamModeSupported: boolean;
  shellEnv: boolean;
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
            <SummaryRow label="Model (Sonnet)" value={data.modelSonnet || '(unset)'} />
            <SummaryRow label="Model (Opus)" value={data.modelOpus || '(unset)'} />
            <SummaryRow label="Model (Haiku)" value={data.modelHaiku || '(unset)'} />
          </>
        )}
      </Section>

      <Section title="Installation">
        <SummaryRow label="Package" value={data.npmPackage} />
        <SummaryRow label="Version" value={data.npmVersion} />
        <SummaryRow
          label="Prompt pack"
          value={
            data.usePromptPack
              ? data.providerKey === 'zai'
                ? 'on (zai-cli routing)'
                : data.providerKey === 'minimax'
                  ? 'on (MCP routing)'
                  : 'on'
              : 'off'
          }
        />
        <SummaryRow label="dev-browser skill" value={data.installSkill ? 'on' : 'off'} />
        {data.teamModeSupported && (
          <SummaryRow
            label="Team mode"
            value={data.enableTeamMode ? 'on (orchestrator skill, TodoWrite blocked)' : 'off'}
          />
        )}
        {data.providerKey === 'zai' && (
          <SummaryRow label="Shell env" value={data.shellEnv ? 'write Z_AI_API_KEY' : 'manual'} />
        )}
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
