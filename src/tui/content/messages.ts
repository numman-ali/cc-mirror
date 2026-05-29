/**
 * Welcome Messages & Greetings
 *
 * Personality layer for the TUI experience.
 */

export const WELCOME_MESSAGES = [
  'Ready to create something great?',
  'What would you like to build today?',
  'Your variants await.',
  'Another day, another variant.',
  "Let's get you set up.",
  'Welcome back, creator.',
];

export const TIME_GREETINGS = {
  morning: 'Good morning! Ready to create?',
  afternoon: "Good afternoon. Let's build.",
  evening: 'Good evening. Time to code.',
  night: "Late night coding? Let's go.",
};

/**
 * Get a time-based greeting
 */
export const getTimeBasedGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour >= 2 && hour < 5) return TIME_GREETINGS.night;
  if (hour < 12) return TIME_GREETINGS.morning;
  if (hour < 18) return TIME_GREETINGS.afternoon;
  return TIME_GREETINGS.evening;
};

/**
 * Get a random welcome message
 */
export const getRandomWelcome = (): string => {
  return WELCOME_MESSAGES[Math.floor(Math.random() * WELCOME_MESSAGES.length)];
};

/**
 * Playful progress messages
 */
export const PROGRESS_MESSAGES = {
  initializing: ['Warming up the engines...', 'Preparing the workspace...', 'Getting things ready...'],
  installing: ['Installing runtime...', 'Fetching the good stuff...', 'Downloading intelligence...'],
  configuring: ['Configuring your variant...', 'Setting up the environment...', 'Tweaking the knobs...'],
  finishing: ['Polishing the finish...', 'Almost there...', 'Final touches...'],
};

/**
 * Get a random progress message for a phase
 */
export const getProgressMessage = (phase: keyof typeof PROGRESS_MESSAGES): string => {
  const messages = PROGRESS_MESSAGES[phase];
  return messages[Math.floor(Math.random() * messages.length)];
};
