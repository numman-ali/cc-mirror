/**
 * Home Screen - Main menu for CLAUDE-SNEAKPEEK
 *
 * Features:
 * - Time-based greeting
 * - About menu option
 * - Konami code easter egg
 */

import React, { useState, useRef } from 'react';
import { Box, Text, useInput } from 'ink';
import { Frame, Divider, HintBar } from '../components/ui/Layout.js';
import { SelectMenu } from '../components/ui/Menu.js';
import { LogoBanner, GoldDivider } from '../components/ui/Logo.js';
import { colors, icons } from '../components/ui/theme.js';
import { RainbowText } from '../components/ui/AsciiArt.js';
import { getTimeBasedGreeting } from '../content/messages.js';
import { KONAMI_CODE } from '../content/easter-eggs.js';
import type { MenuItem } from '../components/ui/types.js';

interface HomeScreenProps {
  onSelect: (value: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onSelect }) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [konamiProgress, setKonamiProgress] = useState(0);
  const [showEasterEgg, setShowEasterEgg] = useState(false);

  // Track greeting so it doesn't change on re-render
  const greetingRef = useRef(getTimeBasedGreeting());

  // Konami code detection
  useInput((input, key) => {
    if (showEasterEgg) return; // Already triggered

    let keyName: string | null = null;
    if (key.upArrow) keyName = 'up';
    else if (key.downArrow) keyName = 'down';
    else if (key.leftArrow) keyName = 'left';
    else if (key.rightArrow) keyName = 'right';
    else if (input === 'b') keyName = 'b';
    else if (input === 'a') keyName = 'a';

    if (keyName) {
      if (KONAMI_CODE[konamiProgress] === keyName) {
        const newProgress = konamiProgress + 1;
        if (newProgress === KONAMI_CODE.length) {
          setShowEasterEgg(true);
          // Auto-hide after 3 seconds
          setTimeout(() => setShowEasterEgg(false), 3000);
        } else {
          setKonamiProgress(newProgress);
        }
      } else if (KONAMI_CODE[0] === keyName) {
        setKonamiProgress(1);
      } else {
        setKonamiProgress(0);
      }
    }
  });

  const items: MenuItem[] = [
    { value: 'quick', label: 'Quick Setup', description: 'Provider + API key → Ready in 30s', icon: 'star' },
    { value: 'create', label: 'New Variant', description: 'Full configuration wizard' },
    { value: 'manage', label: 'Manage Variants', description: 'Update, remove, or inspect' },
    { value: 'updateAll', label: 'Update All', description: 'Sync all variants to latest' },
    { value: 'doctor', label: 'Diagnostics', description: 'Health check all variants' },
    { value: 'about', label: 'About', description: 'Learn how CLAUDE-SNEAKPEEK works' },
    { value: 'feedback', label: 'Feedback', description: 'Links, issues, and contributions' },
    { value: 'exit', label: 'Until next time', icon: 'exit' },
  ];

  return (
    <Frame borderColor={colors.borderFocus}>
      {/* ASCII Art Banner - Rainbow if easter egg active */}
      {showEasterEgg ? (
        <Box flexDirection="column" alignItems="center" marginBottom={1}>
          <RainbowText>{'CLAUDE-SNEAKPEEK'}</RainbowText>
          <Text color={colors.gold}>{'You found the secret! 🎮'}</Text>
        </Box>
      ) : (
        <LogoBanner />
      )}

      <Box marginY={1}>
        <GoldDivider width={66} />
      </Box>

      {/* Time-based greeting */}
      <Box marginBottom={1}>
        <Text color={colors.gold}>{icons.star} </Text>
        <Text color={colors.textMuted}>{greetingRef.current}</Text>
      </Box>

      <Box marginY={1}>
        <SelectMenu items={items} selectedIndex={selectedIndex} onIndexChange={setSelectedIndex} onSelect={onSelect} />
      </Box>

      <Divider />
      <HintBar />
    </Frame>
  );
};
