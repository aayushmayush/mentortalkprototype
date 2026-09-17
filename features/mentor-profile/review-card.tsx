'use client';

import { AppIcon } from '@/design-system';
import { ExpandableText } from '@/components/expandable-text';
import { copy } from '@/lib/copy';
import { formatReviewDate, type Review } from '@/lib/fake/reviews';

/**
 * ReviewCard and ReviewsSummaryHeader — ports of
 * `apps/core/lib/review/ui/widgets/review_card.dart` and
 * `reviews_summary_header.dart`.
 *
 * ── Two star colours, one screen ────────────────────────────────────────────
 *
 * `kReviewStar` is `#FBBF24` (amber-400) and is what these two widgets use. The
 * mentor hero's rating pill uses `#FFCA28` instead. Both are hardcoded, both
 * are on the mentor profile, and they do not match. Reproduced rather than
 * reconciled — see the note in `mentor-hero.tsx`.
 *
 * ── The avatar is a raw CircleAvatar ────────────────────────────────────────
 *
 * Everywhere else in the app an avatar is `AppAvatar`. The review card builds a
 * `CircleAvatar(radius: 20)` by hand, with `surface.actionLight` behind a
 * `labelMedium w600 text.action` initial. So it is ported by hand here too: the
 * initial's type slot and the 40px diameter come from the CircleAvatar, not
 * from the design system's avatar sizes.
 */

/** `kReviewStar`. */
const REVIEW_STAR = '#FBBF24';

export function ReviewsSummaryHeader({
  avgRating,
  totalReviews,
  onFilterTap,
}: {
  avgRating: number;
  totalReviews: number;
  /** Null hides the sort button entirely — the source's `if (onFilterTap != null)`. */
  onFilterTap?: (() => void) | null;
}) {
  return (
    <div
      style={{
        padding: 'var(--spacing-md)',
        background: 'var(--surface-primary)',
        borderRadius: 'var(--ds-radius-sm)',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span
            className="type-headline-md type-emphasis-bold"
            style={{ color: 'var(--text-heading)' }}
          >
            {avgRating.toFixed(1)}
          </span>
          <div style={{ width: 4 }} />
          <AppIcon name="star" size="md" color={REVIEW_STAR} />
        </div>

        <div style={{ height: 2 }} />

        <span className="type-body-sm" style={{ color: 'var(--text-body-light)' }}>
          {/* Hardcoded `'$totalReviews reviews'` in the source — not an l10n
              key, so the noun does not pluralise from the catalogue. */}
          {totalReviews} reviews
        </span>
      </div>

      <div style={{ flex: 1 }} />

      {onFilterTap != null ? (
        <button
          type="button"
          aria-label={copy.sortBy}
          onClick={onFilterTap}
          style={{
            width: 40,
            height: 40,
            flexShrink: 0,
            borderRadius: 'var(--ds-radius-sm)',
            background: 'var(--surface-page)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <AppIcon name="sort" size="sm" color="var(--icon-secondary)" />
        </button>
      ) : null}
    </div>
  );
}

export function ReviewCard({ review }: { review: Review }) {
  // `author?.name ?? 'Mentee'` — the backend omits the participant when the
  // mentee has `show_name_in_reviews` off, and the card names them "Mentee"
  // rather than showing an anonymous placeholder.
  const name = review.mentee?.name ?? copy.mentee;
  const avatar = review.mentee?.avatar ?? null;

  return (
    <div
      style={{
        padding: 'var(--spacing-md)',
        background: 'var(--surface-primary)',
        borderRadius: 'var(--ds-radius-sm)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <CircleAvatar name={name} avatar={avatar} />

        <div style={{ width: 'var(--spacing-sm)' }} />

        <div
          style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <span
            className="type-title-sm type-emphasis-semibold"
            style={{
              color: 'var(--text-heading)',
              // The source passes `overflow: TextOverflow.ellipsis` with no
              // `maxLines`, and ellipsis never fires while maxLines is null — a
              // long name wraps to a second line and the card grows. Reproduced
              // rather than "fixed" with a nowrap, so a long name behaves the
              // same here as in the app.
              overflowWrap: 'break-word',
            }}
          >
            {name}
          </span>
          <span className="type-label-sm" style={{ color: 'var(--text-body-light)' }}>
            {formatReviewDate(review.createdAt)}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center' }}>
          <AppIcon name="star" size="xs" color={REVIEW_STAR} />
          <div style={{ width: 4 }} />
          <span
            className="type-label-lg type-emphasis-bold"
            style={{ color: 'var(--text-heading)' }}
          >
            {review.rating.toFixed(1)}
          </span>
        </div>
      </div>

      {review.comment !== null && review.comment !== '' ? (
        <>
          <div style={{ height: 'var(--spacing-sm)' }} />
          <ExpandableText
            text={review.comment}
            // `_ExpandableComment._collapsedLines` — 3, one fewer than the
            // bio's 4.
            collapsedLines={3}
            className="type-body-md"
            style={{ color: 'var(--text-body)', lineHeight: 1.4 }}
          />
        </>
      ) : null}
    </div>
  );
}

/**
 * The hand-built `CircleAvatar(radius: 20)`.
 *
 * `radius: 20` is the RADIUS, so the box is 40 — the same diameter as
 * `AppAvatar.md`, but the type slot inside differs (the design system uses its
 * own initial sizes per circle size). Themed by `surface.actionLight` with the
 * initial in `text.action`.
 */
function CircleAvatar({ name, avatar }: { name: string; avatar: string | null }) {
  const initial = name.length > 0 ? name[0].toUpperCase() : '?';

  return (
    <div
      style={{
        width: 40,
        height: 40,
        flexShrink: 0,
        borderRadius: '50%',
        overflow: 'hidden',
        background: 'var(--surface-action-light)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {avatar !== null ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={avatar}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <span className="type-label-md type-emphasis-semibold" style={{ color: 'var(--text-action)' }}>
          {initial}
        </span>
      )}
    </div>
  );
}
