/**
 * The session domain — the union that everything in T3 hangs off.
 *
 * ── It is transcribed from `session_state.dart`, with one omission ──────────
 *
 * The Dart sealed class has twelve states. Ten are reachable from a mentee
 * client and are modelled here. Two are not:
 *
 * - `incomingRequest` is the *mentor's* ring — it carries the mentee's name and
 *   the accept/decline affordances, and no mentee code path can produce it.
 * - `modeSwitchPending` IS reachable (a mentor can ask the mentee to upgrade to
 *   video, and `session_overlay_manager.dart` shows a confirm dialog for it),
 *   so it is modelled in full.
 *
 * ── `pendingSwitchType` is a field, not a state, and that is load-bearing ───
 *
 * When *this* user asks to switch, the Dart emits
 * `active.copyWith(pendingSwitchType: ...)` — the state type does not change.
 * So the chat screen keeps rendering, the timer keeps running, and the banner
 * is the only thing that reacts (a 60-second "Calling… waiting for response"
 * snackbar). Modelling it as its own state would unmount the chat screen
 * mid-call, which is not what the app does.
 *
 * `modeSwitchPending` is the mirror image: a request arriving *from* the mentor
 * IS a distinct state in the Dart, because it replaces the active session with a
 * prompt and the overlay manager pops a modal on it.
 */

export type SessionType = 'chat' | 'audio' | 'video';

/**
 * `billing_type` — three modes, and the strings are the JSON's own.
 *
 * `intro_rate` is the discounted first-N-minutes rate; `free_intro` is free
 * chat. Only `free_intro` changes the UI structurally (the amount renders as
 * "Free" rather than a figure, and the banner says "Free Chat").
 */
export type BillingType = 'paid' | 'intro_rate' | 'free_intro';

/** `SessionEnded.endedBy`. The WS path can also deliver `mentor`. */
export type EndedBy = 'self' | 'mentor' | 'system' | 'timeout';

/**
 * `MenteePrivacySnapshot` — two booleans, both defaulting false.
 *
 * The name is misleading: it is the *mentee's* privacy preferences as sent to
 * the mentor's client, and only `blockCallRecording` is ever read (by the
 * mentor's overlay, to enable Android's secure-screen flag). The mentee's own
 * overlays read nothing from it. It is carried here so the active state has the
 * same shape as production — a mentee-side field that is never read is still a
 * field the state is defined by.
 */
export type MenteePrivacySnapshot = {
  blockScreenshots: boolean;
  blockCallRecording: boolean;
};

/**
 * `SessionBillingSummary` — `POST /session/{id}/end`.
 *
 * Note what is NOT here: a billing type. The WS `session_ended` payload carries
 * `billing_type`, but the bloc drops it when it builds this summary, which is
 * why the mentor app has to cache `_lastBillingType` separately to decide
 * whether to say "Free intro chat".
 *
 * `grossAmount` and `platformFee` are parsed and transported in production and
 * **never displayed anywhere** — the mentee's post-session UI is the review
 * sheet alone, and the details block reads `SessionDetail`, a different model.
 * They are kept here for the same reason: they are part of the payload.
 */
export type SessionBillingSummary = {
  sessionId: string;
  totalDurationSeconds: number;
  grossAmount: number;
  platformFee: number;
  mentorEarning: number;
};

/**
 * The fields shared by `active`, `inCall` and `modeSwitchPending` — the Dart
 * repeats this block verbatim in all three factories.
 */
export type LiveSessionFields = {
  sessionId: string;
  sessionType: SessionType;
  ratePerMinute: number;
  /** Epoch ms. The Dart uses `DateTime`; a number survives a reducer intact. */
  startedAt: number;
  otherUserId: string;
  otherUserName: string;
  otherUserAvatar: string | null;
  /**
   * Nullable in the Dart and defaulted to 300 s by the overlay manager when it
   * seeds the chat cubit — so a session can genuinely arrive without one, and
   * the two clocks can disagree. See `machine.ts` for how it is derived here.
   */
  maxDurationSeconds: number;
  /** Set while a switch requested by *this* user is in flight. */
  pendingSwitchType: SessionType | null;
  prefAudio: boolean;
  prefVideo: boolean;
  billingType: BillingType;
  menteePrivacy: MenteePrivacySnapshot;
  /**
   * Plumbed through the whole Dart stack, documented as a "mentee-only gate",
   * and **never read by either call overlay** — the gate does not exist. Kept
   * so the state matches, with the same non-behaviour.
   */
  minDurationSeconds: number;
};

export type SessionState =
  | { status: 'idle' }
  /**
   * Sent, awaiting the server's acknowledgement of the request itself.
   * `mentorName` is null on the free-chat path, which does not know who it is
   * ringing — `requestFreeChat()` emits `requesting()` with no name at all.
   */
  | { status: 'requesting'; mentorName: string | null }
  | {
      status: 'waitingForMentor';
      sessionId: string;
      mentorId: string;
      mentorName: string;
      mentorAvatar: string | null;
      sessionType: SessionType;
      ratePerMinute: number;
      timeoutSeconds: number;
      billingType: BillingType;
    }
  | {
      status: 'queued';
      sessionId: string;
      mentorId: string;
      mentorName: string;
      queuePosition: number;
    }
  | ({ status: 'active' } & LiveSessionFields)
  | ({
      status: 'inCall';
      callType: SessionType;
      agoraChannel: string;
      agoraToken: string;
      agoraUid: number;
      agoraAppId: string;
    } & LiveSessionFields)
  | ({
      status: 'modeSwitchPending';
      requestedType: SessionType;
      requesterName: string;
      currentRate: number;
      newRate: number;
    } & LiveSessionFields)
  | { status: 'ended'; summary: SessionBillingSummary; endedBy: EndedBy }
  | { status: 'rejected'; sessionId: string }
  | { status: 'cancelled'; sessionId: string }
  | { status: 'error'; message: string; sessionId: string | null };

/**
 * The three states that carry a live session — the ones the banner and the
 * overlay manager both branch on.
 */
export function isLive(
  state: SessionState,
): state is Extract<SessionState, { status: 'active' | 'inCall' | 'modeSwitchPending' }> {
  return (
    state.status === 'active' ||
    state.status === 'inCall' ||
    state.status === 'modeSwitchPending'
  );
}

/**
 * `SessionState.sessionId` — the Dart's own getter, which returns null for the
 * states that have no session yet.
 */
export function sessionIdOf(state: SessionState): string | null {
  switch (state.status) {
    case 'idle':
    case 'requesting':
      return null;
    case 'error':
      return state.sessionId;
    default:
      if ('sessionId' in state) return state.sessionId;
      return null;
  }
}
