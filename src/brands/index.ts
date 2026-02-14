import type { TweakccConfig } from './types.js';
import { buildZaiTweakccConfig } from './zai.js';
import { buildMinimaxTweakccConfig } from './minimax.js';
import { buildKimiTweakccConfig } from './kimi.js';
import { buildOpenRouterTweakccConfig } from './openrouter.js';
import { buildCCRouterTweakccConfig } from './ccrouter.js';
import { buildMirrorTweakccConfig } from './mirror.js';
import { buildOllamaTweakccConfig } from './ollama.js';
import { buildGatewayzTweakccConfig } from './gatewayz.js';
import { buildVercelTweakccConfig } from './vercel.js';
import { buildNanoGPTTweakccConfig } from './nanogpt.js';

export interface BrandPreset {
  key: string;
  label: string;
  description: string;
  buildTweakccConfig: () => TweakccConfig;
}

const BRAND_PRESETS: Record<string, BrandPreset> = {
  zai: {
    key: 'zai',
    label: 'Z.ai Carbon',
    description: 'Dark carbon palette, gold + blue accents',
    buildTweakccConfig: buildZaiTweakccConfig,
  },
  minimax: {
    key: 'minimax',
    label: 'MiniMax Nebula',
    description: 'Electric violet + neon cyberpunk palette',
    buildTweakccConfig: buildMinimaxTweakccConfig,
  },
  kimi: {
    key: 'kimi',
    label: 'Kimi Teal',
    description: 'Teal/cyan palette for Kimi Code (kimi-for-coding).',
    buildTweakccConfig: buildKimiTweakccConfig,
  },
  openrouter: {
    key: 'openrouter',
    label: 'OpenRouter Chrome',
    description: 'Silver/chrome palette with electric blue accents.',
    buildTweakccConfig: buildOpenRouterTweakccConfig,
  },
  ccrouter: {
    key: 'ccrouter',
    label: 'CCRouter Sky',
    description: 'Dark sky-blue palette for CC Router.',
    buildTweakccConfig: buildCCRouterTweakccConfig,
  },
  ollama: {
    key: 'ollama',
    label: 'Ollama Llama',
    description: 'Warm sandstone palette with earthy llama tones.',
    buildTweakccConfig: buildOllamaTweakccConfig,
  },
  gatewayz: {
    key: 'gatewayz',
    label: 'GatewayZ Violet',
    description: 'Violet gradients for GatewayZ.',
    buildTweakccConfig: buildGatewayzTweakccConfig,
  },
  vercel: {
    key: 'vercel',
    label: 'Vercel Mono',
    description: 'Minimal monochrome palette with Vercel blue accents.',
    buildTweakccConfig: buildVercelTweakccConfig,
  },
  nanogpt: {
    key: 'nanogpt',
    label: 'NanoGPT Aurora',
    description: 'Aurora green + cyan accents for NanoGPT.',
    buildTweakccConfig: buildNanoGPTTweakccConfig,
  },
  mirror: {
    key: 'mirror',
    label: 'Mirror Claude',
    description: 'Reflective silver/chrome theme for pure Claude Code experience.',
    buildTweakccConfig: buildMirrorTweakccConfig,
  },
};

export const listBrandPresets = (): BrandPreset[] => Object.values(BRAND_PRESETS);

export const getBrandPreset = (key?: string | null): BrandPreset | undefined => (key ? BRAND_PRESETS[key] : undefined);

export const resolveBrandKey = (providerKey: string, requested?: string): string | null => {
  const normalized = requested?.trim().toLowerCase();
  if (!normalized || normalized === 'auto') {
    return BRAND_PRESETS[providerKey] ? providerKey : null;
  }
  if (normalized === 'none' || normalized === 'default' || normalized === 'off') {
    return null;
  }
  if (!BRAND_PRESETS[normalized]) {
    throw new Error(`Unknown brand preset: ${requested}`);
  }
  return normalized;
};

export const buildBrandConfig = (brandKey: string): TweakccConfig => {
  const preset = BRAND_PRESETS[brandKey];
  if (!preset) {
    throw new Error(`Unknown brand preset: ${brandKey}`);
  }
  return preset.buildTweakccConfig();
};

export const getBrandThemeId = (brandKey?: string | null): string | null => {
  if (!brandKey) return null;
  const config = buildBrandConfig(brandKey);
  const theme = config.settings?.themes?.[0];
  return theme?.id ?? null;
};
