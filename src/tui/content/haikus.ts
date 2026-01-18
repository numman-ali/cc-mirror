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
  ccrouter: [
    ['Local models shine,', "routed through the mirror's edge.", 'Your code, your design.'],
    ['Proxied through the night,', 'your models stand at the ready.', 'Code takes its first flight.'],
  ],
  gatewayz: [
    ['Many gates align,', 'your routes converge in violet.', 'Paths intertwine.'],
    ['Bridges hum in sync,', 'one gateway, many bright roads.', 'Ideas link.'],
  ],
  vercel: [
    ['Black lines, green light glows,', 'gateways stream with steady pulse.', 'Deploying flows.'],
    ['Edges softly breathe,', 'requests arc through silent nodes.', 'Signals weave.'],
  ],
  nanogpt: [
    ['Neon currents rise,', 'small sparks ignite the dark grid.', 'Swift replies.'],
    ['Tiny waves collide,', 'blue and pink in quiet code.', 'Systems glide.'],
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
