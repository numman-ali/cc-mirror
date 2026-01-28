/**
 * About Screen
 *
 * Educational screen explaining what CLAUDE-SNEAKPEEK does and how it works.
 * Features toggling between poem view and guide view.
 */

import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { ScreenLayout } from '../components/ui/ScreenLayout.js';
import { PoemDisplay, FancyHeader } from '../components/ui/AsciiArt.js';
import { colors, icons, keyHints } from '../components/ui/theme.js';
import { MIRROR_POEM } from '../content/poems.js';
import { EDUCATION } from '../content/education.js';

interface AboutScreenProps {
  onBack: () => void;
}

export const AboutScreen: React.FC<AboutScreenProps> = ({ onBack }) => {
  const [view, setView] = useState<'guide' | 'poem'>('guide');

  useInput((input, key) => {
    if (key.escape || key.return) {
      onBack();
    }
    // Toggle between poem and guide with ? or Tab
    if (input === '?' || key.tab) {
      setView((v) => (v === 'poem' ? 'guide' : 'poem'));
    }
  });

  const toggleHint = view === 'poem' ? '? Show guide' : '? Show poem';

  return (
    <ScreenLayout
      title="About CLAUDE-SNEAKPEEK"
      subtitle={view === 'poem' ? 'A poem for the mirror' : 'How it works'}
      hints={[keyHints.back, toggleHint]}
    >
      {view === 'poem' ? (
        // Poem view
        <PoemDisplay lines={MIRROR_POEM.lines} />
      ) : (
        // Guide view - educational content
        <>
          {/* What is CLAUDE-SNEAKPEEK */}
          <Box flexDirection="column" marginY={1}>
            <FancyHeader title={EDUCATION.whatIsCcMirror.title} />
            <Box marginLeft={2} flexDirection="column">
              {EDUCATION.whatIsCcMirror.detailed.map((line, i) => (
                <Text key={i} color={line === '' ? colors.textDim : colors.textMuted}>
                  {line}
                </Text>
              ))}
            </Box>
          </Box>

          {/* Why Variants */}
          <Box flexDirection="column" marginY={1}>
            <FancyHeader title={EDUCATION.whyVariants.title} />
            <Box marginLeft={2} flexDirection="column">
              {EDUCATION.whyVariants.points.map((point, i) => (
                <Text key={i} color={colors.textMuted}>
                  {icons.bullet} {point}
                </Text>
              ))}
            </Box>
          </Box>

          {/* What Happens */}
          <Box flexDirection="column" marginY={1}>
            <FancyHeader title={EDUCATION.whatHappens.title} />
            <Box marginLeft={2} flexDirection="column">
              {EDUCATION.whatHappens.steps.map((step, i) => (
                <Box key={i} marginBottom={0}>
                  <Text color={colors.gold}>{step.step}. </Text>
                  <Text color={colors.text} bold>
                    {step.title}
                  </Text>
                  <Text color={colors.textMuted}> — {step.detail}</Text>
                </Box>
              ))}
            </Box>
          </Box>

          {/* How Isolation Works */}
          <Box flexDirection="column" marginY={1}>
            <FancyHeader title={EDUCATION.isolation.title} />
            <Box marginLeft={2} flexDirection="column">
              {EDUCATION.isolation.details.map((line, i) => (
                <Text key={i} color={line === '' ? colors.textDim : colors.textMuted}>
                  {line}
                </Text>
              ))}
            </Box>
          </Box>
        </>
      )}
    </ScreenLayout>
  );
};
