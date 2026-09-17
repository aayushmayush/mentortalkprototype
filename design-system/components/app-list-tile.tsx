'use client';

import type { ReactNode } from 'react';
import { cn } from '../cn';

/**
 * AppListTile — port of design_system/lib/core/components/app_list_tile.dart
 *
 * The workhorse row: leading widget, title, optional subtitle, optional
 * trailing widget. Notes:
 *
 * - min-height is 56 (`spacing3xl`); the source has the fixed height commented
 *   out, so the tile GROWS with a two-line subtitle. Do not pin it.
 * - radius 16, and the border defaults to 1px TRANSPARENT — so a tile with no
 *   border still measures the same as one with, which matters when tiles sit in
 *   a column next to bordered ones.
 * - The title is w600 with `height: 1`; the subtitle is bodySmall at 1.2.
 * - `enabled: false` greys the text but keeps the tile's own colours.
 */
export type AppListTileProps = {
  title: string;
  subtitle?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  onClick?: () => void;
  enabled?: boolean;
  borderColor?: string;
  borderWidth?: number;
  backgroundColor?: string;
  className?: string;
};

export function AppListTile({
  title,
  subtitle,
  leading,
  trailing,
  onClick,
  enabled = true,
  borderColor,
  borderWidth = 2,
  backgroundColor,
  className,
}: AppListTileProps) {
  return (
    <div
      onClick={enabled ? onClick : undefined}
      className={cn(enabled && onClick ? 'cursor-pointer' : undefined, className)}
      style={{
        minHeight: 56,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px',
        borderRadius: 16,
        background: backgroundColor ?? 'var(--surface-primary)',
        border: `${borderWidth}px solid ${borderColor ?? 'transparent'}`,
      }}
    >
      {leading ? (
        <>
          {leading}
          <span style={{ width: 8 }} />
        </>
      ) : null}

      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <span
          className="type-title-md type-emphasis-semibold"
          style={{
            color: enabled ? 'var(--text-body)' : 'var(--text-body-light)',
            lineHeight: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </span>
        {subtitle ? (
          <span
            className="type-body-sm"
            style={{
              color: 'var(--text-body-light)',
              lineHeight: 1.2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {subtitle}
          </span>
        ) : null}
      </div>

      {trailing ? (
        <>
          <span style={{ width: 12 }} />
          {trailing}
        </>
      ) : null}
    </div>
  );
}
