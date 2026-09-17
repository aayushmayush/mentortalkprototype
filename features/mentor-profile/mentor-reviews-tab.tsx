'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AppBottomSheetHeader,
  AppButton,
  AppIcon,
  AppLoadingSpinner,
  AppRadio,
  AppRadioGroup,
} from '@/design-system';
import { PhoneOverlay } from '@/components/prototype/phone-frame';
import { ReviewCard, ReviewsSummaryHeader } from './review-card';
import { copy } from '@/lib/copy';
import {
  fetchReviews,
  REVIEW_SORTS,
  REVIEWS_PAGE_SIZE,
  type Review,
  type ReviewSort,
} from '@/lib/fake/reviews';

/**
 * MentorReviewsTab — port of
 * `ui/mentor_profile/widgets/mentor_reviews_tab.dart`.
 *
 * ── The pagination is real, over a finite fake set ──────────────────────────
 *
 * The source fetches `limit: 15, offset: 0` on mount and appends on "Load
 * more", with the button disappearing once `pagination.has_more` is false. The
 * fake set is however many reviews the mentor's `totalReviews` says they have,
 * so a mentor with 11 reviews never shows the button and one with 340 pages
 * through the same way the app would. That is the point: the *control flow* is
 * identical, only the transport is faked.
 *
 * ── `_loadMore` guards the same way ─────────────────────────────────────────
 *
 * `if (_hasMore && !_isLoadingMore)` — a fast double-tap must not fire two
 * overlapping fetches. Reproduced with the same two flags rather than a single
 * `loading` boolean, because the initial load and the append are different
 * states: the first replaces the list (and shows a spinner over it), the second
 * only appends.
 */

export function MentorReviewsTab({
  mentorId,
  avgRating,
  totalReviews,
}: {
  mentorId: string;
  avgRating: number;
  totalReviews: number;
}) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState(false);
  const [sort, setSort] = useState<ReviewSort>('newest');
  const [sortOpen, setSortOpen] = useState(false);

  /** `_offset` — how far the window has reached. A ref, not state: it is
      bookkeeping for the next fetch and must not trigger a render. */
  const offsetRef = useRef(0);

  /** The first page. Also the retry handler, matching `_load`. */
  const load = useCallback(() => {
    setIsLoading(true);
    setError(false);
    offsetRef.current = 0;

    const { reviews: page, hasMore: more } = fetchReviews({
      mentorId,
      total: totalReviews,
      sort,
      limit: REVIEWS_PAGE_SIZE,
      offset: 0,
    });

    setReviews(page);
    setHasMore(more);
    setIsLoading(false);
    offsetRef.current = REVIEWS_PAGE_SIZE;
  }, [mentorId, totalReviews, sort]);

  // Re-runs when the sort changes: the source has no separate re-sort path, the
  // sheet simply calls `_load()` again.
  useEffect(() => {
    load();
  }, [load]);

  const loadMore = () => {
    if (!hasMore || isLoadingMore) return;
    setIsLoadingMore(true);

    const { reviews: page, hasMore: more } = fetchReviews({
      mentorId,
      total: totalReviews,
      sort,
      limit: REVIEWS_PAGE_SIZE,
      offset: offsetRef.current,
    });

    setReviews((current) => [...current, ...page]);
    setHasMore(more);
    offsetRef.current += REVIEWS_PAGE_SIZE;
    setIsLoadingMore(false);
  };

  return (
    <>
      {isLoading ? (
        <div style={{ padding: '48px 0', display: 'flex', justifyContent: 'center' }}>
          <AppLoadingSpinner size="md" />
        </div>
      ) : error ? (
        <div style={{ padding: '48px 0', display: 'flex', justifyContent: 'center' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <span className="type-body-md" style={{ color: 'var(--text-body-light)' }}>
              {copy.couldNotLoadReviews}
            </span>
            <div style={{ height: 'var(--spacing-sm)' }} />
            <AppButton label={copy.retry} type="plain" size="compact" onClick={load} />
          </div>
        </div>
      ) : reviews.length === 0 ? (
        <div style={{ padding: '48px 0', display: 'flex', justifyContent: 'center' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <AppIcon name="rateReview" size="lg" color="var(--icon-secondary)" />
            <div style={{ height: 'var(--spacing-sm)' }} />
            <span className="type-body-md" style={{ color: 'var(--text-body-light)' }}>
              {copy.noReviewsYet}
            </span>
          </div>
        </div>
      ) : (
        <div
          style={{
            padding: '0 var(--page-padding-horizontal)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <ReviewsSummaryHeader
            avgRating={avgRating}
            totalReviews={totalReviews}
            onFilterTap={() => setSortOpen(true)}
          />

          <div style={{ height: 'var(--spacing-sm)' }} />

          {reviews.map((review) => (
            <div key={review.id} style={{ paddingBottom: 'var(--spacing-sm)' }}>
              <ReviewCard review={review} />
            </div>
          ))}

          {hasMore ? (
            isLoadingMore ? (
              <div style={{ padding: 'var(--spacing-md)', display: 'flex', justifyContent: 'center' }}>
                <AppLoadingSpinner size="md" />
              </div>
            ) : (
              <div
                style={{
                  paddingBottom: 'var(--spacing-md)',
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <AppButton
                  label={copy.loadMore}
                  type="plain"
                  size="compact"
                  onClick={loadMore}
                />
              </div>
            )
          ) : null}
        </div>
      )}

      <PhoneOverlay>
        <SortSheet
          open={sortOpen}
          sort={sort}
          onClose={() => setSortOpen(false)}
          onApply={(next) => {
            setSort(next);
            setSortOpen(false);
          }}
        />
      </PhoneOverlay>
    </>
  );
}

/**
 * `_showSortSheet` — a plain `showModalBottomSheet` sized to content: a header
 * and three radios. Not the draggable 85%-height sheet that the mentors list
 * uses; this one has no height constraint at all.
 */
function SortSheet({
  open,
  sort,
  onClose,
  onApply,
}: {
  open: boolean;
  sort: ReviewSort;
  onClose: () => void;
  onApply: (sort: ReviewSort) => void;
}) {
  const [pending, setPending] = useState<ReviewSort>(sort);

  // A fresh sheet each time it opens — the equivalent of Flutter building a new
  // State for the modal route.
  useEffect(() => {
    if (open) setPending(sort);
  }, [open, sort]);

  if (!open) return null;

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
          boxShadow: 'var(--shadow-bottom-sheet)',
        }}
      >
        <AppBottomSheetHeader
          closeLabel={copy.close}
          // Hardcoded `'Sort By'` in the source, not an l10n key.
          title={copy.sortBy}
          onClose={onClose}
        />

        <div style={{ padding: 'var(--spacing-sm) var(--page-padding-horizontal) var(--spacing-md)' }}>
          <AppRadioGroup
            value={pending}
            onChange={(next) => {
              setPending(next as ReviewSort);
              // Tapping a radio applies and closes immediately — the source's
              // radio `onChanged` calls `pop(option)` rather than collecting a
              // selection to submit.
              onApply(next as ReviewSort);
            }}
          >
            {REVIEW_SORTS.map((option) => (
              <AppRadio key={option.value} value={option.value} title={option.label} />
            ))}
          </AppRadioGroup>
        </div>
      </div>
    </div>
  );
}
