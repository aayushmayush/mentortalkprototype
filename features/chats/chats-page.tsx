'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AppButton,
  AppIcon,
  AppLoadingSpinner,
  AppTopBar,
  LoadingPage,
} from '@/design-system';
import { AppErrorView } from '@/components/app-error-view';
import { MentorInboxCard } from '@/components/mentor-inbox-card';
import { buildChats, type MentorInboxItem } from '@/lib/fake/chats';
import { copy } from '@/lib/copy';

/**
 * ChatsPage — port of `apps/mentee_app/lib/ui/chats/widges/chats_page.dart`.
 *
 * ── It is an INBOX, and the title is wrong ──────────────────────────────────
 *
 * The app bar reads `l10n.orderHistory` — "Order History" — and this page has
 * never shown an order. It is a WhatsApp-style list of mentors, sorted by the
 * last thing that happened in each thread. The Session Logs and Payment Logs
 * tabs that *are* a history live on the wallet screen instead.
 *
 * The mislabel is reproduced rather than corrected: a reviewer comparing this
 * to the app must find the same wrong title, and "fixing" it here would hide a
 * real bug in the app from the audit this prototype exists to support.
 *
 * ── Refresh, and why there is no pull gesture ───────────────────────────────
 *
 * The source wraps the list in a `RefreshIndicator`, which is a swipe-down
 * gesture on a touch screen. A browser has no equivalent, so refresh is a
 * button in the top bar. That is a real divergence and the only one on this
 * screen — everything else, including the 60%-height empty-state box, is the
 * source's.
 */

const PAGE_PADDING = 16;
const SPACING_MD = 16;
const SPACING_XS = 4;
const SPACING_XL = 32;

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'loaded'; chats: MentorInboxItem[] };

/** One page exists. `hasMore` is true until it has been taken, then false. */
const PAGE_SIZE = 5;

export function ChatsPage() {
  const router = useRouter();
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const load = useCallback(() => {
    setState({ status: 'loading' });
    // `ChatsCubit.load()` — a repository round-trip with no backend behind it.
    const timer = setTimeout(() => {
      const all = buildChats();
      setState({ status: 'loaded', chats: all.slice(0, PAGE_SIZE) });
      setHasMore(all.length > PAGE_SIZE);
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => load(), [load]);

  const loadMore = useCallback(() => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    setTimeout(() => {
      setState((current) => {
        if (current.status !== 'loaded') return current;
        const all = buildChats();
        const next = all.slice(0, current.chats.length + PAGE_SIZE);
        setHasMore(next.length < all.length);
        return { status: 'loaded', chats: next };
      });
      setIsLoadingMore(false);
    }, 800);
  }, [isLoadingMore]);

  const openThread = (mentor: MentorInboxItem) => {
    router.push(`/chat?mentor=${mentor.mentorId}`);
  };

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--surface-page)',
      }}
    >
      <AppTopBar
        title={copy.orderHistory}
        onBack={() => router.back()}
        actions={
          <button
            type="button"
            onClick={load}
            aria-label={copy.retry}
            style={{
              border: 'none',
              background: 'transparent',
              padding: 8,
              cursor: 'pointer',
              display: 'flex',
            }}
          >
            <AppIcon name="refresh" size="md" color="var(--icon-primary)" />
          </button>
        }
      />

      {state.status === 'loading' ? (
        <LoadingPage message={copy.loadingChats} />
      ) : state.status === 'error' ? (
        <AppErrorView message={state.message} onRetry={load} />
      ) : state.chats.length === 0 ? (
        <EmptyState />
      ) : (
        <div
          className="no-scrollbar"
          style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: `0 ${PAGE_PADDING}px` }}
        >
          <div style={{ height: SPACING_MD }} />

          {state.chats.map((mentor) => (
            <div key={mentor.mentorId} style={{ paddingBottom: SPACING_XS }}>
              <MentorInboxCard mentor={mentor} onTap={() => openThread(mentor)} />
            </div>
          ))}

          {hasMore && (
            <div
              style={{
                padding: `${SPACING_MD}px 0`,
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              {isLoadingMore ? (
                <AppLoadingSpinner size="md" />
              ) : (
                <AppButton
                  label={copy.loadMore}
                  type="plain"
                  size="compact"
                  onClick={loadMore}
                />
              )}
            </div>
          )}

          <div style={{ height: SPACING_XL }} />
        </div>
      )}
    </div>
  );
}

/**
 * `_EmptyState` — a `chat` glyph in `icon.secondary`, a title and a two-line
 * body. It is wrapped in a 60%-of-screen-height box in the source so the block
 * centres in the upper part of the viewport rather than the middle, which is
 * what keeps it from colliding with the bottom bar on short phones.
 */
function EmptyState() {
  return (
    <div
      style={{
        height: '60%',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          padding: '0 32px',
        }}
      >
        <AppIcon name="chat" size="lg" color="var(--icon-secondary)" />
        <div style={{ height: SPACING_MD }} />
        <span className="type-title-md" style={{ color: 'var(--text-heading)' }}>
          {copy.noChatsYet}
        </span>
        <div style={{ height: SPACING_XS }} />
        <span className="type-body-sm" style={{ color: 'var(--text-body-light)' }}>
          {copy.chatsEmptyMessage}
        </span>
      </div>
    </div>
  );
}
