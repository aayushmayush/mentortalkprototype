/**
 * `SessionDetail` — port of `core/lib/session/data/models/session_detail.dart`
 * and its two extensions, plus the fake read that stands in for
 * `SessionRepository.getSessionDetail`.
 *
 * ── Role-specific visibility is the whole shape of this model ───────────────
 *
 * The same session is returned by two endpoints, and which half comes back
 * depends on who asked: `/mentor/session/:id/details` carries `mentee` +
 * `total_earning`, `/mentee/session/:id/details` carries `mentor` +
 * `total_amount`. Every field on the money half is nullable for that reason —
 * a mentee's payload has no `total_earning` in it at all — and the block reads
 * whichever one matches `isMentor`.
 *
 * `otherUser` is the legacy fallback for payloads from before the split, and
 * `counterparty()` prefers the role-specific field and only then falls back.
 *
 * ── `segments` is dead weight, and it is carried anyway ─────────────────────
 *
 * The mode-switch flow that produced a list of per-mode segments is deprecated
 * — one session is one mode now — so the sheet renders top-level `sessionType`
 * and `ratePerMinute` and never touches `segments`. The model still parses it.
 */

import type { IconName } from '@/design-system';
import { formatInr } from '@/lib/rates';
import type { SessionType } from '@/lib/session/types';

/**
 * `SessionParticipant` from `core/lib/session/data/models/session_summary.dart`
 * — NOT from `session_detail.dart`, which only imports it.
 *
 * Every field is lenient in the source and defaults: backends disagree on
 * whether they send `name` or a split first/last, and may null out either the id
 * or the name for a deleted account. `id` is `''` when absent rather than
 * undefined, and the block tolerates both.
 *
 * `categories` is on the model and read by the mentor app's session list; the
 * receipt block renders only avatar and name, so it is carried but unused here
 * — the same way `segments` is.
 */
export type SessionParticipant = {
  id: string;
  name: string;
  avatar: string | null;
  categories: string[];
};

/** Legacy `segments[]`. Parsed, never rendered — see the header. */
export type SessionSegmentDetail = {
  id: string;
  type: SessionType;
  ratePerMinute: number;
  durationSeconds: number;
  durationMinutes: number;
  earning: number;
  startedAt: string | null;
  endedAt: string | null;
};

export type SessionReview = {
  rating: number;
  comment: string | null;
  createdAt: string;
};

export type SessionDetail = {
  id: string;
  status: string;
  sessionType: SessionType;
  ratePerMinute: number;
  /** `'paid' | 'intro_rate' | 'free_intro'`. Null on older rows. */
  billingType: string | null;

  /** Mentor-side participant — present in the MENTEE's response. */
  mentor: SessionParticipant | null;
  /** Mentee-side participant — present in the MENTOR's response. */
  mentee: SessionParticipant | null;
  /** Legacy fallback when only one of the two is present. */
  otherUser: SessionParticipant | null;

  segments: SessionSegmentDetail[];
  totalDurationSeconds: number;
  totalDurationMinutes: number;

  /** The mentor sees their cut. Absent on the mentee's payload. */
  totalEarning: number | null;
  /** The mentee sees what they paid. Absent on the mentor's payload. */
  totalAmount: number | null;

  review: SessionReview | null;
  startedAt: string;
  /** Null for a session that never started. */
  endedAt: string | null;
};

/** `counterparty()` — the participant the current viewer is looking at. */
export function counterparty(
  detail: SessionDetail,
  isMentor: boolean,
): SessionParticipant | null {
  return isMentor ? (detail.mentee ?? detail.otherUser) : (detail.mentor ?? detail.otherUser);
}

/**
 * `billingType == 'free_intro'`. There is an `isIntroRate` beside it in the
 * source that nothing reads — the block only ever branches on free.
 */
export function isFreeChat(detail: SessionDetail): boolean {
  return detail.billingType === 'free_intro';
}

/** `totalEarning.inr` / `totalAmount.inr` — a null total reads as ₹0. */
export function totalEarningDisplay(detail: SessionDetail): string {
  return formatInr(detail.totalEarning ?? 0);
}

