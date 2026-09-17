'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AppBottomSheet,
  AppBottomSheetHeader,
  AppIcon,
  AppIconButton,
  AppLoadingSpinner,
  AppRadio,
  AppRadioGroup,
  AppTopBar,
} from '@/design-system';
import { AppErrorView } from '@/components/app-error-view';
import { PhoneOverlay } from '@/components/prototype/phone-frame';
import { copy } from '@/lib/copy';
import {
  fetchMenteeReviews,
  formatReviewDate,
  REVIEW_SORTS,
  type Review,
  type ReviewSort,
} from '@/lib/fake/reviews';
import { postedToReview, useReviews } from '@/lib/state/reviews-provider';

/**
 * MyReviewsPage — port of
 * `apps/mentee_app/lib/ui/account/pages/my_reviews_page.dart`.
 *
 * ── Three scaffolds, not one ────────────────────────────────────────────────
 *
 * The source returns a whole different `Scaffold` for loading, for a failed
 * first page, and for loaded. The visible consequence is that the sort action
 * is ABSENT until the first page lands, because the loading and error app bars
 * are constructed without `actions` at all. Reproduced: the sort button pops in
 * with the first page and disappears again while a sort re-fetch is in flight.
 *
 * ── The sort re-fetches everything ──────────────────────────────────────────
 *
 * `onChanged` does `setState(_sort); Navigator.pop(); _load();` — so picking a
 * different order clears the list, shows the spinner, and re-reads page one
 * from the server. Sorting is a round-trip, not a client-side reorder. The
 * sheet closes first, so what you see is the list blanking behind it.
 *
 * ── The load-more trigger is a build-phase side effect ──────────────────────
 *
 * `itemBuilder` fires `_loadMore()` when the sentinel row is built — a write
 * during build. Flutter tolerates it because the setState lands after the
 * frame; React does not, so the sentinel carries an IntersectionObserver
 * instead. Same trigger point, no render-phase mutation. The row is a spinner
 * and only a spinner: there is no "Load more" button in the app.
 *
 * ── Two hardcoded English strings ───────────────────────────────────────────
 *
 * `_SortOption.label` and the sheet's `'Sort By'` are string literals in the
 * source, not `l10n` lookups — the only two in a file that otherwise goes
 * through the extension for every string, so a Hindi build shows an English
 * sort sheet. They render the same text here via `copy`; the gap is the app's,
 * and translating it in the prototype would hide it.
 *
 * ── The header's filter button does nothing ─────────────────────────────────
 *
 * `_SummaryHeader`'s tune glyph has `onTap: () { // TODO: Filter/sort reviews }`
 * — an empty closure. Reproduced inert, because that is what a user gets.
 *
 * ── One divergence: pull-to-refresh ─────────────────────────────────────────
 *
 * The body is wrapped in a `RefreshIndicator`, a swipe-down gesture on a touch
 * screen with no browser equivalent. No button is added in its place, because
 * unlike the chats list the app bar here is not empty — a second action would
 * change the bar's composition, and `_load()` is still reachable by changing
 * the sort or retrying an error. This is the only divergence on the screen.
 */

const PAGE_SIZE = 15;
const PAGE_PADDING = 16;
const SPACING_XS = 4;
const SPACING_SM = 8;
const SPACING_MD = 16;

type PageState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | {
      status: 'loaded';
      reviews: Review[];
      avgRating: number;
      totalReviews: number;
      hasMore: boolean;
      offset: number;
    };

