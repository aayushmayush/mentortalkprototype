/**
 * Username rules — port of `utils/username_validator.dart` and
 * `utils/username_generator.dart`.
 *
 * The validator returns a message or null, exactly like the Dart original, and
 * returns null for an empty string because the required-field check owns that
 * case. Keeping that split matters: an empty username shows "Username is
 * required", not "at least 3 characters".
 */

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 30;

const ALLOWED = /^[a-z0-9_]+$/;

export function validateUsername(username: string): string | null {
  if (username.length === 0) return null;
  if (username.length < USERNAME_MIN)
    return `Username must be at least ${USERNAME_MIN} characters`;
  if (username.length > USERNAME_MAX)
    return `Username must be ${USERNAME_MAX} characters or less`;
  if (!ALLOWED.test(username))
    return 'Only lowercase letters, numbers, and underscores allowed';
  if (username.startsWith('_') || username.endsWith('_'))
    return 'Username cannot start or end with an underscore';
  if (username.includes('__'))
    return 'Username cannot contain consecutive underscores';
  return null;
}

const ADJECTIVES = [
  'bright', 'swift', 'bold', 'calm', 'sharp', 'quick', 'keen', 'brave',
  'cool', 'epic', 'fair', 'grand', 'noble', 'wise', 'pure', 'vivid',
  'witty', 'rapid', 'lucid', 'agile', 'prime', 'deft', 'avid', 'zesty',
];

const NOUNS = [
  'owl', 'fox', 'hawk', 'lion', 'sage', 'star', 'wolf', 'bear',
  'phoenix', 'tiger', 'falcon', 'panda', 'eagle', 'spark', 'comet', 'blaze',
  'cedar', 'orbit', 'prism', 'quest', 'ridge', 'storm', 'atlas', 'crest',
];

/**
 * Reddit-style `swift_hawk_4821`. The suffix is 1000–9999 — always four
 * digits, never zero-padded from a smaller range.
 */
export function generateUsername(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const suffix = 1000 + Math.floor(Math.random() * 9000);
  return `${adj}_${noun}_${suffix}`;
}
