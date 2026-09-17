'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { AppBrand, AppButton, AppIcon } from '@/design-system';
import { copy } from '@/lib/copy';

/**
 * ForceUpdatePage — port of `core/lib/config/ui/force_update_page.dart`.
 *
 * ONE component serving TWO states, told apart by a single `force` flag:
 *
 *   force = true   "Update Required"   + the description + Update Now only
 *   force = false  "Update Available"  + the same description + Update Now
 *                                                          + a plain "Later"
 *
 * The flag changes three things and no more: the title, which description is
 * read, and whether the dismiss button exists. The `updateAvailableDescription`
 * is shared with `/settings/about`, which is why the two screens say the same
 * sentence about the same situation.
 *
 * ── The dismiss button is the ONLY reason `onDismiss` exists ───────────────
 *
 * `ForceUpdatePage({ onDismiss })` is nullable, and a forced update is
 * constructed without one — so a forced screen has no way out even if
 * something upstream tried to render a Later button. That is the whole
 * enforcement mechanism: the app is not blocked by a guard, it is blocked by
 * there being no button. `?force=0` renders the optional state.
 *
 * ── `onDismiss` has no navigation attached here ────────────────────────────
 *
 * In production the caller decides what dismissing means — the app returns to
 * whatever it was covering, because this page *covers* a working app rather
 * than replacing it. The prototype has no app underneath, so `?force=0`'s
 * Later button goes back to Home and the header says so, rather than silently
 * doing nothing.
 */

const STORE_URL =
  'https://play.google.com/store/apps/details?id=app.mentortalk.mentee';

export function ForceUpdatePage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // `force` defaults to TRUE — the required state is the one the app ships in
  // when `isUpdateRequired` is true, and it is the state worth seeing first.
  const force = searchParams.get('force') !== '0';

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--surface-page)',
        padding: 'var(--spacing-lg)',
        boxSizing: 'border-box',
      }}
    >
      <AppBrand />

      <div style={{ height: 'var(--spacing-lg)' }} />

      <AppIcon name="systemUpdate" px={64} color="var(--icon-secondary)" />

      <div style={{ height: 'var(--spacing-lg)' }} />

      <div
        className="type-headline-sm type-emphasis-semibold"
        style={{ color: 'var(--text-heading)', textAlign: 'center' }}
      >
        {force ? copy.updateRequired : copy.updateAvailable}
      </div>

      <div style={{ height: 'var(--spacing-sm)' }} />

      <div
        className="type-body-md"
        style={{ color: 'var(--text-body-light)', textAlign: 'center' }}
      >
        {force ? copy.updateRequiredDescription : copy.updateAvailableDescription}
      </div>

      <div style={{ height: 'var(--spacing-xl)' }} />

      {/* No `fullWidth` — the button hugs its label and is centred by the
          column, which is what an unconstrained `AppButton` does. */}
      <AppButton
        label={copy.updateNow}
        onClick={() => {
          window.location.href = STORE_URL;
        }}
      />

      {!force && (
        <>
          <div style={{ height: 'var(--spacing-sm)' }} />
          <AppButton
            label={copy.later}
            type="plain"
            onClick={() => router.replace('/home?tab=home')}
          />
        </>
      )}
    </div>
  );
}
