'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AppButton,
  AppIcon,
  AppIconButton,
  AppModal,
  AppTabBar,
  AppTopBar,
} from '@/design-system';
import { PhoneOverlay } from '@/components/prototype/phone-frame';
import { AppErrorView } from '@/components/app-error-view';
import { MentorHero } from './mentor-hero';
import { MentorAboutTab } from './mentor-about-tab';
import { MentorReviewsTab } from './mentor-reviews-tab';
import { ShimmerMentorProfile } from './shimmer-mentor-profile';
import { ReportSheet } from './report-sheet';
import { useMentorProfile } from './use-mentor-profile';
import { copy, fill } from '@/lib/copy';
import { useSnackbar } from '@/lib/state/snackbar-provider';
import { useSession } from '@/lib/state/session-provider';
import { formatRate } from '@/lib/rates';
import type { SessionType } from '@/lib/session/types';
import type { MentorProfile } from '@/lib/fake/mentors';

/**
 * MentorProfilePage — port of
 * `ui/mentor_profile/pages/mentor_profile_page.dart`.
 *
 * ── Three independently-rebuilt regions ─────────────────────────────────────
 *
 * The source has three separate `BlocBuilder`s in the page Column: the top bar
 * (which only wants the title, so it shows none until loaded), the content area
 * (`when(loading/error/loaded)`), and the bottom bar (which renders
 * `SizedBox.shrink()` while not loaded). That last one is why the Chat/Call bar
 * appears from nothing rather than from a skeleton.
 *
 * ── The bottom bar's two opacities are NOT the same condition ───────────────
 *
 *     Chat opacity: isUnavailable ? 0.4 : 1.0
 *     Call opacity: isCallDisabled ? 0.4 : 1.0    // isUnavailable || !prefAudio
 *
 * Chat dims only when the mentor is unavailable; Call also dims when the mentor
 * declines audio. So with an available mentor who accepts audio, and a session
 * already running, BOTH buttons are disabled and NEITHER is dimmed — they look
 * live and do nothing. That reads like a bug, and it is reproduced rather than
 * tidied, because fixing it here would misrepresent the app.
 *
 * ── What is NOT ported ──────────────────────────────────────────────────────
 *
 * `_showInsufficientBalanceDialog` and `_openChatThread` are both defined in the
 * source and called from nowhere — the balance check lives in the session bloc
 * and the thread is pushed from the chat flow. They are dead code in
 * production.
 */

/** `_videoRateSubtitle`'s base: `videoRatePerMinute ?? ratePerMinute * 1.5`. */
function baseVideoRate(profile: MentorProfile): number {
  return profile.videoRatePerMinute ?? profile.ratePerMinute * 1.5;
}

/** `MentorProfile.discountedVideoRatePerMinute` — the model's own extension. */
function discountedVideoRate(profile: MentorProfile): number | null {
  const video = profile.videoRatePerMinute;
  const percent = profile.chatDiscountPercent;
  if (video === null || percent === null) return null;
  return video * (1 - percent / 100);
}