export function MyReviewsPage() {
  const router = useRouter();
  const { posted } = useReviews();

  const [state, setState] = useState<PageState>({ status: 'loading' });
  const [sort, setSort] = useState<ReviewSort>('newest');
  const [sortOpen, setSortOpen] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  /*
    `_sort` is read by `_loadMore` between renders. A ref keeps that read off the
    dependency list: `loadMore` must not be rebuilt every time the sort changes,
    or the sentinel's observer would tear down and re-arm mid-scroll.
  */
  const sortRef = useRef<ReviewSort>('newest');

  /*
    Reviews posted since the tab opened are prepended and never re-fetched.
    The server has not seen them, so they are outside every page window — which
    is exactly what makes them survive a sort or a refresh and read as real
    rows rather than a banner that comes and goes.
  */
  const postedRef = useRef(posted);
  postedRef.current = posted;

  const load = useCallback((nextSort: ReviewSort = sortRef.current) => {
    sortRef.current = nextSort;
    setState({ status: 'loading' });

    // `MenteeReviewRepository.getReviews(limit: 15, offset: 0, sort: _sort.apiValue)`.
    return window.setTimeout(() => {
      const result = fetchMenteeReviews({
        sort: nextSort,
        limit: PAGE_SIZE,
        offset: 0,
      });
      setState({
        status: 'loaded',
        reviews: [...postedRef.current.map(postedToReview), ...result.reviews],
        avgRating: result.avgRating,
        totalReviews: result.totalReviews,
        hasMore: result.hasMore,
        offset: PAGE_SIZE,
      });
    }, 700);
  }, []);

  useEffect(() => {
    const timer = load();
    return () => window.clearTimeout(timer);
  }, [load]);

  const loadMore = useCallback(() => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);

    window.setTimeout(() => {
      setState((current) => {
        if (current.status !== 'loaded' || !current.hasMore) return current;
        const result = fetchMenteeReviews({
          sort: sortRef.current,
          limit: PAGE_SIZE,
          offset: current.offset,
        });
        return {
          ...current,
          reviews: [...current.reviews, ...result.reviews],
          hasMore: result.hasMore,
          offset: current.offset + PAGE_SIZE,
        };
      });
      setIsLoadingMore(false);
    }, 800);
  }, [isLoadingMore]);

  /**
   * `onChanged` — a different option re-reads page one; the same option or a
   * dismissal just closes the sheet. See the file header.
   */
  const onSortSelected = (value: unknown) => {
    const next = value as ReviewSort;
    setSortOpen(false);
    if (next === sort) return;
    setSort(next);
    load(next);
  };

  /* ── State 1: loading. No sort action — the source's app bar has none. ──── */
  if (state.status === 'loading') {
    return (
      <Shell onBack={() => router.back()}>
        <Centered>
          <AppLoadingSpinner size="md" />
        </Centered>
      </Shell>
    );
  }

  /* ── State 2: a failed first page. Also no sort action. ─────────────────── */
  if (state.status === 'error') {
    return (
      <Shell onBack={() => router.back()}>
        <AppErrorView message={state.message} onRetry={() => load()} />
      </Shell>
    );
  }

  /* ── State 3: loaded. ───────────────────────────────────────────────────── */
  return (
    <Shell
      onBack={() => router.back()}
      actions={
        state.reviews.length === 0 ? undefined : (
          <AppIconButton
            name="sort"
            size="md"
            label={copy.sortBy}
            onClick={() => setSortOpen(true)}
          />
        )
      }
    >
      <div
        className="no-scrollbar"
        style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}
      >
        {state.reviews.length === 0 ? (
          <EmptyState />
        ) : (
          <div
            style={{
              padding: `${SPACING_MD}px ${PAGE_PADDING}px`,
            }}
          >
            {/* index 0 — the summary, spanning the full padded width. */}
            <div style={{ paddingBottom: SPACING_MD }}>
              <SummaryHeader
                avgRating={state.avgRating}
                totalReviews={state.totalReviews}
              />
            </div>

            {state.reviews.map((review) => (
              <div key={review.id} style={{ paddingBottom: SPACING_SM }}>
                <ReviewCard review={review} />
              </div>
            ))}

            {state.hasMore && (
              <div style={{ padding: SPACING_MD, display: 'flex', justifyContent: 'center' }}>
                <LoadMoreSentinel onReachEnd={loadMore} />
              </div>
            )}
          </div>
        )}
      </div>

      <PhoneOverlay>
        <SortSheet
          open={sortOpen}
          sort={sort}
          onClose={() => setSortOpen(false)}
          onSelect={onSortSelected}
        />
      </PhoneOverlay>
    </Shell>
  );
}

/**
 * The sentinel row. The source builds a `AppLoadingSpinner.md()` here and calls
 * `_loadMore()` in the same pass; this fires on intersection instead, and shows
 * the same spinner the source always shows — the new page's rows append below
 * it rather than replacing it.
 */
function LoadMoreSentinel({ onReachEnd }: { onReachEnd: () => void }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) onReachEnd();
      },
      // Fires a little before the row is on screen, so the next page has
      // usually landed by the time the user scrolls to it.
      { rootMargin: '120px 0px 0px 0px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [onReachEnd]);

  return (
    <div ref={ref}>
      <AppLoadingSpinner size="md" />
    </div>
  );
}

/** The scaffold shared by all three states. */
function Shell({
  onBack,
  actions,
  children,
}: {
  onBack: () => void;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--surface-page)',
      }}
    >
      <AppTopBar title={copy.myReviews} onBack={onBack} actions={actions} />
      {children}
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {children}
    </div>
  );
}

/**
 * `_SummaryHeader` — the average, the count, and the tune button that has never
 * done anything. The glyph sits in a 40×40 `surface.page` tile, which is the
 * source's own sizing, not an `AppIconButton`.
 */
