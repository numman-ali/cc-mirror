/**
 * TypeScript types for CLAUDE-SNEAKPEEK TUI components
 */

import type { ReactNode } from 'react';

// Menu item types
export interface MenuItem {
  value: string;
  label: string;
  description?: string;
  icon?: 'star' | 'exit' | 'back' | 'check' | 'warning';
  disabled?: boolean;
}

// Selection callback
export type OnSelectCallback = (value: string) => void;

// Layout props
export interface FrameProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  borderStyle?: 'single' | 'double' | 'round' | 'bold';
  borderColor?: string;
}

export interface SectionProps {
  children: ReactNode;
  title?: string;
  marginY?: number;
}

// Progress types
export interface Step {
  label: string;
  status: 'pending' | 'active' | 'complete' | 'error';
}

export interface ProgressProps {
  percent: number;
  width?: number;
  showPercent?: boolean;
}

// Summary row
export interface SummaryRowData {
  label: string;
  value: string;
}

// Provider template (from providers module)
export interface ProviderInfo {
  key: string;
  label: string;
  description: string;
  baseUrl?: string;
}

// Variant meta
export interface VariantInfo {
  name: string;
  provider?: string;
  wrapperPath?: string;
  binaryPath?: string;
  configDir?: string;
}

// Doctor report item
export interface HealthCheckItem {
  name: string;
  ok: boolean;
  details?: {
    binary: boolean;
    wrapper: boolean;
    config: boolean;
  };
}