export function totalAmountDisplay(detail: SessionDetail): string {
  return formatInr(detail.totalAmount ?? 0);
}

/**
 * `ceiledDurationDisplay` — the unit the user is actually billed for. A 4:30
 * session reads "5 min", which is the number on the invoice and therefore the
 * one the receipt has to show.
 */
export function ceiledDurationDisplay(detail: SessionDetail): string {
  return `${Math.ceil(detail.totalDurationSeconds / 60)} min`;
}

/**
 * `_typeIcon` from `_DetailsCard`.
 *
 * The source reaches past `AppIcons` here and names Flutter's `Icons.*`
 * directly — `Icons.call_outlined`, `Icons.videocam_outlined`,
 * `Icons.chat_bubble_outline_rounded`. All three are the OUTLINED halves of
 * pairs `AppIcons` already carries, so they resolve through the existing
 * constants rather than new ligature strings; only the naming differs.
 */
export function sessionTypeIcon(type: SessionType): IconName {
  switch (type) {
    case 'audio':
      return 'call';
    case 'video':
      return 'videoCam';
    default:
      return 'chat';
  }
}

export function sessionTypeLabel(type: SessionType): string {
  switch (type) {
    case 'audio':
      return 'Audio call';
    case 'video':
      return 'Video call';
    default:
      return 'Chat';
  }
}

/**
 * `DateFormat('d MMM y, h:mm a')` — "4 Sep 2026, 3:20 pm".
 *
 * Named for the receipt that first needed it, but the SAME pattern is on the
 * wallet's transaction tile and its detail sheet, so the implementation moved
 * to `lib/format.ts` when T4 arrived rather than being copied a third time.
 * Re-exported under the old name so the receipt block does not churn.
 */
export { formatDateTimeShort as formatDetailTimestamp } from '@/lib/format';

/* ── The fake read ─────────────────────────────────────────────────────────
 *
 * `SessionRepository().getSessionDetail(sessionId, isMentor:)` — it returns
 * NULL rather than throwing when the server has no such session, and the chat
 * screen turns that into a "Couldn't load session details" snackbar. Keeping
 * the null case in the fixture is what keeps that branch reachable: only the
 * seeded session ids below have a detail, and any other id fails the way a
 * deleted or mistyped one would.
 */

const SEEDED_IDS = new Set(['s_seed_1', 's_live_1', 'me-s2000']);

export function getSessionDetail(
  sessionId: string,
  options: {
    isMentor: boolean;
    peerName: string;
    peerAvatar: string | null;
    /** Absent when the caller only knows a name — the wallet's rows carry one. */
    peerId?: string;
  },
): SessionDetail | null {
  if (!SEEDED_IDS.has(sessionId)) return null;

  const { isMentor, peerName, peerAvatar, peerId } = options;
  const now = Date.now();
  const startedAt = new Date(now - 27 * 60_000);
  const endedAt = new Date(now - 5 * 60_000);
  // 22:30 — deliberately not a whole number of minutes, so the receipt's
  // ceiled "23 min" is visibly different from the elapsed time.
  const totalDurationSeconds = 22 * 60 + 30;

  const participant: SessionParticipant = {
    id: peerId ?? '',
    name: peerName,
    avatar: peerAvatar,
    categories: [],
  };

  return {
    id: sessionId,
    status: 'completed',
    sessionType: 'chat',
    ratePerMinute: 12,
    billingType: 'intro_rate',
    // The mentee's payload carries `mentor`; the mentor's carries `mentee`.
    mentor: isMentor ? null : participant,
    mentee: isMentor ? participant : null,
    otherUser: null,
    segments: [],
    totalDurationSeconds,
    totalDurationMinutes: Math.floor(totalDurationSeconds / 60),
    totalEarning: isMentor ? 96 : null,
    totalAmount: isMentor ? null : 276,
    review: null,
    startedAt: startedAt.toISOString(),
    endedAt: endedAt.toISOString(),
  };
}
