'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PhoneOverlay } from '@/components/prototype/phone-frame';
import { AppModal } from '@/design-system';
import { copy, fill } from '@/lib/copy';
import { useSession } from '@/lib/state/session-provider';
import { useSnackbar } from '@/lib/state/snackbar-provider';
import { useReviews } from '@/lib/state/reviews-provider';
import { AudioCallOverlay, VideoCallOverlay } from './call-overlays';
import { ReviewSheet } from './review-sheet';
import { SessionBanner } from './session-banner';

/**
 * SessionChrome — the port of `session_overlay_manager.dart`.
 *
 * ── What this file is ───────────────────────────────────────────────────────
 *
 * In Flutter, `SessionOverlayManager` is a widget wrapped around every route in
 * `_AppShell` that listens to the global `SessionBloc` and *pushes things onto
 * the navigator* in response to state changes. It owns no UI of its own. This is
 * the same thing: one listener on `useSession()`, deciding which of the five
 * overlays is up, plus the call overlay and the banner.
 *
 * Putting it in the root layout rather than in a page is what makes a running
 * session survive navigation — start a session on a mentor's profile, walk to
 * the wallet, and the banner is still there, exactly as in production.
 *
 * ── The five rules, in the source's order ───────────────────────────────────
 *
 *   1. `modeSwitchPending`    → a confirm modal (Accept / Decline)
 *   2. `ended`                → after **500 ms**, the review sheet; closing it
 *                               resets the session
 *   3. `rejected`             → an info modal ("mentor didn't respond") → reset
 *   4. `cancelled`            → reset immediately, no UI
 *   5. `error`                → a snackbar, or the insufficient-balance modal if
 *                               the message is the pipe-delimited payload
 *
 * The 500 ms on rule 2 is the source's own `Future.delayed`, and it is not
 * cosmetic: it lets the call overlay finish dismissing before the sheet rises,
 * so ending a call does not stack a sheet on top of a dissolving overlay.
 *
 * ── The `INSUFFICIENT_BALANCE|` payload ─────────────────────────────────────
 *
 * The server answers a 402 with a *string*, not JSON:
 *
 *     INSUFFICIENT_BALANCE|{rate}|{minRequired}|{currentBalance}|{shortfall}
 *
 * and the manager splits it to build the modal copy. It is parsed here for the
 * same reason: the copy needs the rate and the minimum, and the state's
 * `message` is the only place they exist. A four-part split that does not yield
 * four parts falls through to the plain snackbar rather than rendering a modal
 * full of `undefined`.
 *
 * ── Prototype-only ──────────────────────────────────────────────────────────
 *
 * The banner's "minimised call" state. In production a route observer answers
 * "is the call overlay on top?"; here the chrome owns the overlay, so it owns
 * that flag and passes it down. See `session-banner.tsx`.
 */

const BALANCE_PREFIX = 'INSUFFICIENT_BALANCE|';

