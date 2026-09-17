import { AppIcon, type IconSize } from './app-icon';
import type { IconName } from '../icons';

/**
 * AppIconCircle — port of design_system/lib/core/components/app_icon_circle.dart
 *
 * Diameters 32/48/56 and icon sizes sm/md/lg (20/24/32) — note the icon is NOT
 * scaled to the circle: md is a 24px icon in a 48px circle, lg a 32px icon in a
 * 56px circle. Both colours are required in the source and are required here.
 */
export type AppIconCircleSize = 'sm' | 'md' | 'lg';

const SPEC: Record<AppIconCircleSize, { circle: number; icon: IconSize }> = {
  sm: { circle: 32, icon: 'sm' },
  md: { circle: 48, icon: 'md' },
  lg: { circle: 56, icon: 'lg' },
};

export type AppIconCircleProps = {
  name: IconName;
  iconColor: string;
  backgroundColor: string;
  size?: AppIconCircleSize;
  className?: string;
};

export function AppIconCircle({
  name,
  iconColor,
  backgroundColor,
  size = 'md',
  className,
}: AppIconCircleProps) {
  const spec = SPEC[size];

  return (
    <div
      className={className}
      style={{
        width: spec.circle,
        height: spec.circle,
        flexShrink: 0,
        borderRadius: '50%',
        background: backgroundColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <AppIcon name={name} size={spec.icon} color={iconColor} />
    </div>
  );
}
