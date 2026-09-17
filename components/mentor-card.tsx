import { AppAvatar, AppIcon } from '@/design-system';
import { RatingChip } from '@/components/rating-chip';
import { formatRate } from '@/lib/rates';
import { copy, fill } from '@/lib/copy';
import type { MentorSummary } from '@/lib/fake/mentors';

/**
 * MentorCard — port of `ui/home/widgets/mentor_card.dart`.
 *
 * Two layouts, chosen by constructor in the source and by a `compact` prop
 * here, matching `MentorCard(...)` and `MentorCard.compact(...)`:
 *
 *   default   horizontal tile for the Chat/Call tabs — `AppAvatar.md`, an
 *             action slot on the right (the session button)
 *   compact   vertical card for the Popular Mentors rail — `AppAvatar.lg`,
 *             164px wide, nothing tappable inside it
 *
 * The part worth getting right is the rate display, which has three modes and
 * is decided by the mentor's own fields rather than by a price:
 *
 *   1. `introPromoEligible`           struck-through base → promo, + "first 5 min"
 *   2. `chatDiscountPercent != null`  struck-through base → discounted, no suffix
 *   3. neither                        the plain rate, w700
 *
 * **Compact cards drop the "first 5 min" suffix** — the source passes
 * `compact: true` explicitly so the rail stays legible, leaving the full promo
 * context to the profile page it navigates to.
 *
 * `_formatCategories` renders `"First +N"`, so a mentor with three categories
 * shows `"JEE +2"` rather than a wrapped list.
 */
export function MentorCard({
  mentor,
  onTap,
  action,
  activeCategory,
  compact = false,
}: {
  mentor: MentorSummary;
  onTap?: () => void;
  action?: React.ReactNode;
  activeCategory?: string;
  compact?: boolean;
}) {
  return compact ? (
    <CompactCard mentor={mentor} onTap={onTap} activeCategory={activeCategory} />
  ) : (
    <DefaultCard mentor={mentor} onTap={onTap} action={action} activeCategory={activeCategory} />
  );
}

function CompactCard({
  mentor,
  onTap,
  activeCategory,
}: {
  mentor: MentorSummary;
  onTap?: () => void;
  activeCategory?: string;
}) {
  const hasInstitution =
    mentor.institutionName != null && mentor.institutionName.trim().length > 0;
  const categoryLabel = formatCategories(mentor.categories, activeCategory);

  return (
    <div
      onClick={onTap}
      style={{
        width: 164,
        padding: '12px 8px',
        background: 'var(--surface-primary)',
        borderRadius: 'var(--ds-radius-md)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: onTap ? 'pointer' : 'default',
        flex: '0 0 auto',
      }}
    >
      {/* Avatar with the rating chip straddling its bottom edge. The padding
          below is conditional in the source — no rating, no overhang, no
          padding — which is why it is 10px here and 0 there. */}
      <div
        style={{
          position: 'relative',
          paddingBottom: mentor.rating > 0 ? 10 : 0,
          marginBottom: 8,
        }}
      >
        <AppAvatar size="lg" imageUrl={mentor.profilePhotoUrl} name={mentor.displayName} />
        {mentor.rating > 0 ? (
          <div style={{ position: 'absolute', bottom: -10, left: '50%', transform: 'translateX(-50%)' }}>
            <RatingChip rating={mentor.rating.toFixed(1)} size="sm" />
          </div>
        ) : null}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4, maxWidth: '100%' }}>
        <span
          className="type-title-md type-emphasis-semibold"
          style={{
            color: 'var(--text-heading)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {mentor.displayName}
        </span>
        <AppIcon name="verified" size="xs" color="var(--text-action)" />
      </div>

      {hasInstitution ? (
        <>
          <div style={{ height: 'var(--spacing-3xs)' }} />
          <span
            className="type-body-sm"
            style={{
              color: 'var(--text-body-light)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              maxWidth: '100%',
              textAlign: 'center',
            }}
          >
            {mentor.institutionName}
          </span>
        </>
      ) : null}

      <div style={{ height: 'var(--spacing-3xs)' }} />

      <span
        className="type-label-sm"
        style={{
          color: 'var(--text-body-light)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          maxWidth: '100%',
        }}
      >
        {categoryLabel}
      </span>

      <div style={{ height: 'var(--spacing-2xs)' }} />

      <RateLabel mentor={mentor} compact />
    </div>
  );
}

