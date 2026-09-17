'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  buildBillingSummary,
  costOf,
  FINAL_CHIME_SECONDS,
  formatClock,
  isTimerWarning,
  maxDurationSecondsFor,
  minRequiredBalance,
  rateForType,
  SIM,
  TIMER_WARNING_SECONDS,
  type BillingSegment,
} from '@/lib/session/machine';
import {
  isLive,
  type BillingType,
  type EndedBy,
  type SessionState,
  type SessionType,
} from '@/lib/session/types';
import { freeChatMentor } from '@/lib/fake/free-chat';
import { useWallet } from './wallet-provider';
import { useDemo } from './demo-provider';

/**
 * SessionProvider — `SessionBloc`, plus the parts of `SessionOverlayManager`
 * that decide *when* things happen.
 *
 * ── Two contexts, one provider, and the reason is the ticking clock ─────────
 *
 * A session re-renders on two completely different cadences: the state union
 * changes a handful of times per session, and the countdown changes every
 * second for minutes. Putting `remainingSeconds` on the same context as the
 * union would re-render every consumer of the session — the mentor profile's
 * bottom bar, the feed's cards, the whole account tab — once a second.
 *
 * So this component provides TWO contexts. `SessionContext` is memoised against
 * the union alone and is stable across ticks; `SessionClockContext` carries
 * only the derived display and is the one that changes every second. A screen
 * that wants to know *whether* a session is running reads the first; a widget
 * that draws the countdown reads the second. `children` is passed through
 * untouched, so React bails out of re-rendering the subtree on a tick and only
 * the clock's own consumers update.
 *
 * ── The simulation is the SERVER, not the app ───────────────────────────────
 *
 * Everything time-based in the effects below stands in for a backend that does
 * not exist here: the request round-trip, the mentor accepting, the ring
 * timeout, Agora credentials arriving. The reducer knows only how to move
 * between states; the effects decide when. That split means this could be
 * driven by a real backend by deleting the effects and dispatching the same
 * actions.
 *
 * `request()` deliberately does NOT pre-check the balance. Production sends the
 * request and the server answers 402; the check lives in the simulated server
 * response so the error path a reviewer sees arrives at the moment the real one
 * does, with the real payload.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

type PendingRequest = {
  mentorId: string;
  mentorName: string;
  mentorAvatar: string | null;
  sessionType: SessionType;
  ratePerMinute: number;
  prefAudio: boolean;
  prefVideo: boolean;
};

type WaitingSession = {
  sessionId: string;
  mentorId: string;
  mentorName: string;
  mentorAvatar: string | null;
  sessionType: SessionType;
  ratePerMinute: number;
  timeoutSeconds: number;
  /**
   * `SessionWaitingForMentor.billingType`. Carried into the waiting state so
   * `accepted` can pass it on to the active session — this is how a free
   * chat's zero-rate billing survives the ring.
   */
  billingType: BillingType;
};

export type IncomingSwitch = {
  requestedType: SessionType;
  requesterName: string;
  currentRate: number;
  newRate: number;
};

export type EndedSession = {
  summary: ReturnType<typeof buildBillingSummary>;
  endedBy: EndedBy;
  mentorName: string;
  mentorAvatar: string | null;
  sessionType: SessionType;
  startedAt: number;
};

type Action =
  | {
      type: 'request';
      pending: PendingRequest;
      /**
       * What the REQUESTING bar shows. Not `pending.mentorName`: the paid path
       * knows the name before it asks, and the free-chat path does not know it
       * until the server answers, so the two differ at this step while sharing
       * everything after it.
       */
      requestingName: string | null;
    }
  | { type: 'waiting'; session: WaitingSession }
  | {
      type: 'accepted';
      maxDurationSeconds: number;
      prefAudio: boolean;
      prefVideo: boolean;
    }
  | { type: 'rejected'; sessionId: string }
  | { type: 'timedOut' }
  | { type: 'cancel' }
  | { type: 'error'; message: string; sessionId: string | null }
  | {
      type: 'end';
      summary: ReturnType<typeof buildBillingSummary>;
      endedBy: EndedBy;
    }
  | { type: 'switchRequested'; newType: SessionType }
  | { type: 'switchOutgoingAccepted' }
  | { type: 'switchIncoming'; payload: IncomingSwitch }
  | { type: 'switchAccepted' }
  | { type: 'switchDeclined' }
  | { type: 'enterCall' }
  | { type: 'endCall' }
  | { type: 'reset' };

