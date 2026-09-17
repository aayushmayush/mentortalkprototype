'use client';

import type { CSSProperties, ReactNode } from 'react';
import { cn } from '../cn';

/**
 * AppButton — port of design_system/lib/core/components/app_button.dart
 *
 * Three types × two sizes × three intents, with the source's exact colour
 * mapping. Points worth preserving:
 *
 * - Radius is `borderRadiusLg` (24), not md. Buttons are the one place "lg"
 *   means the big pill.
 * - `plain` has no background *and* no overlay, so it does not darken on press.
 * - `isLoading` swaps the label for a spinner AND disables the button — the
 *   source nulls `onPressed` while loading.
 * - The spinner is 12px with a 2px stroke in `border.loading`.
 */
export type AppButtonType = 'solid' | 'outlined' | 'plain';
export type AppButtonSize = 'compact' | 'regular';
export type AppButtonIntent = 'primary' | 'secondary' | 'destructive';

const SIZE_SPEC = {
  compact: {
    height: 32,
    padding: '4px 16px',
    className: 'type-title-sm',
  },
  regular: {
    height: 48,
    padding: '12px 16px',
    className: 'type-title-md',
  },
} as const;

export type AppButtonProps = {
  label: string;
  onClick?: () => void;
  type?: AppButtonType;
  size?: AppButtonSize;
  intent?: AppButtonIntent;
  isLoading?: boolean;
  disabled?: boolean;
  /** Rendered before the label. Not in the Flutter widget, but needed often. */
  leading?: ReactNode;
  fullWidth?: boolean;
  className?: string;
  style?: CSSProperties;
};

export function AppButton({
  label,
  onClick,
  type = 'solid',
  size = 'regular',
  intent = 'primary',
  isLoading = false,
  disabled = false,
  leading,
  fullWidth = false,
  className,
  style,
}: AppButtonProps) {
  const spec = SIZE_SPEC[size];
  const isDisabled = disabled || !onClick;
  const isInert = isDisabled || isLoading;

  let background: string | undefined;
  let color: string;
  let border: string | undefined;

  if (type === 'solid') {
    background = isDisabled ? 'var(--surface-disabled)' : 'var(--surface-action)';
    color = isDisabled ? 'var(--text-body-light)' : 'var(--text-on-action)';
  } else if (type === 'outlined') {
    background = 'transparent';
    color = isDisabled ? 'var(--text-body-light)' : 'var(--text-action)';
    border = `1px solid ${isDisabled ? 'var(--border-disabled)' : 'var(--border-secondary)'}`;
  } else {
    background = 'transparent';
    color = isDisabled
      ? 'var(--text-body-light)'
      : intent === 'primary'
        ? 'var(--text-action)'
        : intent === 'destructive'
          ? 'var(--text-error)'
          : 'var(--text-body)';
  }

  return (
    <button
      type="button"
      onClick={isInert ? undefined : onClick}
      disabled={isInert}
      className={cn(
        'inline-flex items-center justify-center gap-2 whitespace-nowrap',
        'rounded-(--ds-radius-lg) transition-colors duration-150',
        spec.className,
        isInert ? 'cursor-default' : 'cursor-pointer',
        type === 'plain' ? '' : 'active:brightness-95',
        fullWidth ? 'w-full' : 'w-auto',
        className,
      )}
      style={{
        height: spec.height,
        padding: spec.padding,
        background,
        color,
        border,
        ...style,
      }}
    >
      {isLoading ? (
        <span
          className="animate-spin rounded-full"
          style={{
            width: 12,
            height: 12,
            border: '2px solid var(--border-loading)',
            borderTopColor: 'transparent',
          }}
        />
      ) : (
        <>
          {leading}
          {label}
        </>
      )}
    </button>
  );
}
