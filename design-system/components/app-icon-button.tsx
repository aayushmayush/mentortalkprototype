'use client';

import type { CSSProperties } from 'react';
import { AppIcon, type IconSize } from './app-icon';
import type { IconName } from '../icons';
import { cn } from '../cn';

/**
 * AppIconButton — port of design_system/lib/core/components/app_icon_button.dart
 *
 * Two types, as in the source:
 *   filled  — a solid brand circle (surface.action) with a white icon
 *   regular — a bare tappable icon, no background
 *
 * Sizes set the *hit target*, and the icon size is chosen independently by the
 * source (sm 32/20, md 48/24, lg 64/48) — lg's 48px icon in a 64px target is
 * deliberate, not a typo.
 */
export type AppIconButtonSize = 'sm' | 'md' | 'lg';
export type AppIconButtonType = 'filled' | 'regular';

const SPEC: Record<AppIconButtonSize, { button: number; icon: IconSize; iconPx: number }> = {
  sm: { button: 32, icon: 'sm', iconPx: 20 },
  md: { button: 48, icon: 'md', iconPx: 24 },
  lg: { button: 64, icon: 'lg', iconPx: 48 },
};

export type AppIconButtonProps = {
  name: IconName;
  onClick?: () => void;
  size?: AppIconButtonSize;
  type?: AppIconButtonType;
  backgroundColor?: string;
  iconColor?: string;
  disabled?: boolean;
  label?: string;
  className?: string;
  style?: CSSProperties;
};

export function AppIconButton({
  name,
  onClick,
  size = 'md',
  type = 'regular',
  backgroundColor,
  iconColor,
  disabled = false,
  label,
  className,
  style,
}: AppIconButtonProps) {
  const spec = SPEC[size];

  const color =
    iconColor ??
    (type === 'filled' ? 'var(--icon-on-action)' : 'var(--icon-primary)');

  const shared = cn(
    'flex shrink-0 items-center justify-center',
    type === 'filled' ? 'rounded-full' : 'rounded-full',
    disabled ? 'cursor-default opacity-40' : 'cursor-pointer',
    className,
  );

  const dims = { width: spec.button, height: spec.button, ...style };

  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      aria-label={label}
      className={shared}
      style={{
        ...dims,
        background: type === 'filled' ? (backgroundColor ?? 'var(--surface-action)') : undefined,
      }}
    >
      <AppIcon name={name} size={spec.icon} color={color} />
    </button>
  );
}