/**
 * The fake Agora credentials a real `recoverSession` returns. Nothing consumes
 * them — a browser prototype has no WebRTC engine — but `inCall` is *defined*
 * by carrying them, so they exist rather than being omitted.
 */
const FAKE_AGORA = {
  agoraChannel: 'mt_demo_channel',
  agoraToken: 'demo-token',
  agoraUid: 1,
  agoraAppId: 'demo-app-id',
};

const DEFAULT_PRIVACY = {
  blockScreenshots: false,
  blockCallRecording: false,
};

function newSessionId(): string {
  return `sess_${Math.random().toString(36).slice(2, 10)}`;
}

// ─── Reducer ────────────────────────────────────────────────────────────────

function reducer(state: SessionState, action: Action): SessionState {
  switch (action.type) {
    case 'request':
      // `emit(SessionRequesting(mentorName: ...))`. Free chat passes null.
      return { status: 'requesting', mentorName: action.requestingName };

    case 'waiting':
      return {
        status: 'waitingForMentor',
        sessionId: action.session.sessionId,
        mentorId: action.session.mentorId,
        mentorName: action.session.mentorName,
        mentorAvatar: action.session.mentorAvatar,
        sessionType: action.session.sessionType,
        ratePerMinute: action.session.ratePerMinute,
        timeoutSeconds: action.session.timeoutSeconds,
        billingType: action.session.billingType,
      };

    case 'accepted': {
      if (state.status !== 'waitingForMentor') return state;
      return {
        status: 'active',
        sessionId: state.sessionId,
        sessionType: state.sessionType,
        ratePerMinute: state.ratePerMinute,
        startedAt: Date.now(),
        otherUserId: state.mentorId,
        otherUserName: state.mentorName,
        otherUserAvatar: state.mentorAvatar,
        maxDurationSeconds: action.maxDurationSeconds,
        pendingSwitchType: null,
        prefAudio: action.prefAudio,
        prefVideo: action.prefVideo,
        billingType: state.billingType,
        menteePrivacy: DEFAULT_PRIVACY,
        minDurationSeconds: 0,
      };
    }

    case 'rejected':
      return { status: 'rejected', sessionId: action.sessionId };

    case 'timedOut':
      // `if (state is SessionWaitingForMentor) emit(rejected(...))` — the ring
      // timeout becomes a rejection, not a cancellation.
      if (state.status !== 'waitingForMentor') return state;
      return { status: 'rejected', sessionId: state.sessionId };

    case 'cancel':
      return state.status === 'waitingForMentor' || state.status === 'queued'
        ? { status: 'cancelled', sessionId: state.sessionId }
        : { status: 'idle' };

    case 'error':
      return { status: 'error', message: action.message, sessionId: action.sessionId };

    case 'end':
      return { status: 'ended', summary: action.summary, endedBy: action.endedBy };

    case 'switchRequested':
      // `copyWith(pendingSwitchType:)` — the state TYPE does not change, so the
      // chat screen keeps rendering and the timer keeps running.
      if (state.status !== 'active') return state;
      return { ...state, pendingSwitchType: action.newType };

    case 'switchOutgoingAccepted': {
      if (state.status !== 'active' || state.pendingSwitchType === null) return state;
      return {
        ...state,
        status: 'inCall',
        callType: state.pendingSwitchType,
        startedAt: Date.now(),
        pendingSwitchType: null,
        ...FAKE_AGORA,
      };
    }

    case 'switchIncoming':
      // Unlike the outgoing case this IS a distinct state in the Dart: the
      // active session is replaced by a prompt the overlay manager pops a modal
      // on, so the screen behind it stops being the session.
      if (state.status !== 'active') return state;
      return {
        ...state,
        status: 'modeSwitchPending',
        requestedType: action.payload.requestedType,
        requesterName: action.payload.requesterName,
        currentRate: action.payload.currentRate,
        newRate: action.payload.newRate,
      };

    case 'switchAccepted': {
      if (state.status !== 'modeSwitchPending') return state;
      return {
        ...state,
        status: 'inCall',
        callType: state.requestedType,
        ratePerMinute: state.newRate,
        startedAt: Date.now(),
        pendingSwitchType: null,
        ...FAKE_AGORA,
      };
    }

    case 'switchDeclined':
      if (state.status !== 'modeSwitchPending') return state;
      return { ...state, status: 'active' };

    case 'enterCall':
      // `_fetchAndEnterCall` — a call session goes active first (the chat
      // screen is pushed and the timer starts) and only becomes `inCall` once
      // the Agora credentials come back.
      if (state.status !== 'active') return state;
      return {
        ...state,
        status: 'inCall',
        callType: state.sessionType,
        startedAt: Date.now(),
        ...FAKE_AGORA,
      };

    case 'endCall':
      // `endCall` → `active(sessionType: 'chat', startedAt: now)` — the call
      // ending leaves a running chat with a fresh clock, not an ended session.
      if (state.status !== 'inCall') return state;
      return {
        ...state,
        status: 'active',
        sessionType: 'chat',
        startedAt: Date.now(),
        pendingSwitchType: null,
      };

    case 'reset':
      return { status: 'idle' };

    default:
      return state;
  }
}

