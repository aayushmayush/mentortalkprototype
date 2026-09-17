'use client';

import { useMemo } from 'react';
import { HomeSearchBar } from '@/features/home/home-search-bar';
import { LocalBannerCarousel } from '@/features/home/local-banner-carousel';
import { FreeChatEntryCard } from '@/features/home/free-chat-entry-card';
import { StartCounsellingSection } from '@/features/home/start-counselling-section';
import { PopularMentorsSection } from '@/features/home/popular-mentors-section';
import { RecentSessionsSection } from '@/features/home/recent-sessions-section';
import { usePopularMentors } from '@/features/home/use-popular-mentors';
import { AppErrorView } from '@/components/app-error-view';
import { buildChats, type MentorInboxItem } from '@/lib/fake/chats';
import { copy } from '@/lib/copy';
import { useProfile } from '@/lib/state/profile-provider';
import { useAuth } from '@/lib/state/auth-provider';

/**
 * HomeFeedPage — port of `ui/home/pages/home_feed_page.dart`. Tab 1.
 *
 * The spacer rhythm is the source's own and is not uniform — 16px between
 * sections, but **24** before Recent Sessions and again at the foot. Copied
 * rather than normalised, because the wider gap is what visually detaches the
 * "your past sessions" block from the discovery content above it.
 *
 * The whole feed is wrapped in the popular-mentors builder, which means a
 * failure there replaces the entire page with `AppErrorView` — retry AND
 * logout, because a feed that will not load is also the moment a user is most
 * likely to sign out. That is the source's structure, not a shortcut.
 *
 * ── Two things in the source that have no counterpart here ──────────────────
 *
 * 1. **`FreeChatOfferTrigger`** sits between the search bar and the first
 *    spacer. It renders nothing at all — it is an invisible widget whose only
 *    job is to auto-show the free-chat offer sheet once per launch after the
 *    profile loads. There is no sheet to trigger until T5, so there is no
 *    placeholder here; adding an empty component would misrepresent it.
 *
 * 2. **`RefreshIndicator`** (pull-to-refresh) wraps the scroller. A desktop
 *    demo has no pull gesture to trigger it with, so it is not reproduced —
 *    a real omission, recorded rather than hidden. It would need an overscroll
 *    handler plus the wheel gesture, which is device simulation, not app
 *    behaviour.
 */
export function HomeFeed({
  onOpenSearch,
  onViewAllMentors,
  onMentorTap,
  onOpenThread,
  onOpenOrderHistory,
  onStartCounselling,
  onNavigate,
  simulate,
}: {
  onOpenSearch?: () => void;
  onViewAllMentors?: () => void;
  onMentorTap?: (mentorId: string) => void;
  onOpenThread?: (mentor: MentorInboxItem) => void;
  onOpenOrderHistory?: () => void;
  onStartCounselling?: () => void;
  onNavigate?: (path: string) => void;
  simulate?: 'loading' | 'error' | null;
}) {
  const { status, mentors, retry } = usePopularMentors(simulate);
  const profile = useProfile();
  const auth = useAuth();

  /**
   * `ChatsCubit`'s payload. Built once per mount — the timestamps are relative
   * to now, so rebuilding on every render would make them drift.
   */
  const chats = useMemo(() => buildChats(), []);

  if (status === 'error') {
    return (
      <AppErrorView
        // In production this is `mentorsState.message`, the message the
        // repository surfaced — not a fixed string. There is no repository
        // here, so a stand-in is used.
        message="Could not load mentors"
        onRetry={retry}
        onLogout={() => auth.logout()}
        logoutLabel={copy.logout}
      />
    );
  }

  return (
    // `AlwaysScrollableScrollPhysics` in the source — the feed scrolls even
    // when its content is shorter than the viewport, so pull-to-refresh has
    // something to grab. Only the height matters here.
    <div className="no-scrollbar" style={{ height: '100%', overflowY: 'auto' }}>
      <div style={{ height: 16 }} />

      <HomeSearchBar onTap={onOpenSearch} />

      <div style={{ height: 16 }} />

      <LocalBannerCarousel />

      <div style={{ height: 16 }} />

      <FreeChatEntryCard
        available={profile.profile?.freeChatAvailable ?? true}
        onTap={() => onNavigate?.('/free-chat-offer')}
      />

      <div style={{ height: 16 }} />

      <StartCounsellingSection onTap={onStartCounselling} />

      <div style={{ height: 16 }} />

      <PopularMentorsSection
        mentors={mentors}
        status={status}
        onViewAll={onViewAllMentors}
        onMentorTap={onMentorTap}
      />

      <div style={{ height: 24 }} />

      {/*
        `isLoading` / `hasEverLoaded` are `ChatsCubit`'s in production — a
        third bloc with its own fetch. Both it and PopularMentorsBloc are
        kicked off by the same shell mount and resolve within the same window,
        so the popular-mentors status stands in for both here rather than
        inventing a second parallel timer.
      */}
      <RecentSessionsSection
        chats={chats}
        isLoading={status === 'loading'}
        hasEverLoaded={status === 'loaded'}
        onViewAll={onOpenOrderHistory}
        onMentorTap={onOpenThread}
      />

      <div style={{ height: 24 }} />
    </div>
  );
}
