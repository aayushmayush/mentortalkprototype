'use client';

import { AppStateIndicator } from './app-state-indicator';
import { AppIcon } from './app-icon';

/**
 * AppBanner — port of design_system/lib/core/components/app_banner.dart
 *
 * An inline message block: tinted background, a state indicator, an optional
 * bold title and an optional body. The title takes the *variant* colour while
 * the body stays neutral (`text.body`) — that asymmetry is in the source.
 *
 * There is no `close` glyph: dismissal is an sm `close` icon in `icon.primary`.
 */
export type AppBannerVariant = 'info' | 'warning' | 'error' | 'success';

const BACKGROUND: Record<AppBannerVariant, string> = {
  info: 'var(--surface-info)',
  warning: 'var(--surface-warning)',
  error: 'var(--surface-error)',
  success: 'var(--surface-success)',
};

const TITLE_COLOR: Record<AppBannerVariant, string> = {
  info: 'var(--text-info)',
  warning: 'var(--text-warning)',
  error: 'var(--text-error)',
  success: 'var(--text-success)',
};

export type AppBannerProps = {
  variant: AppBannerVariant;
  title?: string;
  message?: string;
  onDismiss?: () => void;
  className?: string;
};

export function AppBanner({
  variant,
  title,
  message,
  onDismiss,
  className,
}: AppBannerProps) {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '12px 16px',
        borderRadius: 12,
        background: BACKGROUND[variant],
      }}
    >
      <span style={{ paddingTop: 2, display: 'inline-flex' }}>
        <AppStateIndicator type={variant} size="sm" />
      </span>

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {title ? (
          <span
            className="type-title-lg type-emphasis-semibold"
            style={{ color: TITLE_COLOR[variant] }}
          >
            {title}
          </span>
        ) : null}
        {message ? (
          <span className="type-body-md" style={{ color: 'var(--text-body)' }}>
            {message}
          </span>
        ) : null}
      </div>

      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          style={{ display: 'inline-flex', marginLeft: 8 }}
        >
          <AppIcon name="close" size="sm" color="var(--icon-primary)" />
        </button>
      ) : null}
    </div>
  );
}
