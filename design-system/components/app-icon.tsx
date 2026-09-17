import type { CSSProperties } from 'react';
import { FILLED_ICONS, icons, type IconName } from '../icons';
import { cn } from '../cn';

/**
 * AppIcon — port of design_system/lib/core/components/app_icon.dart
 *
 * The Flutter widget exposes named constructors (`AppIcon.sm(...)`), which
 * TypeScript has no equivalent of; the size is a prop instead. Sizes and the
 * default colour are the source's own (16/20/24/32, `icon.primary`).
 *
 * Renders a ligature: the Material Symbols variable font turns the text
 * "chat_bubble_outline" into a glyph. That is why the font must be loaded
 * before first paint — hence `font-display: block` in globals.css rather than
 * `swap`, which would flash the raw ligature text.
 */
export type IconSize = 'xs' | 'sm' | 'md' | 'lg';

const SIZE_PX: Record<IconSize, number> = {
  xs: 16,
  sm: 20,
  md: 24,
  lg: 32,
};

export type AppIconProps = {
  name: IconName;
  size?: IconSize;
  /**
   * An exact pixel size, overriding `size`.
   *
   * The four named constructors cover most of the app but not all of it: the
   * call overlays draw icons at 18, 22, 26, 28 and 32, and the review sheet's
   * stars are 40 — none of which land on 16/20/24/32. The Flutter side simply
   * passes `size:` to `Icon`, and this is the same escape hatch.
   */
  px?: number;
  /** Any CSS colour. Defaults to `icon.primary`, matching the source. */
  color?: string;
  /**
   * Material Symbols FILL axis: 0 outlined, 1 filled.
   * Defaults to whatever the icon name implies — `homeFilled` is filled,
   * `home` is not. Pass this only to override that.
   */
  filled?: boolean;
  /** Material Symbols wght axis, 100–700. The app's icons are all 400. */
  weight?: number;
  className?: string;
  style?: CSSProperties;
  /** Supply only when the icon is the sole carrier of meaning. */
  label?: string;
};

export function AppIcon({
  name,
  size = 'md',
  px: pxOverride,
  color,
  filled,
  weight,
  className,
  style,
  label,
}: AppIconProps) {
  const px = pxOverride ?? SIZE_PX[size];
  const isFilled = filled ?? FILLED_ICONS.has(name);

  return (
    <span
      className={cn('material-symbols-outlined', className)}
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? 'img' : undefined}
      style={{
        fontSize: px,
        width: px,
        height: px,
        color: color ?? 'var(--icon-primary)',
        ...(isFilled ? ({ '--icon-fill': 1 } as CSSProperties) : null),
        ...(weight ? ({ '--icon-weight': weight } as CSSProperties) : null),
        ...style,
      }}
    >
      {icons[name]}
    </span>
  );
}
