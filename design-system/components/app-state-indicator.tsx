import { AppIcon } from './app-icon';
import type { IconName } from '../icons';

/**
 * AppStateIndicator — port of
 * design_system/lib/core/components/app_state_indicator.dart
 *
 * A coloured status circle. Two quirks carried over deliberately:
 *
 * 1. `warning` is NOT a circle. It renders a bare icon whose size is the
 *    *container* size (32/48/56) rather than the icon ladder — so a 32px amber
 *    triangle, not a 20px one. That is the source, not a mistake here.
 * 2. The success/info icon colour flips with the circle's luminance. The two
 *    outcomes are static per theme, so they are CSS variables
 *    (`--icon-on-*-circle`) instead of runtime colour math.
 */
export type AppStateIndicatorSize = 'sm' | 'md' | 'lg';
export type AppStateIndicatorType = 'error' | 'warning' | 'success' | 'info';

const CONTAINER_SIZE: Record<AppStateIndicatorSize, number> = {
  sm: 32,
  md: 48,
  lg: 56,
};

const ICON_NAME: Record<AppStateIndicatorType, IconName> = {
  error: 'close',
  warning: 'warning',
  success: 'check',
  info: 'info',
};

/** The circle fill. Warning is transparent — it is drawn as a bare icon. */
const BACKGROUND: Record<AppStateIndicatorType, string> = {
  error: 'var(--icon-error)',
  warning: 'transparent',
  success: 'var(--icon-success)',
  info: 'var(--icon-info)',
};

const ICON_COLOR: Record<AppStateIndicatorType, string> = {
  error: 'var(--icon-on-action)',
  warning: 'var(--icon-warning)',
  success: 'var(--icon-on-success-circle)',
  info: 'var(--icon-on-info-circle)',
};

export type AppStateIndicatorProps = {
  type: AppStateIndicatorType;
  size?: AppStateIndicatorSize;
  className?: string;
};

export function AppStateIndicator({
  type,
  size = 'sm',
  className,
}: AppStateIndicatorProps) {
  const px = CONTAINER_SIZE[size];

  if (type === 'warning') {
    return (
      <span className={className} style={{ display: 'inline-flex' }}>
        <AppIcon
          name={ICON_NAME.warning}
          color={ICON_COLOR.warning}
          style={{ fontSize: px, width: px, height: px }}
        />
      </span>
    );
  }

  return (
    <div
      className={className}
      style={{
        width: px,
        height: px,
        flexShrink: 0,
        borderRadius: '50%',
        background: BACKGROUND[type],
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <AppIcon
        name={ICON_NAME[type]}
        size={size === 'sm' ? 'sm' : size === 'md' ? 'md' : 'lg'}
        color={ICON_COLOR[type]}
      />
    </div>
  );
}
