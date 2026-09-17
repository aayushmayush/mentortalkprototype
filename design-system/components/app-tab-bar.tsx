'use client';

import { cn } from '../cn';

/**
 * AppTabBar — port of design_system/lib/core/components/app_tab_bar.dart
 *
 * A segmented pill: a white track (radius 24, 2px inner padding) with the
 * selected segment filled `surface.actionLight` and its label in `text.action`
 * at w700; unselected labels are bodyLight at w500.
 *
 * There is a second 2px of padding INSIDE the TabBar as well as the outer
 * container's, so the effective inset around the indicator is 4px on the
 * horizontal axis and 4px vertically. Both are in the source; dropping either
 * makes the pill look subtly wrong.
 *
 * Segment height is a fixed 40 and tabs never scroll — the app's tab bars have
 * two or three segments, never more.
 */
export type AppTabBarProps = {
  tabs: string[];
  index: number;
  onChange: (index: number) => void;
  className?: string;
};

export function AppTabBar({ tabs, index, onChange, className }: AppTabBarProps) {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        padding: 4,
        borderRadius: 24,
        background: 'var(--surface-primary)',
      }}
    >
      {tabs.map((tab, i) => {
        const selected = i === index;
        return (
          <button
            key={tab}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(i)}
            className={cn(
              'type-title-md',
              selected && 'type-emphasis-bold',
              'flex-1 whitespace-nowrap',
            )}
            style={{
              height: 40,
              borderRadius: 24,
              background: selected ? 'var(--surface-action-light)' : 'transparent',
              color: selected ? 'var(--text-action)' : 'var(--text-body-light)',
              transition: 'background 180ms var(--ease-out), color 180ms var(--ease-out)',
              padding: '0 8px',
            }}
          >
            {tab}
          </button>
        );
      })}
    </div>
  );
}
