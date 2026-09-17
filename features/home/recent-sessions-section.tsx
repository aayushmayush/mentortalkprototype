'use client';

import { MentorInboxCard } from '@/components/mentor-inbox-card';
import { copy } from '@/lib/copy';
import type { MentorInboxItem } from '@/lib/fake/chats';

/**
 * RecentSessionsSection — port of
 * `ui/home/widgets/recent_sessions_section.dart`.
 *
 * Two rules from the source are preserved as props rather than folded away:
 *
 * 1. **Shimmer only on the very first load.** Once the list has loaded once —
 *    even if it came back empty — a refresh must not bring the skeleton back.
 *    That is the `isLoading && chats.isEmpty && !hasEverLoaded` triple, and
 *    `hasEverLoaded` is the part that is easy to drop.
 * 2. **Empty renders nothing** — no header, no empty-state card.
 *
 * The cards are **90% of the phone's width**, not full width, so the next one
 * peeks in and the rail reads as scrollable. That is `MediaQuery.size.width *
 * 0.9` in the source, which is the phone's 390px here, hence 351.
 */
const PHONE_WIDTH = 390;
const CARD_WIDTH = PHONE_WIDTH * 0.9;

export function RecentSessionsSection({
  chats,
  isLoading = false,
  hasEverLoaded = true,
  onViewAll,
  onMentorTap,
}: {
  chats: MentorInboxItem[];
  isLoading?: boolean;
  hasEverLoaded?: boolean;
  onViewAll?: () => void;
  onMentorTap?: (mentor: MentorInboxItem) => void;
}) {
  if (isLoading && chats.length === 0 && !hasEverLoaded) {
    return <ShimmerSessions />;
  }

  if (chats.length === 0) return null;

  const items = chats.slice(0, 5);

  return (
    <div>
      <div style={{ padding: '0 var(--spacing-md)', display: 'flex', alignItems: 'center' }}>
        <span
          className="type-title-md type-emphasis-bold"
          style={{ color: 'var(--text-heading)', flex: 1 }}
        >
          {copy.mySessions}
        </span>
        <span
          onClick={onViewAll}
          className="type-body-sm type-emphasis-semibold"
          style={{ color: 'var(--text-body-light)', cursor: onViewAll ? 'pointer' : 'default' }}
        >
          {copy.viewAll}
        </span>
      </div>

      <div style={{ height: 12 }} />

      <div
        className="no-scrollbar"
        style={{
          height: 72,
          display: 'flex',
          gap: 10,
          padding: '0 var(--spacing-md)',
          overflowX: 'auto',
          overflowY: 'hidden',
        }}
      >
        {items.map((mentor) => (
          <div key={mentor.mentorId} style={{ width: CARD_WIDTH, flex: '0 0 auto' }}>
            <MentorInboxCard mentor={mentor} onTap={() => onMentorTap?.(mentor)} />
          </div>
        ))}
      </div>
    </div>
  );
}

function ShimmerSessions() {
  return (
    <div>
      <div style={{ padding: '0 var(--spacing-md)' }}>
        <span className="type-title-md type-emphasis-bold" style={{ color: 'var(--text-heading)' }}>
          {copy.mySessions}
        </span>
      </div>

      <div style={{ height: 12 }} />

      <div
        className="no-scrollbar"
        style={{
          height: 72,
          display: 'flex',
          gap: 10,
          padding: '0 var(--spacing-md)',
          overflow: 'hidden',
        }}
      >
        {[0, 1].map((i) => (
          <div key={i} style={{ width: CARD_WIDTH, flex: '0 0 auto', padding: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <div
                className="shimmer-bone"
                style={{ width: 48, height: 48, borderRadius: '50%', flex: '0 0 auto' }}
              />
              <div style={{ width: 10 }} />
              <div>
                <div className="shimmer-bone" style={{ width: 120, height: 14, borderRadius: 6 }} />
                <div style={{ height: 8 }} />
                <div className="shimmer-bone" style={{ width: 80, height: 10, borderRadius: 5 }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