// ─── Contexts ───────────────────────────────────────────────────────────────

export type SessionRequestArgs = {
  mentorId: string;
  mentorName: string;
  mentorAvatar?: string | null;
  sessionType: SessionType;
  /** The mentor's CHAT rate. Video is derived from it unless overridden. */
  ratePerMinute: number;
  videoRatePerMinute?: number | null;
  prefAudio?: boolean;
  prefVideo?: boolean;
};

type SessionContextValue = {
  state: SessionState;
  request: (args: SessionRequestArgs) => void;
  /**
   * `SessionEvent.requestFreeChat` — the one free intro chat, rung against a
   * mentor the SERVER picks. Distinct from `request` because it takes no
   * mentor, ignores the balance, and bills at zero.
   */
  requestFreeChat: () => void;
  cancel: () => void;
  end: (endedBy?: EndedBy) => void;
  requestModeSwitch: (newType: SessionType) => void;
  acceptModeSwitch: () => void;
  declineModeSwitch: () => void;
  endCall: () => void;
  reset: () => void;
  /** `SessionActive.copyWith` — the rate the running session bills at. */
  ratePerMinute: number;
  /** `isBusy` — the mentor profile's two buttons lock while this is true. */
  isBusy: boolean;
  /**
   * Prototype-only. In production the *mentor's* client raises an upgrade
   * request; there is no mentor here, so the chrome drives it.
   */
  simulateIncomingSwitch: (requestedType: SessionType) => void;
  /** Sessions ended in this browser session, newest first. */
  endedSessions: EndedSession[];
  /**
   * Internal plumbing for the clock. Not part of the app's surface — exported
   * because the countdown lives in this file but is published on its own
   * context.
   */
  recordSecond: () => void;
};

type ClockValue = {
  remainingSeconds: number;
  /** `MM:SS`, minutes uncapped — `ChatState.timerDisplay`. */
  display: string;
  isWarning: boolean;
};

const SessionContext = createContext<SessionContextValue | null>(null);
const SessionClockContext = createContext<ClockValue>({
  remainingSeconds: 0,
  display: '00:00',
  isWarning: false,
});