export function SessionChrome() {
  const router = useRouter();
  const { show } = useSnackbar();
  const { state, reset, acceptModeSwitch, declineModeSwitch, endCall } =
    useSession();
  const { post } = useReviews();

  /**
   * The last live session's peer — read when `ended` arrives, which drops it.
   *
   * The avatar is cached alongside the name because the review sheet's submit
   * writes a row that `/reviews` renders with a face on it, and by the time the
   * sheet is submitted the session it came from is long gone.
   */
  const lastPeerRef = useRef<{ name: string; avatar: string | null } | null>(null);
  if (
    state.status === 'active' ||
    state.status === 'inCall' ||
    state.status === 'modeSwitchPending'
  ) {
    lastPeerRef.current = {
      name: state.otherUserName,
      avatar: state.otherUserAvatar ?? null,
    };
  }

  /**
   * Whether the call overlay is collapsed to the banner.
   *
   * Reset whenever a call is not running, so the next call always starts
   * full-screen — a `useState` left true by a previous call would open the next
   * one minimised, which is not a state the app can reach.
   */
  const [callMinimised, setCallMinimised] = useState(false);
  if (state.status !== 'inCall' && callMinimised) setCallMinimised(false);

  // ── Rule 2: the review sheet, 500 ms after `ended` ────────────────────────
  const [reviewFor, setReviewFor] = useState<{
    id: string;
    name: string;
    avatar: string | null;
  } | null>(null);
  /**
   * Guards against re-opening. The manager uses the same idea with
   * `_isReviewShowing`, but keyed on a boolean; keying on the *session id* here
   * means a second session's review still opens even if the first one was
   * dismissed in the same tick.
   */
  const reviewShownFor = useRef<string | null>(null);

  useEffect(() => {
    if (state.status !== 'ended') return;
    const sessionId = state.summary.sessionId;
    if (reviewShownFor.current === sessionId) return;
    reviewShownFor.current = sessionId;

    // The mentor's name and avatar are not on `ended` — the summary carries only
    // money. The manager reads them off the bloc's cached `_lastSession`, so the
    // chrome caches them the same way, at the last moment they were known.
    const peer = lastPeerRef.current;

    const timer = window.setTimeout(() => {
      setReviewFor({
        id: sessionId,
        name: peer?.name ?? 'Mentor',
        avatar: peer?.avatar ?? null,
      });
    }, 500);

    return () => window.clearTimeout(timer);
  }, [state]);

  // ── Rules 3 & 4: rejected and cancelled both reset ────────────────────────
  useEffect(() => {
    if (state.status === 'cancelled') reset();
  }, [state.status, reset]);

  // ── Rule 5: the error branches ────────────────────────────────────────────
  const errorShownFor = useRef<string | null>(null);
  useEffect(() => {
    if (state.status !== 'error') return;
    // `sessionId` is null for a fault raised before a session existed, which
    // makes the id itself unusable as a dedupe key — the message stands in.
    const key = state.sessionId ?? state.message;
    if (errorShownFor.current === key) return;
    errorShownFor.current = key;

    if (state.message.startsWith(BALANCE_PREFIX)) {
      const parts = state.message.split('|');
      const rate = Number(parts[1]);
      const minRequired = Number(parts[2]);
      if (Number.isFinite(rate) && Number.isFinite(minRequired)) {
        setBalanceError({ rate, minRequired });
        return;
      }
    }

    // Every other error is a snackbar, then a reset. `callDeclined` is the one
    // the source names explicitly; anything else shows the raw message.
    show(state.message === 'CALL_DECLINED' ? copy.callDeclined : state.message);
    reset();
  }, [state, show, reset]);

  // ── The outgoing-switch snackbar ──────────────────────────────────────────
  /**
   * `SessionActive.copyWith(pendingSwitchType: ...)` — the state *type* does not
   * change, so this is a field watch, not a state watch. The source shows a
   * 60-second snackbar while the mentor decides; the delay before it clears is
   * the ask's own timeout, so it is not reproduced here (the provider's accept
   * timer is the real clock).
   */
  const pendingSwitch =
    state.status === 'active' || state.status === 'inCall'
      ? state.pendingSwitchType
      : null;
  useEffect(() => {
    if (pendingSwitch === null) return;
    show(
      fill(copy.callingWaiting, {
        type:
          pendingSwitch === 'video' ? copy.videoLabel : copy.audioCallLabel,
      }),
    );
  }, [pendingSwitch, show]);

  const [balanceError, setBalanceError] = useState<{
    rate: number;
    minRequired: number;
  } | null>(null);

  const onOpenChat = useCallback(() => router.push('/chat'), [router]);
  const onReopenCall = useCallback(() => setCallMinimised(false), []);

  const isVideo = state.status === 'inCall' && state.callType === 'video';
  const showCall = state.status === 'inCall' && !callMinimised;

  return (
    <>
      {/* ── The banner ───────────────────────────────────────────────────────
          Rendered in the flow, not the overlay layer: in Flutter it is a
          `Column` child of the shell above the page, so it pushes the page down
          rather than covering it. */}
      <SessionBanner
        callMinimised={callMinimised}
        onOpenChat={onOpenChat}
        onReopenCall={onReopenCall}
      />

      <PhoneOverlay>
        {/* ── The call overlay ───────────────────────────────────────────── */}
        {showCall ? (
          isVideo ? (
            <VideoCallOverlay
              mentorName={state.otherUserName}
              mentorAvatar={state.otherUserAvatar}
              // A real call has a join event; the simulation joins 900 ms in,
              // which the provider models as the transition into `inCall`. The
              // overlay's `remoteJoined` therefore tracks the *peer*, and the
              // peer is the mentor — absent until the mentor accepts, which has
              // already happened by the time this renders.
              remoteJoined
              onMinimize={() => setCallMinimised(true)}
              onEndCall={endCall}
              onSwitchToAudio={() => router.push('/chat')}
            />
          ) : (
            <AudioCallOverlay
              mentorName={state.otherUserName}
              mentorAvatar={state.otherUserAvatar}
              remoteJoined
              onMinimize={() => setCallMinimised(true)}
              onEndCall={endCall}
              onSwitchToVideo={() => router.push('/chat')}
            />
          )
        ) : null}

        {/* ── Rule 1: the incoming mode-switch request ──────────────────── */}
        <AppModal
          open={state.status === 'modeSwitchPending'}
          title={
            state.status === 'modeSwitchPending'
              ? fill(copy.switchToType, {
                  type:
                    state.requestedType === 'video'
                      ? copy.videoLabel
                      : copy.audioCallLabel,
                })
              : ''
          }
          message={
            state.status === 'modeSwitchPending'
              ? state.currentRate === state.newRate
                ? fill(copy.switchRequestMessage, {
                    name: state.requesterName,
                    type:
                      state.requestedType === 'video'
                        ? copy.videoLabel
                        : copy.audioCallLabel,
                  })
                : fill(copy.switchRequestMessageWithRate, {
                    name: state.requesterName,
                    type:
                      state.requestedType === 'video'
                        ? copy.videoLabel
                        : copy.audioCallLabel,
                    oldRate: state.currentRate,
                    newRate: state.newRate,
                  })
              : ''
          }
          // The source renders Cancel first, then Confirm.
          actions={[
            { label: copy.decline, onPress: declineModeSwitch },
            { label: copy.accept, onPress: acceptModeSwitch },
          ]}
          onClose={declineModeSwitch}
          dismissible={false}
        />

        {/* ── Rule 3: the request was rejected ──────────────────────────── */}
        <AppModal
          open={state.status === 'rejected'}
          title={copy.mentorUnavailableTitle}
          message={copy.mentorDidntRespond}
          actions={[{ label: copy.ok, onPress: reset }]}
          onClose={reset}
        />

        {/* ── Rule 5a: not enough balance ───────────────────────────────── */}
        <AppModal
          open={balanceError !== null}
          title={copy.insufficientBalance}
          message={
            balanceError
              ? fill(copy.sessionCostMessage, {
                  rate: balanceError.rate,
                  minRequired: balanceError.minRequired,
                })
              : ''
          }
          actions={[
            {
              label: copy.cancel,
              onPress: () => {
                setBalanceError(null);
                reset();
              },
            },
            {
              label: copy.addBalance,
              onPress: () => {
                setBalanceError(null);
                reset();
                router.push('/wallet/add');
              },
            },
          ]}
          onClose={() => {
            setBalanceError(null);
            reset();
          }}
        />

        {/* ── Rule 2: the review sheet ──────────────────────────────────── */}
        <ReviewSheet
          open={reviewFor !== null}
          mentorName={reviewFor?.name ?? ''}
          onSubmit={async (rating, comment) => {
            // The 600 ms is the server round-trip — long enough for the button's
            // spinner to be real, short enough not to be a wait. The write
            // itself is real: `ReviewsProvider.post` is what puts the row on
            // `/reviews`, which is the only reason the loop this prototype
            // demonstrates has a visible end. See the provider's header for why
            // it is in memory and not localStorage.
            await new Promise((resolve) => window.setTimeout(resolve, 600));
            post({
              rating,
              comment,
              mentorName: reviewFor?.name ?? 'Mentor',
              mentorAvatar: reviewFor?.avatar ?? null,
            });
            setReviewFor(null);
            reset();
          }}
        />
      </PhoneOverlay>
    </>
  );
}
