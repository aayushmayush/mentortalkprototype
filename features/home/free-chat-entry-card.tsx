'use client';

import { AppIcon } from '@/design-system';
import { copy } from '@/lib/copy';

/**
 * FreeChatEntryCard — port of `ui/home/widgets/free_chat_entry_card.dart`.
 *
 * Its copy is hardcoded in the source, not an ARB key — like the referral
 * field and the counselling card. Transcribed verbatim.
 *
 * The visibility rule is the interesting part and is transcribed as a prop
 * rather than a lookup, because in the app it comes from
 * `MenteeProfile.freeChatAvailable`: once the one free chat is consumed the
 * card disappears entirely. Note the deliberate asymmetry — the source hides
 * the card only on a *confirmed* `HomeLoaded` with the flag false and fails
 * open on every other state (loading, error, unknown). So an unknown profile
 * shows the card. `available` therefore defaults to true here.
 */
export function FreeChatEntryCard({
  available = true,
  onTap,
}: {
  available?: boolean;
  onTap?: () => void;
}) {
  if (!available) return null;

  return (
    <div style={{ padding: '0 var(--spacing-md)' }}>
      <div
        onClick={onTap}
        style={{
          width: '100%',
          padding: 16,
          background: 'var(--surface-action-light)',
          borderRadius: 16,
          border: '1px solid var(--border-primary-light)',
          display: 'flex',
          alignItems: 'center',
          cursor: onTap ? 'pointer' : 'default',
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'var(--surface-action)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: '0 0 auto',
          }}
        >
          <AppIcon name="chatFilled" size="md" color="var(--icon-on-action)" />
        </div>

        <div style={{ width: 12 }} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="type-body-md type-emphasis-semibold" style={{ color: 'var(--text-heading)' }}>
            Try a Free Chat
          </div>
          <div style={{ height: 2 }} />
          <div className="type-body-sm" style={{ color: 'var(--text-body-light)' }}>
            Chat free with any mentor for 5 minutes.
          </div>
        </div>

        <AppIcon name="chevronRight" size="md" color="var(--icon-secondary)" />
      </div>
    </div>
  );
}
