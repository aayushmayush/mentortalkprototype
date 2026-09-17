'use client';

import { AppAvatar, AppIcon } from '@/design-system';
import type { Profile } from '@/lib/state/profile-provider';

/**
 * ProfileCard — port of `ui/account/widgets/profile_card.dart`.
 *
 * The whole card is the edit affordance — there is no separate button, and
 * `HitTestBehavior.opaque` in the source means the gaps between the text lines
 * are tappable too, not just the glyphs. The pencil is a *hint*, not a target.
 *
 * Three type scales stack here, and the weights are all overridden:
 * displayName is `titleLarge` at **w700** (the theme's own is w500), the
 * username line is `bodySmall` in `text.bodyLight`, and the education line is
 * the same `bodySmall` but in `text.body` and back at w500. So the education
 * line is deliberately *darker* than the username above it — the handle is
 * metadata, the school is content.
 *
 * The education line is conditional on the value being non-null; the username
 * line is not. An empty handle renders `@`, which is the source's behaviour.
 */
export function ProfileCard({
  profile,
  onEditTap,
}: {
  profile: Profile;
  onEditTap?: () => void;
}) {
  return (
    <div
      onClick={onEditTap}
      style={{
        padding: 16,
        background: 'var(--surface-primary)',
        borderRadius: 'var(--ds-radius-md)',
        cursor: onEditTap ? 'pointer' : 'default',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <AppAvatar size="md" imageUrl={profile.profilePhotoUrl} name={profile.displayName} />

      <div style={{ width: 14, flexShrink: 0 }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            className="type-title-lg type-emphasis-bold"
            style={{
              color: 'var(--text-heading)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              minWidth: 0,
            }}
          >
            {profile.displayName}
          </span>
          <AppIcon name="edit" size="xs" color="var(--icon-primary)" />
        </div>

        <div style={{ height: 4 }} />

        <div className="type-body-sm" style={{ color: 'var(--text-body-light)' }}>
          @{profile.username}
        </div>

        {profile.educationDetail !== null ? (
          <>
            <div style={{ height: 6 }} />
            <div className="type-body-sm" style={{ color: 'var(--text-body)' }}>
              {profile.educationDetail}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
