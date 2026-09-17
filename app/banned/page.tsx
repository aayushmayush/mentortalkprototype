'use client';

import { AppButton, AppStateIndicator } from '@/design-system';
import { useAuth } from '@/lib/state/auth-provider';
import { copy } from '@/lib/copy';

/**
 * Banned — port of `core/lib/auth/ui/widgets/ban_page.dart`.
 *
 * A blocking state: the router renders it in place of the shell, so it has no
 * top bar and no way back — the only exit is Contact Support.
 *
 * The layout is Spacer / card / Spacer / footer, which centres the card and
 * pins the support block to the bottom. The card is `surface.primary` on
 * `surface.page` with radius 16 (borderRadiusMd) and spacingLg padding, and the
 * indicator is the LARGE (56px) error state indicator — a white glyph on the
 * error circle, not an outlined one.
 *
 * `launchUrl(mailto:)` has no browser equivalent that works reliably from a
 * sandboxed page, so the button is inert but present — noted rather than
 * silently dropped. See the README's native-surfaces section.
 */
export default function BannedPage() {
  const { state } = useAuth();
  const reason =
    state.status === 'banned' && state.reason
      ? state.reason
      : copy.accountSuspendedDefaultReason;

  return (
    <div
      style={{
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '0 16px',
        background: 'var(--surface-page)',
      }}
    >
      <div style={{ flex: 1 }} />

      <div
        style={{
          padding: 'var(--spacing-lg)',
          background: 'var(--surface-primary)',
          borderRadius: 16,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <AppStateIndicator type="error" size="lg" />

        <div style={{ height: 16 }} />

        <h1 className="type-headline-md type-emphasis-semibold" style={{ color: 'var(--text-heading)', textAlign: 'center' }}>
          {copy.accountSuspended}
        </h1>

        <div style={{ height: 12 }} />

        <p className="type-body-md" style={{ color: 'var(--text-body-light)', textAlign: 'center' }}>
          {reason}
        </p>
      </div>

      <div style={{ flex: 1 }} />

      <p className="type-body-sm" style={{ color: 'var(--text-body-light)', textAlign: 'center' }}>
        {copy.banContactSupportMessage}
      </p>

      <div style={{ height: 12 }} />

      <AppButton label={copy.contactSupport} fullWidth onClick={() => {}} />

      <div style={{ height: 24 }} />
    </div>
  );
}
