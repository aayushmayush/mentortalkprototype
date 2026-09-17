/**
 * The route table.
 *
 * There is nothing to transcribe from the Flutter app: go_router declares only
 * nine routes, and every other screen is an imperative `Navigator.push` or a
 * `showModalBottomSheet`. So this table is INVENTED — and that is a feature,
 * because it gives all ~35 screens real, deep-linkable URLs, which is what the
 * screen-index panel needs and what makes the prototype reviewable.
 *
 * `/home` is the one route that keeps Flutter's structure: it is a single route
 * with a `?tab=` parameter, not four nested routes, because the real HomeShell
 * holds an IndexedStack whose four children stay mounted. Nested routes would
 * unmount them and lose each tab's scroll position on every switch.
 *
 * `built` is the tiering switch. The full table exists from the start so the
 * parity checklist is visible while the build is in progress; entries that are
 * not built yet render as disabled in the index and are never linked, so noth-
 * ing 404s. Every flag ends up true.
 */

export type RouteTier = 'T1' | 'T2' | 'T3' | 'T4' | 'T5';

export type AppRoute = {
  href: string;
  label: string;
  /** Group heading in the screen index. */
  group: string;
  tier: RouteTier | 'T0';
  built: boolean;
  /** Shown as the index row's tooltip — usually the production screen name. */
  note?: string;
  /**
   * A real path to link to when `href` is a pattern. `/mentors/[id]` cannot be
   * navigated to literally, so the index opens this instead. Ignored otherwise.
   */
  example?: string;
};

export const ROUTES: AppRoute[] = [
  // ── Launch & auth ──────────────────────────────────────────────────────
  { href: '/', label: 'Splash', group: 'Launch & auth', tier: 'T1', built: true, note: 'splash_page.dart — video + redirect' },
  { href: '/get-started', label: 'Get started', group: 'Launch & auth', tier: 'T1', built: true },
  { href: '/auth/phone', label: 'Phone number', group: 'Launch & auth', tier: 'T1', built: true },
  { href: '/auth/otp', label: 'OTP', group: 'Launch & auth', tier: 'T1', built: true, note: '30s resend cooldown (the 120s expiry is dead code in the source too)' },
  { href: '/banned', label: 'Banned', group: 'Launch & auth', tier: 'T1', built: true },

  // ── Onboarding ─────────────────────────────────────────────────────────
  { href: '/onboarding', label: 'Onboarding wizard', group: 'Onboarding', tier: 'T1', built: true, note: '3 steps, ?step= for resume' },
  { href: '/onboarding/education/add', label: 'Add education', group: 'Onboarding', tier: 'T1', built: true },
  { href: '/onboarding/complete', label: 'Completion', group: 'Onboarding', tier: 'T1', built: true, note: 'the success animation — a step of /onboarding, given its own URL to deep-link' },
  { href: '/free-chat-offer', label: 'Free chat offer', group: 'Onboarding', tier: 'T5', built: true, note: 'linked from the home feed — an entry point, not a settings screen' },

  // ── Home & discovery ───────────────────────────────────────────────────
  { href: '/home?tab=home', label: 'Home', group: 'Home & discovery', tier: 'T2', built: true },
  { href: '/home?tab=chat', label: 'Chats tab', group: 'Home & discovery', tier: 'T2', built: true },
  { href: '/home?tab=call', label: 'Call tab', group: 'Home & discovery', tier: 'T2', built: true },
  {
    href: '/home?tab=account',
    label: 'Account tab',
    group: 'Home & discovery',
    tier: 'T2',
    built: true,
    note: 'the tab is built; its four action tiles point at T4/T5 screens',
  },
  { href: '/search', label: 'Search', group: 'Home & discovery', tier: 'T2', built: true, note: '600ms debounce' },
  { href: '/mentors/[id]', label: 'Mentor profile', group: 'Home & discovery', tier: 'T2', built: true, example: '/mentors/m1', note: 'About / Reviews tabs' },

  // ── Session & calls ────────────────────────────────────────────────────
  {
    href: '/chat',
    label: 'Chat session',
    group: 'Session & calls',
    tier: 'T3',
    built: true,
    example: '/chat?mentor=m1',
    note: 'the metered loop',
  },
  {
    href: '/chats',
    label: 'Order history',
    group: 'Session & calls',
    tier: 'T3',
    built: true,
    note: 'a mentor INBOX — the title is a mislabel, see the page header',
  },
  {
    href: '/reviews',
    label: 'My reviews',
    group: 'Session & calls',
    tier: 'T3',
    built: true,
    note: 'reads the review the end-of-session sheet posts',
  },

  // ── Wallet & packages ──────────────────────────────────────────────────
  { href: '/wallet', label: 'Wallet', group: 'Wallet & packages', tier: 'T4', built: true },
  { href: '/wallet/add', label: 'Add balance', group: 'Wallet & packages', tier: 'T4', built: true },
  { href: '/packages', label: 'Packages', group: 'Wallet & packages', tier: 'T4', built: true },
  { href: '/referral', label: 'Refer & earn', group: 'Wallet & packages', tier: 'T4', built: true },

  // ── Counselling ────────────────────────────────────────────────────────
  { href: '/counselling', label: 'Exam picker', group: 'Counselling', tier: 'T4', built: true },
  { href: '/counselling/intake', label: 'Intake form', group: 'Counselling', tier: 'T4', built: true },
  { href: '/counselling/college', label: 'College preference', group: 'Counselling', tier: 'T4', built: true },
  { href: '/counselling/counsellor', label: 'Matched counsellor', group: 'Counselling', tier: 'T4', built: true },
  { href: '/counselling/connecting', label: 'Connecting', group: 'Counselling', tier: 'T4', built: true },

  // ── Account & settings ─────────────────────────────────────────────────
  { href: '/edit-profile', label: 'Edit profile', group: 'Account & settings', tier: 'T5', built: true, note: '?sim= | ?fail= | ?empty=1 force its unreachable branches' },
  { href: '/edit-profile/categories', label: 'Category picker', group: 'Account & settings', tier: 'T5', built: true, note: 'pushed from edit-profile; shares its provider' },
  { href: '/edit-profile/add-education', label: 'Add education', group: 'Account & settings', tier: 'T5', built: true, note: '?id=<entryId> switches it to edit' },
  { href: '/settings', label: 'Settings', group: 'Account & settings', tier: 'T5', built: true },
  { href: '/settings/privacy', label: 'Privacy', group: 'Account & settings', tier: 'T5', built: true, note: '?sim= for the load and save failures' },
  { href: '/settings/blocked', label: 'Blocked users', group: 'Account & settings', tier: 'T5', built: true },
  { href: '/settings/following', label: 'Following', group: 'Account & settings', tier: 'T5', built: true },
  { href: '/settings/help', label: 'Help centre', group: 'Account & settings', tier: 'T5', built: true },
  { href: '/settings/about', label: 'App info', group: 'Account & settings', tier: 'T5', built: true },
  { href: '/support', label: 'Support chat', group: 'Account & settings', tier: 'T5', built: true },
  { href: '/delete-account', label: 'Delete account', group: 'Account & settings', tier: 'T5', built: true, note: '?sim= | ?empty=1 for its unreachable branches' },

  // ── Blocking states ────────────────────────────────────────────────────
  { href: '/maintenance', label: 'Maintenance', group: 'Blocking states', tier: 'T5', built: true, note: 'renders in place of the shell; ?sim= for the ETA variant' },
  { href: '/force-update', label: 'Force update', group: 'Blocking states', tier: 'T5', built: true, note: 'renders in place of the shell; ?force=0 for the dismissible variant' },

  // ── Prototype-only ─────────────────────────────────────────────────────
  { href: '/design-system', label: 'Design system', group: 'Prototype', tier: 'T0', built: true, note: 'not an app screen — the component gallery' },
];

