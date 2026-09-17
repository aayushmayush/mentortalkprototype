'use client';

import { useState, type ReactNode } from 'react';
import { AppCircle, type AppCircleSize } from './app-circle';

/**
 * AppAvatar — port of design_system/lib/core/components/app_avatar.dart
 *
 * Falls back to initials when there is no usable image. The source only treats
 * an `http`-prefixed URL as valid (`_hasValidImage`), so a relative path falls
 * through to initials there too; here the local fixture images are real files
 * served from /assets, so the check is relaxed to "non-empty" — otherwise every
 * seeded mentor would render as initials, which would look wrong against the
 * app. A load failure still falls back to initials, as in the source.
 *
 * Initials: first + last word's first letter, upper-cased; a single word yields
 * one letter; an empty name yields "?".
 */
export type AppAvatarProps = {
  name: string;
  imageUrl?: string | null;
  size?: AppCircleSize;
  border?: string;
  /** Rendered over the bottom edge — typically an <AppOnlineBadge />. */
  badge?: ReactNode;
  className?: string;
};

const INITIALS_FONT_SIZE: Record<AppCircleSize, number> = {
  sm: 14,
  md: 18,
  lg: 24,
};

export function AppAvatar({
  name,
  imageUrl,
  size = 'md',
  border,
  badge,
  className,
}: AppAvatarProps) {
  const [failed, setFailed] = useState(false);

  const trimmed = name.trim();
  const parts = trimmed.split(/\s+/).filter(Boolean);
  const initials =
    parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : trimmed
        ? trimmed[0].toUpperCase()
        : '?';

  const hasImage = Boolean(imageUrl) && !failed;
  const diameter = size === 'sm' ? 48 : size === 'md' ? 64 : 88;

  const circle = (
    <AppCircle size={size} border={border} className={className}>
      {hasImage ? (
        // Plain <img>: the prototype's photos are remote fixture URLs, and
        // next/image would mean an allowlist of their host in next.config plus
        // an optimiser round-trip, for no benefit at this size. The `onError`
        // below is what matters — it degrades a failed load to the initials
        // circle rather than to a broken-image glyph.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl!}
          alt=""
          width={diameter}
          height={diameter}
          className="h-full w-full object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <div
          className="flex h-full w-full items-center justify-center"
          style={{ background: 'var(--surface-action-light)' }}
        >
          <span
            className="type-emphasis-semibold"
            style={{ color: 'var(--text-action)', fontSize: INITIALS_FONT_SIZE[size] }}
          >
            {initials}
          </span>
        </div>
      )}
    </AppCircle>
  );

  if (!badge) return circle;

  return (
    <div className="relative" style={{ width: diameter, height: diameter }}>
      {circle}
      {badge}
    </div>
  );
}
