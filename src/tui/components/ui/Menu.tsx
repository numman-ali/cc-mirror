/**
 * Menu components for CC-MIRROR TUI
 */

import React from 'react';
import { Box, Text, useInput } from 'ink';
import { colors, icons } from './theme.js';
import { DEFAULT_BIN_DIR } from '../../../core/constants.js';
import { getWrapperPath } from '../../../core/paths.js';
import type { MenuItem } from './types.js';

interface MenuItemDisplayProps {
  item: MenuItem;
  selected: boolean;
}

/**
 * Single menu item display
 */
const MenuItemDisplay: React.FC<MenuItemDisplayProps> = ({ item, selected }) => {
  const pointer = selected ? icons.pointer : icons.pointerEmpty;

  // Icon suffix based on type - gold for special items
  let iconSuffix = '';
  let iconColor: string = colors.gold;
  if (item.icon === 'star') iconSuffix = ` ${icons.star}`;
  else if (item.icon === 'exit') {
    iconSuffix = ` ${icons.cross}`;
    iconColor = colors.error;
  } else if (item.icon === 'back') iconSuffix = ` ${icons.arrowLeft}`;
  else if (item.icon === 'check') iconSuffix = ` ${icons.check}`;
  else if (item.icon === 'warning') {
    iconSuffix = ` ${icons.warning}`;
    iconColor = colors.warning;
  }

  return (
    <Box>
      <Text color={selected ? colors.gold : colors.textMuted}>{pointer} </Text>
      <Text color={selected ? colors.text : colors.textMuted} bold={selected} dimColor={item.disabled}>
        {item.label}
      </Text>
      {iconSuffix && <Text color={iconColor}>{iconSuffix}</Text>}
      {item.description && <Text color={colors.textMuted}> — {item.description}</Text>}
    </Box>
  );
};

interface SelectMenuProps {
  items: MenuItem[];
  selectedIndex: number;
  onIndexChange: (index: number) => void;
  onSelect: (value: string) => void;
}

/**
 * Selectable menu with keyboard navigation
 */
export const SelectMenu: React.FC<SelectMenuProps> = ({ items, selectedIndex, onIndexChange, onSelect }) => {
  useInput((input, key) => {
    if (key.upArrow) {
      const newIndex = selectedIndex > 0 ? selectedIndex - 1 : items.length - 1;
      onIndexChange(newIndex);
    }
    if (key.downArrow) {
      const newIndex = selectedIndex < items.length - 1 ? selectedIndex + 1 : 0;
      onIndexChange(newIndex);
    }
    if (key.return) {
      const item = items[selectedIndex];
      if (item && !item.disabled) {
        onSelect(item.value);
      }
    }
  });

  return (
    <Box flexDirection="column">
      {items.map((item, idx) => (
        <MenuItemDisplay key={item.value} item={item} selected={idx === selectedIndex} />
      ))}
    </Box>
  );
};

interface SimpleMenuProps {
  items: MenuItem[];
  onSelect: (value: string) => void;
}

/**
 * Simple menu that manages its own selection state
 */
export const SimpleMenu: React.FC<SimpleMenuProps> = ({ items, onSelect }) => {
  const [selectedIndex, setSelectedIndex] = React.useState(0);

  return (
    <SelectMenu items={items} selectedIndex={selectedIndex} onIndexChange={setSelectedIndex} onSelect={onSelect} />
  );
};

interface ProviderCardProps {
  provider: {
    key: string;
    label: string;
    description: string;
    baseUrl?: string;
    experimental?: boolean;
  };
  selected: boolean;
  disabled?: boolean;
  docsUrl?: string;
}

/**
 * Provider selection card
 */
export const ProviderCard: React.FC<ProviderCardProps> = ({ provider, selected, disabled = false, docsUrl }) => (
  <Box flexDirection="column" marginBottom={1}>
    <Box>
      <Text color={selected ? colors.gold : colors.textMuted}>{selected ? icons.pointer : icons.pointerEmpty} </Text>
      <Text
        color={disabled ? colors.textDim : selected ? colors.text : colors.textMuted}
        bold={selected}
        dimColor={disabled}
      >
        {provider.label}
      </Text>
      {disabled && <Text color={colors.warning}> [Coming Soon]</Text>}
    </Box>
    <Box marginLeft={3}>
      <Text color={disabled ? colors.textDim : colors.textMuted} dimColor={disabled}>
        {provider.description}
      </Text>
    </Box>
    {provider.baseUrl && !disabled && (
      <Box marginLeft={3}>
        <Text color={colors.primaryBright} dimColor>
          {provider.baseUrl}
        </Text>
      </Box>
    )}
    {!provider.baseUrl && docsUrl && !disabled && (
      <Box marginLeft={3}>
        <Text color={colors.primaryBright} dimColor>
          {docsUrl}
        </Text>
      </Box>
    )}
  </Box>
);

interface VariantCardProps {
  name: string;
  provider?: string;
  path?: string;
  selected: boolean;
}

/**
 * Variant list card
 */
export const VariantCard: React.FC<VariantCardProps> = ({ name, provider, path, selected }) => (
  <Box flexDirection="column" marginBottom={1}>
    <Box>
      <Text color={selected ? colors.gold : colors.textMuted}>{selected ? icons.pointer : icons.pointerEmpty} </Text>
      <Text color={selected ? colors.text : colors.textMuted} bold={selected}>
        {name}
      </Text>
      {provider && <Text color={colors.textMuted}> ({provider})</Text>}
    </Box>
    <Box marginLeft={3}>
      <Text color={colors.primaryBright} dimColor>
        {path || getWrapperPath(DEFAULT_BIN_DIR, name)}
      </Text>
    </Box>
  </Box>
);
