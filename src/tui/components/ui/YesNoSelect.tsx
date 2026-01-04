/**
 * Yes/No Selection Component
 *
 * Modern styled yes/no prompt using the UI component library.
 */

import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { colors, icons } from './theme.js';

interface YesNoSelectProps {
  /** Title/question to display */
  title: string;
  /** Callback when user makes a selection */
  onSelect: (value: boolean) => void;
  /** Label for the yes option */
  yesLabel?: string;
  /** Label for the no option */
  noLabel?: string;
  /** Default to "No" instead of "Yes" */
  defaultNo?: boolean;
}

/**
 * Yes/No selection with keyboard navigation
 */
export const YesNoSelect: React.FC<YesNoSelectProps> = ({
  title,
  onSelect,
  yesLabel = 'Yes',
  noLabel = 'No',
  defaultNo = false,
}) => {
  const [selectedIndex, setSelectedIndex] = useState(defaultNo ? 1 : 0);

  useInput((input, key) => {
    if (key.upArrow || key.downArrow) {
      setSelectedIndex((prev) => (prev === 0 ? 1 : 0));
    }
    if (key.return) {
      onSelect(selectedIndex === 0);
    }
  });

  const items = [
    { label: yesLabel, value: true },
    { label: noLabel, value: false },
  ];

  return (
    <Box flexDirection="column" marginY={1}>
      <Text color={colors.textMuted} bold>
        {title}
      </Text>
      <Box flexDirection="column" marginTop={1}>
        {items.map((item, idx) => {
          const selected = idx === selectedIndex;
          return (
            <Box key={item.label}>
              <Text color={selected ? colors.gold : colors.textMuted}>
                {selected ? icons.pointer : icons.pointerEmpty}{' '}
              </Text>
              <Text color={selected ? colors.text : colors.textMuted} bold={selected}>
                {item.label}
              </Text>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};
