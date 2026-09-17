/**
 * Account deletion — the stand-in for `AuthRepository.deleteAccount()`.
 *
 * ── The two failure messages are the backend's, verbatim ────────────────────
 *
 * `backend/mentortalk-auth/index.mjs` rejects the delete with **409** in two
 * cases, and both strings below are copied out of that handler character for
 * character:
 *
 *   - an `active`, `requested` or `pending` session involving the user
 *     (`?blocked=session`)
 *   - a `report` filed BY the user that is still `pending` (`?blocked=report`)
 *
 * The 409s surface as `ConflictException`, which the screen renders in a
 * single-action "Cannot Delete Account" dialog — a different treatment from
 * every other failure, which is a snackbar. That asymmetry is the whole reason
 * the two branches are modelled separately here rather than collapsed into one
 * error.
 *
 * ── A 400 also exists and is NOT modelled ──────────────────────────────────
 *
 * The handler first checks `account_status !== 'active'` and returns
 * *"Account is not in active state"*. That cannot fire from inside the app: a
 * non-active account has already been logged out by the token-version bump, so
 * it can never hold a screen open long enough to tap Delete. It is reachable
 * only with a stale token, which the prototype has no way to hold.
 *
 * ── Thirty days, and the date is rendered in two places ────────────────────
 *
 * The grace period is a literal 30 in the backend and is not read from any
 * config. The screen formats the returned `deletion_date` — and the snackbar
 * copy says "within 30 days" independently, so the two could disagree if the
 * backend's period ever changed. Reproduced as-is.
 */

/** `+30` days, matching the backend's `deletionDate.setDate(getDate() + 30)`. */
export const GRACE_PERIOD_DAYS = 30;

/** How long the fake round-trip takes. */
export const DELETE_ACCOUNT_MS = 900;

export type DeleteAccountFailure = 'session' | 'report';

export type DeleteAccountResult =
  | { ok: true; deletionDate: string }
  | { ok: false; kind: 'conflict'; message: string }
  | { ok: false; kind: 'error' };

/**
 * The 409 messages, exactly as the auth handler writes them. Note the first is
 * two sentences and the second is one — the dialog is sized by the message, so
 * the two look different on screen.
 */
export const CONFLICT_MESSAGES: Record<DeleteAccountFailure, string> = {
  session:
    'You have an active or pending session. Please wait for it to complete before deleting your account.',
  report:
    'You have an open report pending review. Please wait for it to be resolved.',
};

/**
 * `AuthRepository.deleteAccount()`.
 *
 * @param failure  Which 409 to raise, if any.
 * @param networkFail  Raise a generic `ApiException` instead — the branch that
 *   shows `deleteAccountGenericError` in a snackbar.
 */
export function deleteAccount({
  failure = null,
  networkFail = false,
}: {
  failure?: DeleteAccountFailure | null;
  networkFail?: boolean;
} = {}): Promise<DeleteAccountResult> {
  return new Promise((resolve) => {
    window.setTimeout(() => {
      if (networkFail) {
        resolve({ ok: false, kind: 'error' });
        return;
      }
      if (failure !== null) {
        resolve({ ok: false, kind: 'conflict', message: CONFLICT_MESSAGES[failure] });
        return;
      }
      const date = new Date();
      date.setDate(date.getDate() + GRACE_PERIOD_DAYS);
      resolve({ ok: true, deletionDate: date.toISOString() });
    }, DELETE_ACCOUNT_MS);
  });
}

/**
 * `DateFormat('d MMMM yyyy')` — the source's pattern, which is `'14 September
 * 2026'`: day with no leading zero, full month name, four-digit year.
 *
 * `Intl` rather than a hand-rolled table, because `DateFormat` is itself an
 * `Intl` wrapper in the Flutter app and the locale is whatever the app is set
 * to. `en-GB` is the closest match to `d MMMM yyyy` — `en-US` would give
 * "September 14, 2026", which is a different pattern.
 */
export function formatDeletionDate(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return iso;
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(parsed);
}
