/**
 * Portrait URLs for the fixture people.
 *
 * Every mentor, mentee and reviewer in this prototype used to have a `null`
 * photo, which meant the avatar component always fell back to its initials
 * circle — so the *image* branch of `AppAvatar`, the list cards' photo layout,
 * and the chat app bar's 18px photo were all unreachable. Faces were asked for,
 * so the fixtures now point at real hosted portraits.
 *
 * ── Why `randomuser.me` and not a random-avatar service ─────────────────────
 *
 * The URL is `/portraits/{women|men}/{n}.jpg` — the set is chosen explicitly and
 * `n` is a fixed index, so a given fixture always gets the same face. A
 * "random avatar" endpoint would hand out a different person on every reload,
 * which makes a screenshot worthless and a review note impossible to reproduce.
 *
 * ── Two things to know ──────────────────────────────────────────────────────
 *
 * 1. **These are remote.** The prototype now needs a network connection to show
 *    faces. Every one of them degrades to the initials circle on failure —
 *    `AppAvatar` handles `onError` itself — so an offline run looks like the old
 *    build rather than like a broken image.
 * 2. **The pairing is cosmetic.** The portrait sets are gender-bucketed because
 *    the fixture names are, and nothing more than that was matched. These are
 *    stand-ins for real profile photos, not likenesses of anyone.
 */

/** `randomuser.me` portrait sets are 0–99. */
function portrait(set: 'women' | 'men', index: number): string {
  return `https://randomuser.me/api/portraits/${set}/${index}.jpg`;
}

/**
 * One portrait per mentor id. Keyed by id rather than name so a rename in the
 * fixtures cannot silently reshuffle who is who.
 */
export const MENTOR_PORTRAITS: Record<string, string> = {
  m1: portrait('women', 68), // Ananya Iyer
  m2: portrait('men', 32), // Rohan Deshpande
  m3: portrait('women', 44), // Priya Nair
  m4: portrait('men', 75), // Karthik Reddy
  m5: portrait('women', 21), // Sneha Kulkarni
  m6: portrait('men', 54), // Arjun Mehta
  m7: portrait('women', 90), // Fatima Sheikh
  m8: portrait('men', 11), // Vikram Singh
};

/**
 * The signed-in mentee. Used by the account tab and as the sender avatar for
 * the mentee's own messages in reviews.
 */
export const MY_PORTRAIT = portrait('men', 41);

/**
 * Portraits for the review authors.
 *
 * Keyed by NAME, not by index, because the review fixture draws its authors from
 * a seeded generator — an index-keyed table would be correct only for as long as
 * nobody reorders the name pool, and would then silently hand "Meera Krishnan" a
 * man's portrait.
 *
 * This covers every entry in that pool. Add a name to the pool without adding it
 * here and `portraitForReviewer` falls back to `null`, which is the app's own
 * no-photo state — a visible gap rather than a wrong face.
 */
export const REVIEWER_PORTRAITS: Record<string, string> = {
  'Aarav Sharma': portrait('men', 22),
  'Diya Patel': portrait('women', 33),
  'Ishaan Verma': portrait('men', 60),
  'Meera Krishnan': portrait('women', 51),
  'Kabir Bose': portrait('men', 8),
  'Riya Gupta': portrait('women', 12),
  'Vivaan Joshi': portrait('men', 41),
  'Anika Rao': portrait('women', 79),
  'Aditya Nair': portrait('men', 91),
  'Saanvi Reddy': portrait('women', 26),
  'Reyansh Malik': portrait('men', 17),
  'Zara Khan': portrait('women', 64),
  'Dhruv Chopra': portrait('men', 73),
  'Naina Bhatt': portrait('women', 5),
  'Aryan Pillai': portrait('men', 35),
  'Tanvi Desai': portrait('women', 88),
  'Yash Agarwal': portrait('men', 48),
  'Ira Menon': portrait('women', 57),
};

/** The review fixture's lookup, with a null that the card renders as initials. */
export function portraitForReviewer(name: string): string | null {
  return REVIEWER_PORTRAITS[name] ?? null;
}

/** Fallback for an id with no portrait — the avatar renders its initials. */
export function mentorPortrait(mentorId: string): string | null {
  return MENTOR_PORTRAITS[mentorId] ?? null;
}
