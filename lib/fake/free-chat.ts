/**
 * Free chat — `checkFreeChatAvailability()` and the reason it returns.
 *
 * ── The button asks the server BEFORE it tries, and the reason matters ──────
 *
 * `free_chat_offer_page.dart` does not attempt the request and then explain the
 * failure. It calls a separate lightweight endpoint first, gets
 * `{available, reason}`, and only dispatches `RequestFreeChat` when available
 * is true. When it is false the screen shows a snackbar whose text is chosen
 * from `reason` — and the source is explicit about why:
 *
 *   *"Mirror the server's real reason instead of always claiming the free chat
 *   was used — a null reason on available:false means the last check found no
 *   eligible mentor (mentor shortage), which the server reports without a reason
 *   field."*
 *
 * So there are four distinct messages for four distinct situations, and the
 * `_` default is not "unknown error" but specifically "no mentors". That is the
 * whole reason this is a fixture with a `reason` union rather than a boolean.
 *
 * ── The reason strings are the wire values, not the copy ───────────────────
 *
 * `'already_used'`, `'feature_disabled'` and `'no_categories'` are what the API
 * sends (snake_case, as in the source's `switch`). The user-facing sentences
 * live in `copy.ts` keyed off them, and they are ALSO hardcoded English in the
 * Dart rather than l10n — so a translated app shows English here.
 *
 * ── Reachability ───────────────────────────────────────────────────────────
 *
 * `?free=used`, `?free=disabled`, `?free=none` and `?free=slow` drive the four
 * outcomes from the offer screen's URL. Without them three of the four
 * snackbars and the whole `ApiException` arm would be unreachable, and the
 * `switch` on `e` (which maps five exception types to four messages) is the
 * most intricate error handling in the page.
 */

import { MENTORS, type MentorSummary } from './mentors';

/**
 * `FreeChatAvailability.reason` — the wire values. `null` is a real case and
 * means "no eligible mentor", which is why it is in the union rather than
 * being modelled as an absent property.
 */
export type FreeChatReason =
  | 'already_used'
  | 'feature_disabled'
  | 'no_categories'
  | null;

export type FreeChatAvailability = {
  available: boolean;
  reason: FreeChatReason;
};

/** A short round-trip — this endpoint is described as "lightweight". */
export const AVAILABILITY_MS = 500;

/**
 * `SessionRepository.checkFreeChatAvailability()`.
 *
 * The default is `available: true`: the offer screen exists to be accepted, and
 * the fixture's profile has not used its free chat (`freeChatAvailable: true`
 * in `lib/fake/profile.ts`), so the two agree.
 */
export function checkFreeChatAvailability(
  override: FreeChatReason | 'ok' | null = null,
): Promise<FreeChatAvailability> {
  return new Promise((resolve) => {
    window.setTimeout(() => {
      if (override === null || override === 'ok') {
        resolve({ available: true, reason: null });
        return;
      }
      resolve({ available: false, reason: override });
    }, AVAILABILITY_MS);
  });
}

/**
 * The mentor a free chat binds to.
 *
 * ── The server picks, not the client ──────────────────────────────────────
 *
 * The real `POST /session/free-chat` has no mentor in the request body — the
 * backend matches against eligible, online mentors and returns whoever it
 * picked. So this is the prototype's stand-in for that match, and the ONE rule
 * that matters is that both callers agree: `SessionProvider.requestFreeChat`
 * seeds the name and avatar from it, and `/free-chat-offer` builds its
 * `/chat?mentor=` link from the same function. Two independent picks would put
 * one mentor's name in the waiting header and another's profile on the screen
 * behind it.
 *
 * ── Why the first ONLINE mentor, and why that is not arbitrary ────────────
 *
 * "Eligible" in the backend means available AND online — ringing an offline
 * mentor is precisely the case `free_chat_forward_count` exists to paper over.
 * Taking the first online mentor from the fixture is a deterministic stand-in
 * for a match the prototype cannot reproduce, and being deterministic is the
 * point: a random pick would make the waiting header, the chat thread's name
 * and the mentor-profile link disagree across a reload.
 */
export function freeChatMentor(): MentorSummary {
  const online = MENTORS.find((m) => m.isOnline && m.isAvailable);
  // `ONLINE_MENTORS` is a non-empty fixture, so this cannot fire; the fallback
  // keeps the return type honest rather than asserting.
  return online ?? MENTORS[0]!;
}

/**
 * `FreeChatPrefs.markUsed()` — the local "never ask again" flag.
 *
 * `free_chat_offer_page.dart` sets this in a `BlocListener` the moment the
 * server confirms the free-intro request (`SessionWaitingForMentor` with
 * `billingType == 'free_intro'`), NOT when the user taps the button. So a tap
 * that fails leaves the flag unset and the offer reachable again.
 *
 * It is a device-local preference in the source (`SharedPreferences`), separate
 * from the server's `free_chat_used` column, and the two can disagree — a
 * reinstall clears one and not the other.
 */
const USED_KEY = 'mentortalk.freeChatUsed';

export const freeChatPrefs = {
  isUsed(): boolean {
    try {
      return window.localStorage.getItem(USED_KEY) === '1';
    } catch {
      // Private mode, or storage disabled. Fail OPEN — showing the offer again
      // is the harmless direction, and the server is the real gate anyway.
      return false;
    }
  },
  markUsed(): void {
    try {
      window.localStorage.setItem(USED_KEY, '1');
    } catch {
      // Nothing to do; see above.
    }
  },
  clear(): void {
    try {
      window.localStorage.removeItem(USED_KEY);
    } catch {
      // Nothing to do.
    }
  },
};
