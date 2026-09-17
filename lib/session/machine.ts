/**
 * The session machine's arithmetic — everything the lifecycle needs that is
 * pure, so it can be reasoned about (and checked) without React.
 *
 * ── What production computes and what this has to fake ──────────────────────
 *
 * `max_duration_seconds` is a **server** field: the backend knows the mentee's
 * balance, the mentor's rate and the platform's minimum, and returns how many
 * seconds the money buys. The client only ever receives it. Here there is no
 * backend, so `maxDurationSecondsFor` derives it from the same two numbers the
 * server would use, and the derivation is the one place in T3 where a number is
 * actively invented rather than transcribed.
 *
 * The billing split is not invented: `mentor_app`'s own rules page states it in
 * words — *"You earn 50% of every paid session, from the first minute."*
 */

import type { BillingType, SessionBillingSummary, SessionType } from './types';

/**
 * `sessionCostMessage` — *"You need at least ₹{minRequired} for a 5-minute
 * session."* The 5 is the platform's minimum purchase, and the 402 payload's
 * `minimum_required` is computed from it.
 */
export const MIN_SESSION_MINUTES = 5;

/**
 * The mentor keeps half. `mentor_app/.../rules_page.dart:112`. The mentee never
 * sees this split — `grossAmount` and `platformFee` are parsed in production
 * and rendered nowhere — but the summary carries them, so they are computed.
 */
export const PLATFORM_FEE_SHARE = 0.5;

/**
 * `ChatState.isTimerWarning` — `remainingSeconds <= 120 && isSessionActive`.
 * It is ALSO the first low-balance chime threshold; the second is 30.
 */
export const TIMER_WARNING_SECONDS = 120;
export const FINAL_CHIME_SECONDS = 30;

/**
 * `session_overlay_manager.dart:366` — `state.maxDurationSeconds ?? 300`.
 *
 * The null case is real: a session can arrive without a max, and the overlay
 * manager seeds the chat cubit with five minutes while the call overlays seed
 * themselves with `?? 0` and pin at `00:00`. The two clocks genuinely disagree
 * in production; this port gives every session a max, so the disagreement
 * cannot arise, and the constant is kept only to name the default.
 */
export const FALLBACK_MAX_DURATION_SECONDS = 300;

/** Video is 1.5× the chat rate unless the mentor sets one explicitly. */
export const VIDEO_RATE_MULTIPLIER = 1.5;

/**
 * The balance that buys the platform's minimum session — the `minRequired` in
 * the 402 payload and in `sessionCostMessage`.
 */
export function minRequiredBalance(ratePerMinute: number): number {
  return ratePerMinute * MIN_SESSION_MINUTES;
}

/**
 * How many seconds `balance` buys at `ratePerMinute`.
 *
 * A zero or negative rate (free chat, or a mentor with no rate set) buys no
 * meaningful window, so it falls back rather than returning Infinity — an
 * infinite timer would make the countdown never tick and the session never end.
 */
export function maxDurationSecondsFor(
  balance: number,
  ratePerMinute: number,
): number {
  if (ratePerMinute <= 0) return FALLBACK_MAX_DURATION_SECONDS;
  return Math.max(0, Math.floor((balance / ratePerMinute) * 60));
}

/**
 * `ChatState.timerDisplay` and both call overlays: `MM:SS`, both parts padded,
 * **minutes not capped at 59** — a ninety-minute session reads `90:00`.
 */
export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

/**
 * The grace-period timer in the chat header uses a DIFFERENT format from every
 * other timer in the app: `'${g ~/ 60}:${(g % 60).padLeft(2,'0')}'` —
 * `waitingForUserWithTimer`, e.g. `"2:05"` but `"12:05"` too, minutes unpadded.
 * Two formats two widgets apart, both reproduced.
 */
export function formatGraceClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`;
}

export function isTimerWarning(
  remainingSeconds: number,
  isSessionActive: boolean,
): boolean {
  return remainingSeconds <= TIMER_WARNING_SECONDS && isSessionActive;
}

/** `CurrencyFormat.formatAmount` — whole rupees lose their decimals. */
export function formatAmount(amount: number): string {
  return Number.isInteger(amount) ? amount.toFixed(0) : amount.toFixed(2);
}

/** The rate a mode switch to `type` would bill at. */
export function rateForType(
  currentRate: number,
  type: SessionType,
  videoRatePerMinute?: number | null,
): number {
  if (type !== 'video') return currentRate;
  return videoRatePerMinute ?? currentRate * VIDEO_RATE_MULTIPLIER;
}

/** One billable stretch of a session — `SegmentSummary`. */
export type BillingSegment = {
  type: SessionType;
  durationSeconds: number;
  ratePerMinute: number;
  cost: number;
};

/**
 * `POST /session/{id}/end`'s payload, assembled from the segments.
 *
 * Rounding to paise happens once, here, so the three money fields always add
 * up: `gross = Σ cost`, `fee = round(gross × 0.5)`, `net = gross − fee`. Doing
 * it per-segment would let the parts drift from the whole.
 */
export function buildBillingSummary(
  sessionId: string,
  segments: BillingSegment[],
): SessionBillingSummary {
  const totalDurationSeconds = segments.reduce(
    (sum, s) => sum + s.durationSeconds,
    0,
  );
  const gross = round2(segments.reduce((sum, s) => sum + s.cost, 0));
  const platformFee = round2(gross * PLATFORM_FEE_SHARE);

  return {
    sessionId,
    totalDurationSeconds,
    grossAmount: gross,
    platformFee,
    mentorEarning: round2(gross - platformFee),
  };
}

/**
 * What it costs to sit in a session for `durationSeconds` at `ratePerMinute`.
 *
 * Free chat bills nothing — `billingType == 'free_intro'` is the one case where
 * time passes and no money moves, which is why the amount renders as the
 * literal "Free" rather than `₹0`.
 */
export function costOf(
  durationSeconds: number,
  ratePerMinute: number,
  billingType: BillingType,
): number {
  if (billingType === 'free_intro') return 0;
  return round2((durationSeconds / 60) * ratePerMinute);
}

/** Money is held to paise; float drift would show up as ₹0.30000000000004. */
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * The simulated network's pacing.
 *
 * Production's real latencies are unknown from the source, so these are chosen
 * to be *visible* — a request that returns instantly would hide the requesting
 * banner, and the banner is a screen a reviewer needs to see.
 */
export const SIM = {
  /** `requesting` → the server's answer. */
  requestMs: 900,
  /** The shortest and longest a simulated mentor takes to accept. */
  acceptMinMs: 2200,
  acceptMaxMs: 4200,
  /** Free chat rings mentors in sequence, so it is slower. */
  freeChatAcceptMs: 5000,
  /** The chat cubit's own ack delay, so ticks settle before "read". */
  ackMs: 700,
  readMs: 1600,
  /** The mentor's typing indicator lead-in before a reply lands. */
  typingMs: 1400,
  /** `Future.delayed(500ms)` before the review sheet — the source's own. */
  reviewSheetDelayMs: 500,
} as const;
