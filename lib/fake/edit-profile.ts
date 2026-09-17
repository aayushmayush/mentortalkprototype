import { DEMO_EDUCATION, DEMO_CATEGORY_IDS, DEMO_OPTION_IDS } from '@/lib/state/demo-provider';

/**
 * Fixtures for `/edit-profile`.
 *
 * ── Why the fallbacks exist at all ──────────────────────────────────────────
 *
 * Production loads all of this from the server: `getEditProfile()` returns the
 * name, username, phone, photo, category ids, option ids and education list,
 * and the bloc additionally fetches the category catalogue. A prototype has no
 * server — and, worse, has no *onboarding* behind it when you deep-link in from
 * the screen index. Without a fallback the screen renders the empty variants of
 * everything, and an empty screen is indistinguishable from a broken one.
 *
 * So the fallbacks below are what a reviewer sees on a cold `/edit-profile`, and
 * `?empty=1` clears them to reach the two empty states on purpose. Both are
 * real states of the real screen; neither is reachable by tapping alone, which
 * is exactly why they need a URL.
 *
 * ── The education entry is the wizard's own ─────────────────────────────────
 *
 * `DEMO_EDUCATION` is the entry `onboarding/education/add` prefills with when
 * autofill is on. Reusing it means: walk the wizard, land on edit-profile, and
 * the card shows the row you just added rather than a second, differently
 * spelled one. One fixture, two screens.
 *
 * Note the type differs from the wizard's. `onboarding-provider.tsx` stores
 * years as STRINGS (they come straight off text fields); the edit-profile
 * `EducationEntry` in Dart stores `int?` and the card renders `startYear - endYear`
 * from them. The conversion happens here, once.
 */

export type EditEducationEntry = {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string | null;
  startYear: number | null;
  endYear: number | null;
};

export const FALLBACK_EDUCATION: EditEducationEntry[] = [
  {
    id: 'edu-1',
    institution: DEMO_EDUCATION.institution,
    degree: DEMO_EDUCATION.degree,
    fieldOfStudy: DEMO_EDUCATION.fieldOfStudy,
    startYear: Number(DEMO_EDUCATION.startYear),
    endYear: Number(DEMO_EDUCATION.endYear),
  },
];

export const FALLBACK_CATEGORY_IDS: string[] = [...DEMO_CATEGORY_IDS];
export const FALLBACK_OPTION_IDS: string[] = [...DEMO_OPTION_IDS];

/**
 * The photo the "picker" hands back.
 *
 * Camera and gallery cannot exist in a browser, and neither can the cropper —
 * but the three things around them can, and they are the parts worth reviewing:
 * the action sheet, the upload spinner over the avatar, and the avatar swapping
 * to the new image. So the prototype substitutes a stock portrait for whatever
 * the OS would have returned, and the source's own `isUploadingPhoto` path runs
 * unchanged.
 *
 * Deliberately NOT a random portrait on each tap: two taps in a row should show
 * two visibly different photos, so it walks a fixed list. A random pick would
 * look identical about one time in eight, and a reviewer would read that as the
 * upload having failed.
 */
export const STOCK_PHOTOS = [
  'https://randomuser.me/api/portraits/men/45.jpg',
  'https://randomuser.me/api/portraits/women/62.jpg',
  'https://randomuser.me/api/portraits/men/19.jpg',
  'https://randomuser.me/api/portraits/women/84.jpg',
];
