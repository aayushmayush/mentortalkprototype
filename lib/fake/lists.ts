/**
 * Blocked users and followed mentors — the two list fixtures `/settings` opens.
 *
 * ── Why they are one file ───────────────────────────────────────────────────
 *
 * They are the same shape of thing (a `mentee_profile_repository` list call)
 * and the two pages share a load/error/empty/list lifecycle. Keeping them
 * together means the two `_load()` methods cannot drift into different states.
 *
 * ── Blocked users are `Map<String, dynamic>`, not a model ───────────────────
 *
 * `blocked_users_page.dart` reads `user['display_name']` and `user['user_id']`
 * off an untyped map — `MenteeProfileRepositoryImpl.getBlockedUsers()` returns
 * `List<Map<String, dynamic>>`, so there is no `BlockedUser` class to port. The
 * prototype types them anyway, because TypeScript will not index an object with
 * a bare string and inventing a type is the only way to write the page at all.
 * The two keys the page reads are the two the type carries.
 *
 * `display_name` is nullable in the source (`as String?`) and falls back to the
 * literal `'Unknown'`, which is why one row here has a null name — so that
 * fallback is exercised rather than assumed. Note the avatar initial uses the
 * same fallback chain but on `name[0]`, guarded by `name.isNotEmpty`, so a null
 * name renders `?`.
 *
 * ── Following reads the real `MentorSummary` ────────────────────────────────
 *
 * `following_page.dart` consumes `MentorSummary` — id, displayName,
 * profilePhotoUrl, categories, ratePerMinute — which `lib/fake/mentors.ts`
 * already models. So the fixture below is a view over `MENTORS`, not a parallel
 * copy: three of them, by id, so a change to the mentor fixture moves both.
 */

import { MENTORS, type MentorSummary } from '@/lib/fake/mentors';

export type BlockedUser = {
  user_id: string;
  /** Nullable in the source; the page falls back to `'Unknown'`. */
  display_name: string | null;
};

export const BLOCKED_USERS: BlockedUser[] = [
  { user_id: 'u-8821', display_name: 'Rohit Sharma' },
  { user_id: 'u-9104', display_name: null },
  { user_id: 'u-7733', display_name: 'Anonymous Mentor' },
];

/** The three mentors `/settings/following` lists. Ids are `MENTORS`' own. */
export const FOLLOWED_MENTOR_IDS = ['m1', 'm3', 'm5'] as const;

export function followedMentors(): MentorSummary[] {
  return FOLLOWED_MENTOR_IDS.map((id) => MENTORS.find((m) => m.id === id)).filter(
    (m): m is MentorSummary => m !== undefined,
  );
}

/** `FollowingCubit.load()` — long enough to see the spinner, short enough not to. */
export const LISTS_LOAD_MS = 700;
/** `unblockUser` — the confirm dialog closes, then the row disappears. */
export const UNBLOCK_MS = 600;
