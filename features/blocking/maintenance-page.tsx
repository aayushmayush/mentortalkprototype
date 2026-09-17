'use client';

import { useSearchParams } from 'next/navigation';
import { AppBrand, AppIcon } from '@/design-system';
import { copy } from '@/lib/copy';

/**
 * MaintenancePage — port of `core/lib/config/ui/maintenance_page.dart`.
 *
 * The full-screen state shown when the backend answers 503 for the app as a
 * whole. It is not a route in go_router; `AppConfigService` swaps the whole
 * widget tree for it, so there is no app bar, no back, and nothing to navigate
 * to. The prototype gives it a URL so it can be looked at directly.
 *
 * ── The layout is `Center` + `mainAxisSize.min` inside 24px of padding ─────
 *
 * Brand lockup, 24, a 64px glyph, 24, a `headlineSmall w600` title, 12, then
 * the message. Every gap is `spacingLg` except the last, which is `spacingSm` —
 * the title sits closer to its body than to the icon above it.
 *
 * ── The message comes from the SERVER and the field is not optional ────────
 *
 * `MaintenancePage({ required this.message })` takes a non-null String, and it
 * is the 503 body's `message`. The `message.isNotEmpty` fallback to
 * `maintenanceDefaultMessage` exists because the API can send an empty string
 * rather than omitting the field — so "no message" arrives as `''`, not null.
 * `?message=` drives that branch here.
 *
 * ── The glyph is raw `Icons.construction_rounded` at 64, not an AppIcons ───
 *
 * Same divergence as the blocked-users back arrow: this screen reaches past the
 * icon set for a rounded glyph, at a size four steps above the DS's largest.
 */

export function MaintenancePage() {
  const searchParams = useSearchParams();
  const message = searchParams.get('message') ?? '';

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--surface-page)',
        // `EdgeInsets.all(spacingLg)`.
        padding: 'var(--spacing-lg)',
        boxSizing: 'border-box',
      }}
    >
      <AppBrand />

      <div style={{ height: 'var(--spacing-lg)' }} />

      <AppIcon name="construction" px={64} color="var(--icon-secondary)" />

      <div style={{ height: 'var(--spacing-lg)' }} />

      <div
        className="type-headline-sm type-emphasis-semibold"
        style={{ color: 'var(--text-heading)', textAlign: 'center' }}
      >
        {copy.underMaintenance}
      </div>

      <div style={{ height: 'var(--spacing-sm)' }} />

      <div
        className="type-body-md"
        style={{ color: 'var(--text-body-light)', textAlign: 'center' }}
      >
        {message !== '' ? message : copy.maintenanceDefaultMessage}
      </div>
    </div>
  );
}
