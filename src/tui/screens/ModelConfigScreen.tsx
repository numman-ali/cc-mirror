/**
 * Model Configuration Screen
 *
 * Single screen for configuring all 3 provider model slots.
 * Consolidates 9 separate screens into 3 (one per flow).
 */

import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { ScreenLayout } from '../components/ui/ScreenLayout.js';
import { colors, keyHints } from '../components/ui/theme.js';
import { getModelGuidanceKind, type ModelAliasMap, type ModelGuidanceKind } from '../providerCapabilities.js';

interface ModelConfigScreenProps {
  /** Screen title */
  title?: string;
  /** Screen subtitle */
  subtitle?: string;
  /** Provider key for smart placeholders */
  providerKey?: string;
  /** Provider model defaults for placeholders and explanatory text */
  modelDefaults?: ModelAliasMap;
  /** Provider model-help category */
  guidance?: ModelGuidanceKind;
  /** Current primary model value */
  opusValue: string;
  /** Current balanced model value */
  sonnetValue: string;
  /** Current fast model value */
  haikuValue: string;
  /** Callback when primary changes */
  onOpusChange: (value: string) => void;
  /** Callback when balanced changes */
  onSonnetChange: (value: string) => void;
  /** Callback when fast changes */
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
    slot: 'primary',
    label: 'Primary',
    description: 'Used for complex reasoning tasks',
  },
  {
    key: 'sonnet',
    slot: 'balanced',
    label: 'Balanced',
    description: 'Default model for most tasks',
  },
  {
    key: 'haiku',
    slot: 'fast',
    label: 'Fast',
    description: 'Used for quick tasks and subagents',
  },
] as const;

/** Get provider-specific placeholder for a model */
function getPlaceholder(
  providerKey: string | undefined,
  model: 'opus' | 'sonnet' | 'haiku',
  modelDefaults?: ModelAliasMap
): string {
  const defaultValue = modelDefaults?.[model]?.trim();
  if (defaultValue) return defaultValue;

  const placeholders: Record<string, Record<string, string>> = {
    zai: {
      opus: 'glm-5.1',
      sonnet: 'glm-5-turbo',
      haiku: 'glm-4.5-air',
    },
    minimax: {
      opus: 'MiniMax-M2.7',
      sonnet: 'MiniMax-M2.7',
      haiku: 'MiniMax-M2.7',
    },
    openrouter: {
      opus: 'provider/primary-coding-model',
      sonnet: 'provider/balanced-coding-model',
      haiku: 'provider/fast-coding-model',
    },
    gatewayz: {
      opus: 'provider/primary-coding-model',
      sonnet: 'provider/balanced-coding-model',
      haiku: 'provider/fast-coding-model',
    },
    vercel: {
      opus: 'provider/primary-coding-model',
      sonnet: 'provider/balanced-coding-model',
      haiku: 'provider/fast-coding-model',
    },
    nanogpt: {
      opus: 'openai/gpt-5.2',
      sonnet: 'openai/gpt-5.2',
      haiku: 'google/gemini-3-flash-preview',
    },
    ollama: {
      opus: 'qwen3.5',
      sonnet: 'qwen3.5',
      haiku: 'qwen3.5',
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
  subtitle = 'Map provider model slots',
  providerKey,
  modelDefaults,
  guidance,
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
  const guidanceKind = guidance ?? getModelGuidanceKind(providerKey);
  const defaultsLine = MODEL_FIELDS.map((field) => {
    const value = modelDefaults?.[field.key]?.trim();
    return value ? `${field.slot}=${value}` : '';
  })
    .filter(Boolean)
    .join(', ');

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
          Each variant uses three model slots. Map them to your provider's actual model names.
        </Text>
        <Text color={colors.textDim}>
          cc-mirror uses the provider's start slot by default and uses Fast for small tasks.
        </Text>
        {defaultsLine && <Text color={colors.textDim}>Provider defaults: {defaultsLine}.</Text>}
      </Box>

      {/* Model-mapping help */}
      {guidanceKind !== 'generic' && (
        <Box flexDirection="column" marginBottom={1}>
          {guidanceKind === 'openrouter' && (
            <>
              <Text color={colors.textMuted}>Browse OpenRouter models:</Text>
              <Box marginLeft={2} flexDirection="column">
                <Text color={colors.primaryBright}>
                  Free: https://openrouter.ai/models?max_price=0&order=top-weekly
                </Text>
                <Text color={colors.primaryBright}>Paid: https://openrouter.ai/models?order=top-weekly</Text>
              </Box>
              <Box marginTop={1}>
                <Text color={colors.warning}>
                  {
                    'Not all gateway models support every tool shape. If issues occur, use "cc-mirror update" to switch models.'
                  }
                </Text>
              </Box>
            </>
          )}
          {guidanceKind === 'nanogpt' && (
            <>
              <Text color={colors.textMuted}>Browse NanoGPT models:</Text>
              <Box marginLeft={2}>
                <Text color={colors.primaryBright}>https://nano-gpt.com/models/text</Text>
              </Box>
              <Text color={colors.textDim}>Use provider/model format (e.g. openai/gpt-5.2).</Text>
            </>
          )}
          {guidanceKind === 'ollama' && (
            <>
              <Text color={colors.textMuted}>Use model IDs from `ollama list` (local) or cloud model IDs.</Text>
              <Text color={colors.textDim}>Tip: `ollama cp source target` creates friendly aliases.</Text>
            </>
          )}
          {guidanceKind === 'gateway' && (
            <Text color={colors.textMuted}>
              Use your gateway model identifiers (some providers use provider/model format).
            </Text>
          )}
        </Box>
      )}

      <Box flexDirection="column" marginY={1}>
        {MODEL_FIELDS.map((field, idx) => {
          const isActive = idx === activeField;
          const value = idx === activeField ? inputBuffer : values[idx];
          const placeholder = getPlaceholder(providerKey, field.key, modelDefaults);

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
