'use client';

import { AppIconCircle } from '@/design-system';
import { copy } from '@/lib/copy';
import type { IconName } from '@/design-system';

/**
 * AccountActionGrid — port of `ui/account/widgets/account_action_grid.dart`.
 *
 * A 2-column grid, `childAspectRatio: 1.4`, 12px in both directions. Each tile
 * is a `surface.primary` card at radius 16 with a 12px inset: a 32px icon
 * circle pinned top-left, a `Spacer`, then the label at the bottom. So the
 * circle is not vertically centred — it rides high and the label sits low, and
 * the gap between them is whatever the tile's height works out to. The
 * `mainAxisAlignment: center` does nothing visible once a `Spacer` is present,
 * which is why it is not reproduced.
 *
 * ── The "My Reviews" tile is commented out in the source ────────────────────
 *
 * Four tiles ship, not five: Wallet, Order History, My Following, Settings.
 * The `My Reviews` `_ActionTile` is commented out in
 * `account_action_grid.dart`, and the import of `my_reviews_page.dart` plus the
 * now-uncalled `_openReviews` method were left behind with it. That is why
 * `MyReviewsPage` is unreachable from anywhere in the running app — the screen
 * exists and compiles, nothing links to it. Not a prototype omission; the
 * production state.
 *
 * The four icon colours are hard-coded literals in the source (`0xFF4CAF50`
 * and friends), not theme tokens — they are the only place in the app that
 * paints outside `AppColorScheme`, so they are transcribed as hex here rather
 * than mapped onto tokens that do not exist.
 */

type Action = {
  label: string;
  icon: IconName;
  iconColor: string;
  iconBgColor: string;
};

const ACTIONS: Action[] = [
  {
    label: copy.wallet,
    icon: 'wallet',
    iconColor: '#4CAF50',
    iconBgColor: '#E8F5E9',
  },
  {
    label: copy.orderHistory,
    icon: 'history',
    iconColor: '#7E57C2',
    iconBgColor: '#EDE7F6',
  },
  {
    label: copy.myFollowing,
    icon: 'people',
    iconColor: '#42A5F5',
    iconBgColor: '#E3F2FD',
  },
  {
    label: copy.settings,
    icon: 'settings',
    iconColor: '#41BDA6',
    iconBgColor: '#CBF3EB',
  },
];

export function AccountActionGrid({
  onAction,
}: {
  /** Index into `ACTIONS` — the destination is wired by the caller. */
  onAction?: (index: number, action: Action) => void;
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 12,
      }}
    >
      {ACTIONS.map((action, index) => (
        <div
          key={action.label}
          onClick={() => onAction?.(index, action)}
          style={{
            // The source's `childAspectRatio: 1.4` — width / height.
            aspectRatio: '1.4',
            padding: 12,
            background: 'var(--surface-primary)',
            borderRadius: 'var(--ds-radius-md)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            justifyContent: 'center',
            cursor: onAction ? 'pointer' : 'default',
            boxSizing: 'border-box',
          }}
        >
          <AppIconCircle
            name={action.icon}
            size="sm"
            iconColor={action.iconColor}
            backgroundColor={action.iconBgColor}
          />

          <span style={{ flex: 1 }} />

          <span
            className="type-title-md type-emphasis-semibold"
            style={{ color: 'var(--text-body)' }}
          >
            {action.label}
          </span>
        </div>
      ))}
    </div>
  );
}
