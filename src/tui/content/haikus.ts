/**
 * Completion Haikus
 *
 * Provider-specific poems displayed on successful variant creation.
 * Each haiku follows the traditional 5-7-5 syllable pattern.
 */

export type HaikuLines = [string, string, string];

export const COMPLETION_HAIKUS: Record<string, HaikuLines[]> = {
  zai: [
    ['Gold streams, code dreams—', 'your variant awaits you now.', 'GLM starts to gleam.'],
    ['Calibrated well,', 'the mirror reflects your code.', 'Zai hears your call.'],
  ],
  minimax: [
    ['Coral light shines bright,', 'MiniMax pulses with power.', 'AGI for all.'],
    ['Resonating deep,', 'the model learns to listen.', 'Your code takes its leap.'],
  ],
  openrouter: [
    ['Many paths, one door—', 'OpenRouter finds the way.', 'Models at your core.'],
    ['Routes converge as one,', 'your choice echoes through the wire.', 'The journey begun.'],
  ],
  nanogpt: [
    ['Nano sparks ignite,', 'vast models at your command.', 'Code takes its first flight.'],
    ['Violet streams flow,', 'NanoGPT powers your dreams.', 'Watch your projects grow.'],
  ],
  ccrouter: [
    ['Local models shine,', "routed through the mirror's edge.", 'Your code, your design.'],
    ['Proxied through the night,', 'your models stand at the ready.', 'Code takes its first flight.'],
  ],
  default: [
    ['Mirror reflects true,', 'your variant is ready now.', 'Go build something new.'],
    ['Configuration done,', 'the wrapper awaits your call.', 'Your coding has begun.'],
  ],
};

/**
 * Get a random haiku for a provider
 */
export const getRandomHaiku = (providerKey?: string): HaikuLines => {
  const haikus = COMPLETION_HAIKUS[providerKey || ''] || COMPLETION_HAIKUS.default;
  return haikus[Math.floor(Math.random() * haikus.length)];
};
