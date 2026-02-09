/**
 * Input components for CC-MIRROR TUI
 */

import React, { useEffect, useRef, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { colors, icons } from './theme.js';

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  mask?: string;
  hint?: string;
}

type ReliableTextInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  mask?: string;
  focus?: boolean;
  showCursor?: boolean;
};

/**
 * A paste-safe text input for Ink.
 *
 * Why not ink-text-input?
 * Long pastes can arrive in multiple chunks. ink-text-input builds the next
 * value from a potentially stale `value` prop, which can drop earlier chunks
 * before React re-renders. We keep a ref of the latest value and cursor so
 * every chunk is appended correctly.
 */
const ReliableTextInput: React.FC<ReliableTextInputProps> = ({
  value,
  onChange,
  onSubmit,
  placeholder = '',
  mask,
  focus = true,
  showCursor = true,
}) => {
  const valueRef = useRef(value);
  valueRef.current = value;

  const cursorOffsetRef = useRef<number>((value || '').length);
  const [cursorOffset, setCursorOffsetState] = useState<number>(cursorOffsetRef.current);

  const setCursorOffset = (next: number) => {
    cursorOffsetRef.current = next;
    setCursorOffsetState(next);
  };

  // Clamp cursor if the parent changes the value externally (e.g., prefill).
  useEffect(() => {
    const v = valueRef.current || '';
    if (cursorOffsetRef.current > v.length) {
      setCursorOffset(v.length);
    }
  }, [value]);

  useInput(
    (input, key) => {
      if (key.upArrow || key.downArrow || key.tab || (key.shift && key.tab) || (key.ctrl && input === 'c')) {
        return;
      }

      // Let app-level ESC navigation run; don't insert escape characters.
      if (key.escape) return;

      if (key.return) {
        onSubmit();
        return;
      }

      const currentValue = valueRef.current || '';
      let offset = cursorOffsetRef.current;
      if (offset < 0) offset = 0;
      if (offset > currentValue.length) offset = currentValue.length;

      if (key.leftArrow) {
        if (showCursor) setCursorOffset(Math.max(0, offset - 1));
        return;
      }

      if (key.rightArrow) {
        if (showCursor) setCursorOffset(Math.min(currentValue.length, offset + 1));
        return;
      }

      if (key.ctrl && input === 'u') {
        valueRef.current = '';
        setCursorOffset(0);
        onChange('');
        return;
      }

      if (key.backspace || key.delete) {
        if (offset <= 0) return;
        const nextValue = currentValue.slice(0, offset - 1) + currentValue.slice(offset);
        valueRef.current = nextValue;
        setCursorOffset(offset - 1);
        onChange(nextValue);
        return;
      }

      // Strip newlines from pastes so we don't accidentally submit.
      const cleaned = input.replace(/[\r\n]+/g, '');
      if (!cleaned) return;

      const nextValue = currentValue.slice(0, offset) + cleaned + currentValue.slice(offset);
      valueRef.current = nextValue;
      setCursorOffset(offset + cleaned.length);
      onChange(nextValue);
    },
    { isActive: focus }
  );

  const raw = value || '';
  const display = mask ? mask.repeat(raw.length) : raw;

  if (!focus || !showCursor) {
    return (
      <Text color={display.length === 0 ? colors.textDim : undefined} dimColor={display.length === 0}>
        {display.length === 0 ? placeholder : display}
      </Text>
    );
  }

  if (display.length === 0 && placeholder.length > 0) {
    return (
      <Text color={colors.textDim} dimColor>
        <Text inverse>{placeholder[0] ?? ' '}</Text>
        {placeholder.slice(1)}
      </Text>
    );
  }

  const offset = Math.min(cursorOffset, display.length);
  const before = display.slice(0, offset);
  const cursorChar = offset < display.length ? display[offset] : ' ';
  const after = offset < display.length ? display.slice(offset + 1) : '';

  return (
    <Text>
      {before}
      <Text inverse>{cursorChar}</Text>
      {after}
    </Text>
  );
};

/**
 * Text input field with label
 */
export const TextField: React.FC<TextFieldProps> = ({ label, value, onChange, onSubmit, placeholder, mask, hint }) => (
  <Box flexDirection="column">
    <Text color={colors.textMuted}>{label}</Text>
    <Box marginTop={1}>
      <Text color={colors.primary}>{icons.pointer} </Text>
      <ReliableTextInput value={value} onChange={onChange} onSubmit={onSubmit} placeholder={placeholder} mask={mask} />
    </Box>
    {hint && (
      <Box marginTop={1}>
        <Text color={colors.textMuted} dimColor>
          {hint}
        </Text>
      </Box>
    )}
  </Box>
);

interface MaskedInputProps {
  label: string;
  envVarName: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}

/**
 * Masked input for sensitive data like API keys
 */
export const MaskedInput: React.FC<MaskedInputProps> = ({ label, envVarName, value, onChange, onSubmit }) => (
  <Box flexDirection="column">
    <Text color={colors.textMuted}>{label}</Text>
    <Box marginTop={1}>
      <Text color={colors.textMuted}>{envVarName}: </Text>
    </Box>
    <Box marginTop={1}>
      <Text color={colors.primary}>{icons.pointer} </Text>
      <ReliableTextInput value={value} onChange={onChange} onSubmit={onSubmit} mask="•" placeholder="Enter key..." />
    </Box>
    <Box flexDirection="column" marginTop={2}>
      <Text color={colors.textMuted} dimColor>
        {icons.bullet} Stored locally in variant config
      </Text>
      <Text color={colors.textMuted} dimColor>
        {icons.bullet} Never sent to external servers
      </Text>
    </Box>
  </Box>
);
