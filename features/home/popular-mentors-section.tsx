'use client';

import { MentorCard } from '@/components/mentor-card';
import { ShimmerMentorCard } from '@/components/shimmer-mentor-card';
import { copy } from '@/lib/copy';
import type { MentorSummary } from '@/lib/fake/mentors';

/**
 * PopularMentorsSection — port of
 * `ui/home/widgets/popular_mentors_section.dart`.
 *
 * Three states, and the two non-obvious ones are worth preserving:
 *
 * - **error renders nothing at all** (`SizedBox.shrink`), not an error card.
 *   The section simply disappears; the feed's own error view is what surfaces
 *   a failure, and only when *it* fails, not this section.
 * - **empty renders nothing** too, so a loaded-but-empty result leaves no
 *   "Popular Mentors" header behind.
 *
 * The rail is a fixed 210px tall, horizontally scrolling, with 20px gutters and
 * 12px between cards — the card itself is 164 wide, so roughly two-and-a-bit
 * are visible, which is what hints that it scrolls.
 */
export function PopularMentorsSection({
  mentors,
  status = 'loaded',
  onViewAll,
  onMentorTap,
}: {
  mentors: MentorSummary[];
  status?: 'loading' | 'error' | 'loaded';
  onViewAll?: () => void;
  onMentorTap?: (id: string) => void;
}) {
  if (status === 'error') return null;

  if (status === 'loading') {
    return (
      <Section onViewAll={onViewAll}>
        <Rail>
          {Array.from({ length: 4 }, (_, i) => (
            <ShimmerMentorCard key={i} />
          ))}
        </Rail>
      </Section>
    );
  }

  if (mentors.length === 0) return null;

  return (
    <Section onViewAll={onViewAll}>
      <Rail>
        {mentors.map((mentor) => (
          <MentorCard
            key={mentor.id}
            mentor={mentor}
            compact
            onTap={() => onMentorTap?.(mentor.id)}
          />
        ))}
      </Rail>
    </Section>
  );
}

function Section({
  children,
  onViewAll,
}: {
  children: React.ReactNode;
  onViewAll?: () => void;
}) {
  return (
    <div>
      <div
        style={{
          padding: '0 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span className="type-title-md type-emphasis-bold" style={{ color: 'var(--text-heading)' }}>
          {copy.popularMentors}
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

      {children}
    </div>
  );
}

function Rail({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="no-scrollbar"
      style={{
        height: 210,
        display: 'flex',
        gap: 12,
        padding: '0 20px',
        overflowX: 'auto',
        overflowY: 'hidden',
      }}
    >
      {children}
    </div>
  );
}