function DefaultCard({
  mentor,
  onTap,
  action,
  activeCategory,
}: {
  mentor: MentorSummary;
  onTap?: () => void;
  action?: React.ReactNode;
  activeCategory?: string;
}) {
  const hasInstitution =
    mentor.institutionName != null && mentor.institutionName.trim().length > 0;

  return (
    <div
      onClick={onTap}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-sm)',
        padding: 'var(--spacing-sm)',
        background: 'var(--surface-primary)',
        borderRadius: 'var(--ds-radius-md)',
        cursor: onTap ? 'pointer' : 'default',
      }}
    >
      <div style={{ position: 'relative', flex: '0 0 auto' }}>
        <AppAvatar
          size="md"
          imageUrl={mentor.profilePhotoUrl}
          name={mentor.displayName}
          badge={mentor.isOnline ? <OnlineDot /> : undefined}
        />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span
            className="type-title-md type-emphasis-semibold"
            style={{
              color: 'var(--text-heading)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {mentor.displayName}
          </span>
          <AppIcon name="verified" size="xs" color="var(--text-action)" />
        </div>

        {hasInstitution ? (
          <div
            className="type-body-sm"
            style={{
              color: 'var(--text-body-light)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {mentor.institutionName}
          </div>
        ) : null}

        <div style={{ height: 'var(--spacing-3xs)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {mentor.rating > 0 ? (
            <RatingChip rating={mentor.rating.toFixed(1)} size="sm" />
          ) : null}
          <span className="type-label-sm" style={{ color: 'var(--text-body-light)' }}>
            {formatCategories(mentor.categories, activeCategory)}
          </span>
        </div>

        <div style={{ marginTop: 'var(--spacing-2xs)' }}>
          <RateLabel mentor={mentor} />
        </div>
      </div>

      {action}
    </div>
  );
}

/** A small presence dot, used as the avatar's bottom badge on the list tile. */
function OnlineDot() {
  return (
    <div
      style={{
        width: 14,
        height: 14,
        borderRadius: '50%',
        background: 'var(--surface-success)',
        border: '2px solid var(--surface-primary)',
      }}
    />
  );
}

/**
 * `_RateLabel` — the three modes.
 */
function RateLabel({
  mentor,
  compact = false,
}: {
  mentor: MentorSummary;
  compact?: boolean;
}) {
  if (mentor.introPromoEligible) {
    return (
      <DiscountedRow
        originalRate={mentor.ratePerMinute}
        discountedRate={mentor.introPromoRatePerMinute ?? mentor.ratePerMinute}
        // Compact cards drop the qualifier — see the file header.
        suffix={compact ? null : 'first 5 min'}
      />
    );
  }

  if (mentor.chatDiscountPercent != null) {
    return (
      <DiscountedRow
        originalRate={mentor.ratePerMinute}
        discountedRate={mentor.discountedRatePerMinute ?? mentor.ratePerMinute}
        suffix={null}
      />
    );
  }

  return (
    <span
      className="type-body-md type-emphasis-bold"
      style={{ color: 'var(--text-body)' }}
    >
      {fill(copy.ratePerMinute, { rate: mentor.ratePerMinute })}
    </span>
  );
}

function DiscountedRow({
  originalRate,
  discountedRate,
  suffix,
}: {
  originalRate: number;
  discountedRate: number;
  suffix: string | null;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, maxWidth: '100%' }}>
      <span
        className="type-body-sm"
        style={{
          color: 'var(--text-body-light)',
          textDecoration: 'line-through',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        ₹ {originalRate}/min
      </span>
      <span
        className="type-body-md type-emphasis-bold"
        style={{
          color: 'var(--text-action)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        ₹ {formatRate(discountedRate)}/min
      </span>
      {suffix ? (
        <span
          className="type-body-sm"
          style={{
            color: 'var(--text-body-light)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          · {suffix}
        </span>
      ) : null}
    </div>
  );
}

/**
 * `_formatCategories` — dedup, promote the active category to the front, then
 * `"First"` or `"First +N"`.
 */
export function formatCategories(
  cats: string[],
  activeCategory?: string,
): string {
  const ordered = dedupAndPromoteActive(cats, activeCategory);
  if (ordered.length === 0) return '';
  if (ordered.length === 1) return ordered[0];
  return `${ordered[0]} +${ordered.length - 1}`;
}

function dedupAndPromoteActive(cats: string[], activeCategory?: string): string[] {
  if (cats.length === 0) return [];
  const seen = new Set<string>();
  const unique = cats.filter((c) => {
    if (seen.has(c)) return false;
    seen.add(c);
    return true;
  });
  if (!activeCategory) return unique;

  const active = unique.find((c) => c === activeCategory);
  if (!active) return unique;
  return [active, ...unique.filter((c) => c !== active)];
}
