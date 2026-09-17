'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppButton, AppIcon } from '@/design-system';
import { copy } from '@/lib/copy';
import {
  checkFreeChatAvailability,
  freeChatMentor,
  freeChatPrefs,
  type FreeChatReason,
} from '@/lib/fake/free-chat';
import { useSession } from '@/lib/state/session-provider';
import { useSnackbar } from '@/lib/state/snackbar-provider';

/**
 * FreeChatOfferPage — port of
 * `ui/free_chat/pages/free_chat_offer_page.dart`.
 *
 * The post-onboarding screen that offers the single free introductory chat. No
 * app bar: a close button floats top-right and the content is centred between
 * two `Spacer`s, with the CTA pinned to the bottom.
 *
 * ── `PopScope(canPop: false)` — back does not go back ──────────────────────
 *
 * The source overrides the system back to `context.go(RouteNames.home)`, and
 * the close button does the same. There is no "return to onboarding": this
 * screen is reached once, after the wizard, and both exits land on Home.
 * Reproduced with `router.replace`, so the offer is not left in the history for
 * a second back press to land on — `go` in go_router replaces the stack, which
 * `replace` matches and `push` would not.
 *
 * ── The check-then-request shape is not redundant ──────────────────────────
 *
 * `_onStartFreeChat` calls `checkFreeChatAvailability()` FIRST and only
 * dispatches `RequestFreeChat` when the answer is yes. The request endpoint
 * would also answer 409 if the free chat were spent — so the extra round-trip
 * exists purely so the screen can show the REASON rather than a generic
 * conflict. A port that skipped the check and mapped the 409 would show one
 * message where the app shows four. See `lib/fake/free-chat.ts`.
 *
 * ── The hero image is the real asset, not a placeholder ────────────────────
 *
 * `assets/images/free_chat_hero.png` from `mentee_app`, byte-identical
 * (md5 7989034d…), served from `public/assets/images/`. The `errorBuilder` in
 * the source — a 220px `surface.actionLight` circle with an 80px `chatFilled`
 * glyph — is ported as the `onError` fallback, so a broken asset degrades the
 * way the app's does rather than showing a browser's broken-image icon.
 *
 * ── Every failure message is a snackbar, including the 401 ─────────────────
 *
 * Unusually for this app, an expired session does NOT bounce to login from
 * here; it shows "Your session has expired. Please log in again." as a toast
 * and leaves the screen up. That is the source's mapping of
 * `UnauthorizedException`/`ForbiddenException`/`TokenRefreshException` to one
 * message, and it is reproduced rather than corrected.
 *
 * ── Reachability ───────────────────────────────────────────────────────────
 *
 * `?free=used|disabled|none|slow|error` drives the five non-success arms. The
 * success path is the default. Without the params, four of the five snackbars
 * would be dead code — none of them is reachable by tapping, because the
 * fixture's profile has not used its free chat.
 */