/**
 * Whether an in-app tap should actually navigate.
 *
 * Screens cross-link to each other — the account grid to the wallet, the feed
 * to search — and while the build is in tiers, many of those destinations do
 * not exist yet. Pushing anyway would 404 a reviewer out of the prototype
 * mid-flow, which reads as a bug rather than as an unfinished tier. So taps to
 * unbuilt routes are inert by design, and the screen index shows those entries
 * disabled so the reason is visible.
 *
 * Query strings are stripped before the lookup, so `/home?tab=chat` resolves
 * against `/home`. A dynamic route is matched by prefix: `/mentors/m1` has no
 * entry of its own, so it resolves against the `/mentors/[id]` pattern.
 */
export function isRouteBuilt(href: string): boolean {
  const path = href.split('?')[0];

  const exact = ROUTES.find((r) => r.href.split('?')[0] === path);
  if (exact) return exact.built;

  // A pattern entry (`/mentors/[id]`) matches any path under its prefix — the
  // table cannot enumerate the ids, and a tap always carries a real one.
  const pattern = ROUTES.find((r) => {
    const route = r.href.split('?')[0];
    const bracket = route.indexOf('[');
    if (bracket === -1) return false;
    const prefix = route.slice(0, bracket);
    return path.startsWith(prefix) && path.length > prefix.length;
  });

  return pattern?.built ?? false;
}

export const ROUTE_GROUPS = [
  'Launch & auth',
  'Onboarding',
  'Home & discovery',
  'Session & calls',
  'Wallet & packages',
  'Counselling',
  'Account & settings',
  'Blocking states',
  'Prototype',
] as const;
