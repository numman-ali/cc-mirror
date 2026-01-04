import type { TweakccConfig } from './types.js';
import { buildZaiTweakccConfig } from './zai.js';
import { buildMinimaxTweakccConfig } from './minimax.js';
import { buildOpenRouterTweakccConfig } from './openrouter.js';
import { buildCCRouterTweakccConfig } from './ccrouter.js';
import { buildMirrorTweakccConfig } from './mirror.js';

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
    description: 'Dark carbon palette, gold + blue accents, Z.ai toolset label.',
    buildTweakccConfig: buildZaiTweakccConfig,
  },
  minimax: {
    key: 'minimax',
    label: 'MiniMax Pulse',
    description: 'Vibrant spectrum accents (red/orange/pink/violet) with MiniMax toolset label.',
    buildTweakccConfig: buildMinimaxTweakccConfig,
  },
  openrouter: {
    key: 'openrouter',
    label: 'OpenRouter Teal',
    description: 'Light UI with teal/cyan accents and OpenRouter toolset label.',
    buildTweakccConfig: buildOpenRouterTweakccConfig,
  },
  ccrouter: {
    key: 'ccrouter',
    label: 'CCRouter Sky',
    description: 'Airy sky-blue accents for Claude Code Router.',
    buildTweakccConfig: buildCCRouterTweakccConfig,
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
