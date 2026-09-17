'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AppButton,
  AppIconButton,
  AppLoadingSpinner,
  AppTopBar,
  PagePadding,
} from '@/design-system';
import { copy } from '@/lib/copy';

/**
 * AppInfoPage — port of `core/lib/config/ui/app_info_page.dart`.
 *
 * ── Where the version comes from, and where it does not ────────────────────
 *
 * The source reads TWO independent things and compares them:
 *
 *   `PackageInfo.fromPlatform().version`      — the build's own version, baked
 *                                                into the binary
 *   `AppConfigService.check(app: 'mentee')`    — a remote config fetch giving
 *                                                `minVersion`
 *
 * and then `isUpdateRequired(currentVersion, minVersion)`. So the "update
 * available" branch is driven entirely by whether the installed build is below
 * the server's floor — the app cannot know about a NEWER version than its own
 * binary, which is why the copy says "a new version is available" rather than
 * naming one.
 *
 * A browser has no `PackageInfo`, so `CURRENT_VERSION` below is a constant.
 * It is deliberately set BELOW `MIN_VERSION` so the update branch renders on
 * first load — the interesting half of this screen is the one with the button,
 * and a prototype that defaults to "you're up to date" would hide it. Flip the
 * two to see the other state; both are real.
 *
 * ── `isLoading` is nearly invisible, and that is faithful ──────────────────
 *
 * Two `await`s (platform info, then a network config fetch) sit behind a
 * centred `AppLoadingIndicator`. In the prototype both resolve immediately
 * except for a short artificial delay, so the spinner is a flash. It is kept
 * rather than skipped because the branch exists in the source and its absence
 * would be a silent difference.
 *
 * ── The two layouts are NOT the same layout ────────────────────────────────
 *
 * The doc comment on the class says it plainly: *"When an update is available
 * (but not forced), a gentle nudge … is shown centered on screen. When already
 * up-to-date, the info is top-aligned."* Both branches are wrapped in a
 * `Center`, but the up-to-date branch's `Column` is
 * `mainAxisSize: MainAxisSize.min` inside a `Center` — which in a
 * `SingleChildScrollView`-less body means the content centres vertically
 * either way. The real difference is the 32px gap and the button. Reproduced
 * with the same `mainAxisSize.min` equivalent: a min-height flex column that
 * centres its content.
 */

/** Stands in for `PackageInfo.fromPlatform().version`. */
const CURRENT_VERSION = '1.0.12';

/** Stands in for `AppConfigService.check(app: 'mentee').minVersion`. */
const MIN_VERSION = '1.0.13';

/** The two `await`s in `_loadInfo`, compressed. */
const CONFIG_LOAD_MS = 400;

/**
 * `AppConfigService.isUpdateRequired(current, min)` — a segment-wise numeric
 * compare, not a string compare. `'1.0.9' < '1.0.10'` is true numerically and
 * false lexicographically, which is exactly the bug a naive `current < min`
 * would have on the version that matters most.
 *
 * Non-numeric segments are treated as 0 (the Dart splits on `'.'` and
 * `int.tryParse`s), so a `'1.0.13-beta'` compares as `1.0.13`.
 */
function isUpdateRequired(current: string, min: string): boolean {
  const parse = (v: string) => v.split('.').map((p) => parseInt(p, 10) || 0);
  const a = parse(current);
  const b = parse(min);
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    if (x !== y) return x < y;
  }
  return false;
}

/** The Play Store listing the update button opens. */
const STORE_URL =
  'https://play.google.com/store/apps/details?id=app.mentortalk.mentee';

export function AppInfoPage() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  // `initState` → `_loadInfo()`.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setUpdateAvailable(isUpdateRequired(CURRENT_VERSION, MIN_VERSION));
      setIsLoading(false);
    }, CONFIG_LOAD_MS);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--surface-page)',
      }}
    >
      <AppTopBar
        title={copy.appInfo}
        onBack={() => router.back()}
        /* `actions: [AppIconButton(icon: AppIcons.help, …)]` — a mailto to
           support. A browser cannot open a mail client the way `launchUrl`
           does, so this navigates the tab; on a machine with no mail handler
           the browser shows its own "no application" page, which is the same
           failure `launchUrl` has with no mail app installed. */
        actions={
          <AppIconButton
            name="help"
            label="Email support"
            onClick={() => {
              window.location.href = 'mailto:support@mentortalk.app';
            }}
          />
        }
      />

      {isLoading && (
        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AppLoadingSpinner size="md" />
        </div>
      )}

      {!isLoading && (
        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <PagePadding>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <div
                className="type-headline-md type-emphasis-bold"
                style={{ color: 'var(--text-heading)', textAlign: 'center' }}
              >
                {copy.appTitle}
              </div>
              <div style={{ height: 'var(--spacing-md)' }} />
              <div
                className="type-title-md"
                style={{ color: 'var(--text-body)', textAlign: 'center' }}
              >
                {`${copy.version}: ${CURRENT_VERSION}`}
              </div>
              <div style={{ height: 'var(--spacing-md)' }} />
              <div
                className="type-body-lg"
                style={{ color: 'var(--text-body-light)', textAlign: 'center' }}
              >
                {updateAvailable
                  ? copy.updateAvailableDescription
                  : copy.latestVersionInstalled}
              </div>

              {updateAvailable && (
                <>
                  <div style={{ height: 'var(--spacing-xl)' }} />
                  <div style={{ width: '100%' }}>
                    <AppButton
                      label={copy.updateNow}
                      fullWidth
                      onClick={() => {
                        window.location.href = STORE_URL;
                      }}
                    />
                  </div>
                </>
              )}
            </div>
          </PagePadding>
        </div>
      )}
    </div>
  );
}
