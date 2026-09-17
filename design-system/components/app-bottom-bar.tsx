'use client';

import { AppIcon } from './app-icon';
import type { IconName } from '../icons';

/**
 * AppBottomBar — port of design_system/lib/core/components/app_bottom_bar.dart
 *
 * The four-tab bar at the foot of the home shell. Each item is 56 tall and
 * laid out as icon-over-label with a 4px gap.
 *
 * State colours are inverted from what you might expect: the SELECTED item uses
 * `icon.secondary` (near-black in light) and the unselected use `icon.primary`
 * (mid grey) — the selected icon is the darker one, and it is `text.heading`
 * with a bold label. `activeIcon` defaults to `icon` when not supplied.
 *
 * The bar owns no selection state here: the home shell drives it through the
 * `?tab=` search param so the selection is URL-addressable and survives reloads.
 */
export type AppBottomBarItem = {
  label: string;
  icon: IconName;
  activeIcon?: IconName;
};

export type AppBottomBarProps = {
  items: AppBottomBarItem[];
  currentIndex: number;
  onTap: (index: number) => void;
  className?: string;
};

export function AppBottomBar({
  items,
  currentIndex,
  onTap,
  className,
}: AppBottomBarProps) {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        background: 'var(--surface-primary)',
        flexShrink: 0,
      }}
    >
      {items.map((item, index) => {
        const selected = index === currentIndex;
        return (
          <button
            key={item.label}
            type="button"
            onClick={() => onTap(index)}
            aria-current={selected ? 'page' : undefined}
            style={{
              flex: 1,
              height: 56,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
            }}
          >
            <AppIcon
              name={selected ? (item.activeIcon ?? item.icon) : item.icon}
              size="md"
              color={selected ? 'var(--icon-secondary)' : 'var(--icon-primary)'}
            />
            <span
              className={selected ? 'type-label-md type-emphasis-bold' : 'type-label-md'}
              style={{
                color: selected ? 'var(--text-heading)' : 'var(--text-body-light)',
              }}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
