/**
 * Model Configuration Screen
 *
 * Single screen for configuring all 3 model mappings (Opus, Sonnet, Haiku).
 * Consolidates 9 separate screens into 3 (one per flow).
 */

import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { ScreenLayout } from '../components/ui/ScreenLayout.js';
import { colors, keyHints } from '../components/ui/theme.js';

interface ModelConfigScreenProps {
  /** Screen title */
  title?: string;
  /** Screen subtitle */
  subtitle?: string;
  /** Provider key for smart placeholders */
  providerKey?: string;
  /** Current Opus model value */
  opusValue: string;
  /** Current Sonnet model value */
  sonnetValue: string;
  /** Current Haiku model value */
  haikuValue: string;
  /** Callback when Opus changes */
  onOpusChange: (value: string) => void;
  /** Callback when Sonnet changes */
  onSonnetChange: (value: string) => void;
  /** Callback when Haiku changes */
  onHaikuChange: (value: string) => void;
  /** Callback when all models are configured and user submits */
  onComplete: () => void;
  /** Callback when user presses Escape */
  onBack?: () => void;
}

/** Model field definitions with descriptions */
const MODEL_FIELDS = [
  {
    key: 'opus',
    label: 'Opus (most capable)',
    description: 'Used for complex reasoning tasks',
  },
  {
    key: 'sonnet',
    label: 'Sonnet (balanced)',
    description: 'Default model for most tasks',
  },
  {
    key: 'haiku',
    label: 'Haiku (fastest)',
    description: 'Used for quick tasks and subagents',
  },
] as const;

/** Get provider-specific placeholder for a model */
function getPlaceholder(providerKey: string | undefined, model: 'opus' | 'sonnet' | 'haiku'): string {
  const placeholders: Record<string, Record<string, string>> = {
    openrouter: {
      opus: 'anthropic/claude-3-opus',
      sonnet: 'anthropic/claude-3.5-sonnet',
      haiku: 'anthropic/claude-3-haiku',
    },
    ccrouter: {
      opus: 'deepseek,deepseek-reasoner',
      sonnet: 'deepseek,deepseek-chat',
      haiku: 'ollama,qwen2.5-coder:latest',
    },
  };

  const providerPlaceholders = placeholders[providerKey || ''] || placeholders.ccrouter;
  return providerPlaceholders[model] || 'model-name';
}

export const ModelConfigScreen: React.FC<ModelConfigScreenProps> = ({
  title = 'Model Configuration',
  subtitle = 'Map Claude Code model aliases to your provider models',
  providerKey,
  opusValue,
  sonnetValue,
  haikuValue,
  onOpusChange,
  onSonnetChange,
  onHaikuChange,
  onComplete,
  onBack,
}) => {
  const [activeField, setActiveField] = useState<0 | 1 | 2>(0);
  const [inputBuffer, setInputBuffer] = useState('');

  // Get current values array for easier access
  const values = [opusValue, sonnetValue, haikuValue];
  const setters = [onOpusChange, onSonnetChange, onHaikuChange];

  // Initialize input buffer when field changes
  React.useEffect(() => {
    setInputBuffer(values[activeField] || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeField, opusValue, sonnetValue, haikuValue]);

  useInput((input, key) => {
    // Handle tab to move between fields
    if (key.tab) {
      // Save current input
      setters[activeField](inputBuffer);
      // Move to next field (wrap around)
      setActiveField((prev) => ((prev + 1) % 3) as 0 | 1 | 2);
      return;
    }

    // Handle shift+tab to move backwards
    if (key.shift && key.tab) {
      setters[activeField](inputBuffer);
      setActiveField((prev) => ((prev - 1 + 3) % 3) as 0 | 1 | 2);
      return;
    }

    // Handle up/down arrows
    if (key.upArrow) {
      setters[activeField](inputBuffer);
      setActiveField((prev) => ((prev - 1 + 3) % 3) as 0 | 1 | 2);
      return;
    }
    if (key.downArrow) {
      setters[activeField](inputBuffer);
      setActiveField((prev) => ((prev + 1) % 3) as 0 | 1 | 2);
      return;
    }

    // Handle enter to submit all
    if (key.return) {
      // Save current field
      setters[activeField](inputBuffer);
      // Check all fields are filled
      const finalValues = [...values];
      finalValues[activeField] = inputBuffer;
      if (finalValues.every((v) => v.trim())) {
        onComplete();
      }
      return;
    }

    // Handle escape
    if (key.escape) {
      onBack?.();
      return;
    }

    // Handle backspace
    if (key.backspace || key.delete) {
      setInputBuffer((prev) => prev.slice(0, -1));
      return;
    }

    // Handle regular character input
    if (input && !key.ctrl && !key.meta) {
      setInputBuffer((prev) => prev + input);
    }
  });

  const allFilled = values.every((v) => v.trim());

  return (
    <ScreenLayout
      title={title}
      subtitle={subtitle}
      hints={[keyHints.navigate, 'Tab Next field', 'Enter Submit', keyHints.back]}
    >
      <Box flexDirection="column" marginBottom={1}>
        <Text color={colors.textMuted}>
          Claude Code uses model aliases. Map these to your provider's actual model names.
        </Text>
      </Box>

      {/* OpenRouter-specific help */}
      {providerKey === 'openrouter' && (
        <Box flexDirection="column" marginBottom={1}>
          <Text color={colors.textMuted}>Browse OpenRouter models:</Text>
          <Box marginLeft={2} flexDirection="column">
            <Text color={colors.primaryBright}>Free: https://openrouter.ai/models?max_price=0&order=top-weekly</Text>
            <Text color={colors.primaryBright}>Paid: https://openrouter.ai/models?order=top-weekly</Text>
          </Box>
          <Box marginTop={1}>
            <Text color={colors.warning}>
              {
                '⚠ Not all models work with Claude Code. If issues occur, use "claude-sneakpeek update" to switch models.'
              }
            </Text>
          </Box>
        </Box>
      )}

      <Box flexDirection="column" marginY={1}>
        {MODEL_FIELDS.map((field, idx) => {
          const isActive = idx === activeField;
          const value = idx === activeField ? inputBuffer : values[idx];
          const placeholder = getPlaceholder(providerKey, field.key);

          return (
            <Box key={field.key} flexDirection="column" marginBottom={1}>
              <Box>
                <Text color={isActive ? colors.gold : colors.textMuted} bold={isActive}>
                  {isActive ? '▶ ' : '  '}
                  {field.label}
                </Text>
              </Box>
              <Box marginLeft={2}>
                <Text color={colors.textDim}>{field.description}</Text>
              </Box>
              <Box marginLeft={2} marginTop={0}>
                <Text color={colors.border}>[</Text>
                <Text color={isActive ? colors.text : colors.textMuted}>{value || (isActive ? '' : placeholder)}</Text>
                {isActive && <Text color={colors.primary}>│</Text>}
                <Text color={colors.border}>]</Text>
                {!value && !isActive && <Text color={colors.textDim}> (placeholder)</Text>}
              </Box>
            </Box>
          );
        })}
      </Box>

      <Box marginTop={1}>
        {allFilled ? (
          <Text color={colors.success}>All models configured. Press Enter to continue.</Text>
        ) : (
          <Text color={colors.textMuted}>Fill all fields, then press Enter to continue.</Text>
        )}
      </Box>
    </ScreenLayout>
  );
};