export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { status: 'idle' });
  const [endedSessions, setEndedSessions] = useState<EndedSession[]>([]);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  const { balance, debit } = useWallet();
  const { sessionFault } = useDemo();

  /**
   * The in-flight request and the fault it was made under.
   *
   * The fault is frozen at request time on purpose: a reviewer flipping the
   * chrome's fault selector while a request is in the air should not change the
   * answer to a request already sent.
   */
  const pendingRef = useRef<PendingRequest | null>(null);
  const faultRef = useRef(sessionFault);

  /**
   * The authoritative balance, for the same reason the wallet keeps its own:
   * the accept step needs today's balance to size the session, and reading it
   * out of React state would be a render behind.
   */
  const balanceRef = useRef(balance);
  useEffect(() => {
    balanceRef.current = balance;
  }, [balance]);

  /**
   * The billable stretches of the running session, accumulated one second at a
   * time. A mode switch starts a new segment at the new rate, so a
   * chat-then-video session bills each part at its own rate rather than the
   * whole thing at whichever rate happened to be last.
   */
  const segmentsRef = useRef<BillingSegment[]>([]);

  /** What the running session bills at — read by the tick and the summary. */
  const liveRateRef = useRef(0);
  const billingTypeRef = useRef<'paid' | 'intro_rate' | 'free_intro'>('paid');
  /**
   * Set by `requestFreeChat` and consumed once by Effect 1, which has to know
   * which of the two server simulations to run. A ref rather than state because
   * it is read inside an effect that must not re-run when it changes.
   */
  const freeChatRef = useRef(false);
  const liveRef = useRef<{
    sessionId: string;
    sessionType: SessionType;
    mentorName: string;
    mentorAvatar: string | null;
    startedAt: number;
  } | null>(null);

  liveRateRef.current =
    state.status === 'active' ||
    state.status === 'inCall' ||
    state.status === 'modeSwitchPending'
      ? state.ratePerMinute
      : 0;

  billingTypeRef.current =
    state.status === 'active' ||
    state.status === 'inCall' ||
    state.status === 'modeSwitchPending'
      ? state.billingType
      : 'paid';

  liveRef.current =
    state.status === 'active' ||
    state.status === 'inCall' ||
    state.status === 'modeSwitchPending'
      ? {
          sessionId: state.sessionId,
          sessionType: state.sessionType,
          mentorName: state.otherUserName,
          mentorAvatar: state.otherUserAvatar,
          startedAt: state.startedAt,
        }
      : null;

  /** Called by the tick, once per elapsed second. */
  const recordSecond = useCallback(() => {
    const live = liveRef.current;
    if (!live) return;

    const rate = liveRateRef.current;
    const billingType = billingTypeRef.current;
    const segments = segmentsRef.current;
    const last = segments[segments.length - 1];

    if (last && last.type === live.sessionType && last.ratePerMinute === rate) {
      last.durationSeconds += 1;
      last.cost = costOf(last.durationSeconds, rate, billingType);
      return;
    }

    segments.push({
      type: live.sessionType,
      durationSeconds: 1,
      ratePerMinute: rate,
      cost: costOf(1, rate, billingType),
    });
  }, []);

  const end = useCallback((endedBy: EndedBy = 'self') => {
    const live = liveRef.current;
    if (!live) return;

    const summary = buildBillingSummary(live.sessionId, segmentsRef.current);

    setEndedSessions((current) => [
      {
        summary,
        endedBy,
        mentorName: live.mentorName,
        mentorAvatar: live.mentorAvatar,
        sessionType: live.sessionType,
        startedAt: live.startedAt,
      },
      ...current,
    ]);

    dispatch({ type: 'end', summary, endedBy });
  }, []);

  const request = useCallback(
    (args: SessionRequestArgs) => {
      if (state.status !== 'idle') return;

      const ratePerMinute = rateForType(
        args.ratePerMinute,
        args.sessionType,
        args.videoRatePerMinute,
      );

      const pending: PendingRequest = {
        mentorId: args.mentorId,
        mentorName: args.mentorName,
        mentorAvatar: args.mentorAvatar ?? null,
        sessionType: args.sessionType,
        ratePerMinute,
        prefAudio: args.prefAudio ?? true,
        prefVideo: args.prefVideo ?? true,
      };

      pendingRef.current = pending;
      faultRef.current = sessionFault;
      segmentsRef.current = [];

      dispatch({ type: 'request', pending, requestingName: pending.mentorName });
    },
    [state.status, sessionFault],
  );

  /**
   * `SessionEvent.requestFreeChat` — the offer screen's only entry point.
   *
   * ── The mentor is chosen HERE, and that is a deliberate divergence ────────
   *
   * The bloc seeds `mentorId: ''` and comments: *"the mentor id is not in the
   * response, so the chat thread stays on an empty placeholder id until
   * accept/forward binds the real one."* The real binding arrives over the
   * websocket as a `session_accepted` payload. A browser prototype has no
   * socket, so the id is picked up front from the same fixture the name and
   * avatar come from — the state a reviewer sees after the ring is the state
   * the real app settles into, and only the delivery of the id differs.
   *
   * ── The mentor is picked from `MENTORS`, and it is a real one ────────────
   *
   * Picking a mentor who does not exist would put a name in the header and then
   * break the chat screen the moment the session went active. So the fixture
   * mentor is the one the free chat binds to, which also means the chat thread
   * after a free chat looks like any other — same mentor, same profile link.
   */
  const requestFreeChat = useCallback(() => {
    if (state.status !== 'idle') return;

    const mentor = freeChatMentor();

    pendingRef.current = {
      mentorId: mentor.id,
      mentorName: mentor.displayName,
      mentorAvatar: mentor.profilePhotoUrl,
      sessionType: 'chat',
      // Zero, and it stays zero: `costOf` returns 0 for `free_intro` whatever
      // the rate, so this is belt and braces on top of the billing type.
      ratePerMinute: 0,
      prefAudio: true,
      prefVideo: true,
    };
    faultRef.current = sessionFault;
    segmentsRef.current = [];
    freeChatRef.current = true;

    // `emit(const SessionState.requesting())` — no mentor name at all, so the
    // requesting bar cannot show who is being rung. It is filled in only once
    // the server answers.
    dispatch({ type: 'request', pending: pendingRef.current, requestingName: null });
  }, [state.status, sessionFault]);

  /**
   * The simulated server — every branch an error mapping transcribed from
   * `session_bloc.dart`, reached by the same trigger the real one uses.
   */
  const respondAsServer = useCallback(() => {
    const pending = pendingRef.current;
    if (!pending) return;

    const fault = faultRef.current;
    const rate = pending.ratePerMinute;
    const minRequired = minRequiredBalance(rate);
    const currentBalance = balanceRef.current;

    if (fault === 'insufficient' || currentBalance < minRequired) {
      // The bloc encodes a pipe-delimited payload the overlay PARSES to build
      // "This session costs ₹X/min. You need at least ₹Y for a 5-minute
      // session." — so the message is data, not prose.
      const shortfall = Math.ceil(minRequired - currentBalance);
      dispatch({
        type: 'error',
        message: `INSUFFICIENT_BALANCE|${rate}|${minRequired}|${currentBalance}|${shortfall}`,
        sessionId: null,
      });
      return;
    }

    if (fault === 'unavailable') {
      dispatch({
        type: 'error',
        message: 'Mentor not available right now.',
        sessionId: null,
      });
      return;
    }

    if (fault === 'busy') {
      dispatch({
        type: 'error',
        message: 'You already have an active session.',
        sessionId: null,
      });
      return;
    }

    if (fault === 'maintenance') {
      dispatch({
        type: 'error',
        message: 'No mentors available right now. Please try again later.',
        sessionId: null,
      });
      return;
    }

    const sessionId = newSessionId();

    if (fault === 'rejected') {
      dispatch({ type: 'rejected', sessionId });
      return;
    }

    dispatch({
      type: 'waiting',
      session: {
        sessionId,
        mentorId: pending.mentorId,
        mentorName: pending.mentorName,
        mentorAvatar: pending.mentorAvatar,
        sessionType: pending.sessionType,
        ratePerMinute: rate,
        // `response.timeoutSeconds ?? 60` — the ring window the server grants.
        timeoutSeconds: 60,
        billingType: 'paid',
      },
    });
  }, []);

  /**
   * ── The free-chat server, which is a different endpoint entirely ──────────
   *
   * `SessionEvent.requestFreeChat` does NOT go through `_onRequestSession`. It
   * POSTs to `/session/free-chat`, where the server picks an eligible mentor
   * itself, and it therefore:
   *
   *   - ignores the balance completely — `ratePerMinute: 0`, so
   *     `minRequiredBalance(0)` is 0 and the `INSUFFICIENT_BALANCE` arm cannot
   *     fire. A mentee with ₹0 can still take the free chat, which is the point.
   *   - seeds a mentor NAME and AVATAR from the response "so the wait isn't
   *     anonymous — the header shows who is being rung", while leaving the id
   *     empty, because the id is not in that response.
   *   - rings longer: `_startTimeout(sessionId, 180)` against the paid path's
   *     60, because the server forwards to a second mentor on timeout.
   *   - can answer 503, which maps to the "no mentors available" error rather
   *     than to a generic failure.
   */
  const respondAsFreeChatServer = useCallback(() => {
    const pending = pendingRef.current;
    if (!pending) return;

    if (faultRef.current === 'maintenance') {
      dispatch({
        type: 'error',
        message: 'No mentors available right now. Please try again later.',
        sessionId: null,
      });
      return;
    }

    dispatch({
      type: 'waiting',
      session: {
        sessionId: newSessionId(),
        mentorId: pending.mentorId,
        mentorName: pending.mentorName,
        mentorAvatar: pending.mentorAvatar,
        sessionType: 'chat',
        ratePerMinute: 0,
        timeoutSeconds: 180,
        billingType: 'free_intro',
      },
    });
  }, []);

  // ── Effect 1: the request round-trip ──────────────────────────────────────
  useEffect(() => {
    if (state.status !== 'requesting') return;
    const respond = freeChatRef.current ? respondAsFreeChatServer : respondAsServer;
    freeChatRef.current = false;
    const t = setTimeout(respond, SIM.requestMs);
    return () => clearTimeout(t);
  }, [state.status, respondAsServer, respondAsFreeChatServer]);

  // ── Effect 2: the mentor answers, or the ring times out ───────────────────
  useEffect(() => {
    if (state.status !== 'waitingForMentor') return;

    const { ratePerMinute, timeoutSeconds, billingType } = state;
    const pending = pendingRef.current;
    const isFree = billingType === 'free_intro';

    const accept = setTimeout(
      () => {
        dispatch({
          type: 'accepted',
          // The server sizes the session from the mentee's balance and the
          // rate. At a free chat's rate of 0 that is unbounded — see
          // `maxDurationSecondsFor`, which returns a full window rather than
          // dividing by zero.
          maxDurationSeconds: maxDurationSecondsFor(balanceRef.current, ratePerMinute),
          prefAudio: pending?.prefAudio ?? true,
          prefVideo: pending?.prefVideo ?? true,
        });
      },
      // Free chat "rings mentors in sequence, so it is slower" — the constant
      // was reserved for this path and had no caller until now.
      isFree ? SIM.freeChatAcceptMs : randomBetween(SIM.acceptMinMs, SIM.acceptMaxMs),
    );

    // `_startTimeout` fires at `seconds + 10`, not at `seconds` — the grace is
    // deliberate, so a late accept still lands inside the window. The free
    // path's `seconds` is 180 rather than 60, because the server forwards to a
    // second mentor on timeout and each ring can be delivered late.
    const ring = setTimeout(
      () => dispatch({ type: 'timedOut' }),
      (timeoutSeconds + 10) * 1000,
    );

    return () => {
      clearTimeout(accept);
      clearTimeout(ring);
    };
  }, [state]);

  // ── Effect 3: a call session enters the call once Agora answers ───────────
  useEffect(() => {
    if (state.status !== 'active' || state.sessionType === 'chat') return;
    // `_deferUntilSettled` waits for the router to settle before joining; here
    // that is the pause between the chat screen mounting and the call covering it.
    const t = setTimeout(() => dispatch({ type: 'enterCall' }), 900);
    return () => clearTimeout(t);
  }, [state]);

  // ── Effect 4: the mentor answers an upgrade this user asked for ───────────
  useEffect(() => {
    if (state.status !== 'active' || state.pendingSwitchType === null) return;
    const t = setTimeout(
      () => dispatch({ type: 'switchOutgoingAccepted' }),
      SIM.acceptMinMs,
    );
    return () => clearTimeout(t);
  }, [state]);

  // ── Effect 5: the countdown, the meter, and the low-balance chimes ────────
  const live = isLive(state);
  const sessionId = live ? state.sessionId : null;
  const maxDurationSeconds = live ? state.maxDurationSeconds : 0;

  useEffect(() => {
    if (!live || maxDurationSeconds <= 0) {
      setRemainingSeconds(0);
      return;
    }

    setRemainingSeconds(maxDurationSeconds);

    /**
     * `elapsed` and `billed` are separate so the wallet is charged the exact
     * amount owed rather than a rounded per-second slice. Debiting `rate/60`
     * every tick drifts: at ₹20/min a ten-minute session would be off by
     * several rupees. Charging the *difference* between what is owed now and
     * what has been charged keeps the total exact AND moves the badge every
     * second.
     */
    let elapsed = 0;
    let billed = 0;
    let chimeFiredAtWarning = false;
    let chimeFiredAtFinal = false;

    const id = setInterval(() => {
      elapsed += 1;

      const rate = liveRateRef.current;
      const isFree = billingTypeRef.current === 'free_intro';

      if (!isFree && rate > 0) {
        const owed = round2((elapsed / 60) * rate);
        const delta = round2(owed - billed);
        if (delta > 0) {
          debit(delta);
          billed = owed;
        }
      }

      recordSecond();

      const remaining = Math.max(0, maxDurationSeconds - elapsed);
      setRemainingSeconds(remaining);

      // `session_overlay_manager.dart` chimes at exactly 2:00 and 0:30, and
      // re-arms both when a recharge pushes the timer back above 2:00.
      if (remaining > TIMER_WARNING_SECONDS) {
        chimeFiredAtWarning = false;
        chimeFiredAtFinal = false;
      } else {
        if (remaining === TIMER_WARNING_SECONDS && !chimeFiredAtWarning) {
          chimeFiredAtWarning = true;
          playLowBalanceChime();
        }
        if (remaining === FINAL_CHIME_SECONDS && !chimeFiredAtFinal) {
          chimeFiredAtFinal = true;
          playLowBalanceChime();
        }
      }

      if (remaining <= 0) {
        clearInterval(id);
        // The client timer does not end the session — the SERVER does, when the
        // balance can no longer cover the next second. This is that push.
        endRef.current('system');
      }
    }, 1000);

    return () => clearInterval(id);
  }, [live, sessionId, maxDurationSeconds, debit, recordSecond]);

  // `end` is stable, but the effect must not re-subscribe when it changes
  // identity — the interval above would restart and the clock would jump.
  const endRef = useRef(end);
  endRef.current = end;

  const sessionValue = useMemo<SessionContextValue>(
    () => ({
      state,
      request,
      requestFreeChat,
      cancel: () => dispatch({ type: 'cancel' }),
      end,
      requestModeSwitch: (newType: SessionType) =>
        dispatch({ type: 'switchRequested', newType }),
      acceptModeSwitch: () => dispatch({ type: 'switchAccepted' }),
      declineModeSwitch: () => dispatch({ type: 'switchDeclined' }),
      endCall: () => dispatch({ type: 'endCall' }),
      reset: () => {
        segmentsRef.current = [];
        pendingRef.current = null;
        dispatch({ type: 'reset' });
      },
      ratePerMinute: liveRateRef.current,
      isBusy: state.status !== 'idle',
      simulateIncomingSwitch: (requestedType: SessionType) => {
        const current = liveRef.current;
        if (!current) return;
        dispatch({
          type: 'switchIncoming',
          payload: {
            requestedType,
            requesterName: current.mentorName,
            currentRate: liveRateRef.current,
            newRate: rateForType(liveRateRef.current, requestedType),
          },
        });
      },
      endedSessions,
      recordSecond,
    }),
    [state, request, requestFreeChat, end, endedSessions, recordSecond],
  );

  const clockValue = useMemo<ClockValue>(
    () => ({
      remainingSeconds,
      display: formatClock(remainingSeconds),
      isWarning: isTimerWarning(remainingSeconds, live),
    }),
    [remainingSeconds, live],
  );

  return (
    <SessionContext.Provider value={sessionValue}>
      <SessionClockContext.Provider value={clockValue}>
        {children}
      </SessionClockContext.Provider>
    </SessionContext.Provider>
  );
}

/**
 * The countdown, isolated so the per-second tick does not re-render the app.
 *
 * Only widgets that DRAW the timer should call this — the chat screen's app-bar
 * subtitle and the call overlays. Anything that merely needs to know whether a
 * session is running wants `useSession` instead.
 */
export function useSessionClock(): ClockValue {
  return useContext(SessionClockContext);
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside a SessionProvider');
  return ctx;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * `sounds/low_balance_chime.mp3` at 2:00 and 0:30, with a heavy haptic in the
 * real app. Browsers gate audio until the page has been interacted with — by
 * the time a session is running the reviewer has tapped at least twice, so this
 * plays; if a browser refuses anyway it must not break the session, hence the
 * swallow.
 */
function playLowBalanceChime(): void {
  try {
    const audio = new Audio('/assets/sounds/low_balance_chime.mp3');
    void audio.play().catch(() => undefined);
  } catch {
    /* autoplay refused — the timer is the important part */
  }
}
