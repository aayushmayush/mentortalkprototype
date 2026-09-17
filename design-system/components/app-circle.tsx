import type { ReactNode } from 'react';
import { cn } from '../cn';

/**
 * AppCircle — port of design_system/lib/core/components/app_circle.dart
 *
 * A fixed-diameter circle that clips its child. Diameters are the source's
 * (sm 48 / md 64 / lg 88).
 */
export type AppCircleSize = 'sm' | 'md' | 'lg';

const DIAMETER: Record<AppCircleSize, number> = {
  sm: 48,
  md: 64,
  lg: 88,
};

export type AppCircleProps = {
  children: ReactNode;
  size?: AppCircleSize;
  /** Defaults to transparent, matching the source. */
  backgroundColor?: string;
  /** Any CSS border shorthand, e.g. `2px solid var(--border-primary-light)`. */
  border?: string;
  className?: string;
  onClick?: () => void;
};

export function AppCircle({
  children,
  size = 'md',
  backgroundColor,
  border,
  className,
  onClick,
}: AppCircleProps) {
  const px = DIAMETER[size];

  return (
    <div
      className={cn('flex shrink-0 items-center justify-center overflow-hidden rounded-full', className)}
      onClick={onClick}
      style={{
        width: px,
        height: px,
        background: backgroundColor ?? 'transparent',
        border,
      }}
    >
      {children}
    </div>
  );
}