export function MentorProfilePage({ mentorId }: { mentorId: string }) {
  const router = useRouter();
  const { show } = useSnackbar();
  const { state, retry, toggleFollow } = useMentorProfile(mentorId);

  const [tab, setTab] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);

  // Two of the three regions want the profile without caring which non-loaded
  // state it is — the top bar's title and the bottom bar — so it is narrowed
  // once here rather than in each. The content region narrows on `state`
  // directly, because it needs to tell loading from error.
  const profile = state.status === 'loaded' ? state.profile : null;

  const isUnavailable = profile !== null && !profile.isAvailable;
  const isCallDisabled = isUnavailable || (profile !== null && !profile.prefAudio);

  /**
   * `isBusy = sessionState is! SessionIdle` — a running session locks all three
   * entry points. Read straight off the session provider, whose union is the
   * same one `SessionBloc` exposes.
   */
  const { isBusy } = useSession();

  /**
   * All three entry points push the ChatScreen and let it raise the request —
   * which is what the app does. `ChatScreen(requestSessionOnOpen: true,
   * requestSessionType: ...)` owns the `SessionEvent.requestSession` dispatch,
   * so the request is issued from the screen that will render the
   * "Requesting session…" bar, not from the profile the user is leaving.
   *
   * The URL carries the intent: `?mentor=<id>&start=<type>`.
   */
  const openChat = (sessionType: SessionType) => {
    if (!profile) return;
    router.push(`/chat?mentor=${profile.id}&start=${sessionType}`);
  };

  let content: React.ReactNode;
  if (state.status === 'loading') {
    content = <ShimmerMentorProfile />;
  } else if (state.status === 'error') {
    content = <AppErrorView message={state.message} onRetry={retry} />;
  } else {
    content = (
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <MentorHero
          profile={state.profile}
          isFollowing={state.profile.isFollowing}
          onToggleFollow={toggleFollow}
        />

        <div style={{ height: 12 }} />

        <div style={{ padding: '0 var(--page-padding-horizontal)' }}>
          <AppTabBar
            tabs={[copy.about, copy.reviews]}
            index={tab}
            onChange={setTab}
          />
        </div>

        <div style={{ height: 'var(--spacing-xs)' }} />

        {/*
          `AnimatedSwitcher(duration: 200ms)` — the source passes no
          transitionBuilder, so it is Flutter's default cross-fade. The key is
          what makes React treat the two tabs as different children and re-run
          the animation.
        */}
        <div key={tab} className="tab-switch-enter">
          {tab === 0 ? (
            <MentorAboutTab profile={state.profile} />
          ) : (
            <MentorReviewsTab
              mentorId={state.profile.id}
              avgRating={state.profile.avgRating}
              totalReviews={state.profile.totalReviews}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        minHeight: 0,
      }}
    >
      <AppTopBar
        title={profile?.displayName}
        onBack={() => router.back()}
        actions={
          <AppIconButton
            name="moreVert"
            size="sm"
            label="More"
            onClick={() => setMenuOpen(true)}
          />
        }
      />

      <div
        className="no-scrollbar"
        style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden' }}
      >
        {content}
      </div>

      {/* ── Fixed bottom bar — a sibling of the scroller, so it never moves ── */}
      {profile ? (
        <div
          style={{
            flexShrink: 0,
            padding: '12px var(--page-padding-horizontal)',
            background: 'var(--surface-primary)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {isUnavailable ? (
            <div style={{ paddingBottom: 10 }}>
              <span
                className="type-body-sm"
                style={{ color: 'var(--text-body-light)' }}
              >
                {copy.mentorUnavailable}
              </span>
            </div>
          ) : null}

          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ flex: 1, opacity: isUnavailable ? 0.4 : 1 }}>
              <AppButton
                label={copy.chat}
                fullWidth
                type="solid"
                intent="primary"
                disabled={isBusy || isUnavailable}
                onClick={() => openChat('chat')}
              />
            </div>

            <div style={{ width: 'var(--spacing-md)' }} />

            <div style={{ flex: 1, opacity: isCallDisabled ? 0.4 : 1 }}>
              <AppButton
                label={copy.call}
                fullWidth
                type="outlined"
                intent="primary"
                disabled={isBusy || isCallDisabled}
                onClick={() => openChat('audio')}
              />
            </div>
          </div>
        </div>
      ) : null}

      <PhoneOverlay>
        {menuOpen && profile ? (
          <ProfileMenu
            profile={profile}
            onClose={() => setMenuOpen(false)}
            onVideoCall={() => {
              setMenuOpen(false);
              if (!profile.isAvailable) {
                // `ScaffoldMessenger..clearSnackBars()..showSnackBar(...)`.
                show(copy.mentorUnavailable);
                return;
              }
              if (!profile.prefVideo) {
                show(copy.mentorNoVideo);
                return;
              }
              openChat('video');
            }}
            onReport={() => {
              setMenuOpen(false);
              setReportOpen(true);
            }}
            onBlock={() => {
              setMenuOpen(false);
              setBlockOpen(true);
            }}
          />
        ) : null}

        <ReportSheet
          open={reportOpen && profile !== null}
          userName={profile?.displayName ?? ''}
          onClose={() => setReportOpen(false)}
          onSubmit={() => {
            // The source POSTs, then shows the success or failure snackbar. With
            // nothing to POST to, the success path is taken; `reportFailed`
            // stays unreachable until the demo chrome can fail a request.
            setReportOpen(false);
            show(copy.reportSubmitted);
          }}
        />

        <AppModal
          open={blockOpen && profile !== null}
          title={profile ? fill(copy.blockUser, { name: profile.displayName }) : ''}
          message={copy.blockUserMessage}
          onClose={() => setBlockOpen(false)}
          actions={[
            // AppModal closes first and only then runs `onPress` — the source's
            // own order, so neither action closes the modal itself.
            { label: copy.cancel },
            {
              label: copy.block,
              destructive: true,
              onPress: () => {
                show(profile ? fill(copy.userBlocked, { name: profile.displayName }) : '');
                // `Navigator.of(context).pop()` — blocking leaves the profile.
                router.back();
              },
            },
          ]}
        />
      </PhoneOverlay>
    </div>
  );
}