function SummaryHeader({
  avgRating,
  totalReviews,
}: {
  avgRating: number;
  totalReviews: number;
}) {
  return (
    <div
      style={{
        padding: SPACING_MD,
        background: 'var(--surface-primary)',
        borderRadius: 'var(--ds-radius-sm)',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span
            className="type-headline-md type-emphasis-bold"
            style={{ color: 'var(--text-heading)' }}
          >
            {avgRating.toFixed(1)}
          </span>
          <div style={{ width: 4 }} />
          <AppIcon name="star" size="md" color="var(--surface-warning)" />
        </div>

        <div style={{ height: 2 }} />

        <span className="type-body-sm" style={{ color: 'var(--text-body-light)' }}>
          {copy.reviewCount.replace('{count}', String(totalReviews))}
        </span>
      </div>

      <div style={{ flex: 1 }} />

      {/* `onTap: () { // TODO: Filter/sort reviews }` — an empty closure. */}
      <div
        role="presentation"
        aria-disabled
        title="Not implemented in the app either"
        style={{
          width: 40,
          height: 40,
          flexShrink: 0,
          background: 'var(--surface-page)',
          borderRadius: 'var(--ds-radius-sm)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <AppIcon name="tune" size="sm" color="var(--icon-secondary)" />
      </div>
    </div>
  );
}

/**
 * `_ReviewCard` — the mentee-side card, which shows the MENTOR being reviewed.
 *
 * The avatar is a raw `CircleAvatar(radius: 20)` — a 40px circle with the
 * initial in `text.action` on `surface.actionLight`. That is NOT `AppAvatar`,
 * whose smallest size is 48 and whose fallback styling differs, so it is ported
 * literally rather than approximated with the component.
 *
 * The name falls back to the literal `'Mentor'`, and the date is `MMM dd`.
 */
function ReviewCard({ review }: { review: Review }) {
  const name = review.mentor?.name ?? 'Mentor';
  const avatar = review.mentor?.avatar ?? null;
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(avatar) && !imageFailed;

  return (
    <div
      style={{
        padding: SPACING_MD,
        background: 'var(--surface-primary)',
        borderRadius: 'var(--ds-radius-sm)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
        <div
          style={{
            width: 40,
            height: 40,
            flexShrink: 0,
            borderRadius: '50%',
            background: 'var(--surface-action-light)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {showImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={avatar!}
              alt=""
              width={40}
              height={40}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={() => setImageFailed(true)}
            />
          ) : (
            <span
              className="type-label-md type-emphasis-semibold"
              style={{ color: 'var(--text-action)' }}
            >
              {name ? name[0].toUpperCase() : '?'}
            </span>
          )}
        </div>

        <div style={{ width: SPACING_SM }} />

        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <span
            className="type-title-sm type-emphasis-semibold"
            style={{
              color: 'var(--text-heading)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {name}
          </span>
          <span className="type-label-sm" style={{ color: 'var(--text-body-light)' }}>
            {formatReviewDate(review.createdAt)}
          </span>
        </div>

        <div
          style={{
            padding: '4px 10px',
            flexShrink: 0,
            background: 'var(--surface-page)',
            borderRadius: 'var(--ds-radius-sm)',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <AppIcon name="star" size="xs" color="var(--surface-warning)" />
          <div style={{ width: 3 }} />
          <span
            className="type-label-md type-emphasis-semibold"
            style={{ color: 'var(--text-heading)' }}
          >
            {review.rating.toFixed(1)}
          </span>
        </div>
      </div>

      {review.comment !== null && review.comment !== '' && (
        <>
          <div style={{ height: SPACING_SM }} />
          {/* `maxLines: 3` — clamped, with no way to expand it. */}
          <span
            className="type-body-md"
            style={{
              color: 'var(--text-body)',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {review.comment}
          </span>
        </>
      )}
    </div>
  );
}

/**
 * `_EmptyState` — a 30%-of-screen-height spacer, then a centred column. It is a
 * `ListView` in the source so that the pull-to-refresh gesture still works on
 * an empty list; here it is plain scroll content, which is the same thing minus
 * the gesture this prototype cannot offer.
 */
function EmptyState() {
  return (
    <div>
      <div style={{ height: '30vh' }} />
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          <AppIcon name="star" size="lg" color="var(--icon-secondary)" />
          <div style={{ height: SPACING_MD }} />
          <span className="type-body-md" style={{ color: 'var(--text-body-light)' }}>
            {copy.noReviewsYet}
          </span>
          <div style={{ height: SPACING_XS }} />
          <span className="type-body-sm" style={{ color: 'var(--text-body-light)' }}>
            {copy.reviewsAppearAfterSessions}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * `_showSortSheet` — three radios under a `SafeArea` column. The `AppRadioGroup`
 * here is controlled (see its own header): the Flutter original holds its own
 * `_selected` and merely seeds from `initialValue`, so a sheet reopened after a
 * selection shows the old value for one frame.
 */
function SortSheet({
  open,
  sort,
  onClose,
  onSelect,
}: {
  open: boolean;
  sort: ReviewSort;
  onClose: () => void;
  onSelect: (value: unknown) => void;
}) {
  return (
    <AppBottomSheet open={open} onClose={onClose}>
      <AppBottomSheetHeader title={copy.sortBy} onClose={onClose} />
      <div
        style={{
          padding: `${SPACING_SM}px ${PAGE_PADDING}px ${SPACING_MD}px`,
        }}
      >
        <AppRadioGroup value={sort} onChange={onSelect}>
          {REVIEW_SORTS.map((option) => (
            <div key={option.value} style={{ paddingBottom: SPACING_XS }}>
              <AppRadio value={option.value} title={option.label} />
            </div>
          ))}
        </AppRadioGroup>
      </div>
    </AppBottomSheet>
  );
}
