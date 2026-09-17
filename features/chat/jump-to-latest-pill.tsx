'use client';

import { AppIcon } from '@/design-system';

/**
 * JumpToLatestPill — port of `widgets/jump_to_latest_pill.dart`.
 *
 * Shown when the reader is parked away from the live edge — after tapping a
 * quoted reply to jump to its parent, say. Tapping snaps back to the newest
 * page. It doubles as the unread counter while messages buffer during the jump.
 *
 * Geometry is exact: a 44×44 circle in `surface.primary`, shadow
 * `rgba(0,0,0,0.12)` blur 8 offset (0, 2), a 20px `arrowDown` in `text.heading`,
 * and — when there is anything unread — a badge positioned at (-4, -4) with a
 * 10px corner radius, `minWidth` 18, and `99+` as the ceiling.
 *
 * The badge overflow is NOT clipped: the source sets `clipBehavior: Clip.none`
 * on the Stack, so the counter sits proud of the circle's top-right edge. An
 * `overflow: hidden` anywhere on the ancestor chain would shear it off.
 */
export function JumpToLatestPill({
  unreadCount,
  onTap,
}: {
  unreadCount: number;
  onTap: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onTap}
      aria-label={
        unreadCount > 0 ? `Jump to latest, ${unreadCount} unread` : 'Jump to latest'
      }
      style={{
        position: 'relative',
        width: 44,
        height: 44,
        flexShrink: 0,
        padding: 0,
        border: 'none',
        borderRadius: '50%',
        background: 'var(--surface-primary)',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.12)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
      }}
    >
      <AppIcon name="arrowDown" px={20} color="var(--text-heading)" />
      {unreadCount > 0 && (
        <span
          style={{
            position: 'absolute',
            top: -4,
            right: -4,
            minWidth: 18,
            padding: '2px 6px',
            boxSizing: 'border-box',
            borderRadius: 10,
            background: 'var(--surface-action)',
            color: 'var(--text-on-action)',
            fontSize: 11,
            fontWeight: 600,
            lineHeight: 1.35,
            textAlign: 'center',
          }}
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
}