/**
 * `_showProfileMenu` — a content-sized `showModalBottomSheet` with a drag handle
 * and three ListTiles.
 *
 * Video Call is the only row with state: its icon and label drop to
 * `icon.secondary` / `text.bodyLight` when the row cannot act, and its subtitle
 * runs a three-way branch — unavailable, video-declined, or the video rate. The
 * row stays tappable in all three cases. That is not a mistake: the tap is what
 * shows the snackbar explaining *why* nothing happened.
 */
function ProfileMenu({
  profile,
  onClose,
  onVideoCall,
  onReport,
  onBlock,
}: {
  profile: MentorProfile;
  onClose: () => void;
  onVideoCall: () => void;
  onReport: () => void;
  onBlock: () => void;
}) {
  const canVideoCall = profile.isAvailable && profile.prefVideo;

  return (
    <div
      className="scrim-enter"
      onClick={onClose}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 55,
        pointerEvents: 'auto',
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}
    >
      <div
        className="sheet-enter"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--surface-primary)',
          borderRadius: 'var(--ds-radius-lg) var(--ds-radius-lg) 0 0',
          padding: '8px 0',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div
            style={{
              width: 36,
              height: 4,
              marginBottom: 12,
              borderRadius: 2,
              background: 'var(--border-secondary)',
            }}
          />
        </div>

        <MenuTile
          icon="videoCam"
          iconColor={canVideoCall ? 'var(--icon-primary)' : 'var(--icon-secondary)'}
          title={copy.videoCall}
          titleColor={canVideoCall ? 'var(--text-heading)' : 'var(--text-body-light)'}
          subtitle={<VideoRateSubtitle profile={profile} />}
          onClick={onVideoCall}
        />

        <MenuTile
          icon="flag"
          iconColor="var(--icon-secondary)"
          title={copy.report}
          titleColor="var(--text-body)"
          onClick={onReport}
        />

        <MenuTile
          icon="block"
          iconColor="var(--icon-secondary)"
          title={copy.block}
          // The app's only destructive-coloured menu label.
          titleColor="var(--text-error)"
          onClick={onBlock}
        />
      </div>
    </div>
  );
}

/** `ListTile` — 16px horizontal padding, a 40px leading slot, `bodyLarge` title. */
function MenuTile({
  icon,
  iconColor,
  title,
  titleColor,
  subtitle,
  onClick,
}: {
  icon: 'videoCam' | 'flag' | 'block';
  iconColor: string;
  title: string;
  titleColor: string;
  subtitle?: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '12px 16px',
        cursor: 'pointer',
      }}
    >
      <div style={{ width: 40, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
        <AppIcon name={icon} size="md" color={iconColor} />
      </div>

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <span className="type-body-lg" style={{ color: titleColor, fontWeight: 500 }}>
          {title}
        </span>
        {subtitle ?? null}
      </div>
    </div>
  );
}

/**
 * `_videoRateSubtitle` — the Video Call row's three-way subtitle.
 *
 * Both amounts use the same muted `bodySmall`; the discount then re-colours
 * itself to `text.action` at w600. They are separated by two literal spaces
 * inside the first span rather than by a SizedBox, so the two run together when
 * the strike-through is not visible.
 */
function VideoRateSubtitle({ profile }: { profile: MentorProfile }) {
  const base = baseVideoRate(profile);
  const discounted = discountedVideoRate(profile);

  if (discounted === null) {
    return (
      <span className="type-body-sm" style={{ color: 'var(--text-body-light)' }}>
        {formatRate(base)}/min
      </span>
    );
  }

  return (
    <span className="type-body-sm" style={{ color: 'var(--text-body-light)' }}>
      <span style={{ textDecoration: 'line-through' }}>
        {formatRate(base)}/min{'  '}
      </span>
      <span style={{ color: 'var(--text-action)', fontWeight: 600 }}>
        {formatRate(discounted)}/min
      </span>
    </span>
  );
}
