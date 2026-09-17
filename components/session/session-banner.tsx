'use client';

import { AppIcon } from '@/design-system';
import { copy } from '@/lib/copy';
import type { SessionState } from '@/lib/session/types';
import { useSession } from '@/lib/state/session-provider';
import { usePathname } from 'next/navigation';

/**
 * SessionBanner — port of `core/lib/session/ui/widgets/session_banner.dart`
 * together with the visibility rules in `session_banner_host.dart`.
 *
 * ── The host's rules, which are the whole reason the banner behaves ─────────
 *
 * The banner is NOT simply "a session is running". Two sources of truth decide
 * it: the session's state, and whether the session's own UI is the visible top
 * route. `SessionBannerHost` reads the second from a route observer, and the
 * order of its checks matters:
 *
 *   1. `inCall` and the call overlay is NOT on top → show, with `callType` set.
 *      This is the *minimised call*: the banner shows on every screen beneath
 *      the call, even over the chat screen, and tapping re-opens the overlay.
 *   2. chat screen on top → hide, unconditionally. The user is already in it.
 *   3. requesting / waitingForMentor / queued → show as "requesting".
 *   4. active → show as active.
 *
 * Step 1 before step 2 is the subtle part: a minimised call wins over "the chat
 * screen is on top", because the call overlay is a separate route above it.
 *
 * ── Two details of the banner itself that read as bugs but are the source ───
 *
 * - `requesting` always passes `sessionId: ''` and a name defaulted to the
 *   literal `'Mentor'` (`state.mentorName ?? 'Mentor'`), because a free-chat
 *   request may still be forwarded to a mentor nobody has chosen yet.
 * - The requesting spinner is a 36×36 `CircularProgressIndicator` drawn *behind*
 *   the leading icon inside the same 36px circle — both are visible at once.
 *   Reproduced, not tidied.
 */

export function SessionBanner({
  callMinimised,
  onOpenChat,
  onReopenCall,
}: {
  /**
   * `topRouteName == SessionUiRoute.call`, inverted — the chrome owns whether
   * the call overlay is currently covering the screen, so it passes the answer
   * down rather than the banner reaching for it.
   */
  callMinimised: boolean;
  onOpenChat: () => void;
  onReopenCall: () => void;
}) {
  const pathname = usePathname();
  const { state } = useSession();

  const banner = bannerStateFor(state, pathname, callMinimised, {
    onOpenChat,
    onReopenCall,
  });
  if (banner === null) return null;

  const isActive = banner.kind === 'active';
  const isRequesting = banner.kind === 'requesting';

  const leadingIcon =
    banner.kind === 'active'
      ? banner.callType === 'video'
        ? 'videoCam'
        : banner.callType !== null
          ? 'callFilled'
          : 'chatFilled'
      : 'hourglass';

  return (
    <div
      onClick={banner.onTap}
      style={{
        width: '100%',
        flexShrink: 0,
        // `MediaQuery.padding.top + 10` — the banner is the topmost chrome, so
        // it clears the status bar itself. The prototype's StatusBar is 54px.
        paddingTop: 54 + 10,
        paddingBottom: 14,
        paddingLeft: 16,
        paddingRight: 16,
        background: 'var(--surface-action)',
        boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {/* Leading icon circle — the spinner and the icon share this 36px box. */}
      <div
        style={{
          width: 36,
          height: 36,
          flexShrink: 0,
          borderRadius: '50%',
          background: 'color-mix(in srgb, var(--icon-on-action) 15%, transparent)',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isRequesting ? (
          <div
            className="banner-spinner"
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: '2px solid transparent',
              borderTopColor:
                'color-mix(in srgb, var(--icon-on-action) 50%, transparent)',
            }}
          />
        ) : null}
        <AppIcon name={leadingIcon} px={18} color="var(--icon-on-action)" />
      </div>

      <div style={{ width: 12, flexShrink: 0 }} />

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <span
          className="type-title-sm"
          style={{
            color: 'var(--text-on-action)',
            fontWeight: 600,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {banner.name}
        </span>

        <div style={{ height: 2 }} />

        <div style={{ display: 'flex', alignItems: 'center' }}>
          {isActive ? (
            <>
              <div
                style={{
                  width: 6,
                  height: 6,
                  flexShrink: 0,
                  borderRadius: '50%',
                  background:
                    'color-mix(in srgb, var(--text-on-action) 60%, transparent)',
                }}
              />
              <div style={{ width: 6, flexShrink: 0 }} />
            </>
          ) : null}
          <span
            className="type-body-sm"
            style={{
              color: 'color-mix(in srgb, var(--text-on-action) 70%, transparent)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              minWidth: 0,
            }}
          >
            {banner.subtitle}
          </span>
        </div>
      </div>

      <div style={{ width: 8, flexShrink: 0 }} />

      <AppIcon
        name="chevronRight"
        px={22}
        color="color-mix(in srgb, var(--icon-on-action) 50%, transparent)"
      />
    </div>
  );
}

// ─── Visibility — `SessionBannerHost._bannerStateFor` ───────────────────────

type ResolvedBanner = {
  kind: 'requesting' | 'active';
  name: string;
  subtitle: string;
  callType: 'audio' | 'video' | null;
  onTap: () => void;
};

function bannerStateFor(
  state: SessionState,
  pathname: string,
  callMinimised: boolean,
  handlers: { onOpenChat: () => void; onReopenCall: () => void },
): ResolvedBanner | null {
  // The prototype's session UI lives on `/chat`; the call overlay is a layer
  // the chrome owns, so "the call route is on top" is `!callMinimised`.
  const callOnTop = state.status === 'inCall' && !callMinimised;
  const chatOnTop = pathname === '/chat';

  if (state.status === 'inCall' && !callOnTop) {
    return {
      kind: 'active',
      name: state.otherUserName,
      subtitle: state.billingType === 'free_intro' ? 'Free Chat' : copy.returnToCall,
      callType: state.callType === 'video' ? 'video' : 'audio',
      onTap: handlers.onReopenCall,
    };
  }

  if (chatOnTop) return null;

  if (state.status === 'requesting') {
    // `SessionBannerRequesting(otherUserName: state.mentorName ?? 'Mentor')`.
    return {
      kind: 'requesting',
      name: state.mentorName ?? 'Mentor',
      subtitle: copy.connecting,
      callType: null,
      onTap: handlers.onOpenChat,
    };
  }

  if (state.status === 'waitingForMentor' || state.status === 'queued') {
    return {
      kind: 'requesting',
      name: state.mentorName,
      subtitle: copy.connecting,
      callType: null,
      onTap: handlers.onOpenChat,
    };
  }

  if (state.status === 'active') {
    return {
      kind: 'active',
      name: state.otherUserName,
      subtitle:
        state.billingType === 'free_intro' ? 'Free Chat' : copy.returnToChat,
      callType: null,
      onTap: handlers.onOpenChat,
    };
  }

  return null;
}
