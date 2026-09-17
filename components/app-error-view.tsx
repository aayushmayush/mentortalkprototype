'use client';

import { AppButton, AppIcon } from '@/design-system';
import { copy } from '@/lib/copy';

/**
 * AppErrorView — port of `core/lib/shared/widgets/app_error_view.dart`.
 *
 * Deliberately NOT in `design-system/`. The Flutter original lives in
 * `core/shared/widgets`, not the design system package, so putting it here
 * keeps the layering rule intact — `design-system/` must stay an extractable
 * port of the Flutter package, and this widget is app-level.
 *
 * The interesting behaviour is `_isNetworkError`: rather than being told the
 * error kind, this widget *sniffs the message string* for "no internet",
 * "network", "connection", "SocketException" or "Failed host lookup". That
 * changes both the glyph (`wifi_off` vs `error`) and which copy shows — the
 * message itself is hidden for network errors, replaced by a "check your
 * connection" line, because a raw exception string is not useful to a student.
 *
 * The auto-retry is the other half: when the network restores while this is on
 * screen, it calls `onRetry` once, guarded by `_hasAutoRetried` which resets
 * whenever the message changes. In the prototype the network state comes from
 * the chrome's toggle, so this path is reachable and worth having.
 */
export function AppErrorView({
  message,
  onRetry,
  onLogout,
  logoutLabel,
}: {
  message?: string | null;
  onRetry: () => void;
  onLogout?: () => void;
  logoutLabel?: string;
}) {
  const isNetworkError = isNetworkMessage(message);

  return (
    <div
      style={{
        minHeight: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        {/* `AppIcons.wifiOff` / `AppIcons.error` at 48 — outside the icon ladder. */}
        <AppIcon
          name={isNetworkError ? 'wifiOff' : 'error'}
          size="lg"
          color="var(--icon-secondary)"
          style={{ fontSize: 48, width: 48, height: 48 }}
        />

        <div style={{ height: 16 }} />

        <div className="type-title-md" style={{ color: 'var(--text-heading)' }}>
          {isNetworkError ? copy.noInternetConnection : copy.somethingWentWrongBare}
        </div>

        {!isNetworkError && message ? (
          <>
            <div style={{ height: 6 }} />
            <p className="type-body-sm" style={{ color: 'var(--text-body-light)' }}>
              {message}
            </p>
          </>
        ) : null}

        {isNetworkError ? (
          <>
            <div style={{ height: 6 }} />
            <p className="type-body-sm" style={{ color: 'var(--text-body-light)' }}>
              {copy.checkConnectionAndRetry}
            </p>
          </>
        ) : null}

        <div style={{ height: 24 }} />

        <AppButton label={copy.retry} onClick={onRetry} />

        {onLogout && logoutLabel ? (
          <>
            <div style={{ height: 12 }} />
            <AppButton
              label={logoutLabel}
              type="outlined"
              intent="destructive"
              onClick={onLogout}
            />
          </>
        ) : null}
      </div>
    </div>
  );
}

/** `_isNetworkError` — the source's own five-way substring test. */
export function isNetworkMessage(message?: string | null): boolean {
  const m = (message ?? '').toLowerCase();
  return (
    m.includes('no internet') ||
    m.includes('network') ||
    m.includes('connection') ||
    m.includes('socketexception') ||
    m.includes('failed host lookup')
  );
}
