'use client';

import { copy } from '@/lib/copy';

/**
 * CategoryChips — port of `ui/mentors/widgets/category_chips.dart`.
 *
 * App-level, so `components/` rather than `design-system/`.
 *
 * The source's own doc comment claims the unselected state has "white fill +
 * border + dark text". The code has **no border** — just `surface.primary` and
 * `text.bodyLight`. The code is what was ported.
 *
 * The selected chip is the only place in this row that switches to
 * `text.onAction`, and its weight goes `bold` vs `normal` — note `normal`, not
 * the theme's w500 default, so unselected chips are deliberately lighter than
 * body text elsewhere.
 *
 * The first chip is always "Popular" and represents *no* category filter — it
 * is `CategoryChipPopular`, not a category named Popular. That distinction is
 * what the `id: null` carries.
 */
export type CategoryChip =
  | { kind: 'popular'; label: string }
  | { kind: 'category'; id: string; label: string };

export function CategoryChips({
  chips,
  selectedIndex,
  onSelected,
}: {
  chips: CategoryChip[];
  selectedIndex: number;
  onSelected: (index: number) => void;
}) {
  return (
    <div
      className="no-scrollbar"
      style={{
        height: 34,
        display: 'flex',
        gap: 8,
        padding: '0 16px',
        overflowX: 'auto',
        overflowY: 'hidden',
      }}
    >
      {chips.map((chip, index) => {
        const isSelected = index === selectedIndex;
        const label = chip.kind === 'popular' ? copy.popular : chip.label;

        return (
          <div
            key={chip.kind === 'popular' ? '__popular' : chip.id}
            onClick={() => onSelected(index)}
            style={{
              padding: '8px 16px',
              background: isSelected ? 'var(--surface-action)' : 'var(--surface-primary)',
              borderRadius: 'var(--ds-radius-lg)',
              cursor: 'pointer',
              flex: '0 0 auto',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <span
              className="type-label-lg"
              style={{
                color: isSelected ? 'var(--text-on-action)' : 'var(--text-body-light)',
                fontWeight: isSelected ? 'bold' : 'normal',
                whiteSpace: 'nowrap',
              }}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
