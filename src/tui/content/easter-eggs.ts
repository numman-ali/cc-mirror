/**
 * Easter Eggs
 *
 * Hidden delights for power users to discover.
 */

/**
 * Konami code sequence for HomeScreen
 */
export const KONAMI_CODE = ['up', 'up', 'down', 'down', 'left', 'right', 'left', 'right', 'b', 'a'] as const;

/**
 * Milestone messages for variant count achievements
 */
export const MILESTONE_MESSAGES: Record<number, string> = {
  5: "5 variants! You're building an empire.",
  10: '10 variants! You must really like mirrors.',
  25: "25 variants! Are you okay? (We're impressed.)",
  50: '50 variants! This is dedication.',
  100: '100 variants! You are the mirror master.',
};

/**
 * Get milestone message if count matches a milestone
 */
export const getMilestoneMessage = (variantCount: number): string | null => {
  return MILESTONE_MESSAGES[variantCount] || null;
};

/**
 * Check if it's late night (2-5 AM)
 */
export const isLateNight = (): boolean => {
  const hour = new Date().getHours();
  return hour >= 2 && hour < 5;
};

/**
 * Late night coding acknowledgment
 */
export const LATE_NIGHT_MESSAGE = "Late night coding? Respect. Here's your variant.";

/**
 * Creator acknowledgment trigger
 */
export const CREATOR_TRIGGER = 'numman';
export const CREATOR_MESSAGE = 'Thanks for using CLAUDE-SNEAKPEEK!';

/**
 * Random fun facts shown occasionally
 */
export const FUN_FACTS = [
  'CLAUDE-SNEAKPEEK was built with Claude Code itself.',
  'The gold theme for Zai was inspired by sunrise.',
  'Each variant is completely isolated—they never talk to each other.',
  "You can run 'claude-sneakpeek doctor' anytime to check your variants.",
  'The haikus are original poetry, not generated.',
];

/**
 * Get a random fun fact
 */
export const getRandomFunFact = (): string => {
  return FUN_FACTS[Math.floor(Math.random() * FUN_FACTS.length)];
};

/**
 * Secret CLI flags (for --haiku)
 */
export const SECRET_FLAGS = {
  haiku: true,
  party: false, // Unlocked by Konami code
};
