/**
 * Shared Provider Configurations for E2E Tests
 */

export const PROVIDERS = [
  {
    key: 'zai',
    name: 'Zai Cloud',
    apiKey: 'test-zai-key',
    expectedThemeId: 'dark',
    expectedSplashStyle: 'zai',
    colorCode: '\\x1b[38;5;220m', // Gold
  },
  {
    key: 'minimax',
    name: 'MiniMax Cloud',
    apiKey: 'test-minimax-key',
    expectedThemeId: 'dark',
    expectedSplashStyle: 'minimax',
    colorCode: '\\x1b[38;5;135m', // Electric violet
  },
  {
    key: 'kimi',
    name: 'Kimi Code',
    apiKey: 'test-kimi-key',
    expectedThemeId: 'dark',
    expectedSplashStyle: 'kimi',
    colorCode: '\\x1b[38;5;120m', // Spring green
  },
  {
    key: 'openrouter',
    name: 'OpenRouter',
    apiKey: 'test-openrouter-key',
    expectedThemeId: 'dark',
    expectedSplashStyle: 'openrouter',
    colorCode: '\\x1b[38;5;60m', // Navy
  },
  {
    key: 'ccrouter',
    name: 'Claude Code Router',
    apiKey: '', // Optional for ccrouter
    expectedThemeId: 'dark',
    expectedSplashStyle: 'ccrouter',
    colorCode: '\\x1b[38;5;39m', // Sky blue
  },
  {
    key: 'ollama',
    name: 'Ollama',
    apiKey: 'ollama',
    expectedThemeId: 'dark',
    expectedSplashStyle: 'ollama',
    colorCode: '\\x1b[38;5;180m', // Tan/sorrel
  },
  {
    key: 'gatewayz',
    name: 'GatewayZ',
    apiKey: 'test-gatewayz-key',
    expectedThemeId: 'dark',
    expectedSplashStyle: 'gatewayz',
    colorCode: '\\x1b[38;5;141m', // Violet
  },
  {
    key: 'vercel',
    name: 'Vercel AI Gateway',
    apiKey: 'test-vercel-key',
    expectedThemeId: 'dark',
    expectedSplashStyle: 'vercel',
    colorCode: '\\x1b[38;5;250m', // Light gray
  },
  {
    key: 'nanogpt',
    name: 'NanoGPT',
    apiKey: 'test-nanogpt-key',
    expectedThemeId: 'dark',
    expectedSplashStyle: 'nanogpt',
    colorCode: '\\x1b[38;5;81m', // Neon cyan
  },
];
