/**
 * `PrivacySettings` — the five mentee-controlled flags from the I6 privacy
 * suite, and the local store `/settings/privacy` reads and writes.
 *
 * The production model (`core/lib/user/data/models/privacy_settings.dart`) is a
 * server row fetched by `PrivacySettingsCubit.load()` and written back one flag
 * at a time by `setFlag(key, value)`. It carries ten fields — this file keeps
 * the five the mentee app actually renders, because `privacy_settings_page.dart`
 * only ever binds those five.
 *
 * ── The wire keys are the source's, and they are what `setFlag` takes ───────
 *
 * `show_name_in_reviews`, `mentor_chat_access`, `mentor_download_access`,
 * `block_screenshots`, `block_call_recording`. They are snake_case strings in
 * the Dart too — `_setFlag(context, 'show_name_in_reviews', v)` — so they are
 * reproduced verbatim rather than camel-cased to match the TS field names.
 * `setFlag` is keyed by those strings, which is what makes a failed write
 * identifiable in the error path.
 *
 * ── Defaults are all ON, and two of them are odd ────────────────────────────
 *
 * `blockScreenshots` and `blockCallRecording` default to `true`: the mentee is
 * choosing to *protect themselves* from the mentor's device, which is why the
 * copy reads "Mentors won't be able to…". The other three are permissions the
 * mentee *grants* and also default to `true`. So every switch ships on, and the
 * screen reads as five things already working rather than five things to turn
 * on. That is the server's default, not the screen's.
 */

export type PrivacyFlagKey =
  | 'show_name_in_reviews'
  | 'mentor_chat_access'
  | 'mentor_download_access'
  | 'block_screenshots'
  | 'block_call_recording';

export type PrivacySettings = {
  showNameInReviews: boolean;
  mentorChatAccess: boolean;
  mentorDownloadAccess: boolean;
  blockScreenshots: boolean;
  blockCallRecording: boolean;
};

/** Wire key → the field it writes. The inverse of what `setFlag` receives. */
export const PRIVACY_KEY_TO_FIELD: Record<PrivacyFlagKey, keyof PrivacySettings> = {
  show_name_in_reviews: 'showNameInReviews',
  mentor_chat_access: 'mentorChatAccess',
  mentor_download_access: 'mentorDownloadAccess',
  block_screenshots: 'blockScreenshots',
  block_call_recording: 'blockCallRecording',
};

export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  showNameInReviews: true,
  mentorChatAccess: true,
  mentorDownloadAccess: true,
  blockScreenshots: true,
  blockCallRecording: true,
};

/**
 * Whether a given flag write should fail, so the `privacyUpdateError` snackbar
 * is reachable in the prototype.
 *
 * The real failure is a rejected PATCH. There is nothing to reject here, and a
 * screen whose only error path is dead code is a screen whose error path has
 * never been looked at — so it is driven from the URL instead, the same
 * affordance `ProfileProvider.simulate()` uses for the account tab:
 * `/settings/privacy?fail=1` inverts every write. Named `FAIL_FLAG` rather than
 * hardcoded at the call site so the query parameter is documented in one place.
 */
export const FAIL_FLAG = 'fail';

/** Simulated round-trip for both the initial load and each flag write. */
export const PRIVACY_LOAD_MS = 700;
export const PRIVACY_WRITE_MS = 450;