export function FreeChatOfferPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const snackbar = useSnackbar();
  const { requestFreeChat } = useSession();

  const [isChecking, setIsChecking] = useState(false);
  const [heroFailed, setHeroFailed] = useState(false);

  const goHome = () => router.replace('/home?tab=home');

  /**
   * The `BlocListener` that marks the free chat used.
   *
   * It fires on the SERVER's confirmation — `SessionWaitingForMentor` with
   * `billingType == 'free_intro'` — not on the tap. That is why the flag is set
   * here in an effect watching session state rather than inside `onStart`,
   * where it would be set even for a request the server later rejected.
   *
   * The waiting state is short-lived and the effect is keyed on the boolean, so
   * it writes once per free chat, not once per render.
   */
  const session = useSession();
  const isFreeWaiting =
    session.state.status === 'waitingForMentor' &&
    session.state.billingType === 'free_intro';

  useEffect(() => {
    if (isFreeWaiting) freeChatPrefs.markUsed();
  }, [isFreeWaiting]);

  const onStart = async () => {
    if (isChecking) return;
    setIsChecking(true);

    const reason = searchParams.get('free');

    // `?free=slow` and `?free=error` stand in for a transport failure rather
    // than a server verdict, so they bypass the availability check entirely.
    if (reason === 'slow' || reason === 'error') {
      snackbar.show(
        reason === 'slow'
          ? copy.freeChatSlowNetwork
          : copy.freeChatNoMentors,
      );
      setIsChecking(false);
      return;
    }

    const override: FreeChatReason | 'ok' =
      reason === 'used' || reason === 'disabled' || reason === 'none'
        ? reason === 'used'
          ? 'already_used'
          : reason === 'disabled'
            ? 'feature_disabled'
            : 'no_categories'
        : 'ok';

    const availability = await checkFreeChatAvailability(override);

    if (!availability.available) {
      snackbar.show(reasonFor(availability.reason));
      setIsChecking(false);
      return;
    }

    requestFreeChat();
    // The mentor is picked by the "server" — the same function
    // `requestFreeChat` seeds the waiting header from, so the thread and the
    // header cannot disagree. See `lib/fake/free-chat.ts`.
    const mentor = freeChatMentor();
    // No `start=` param: the request has already been raised, and the chat page
    // auto-requests only when the URL asks it to.
    router.push(`/chat?mentor=${mentor.id}`);
    setIsChecking(false);
  };

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--surface-page)',
        position: 'relative',
      }}
    >
      {/* `Align(centerRight)` + `Padding(top: 12, right: 16)`. */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          paddingTop: 12,
          paddingRight: 16,
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          onClick={goHome}
          aria-label="Close"
          style={{
            border: 'none',
            background: 'transparent',
            padding: 8,
            cursor: 'pointer',
            display: 'flex',
          }}
        >
          <AppIcon name="close" size="md" color="var(--icon-primary)" />
        </button>
      </div>

      {/* `Spacer()` — pushes the content to the vertical centre. */}
      <div style={{ flex: 1, minHeight: 0 }} />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          flexShrink: 0,
        }}
      >
        {heroFailed ? (
          /* The source's `errorBuilder` fallback, at its own 220 × 220. */
          <div
            style={{
              width: 220,
              height: 220,
              borderRadius: '50%',
              background: 'var(--surface-action-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AppIcon name="chatFilled" px={80} color="var(--surface-action)" />
          </div>
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src="/assets/images/free_chat_hero.png"
            alt=""
            width={260}
            height={260}
            style={{ width: 260, height: 260, objectFit: 'contain' }}
            onError={() => setHeroFailed(true)}
          />
        )}

        <div style={{ height: 32 }} />

        <div style={{ padding: '0 32px' }}>
          <div
            className="type-headline-lg type-emphasis-bold"
            style={{ color: 'var(--text-heading)', textAlign: 'center' }}
          >
            {copy.freeChatHeroTitle}
          </div>
        </div>

        <div style={{ height: 8 }} />

        <div style={{ padding: '0 48px' }}>
          <div
            className="type-body-lg"
            style={{ color: 'var(--text-body-light)', textAlign: 'center' }}
          >
            {copy.freeChatHeroSubtitle}
          </div>
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0 }} />

      {/* `EdgeInsets.fromLTRB(24, 0, 24, 24)`. */}
      <div style={{ padding: '0 24px 24px', flexShrink: 0 }}>
        <AppButton
          label={copy.startFreeChat}
          fullWidth
          isLoading={isChecking}
          // `onPressed: _isChecking ? null : …` — passing no handler is how the
          // DS spells disabled, and it is why the guard at the top of `onStart`
          // is belt and braces rather than the only defence.
          onClick={isChecking ? undefined : onStart}
        />
      </div>
    </div>
  );
}

/**
 * The `switch (availability.reason)`.
 *
 * `null` falls to the default, and the default is not "unknown" — the source's
 * comment says a null reason on `available:false` means the server found no
 * eligible mentor. So the four arms are: already used, feature off, no
 * interests chosen, and no mentors. Nothing else can arrive.
 */
function reasonFor(reason: FreeChatReason): string {
  switch (reason) {
    case 'already_used':
      return copy.freeChatAlreadyUsed;
    case 'feature_disabled':
      return copy.freeChatFeatureDisabled;
    case 'no_categories':
      return copy.freeChatNoCategories;
    default:
      return copy.freeChatNoMentors;
  }
}
