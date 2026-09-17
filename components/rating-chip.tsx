import { AppIcon } from '@/design-system';

/**
 * RatingChip — port of `mentee_app/lib/ui/core/widgets/rating_chip.dart`.
 *
 * App-level, not design-system: the Flutter original lives in
 * `mentee_app/lib/ui/core/widgets`, so it sits in `components/` here for the
 * same reason `AppErrorView` does — `design-system/` stays an extractable port
 * of the Flutter package, and this widget is not part of it.
 *
 * Two sizes, and they are not just scaled copies — the sizes use different
 * glyphs and different type slots:
 *
 *   sm   `AppIcons.starRounded` at xs, hard-coded `#FFCA28` (NOT the theme's
 *        warning colour), `labelMedium` at w600
 *   md   `AppIcons.star` at md in `icon.warning`, `labelLarge` at the theme's
 *        own weight
 *
 * The hard-coded amber in the `sm` branch is the source's, not a slip.
 */
export function RatingChip({
  rating,
  size = 'md',
}: {
  rating: string;
  size?: 'sm' | 'md';
}) {
  const isSm = size === 'sm';

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 2,
        padding: '4px 8px',
        borderRadius: 'var(--ds-radius-lg)',
        background: 'var(--surface-shadow)',
      }}
    >
      <AppIcon
        name="star"
        size={isSm ? 'xs' : 'md'}
        color={isSm ? '#FFCA28' : 'var(--icon-warning)'}
      />
      <span
        className={isSm ? 'type-label-md type-emphasis-semibold' : 'type-label-lg'}
        style={{ color: 'var(--text-body)' }}
      >
        {rating}
      </span>
    </div>
  );
}
