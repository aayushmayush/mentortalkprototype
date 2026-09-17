import { AppIcon } from './app-icon';

/**
 * LiveBadge — port of design_system/lib/core/components/live_badge.dart
 *
 * A red pill reading "LIVE" (or a viewer count). Sizes shift the text style,
 * the padding and — for `xl` only — the radius from 24 down to 8 and the weight
 * to bold. `xl` also defaults `showIcon` to true, so the eye glyph appears
 * unless it is explicitly turned off.
 *
 * Red is `text.error`, not the --feature-live token, even though the two are
 * near-identical; the source uses the text colour, so that is what is used.
 */
export type LiveBadgeSize = 'sm' | 'md' | 'lg' | 'xl';

const TEXT_CLASS: Record<LiveBadgeSize, string> = {
  sm: 'type-label-sm',
  md: 'type-label-md',
  lg: 'type-label-lg',
  xl: 'type-label-md',
};

const PADDING: Record<LiveBadgeSize, string> = {
  sm: '0 8px',
  md: '2px 8px',
  lg: '2px 8px',
  xl: '8px',
};

export type LiveBadgeProps = {
  /** Defaults to the literal word LIVE. */
  viewers?: string;
  showIcon?: boolean;
  size?: LiveBadgeSize;
  className?: string;
};

export function LiveBadge({
  viewers,
  showIcon,
  size = 'md',
  className,
}: LiveBadgeProps) {
  const withIcon = showIcon ?? size === 'xl';

  return (
    <div
      className={className}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: withIcon ? (size === 'xl' ? 4 : 2) : 0,
        padding: PADDING[size],
        borderRadius: size === 'xl' ? 8 : 24,
        background: 'var(--text-error)',
      }}
    >
      {withIcon ? (
        <AppIcon name="eyeOutlined" size="md" color="var(--icon-on-action)" />
      ) : null}
      <span
        className={`${TEXT_CLASS[size]}${size === 'xl' ? ' type-emphasis-bold' : ''}`}
        style={{ color: 'var(--text-on-action)' }}
      >
        {viewers ?? 'LIVE'}
      </span>
    </div>
  );
}
