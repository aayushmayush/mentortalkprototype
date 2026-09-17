'use client';

import { useMemo, useState } from 'react';
import { AppAvatar, AppButton } from '@/design-system';
import { MentorCard } from '@/components/mentor-card';
import { CategoryChips, type CategoryChip } from '@/components/category-chips';
import { ShimmerMentorTile } from '@/components/shimmer-mentor-tile';
import { copy, fill } from '@/lib/copy';
import { applyMentorFilters, MENTORS, type MentorSummary } from '@/lib/fake/mentors';
import { DEFAULT_FILTERS, type FilterState } from '@/lib/filters';

/**
 * SessionMentorsPage — port of `ui/mentors/pages/session_mentors_page.dart`.
 *
 * Used twice, by the Chat tab (`type: 'chat'`) and the Call tab
 * (`type: 'audio_call'`). The two differ in exactly two ways, and both come
 * from `type`:
 *
 * - the button label — "Chat" or "Call" (`buttonLabel` in the source)
 * - the session type sent on request — `chat` or `audio`
 *
 * The source passes the label in from `HomeShell` rather than deriving it, so
 * the label is a prop here too.
 *
 * Structure, in the source's order:
 *
 *   1. **Online Now** — a 106px horizontal strip, pinned above the chips and
 *      deliberately NOT filtered by the selected chip (`allOnlineMentors`,
 *      captured from the initial load). Selecting a category does not narrow
 *      this strip — that is the source's behaviour, not an oversight.
 *   2. **Category chips** — only rendered when there are more than two chips
 *      (`state.chips.length > 2`); otherwise the row collapses to a 12px
 *      spacer. With "Popular" always first, two chips means there is nothing
 *      but Popular, so the row would be pointless.
 *   3. **The mentor list** — each row is a `MentorCard` with an outlined
 *      compact action button, `activeCategory` set from the selected chip so
 *      that category is promoted to the front of the card's label.
 *
 * The empty state is a centred `noMentorsFound` line, not an illustration.
 *
 * ── Filters are per tab, not shared ─────────────────────────────────────────
 *
 * `HomeShell` keeps TWO `MentorsListBloc`s — the Chat tab reads the one from
 * its `MultiBlocProvider`, while `_openSortFilter` reaches for a separate
 * `_callTabBloc` when the index is 2. So sorting the Call tab by price does not
 * touch the Chat tab's order, and the two lists can sit on different filters
 * indefinitely. The filter state is therefore a prop here, owned per tab by the
 * shell, rather than something this component holds.
 *
 * ── The chips and the sheet filter different things ─────────────────────────
 *
 * The category chip row narrows by `categories` *on the client's already-loaded
 * page*, while the sheet's sort/gender/language go to the server as query
 * parameters and come back as a new page. Both end up narrowing what you see,
 * so they are composed here in that order: sheet first, then chip.
 */

const ONLINE_STRIP_HEIGHT = 106;

export function SessionMentorsPage({
  type,
  buttonLabel,
  filters = DEFAULT_FILTERS,
  onSessionRequested,
  onMentorTap,
  status = 'loaded',
}: {
  type: 'chat' | 'audio_call';
  buttonLabel: string;
  /** Owned by the shell so the two tabs stay independent. */
  filters?: FilterState;
  onSessionRequested?: (mentor: MentorSummary, sessionType: string) => void;
  onMentorTap?: (mentorId: string) => void;
  status?: 'loading' | 'loaded';
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const chips = useMemo<CategoryChip[]>(() => {
    const names = new Set<string>();
    MENTORS.forEach((m) => m.categories.forEach((c) => names.add(c)));
    return [
      { kind: 'popular', label: copy.popular },
      ...Array.from(names)
        .sort()
        .map((name) => ({
          kind: 'category' as const,
          id: name.toLowerCase(),
          label: name,
        })),
    ];
  }, []);

  // The strip is unfiltered and comes from the *initial* load — see above.
  // Neither the chip row nor the sheet narrows it in the source.
  const onlineMentors = MENTORS.filter((m) => m.isOnline);

  const selectedChip = chips[selectedIndex];
  const activeCategory = selectedChip?.kind === 'category' ? selectedChip.label : undefined;

  const mentors = useMemo(() => {
    const filtered = applyMentorFilters(MENTORS, filters);
    if (!activeCategory) return filtered;
    return filtered.filter((m) => m.categories.includes(activeCategory));
  }, [activeCategory, filters]);

  if (status === 'loading') {
    return <FullPageShimmer />;
  }

  return (
    <div className="no-scrollbar" style={{ height: '100%', overflowY: 'auto' }}>
      {onlineMentors.length > 0 ? (
        <OnlineNow mentors={onlineMentors} onMentorTap={onMentorTap} />
      ) : null}

      {/* `state.chips.length > 2 ? CategoryChips : SizedBox(height: sm)` */}
      <div style={{ height: 'var(--spacing-sm)' }} />
      {chips.length > 2 ? (
        <CategoryChips
          chips={chips}
          selectedIndex={selectedIndex}
          onSelected={setSelectedIndex}
        />
      ) : null}
      <div style={{ height: 'var(--spacing-sm)' }} />

      {mentors.length === 0 ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '48px 0',
          }}
        >
          <span className="type-body-sm" style={{ color: 'var(--text-body-light)' }}>
            {copy.noMentorsFound}
          </span>
        </div>
      ) : (
        mentors.map((mentor) => (
          <div
            key={mentor.id}
            style={{ padding: '4px var(--spacing-md)' }}
          >
            <MentorCard
              mentor={mentor}
              activeCategory={activeCategory}
              onTap={() => onMentorTap?.(mentor.id)}
              action={
                <AppButton
                  label={buttonLabel}
                  size="compact"
                  type="outlined"
                  onClick={() =>
                    onSessionRequested?.(
                      mentor,
                      // `widget.type == 'audio_call' ? 'audio' : 'chat'`
                      type === 'audio_call' ? 'audio' : 'chat',
                    )
                  }
                />
              }
            />
          </div>
        ))
      )}

      <div style={{ height: 24 }} />
    </div>
  );
}

/**
 * `_buildOnlineNowSection` — a pinned strip of who is available right now.
 *
 * The presence dot is a hard-coded `#4CAF50` at 12px, positioned 2px in from
 * the avatar's bottom-right corner with `clipBehavior: none` in the source, so
 * it overhangs the avatar rather than being inset inside it.
 *
 * The rate line uses `ratePerMinute` — the plain base rate, with no promo or
 * discount treatment. Promo framing lives on the cards below.
 */
function OnlineNow({
  mentors,
  onMentorTap,
}: {
  mentors: MentorSummary[];
  onMentorTap?: (mentorId: string) => void;
}) {
  return (
    <div>
      <div style={{ height: 'var(--spacing-sm)' }} />

      <div style={{ padding: '0 var(--spacing-md) 8px' }}>
        <span className="type-title-md type-emphasis-bold" style={{ color: 'var(--text-heading)' }}>
          {copy.onlineNow}
        </span>
      </div>

      <div
        className="no-scrollbar"
        style={{
          height: ONLINE_STRIP_HEIGHT,
          display: 'flex',
          gap: 'var(--spacing-sm)',
          padding: '0 var(--spacing-md)',
          overflowX: 'auto',
          overflowY: 'hidden',
        }}
      >
        {mentors.map((mentor) => (
          <div
            key={mentor.id}
            onClick={() => onMentorTap?.(mentor.id)}
            style={{
              width: 72,
              flex: '0 0 auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: onMentorTap ? 'pointer' : 'default',
            }}
          >
            <div style={{ position: 'relative', display: 'inline-block' }}>
              <AppAvatar size="md" imageUrl={mentor.profilePhotoUrl} name={mentor.displayName} />
              <div
                style={{
                  position: 'absolute',
                  bottom: 2,
                  right: 2,
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: '#4CAF50',
                }}
              />
            </div>

            <div style={{ height: 6 }} />

            <span
              className="type-label-sm type-emphasis-semibold"
              style={{
                color: 'var(--text-body)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '100%',
                textAlign: 'center',
              }}
            >
              {mentor.displayName}
            </span>

            <div style={{ height: 2 }} />

            <span
              className="type-label-sm"
              style={{ color: 'var(--text-body-light)', textAlign: 'center' }}
            >
              {fill(copy.ratePerMinute, { rate: mentor.ratePerMinute })}
            </span>
          </div>
        ))}
      </div>

      <div style={{ height: 'var(--spacing-sm)' }} />
    </div>
  );
}

/** `_FullPageShimmer` — the first-load skeleton for the whole tab. */
function FullPageShimmer() {
  return (
    <div>
      <div style={{ height: 'var(--spacing-sm)' }} />
      <div style={{ padding: '0 var(--spacing-md) 8px' }}>
        <div className="shimmer-bone" style={{ width: 96, height: 16, borderRadius: 6 }} />
      </div>
      <div style={{ height: 106, display: 'flex', gap: 12, padding: '0 var(--spacing-md)', overflow: 'hidden' }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{ width: 72, flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className="shimmer-bone" style={{ width: 64, height: 64, borderRadius: '50%' }} />
            <div style={{ height: 6 }} />
            <div className="shimmer-bone" style={{ width: 56, height: 10, borderRadius: 5 }} />
          </div>
        ))}
      </div>
      <div style={{ height: 'var(--spacing-sm)' }} />
      {[0, 1, 2, 3, 4].map((i) => (
        <div key={i} style={{ padding: '4px var(--spacing-md)' }}>
          <ShimmerMentorTile />
        </div>
      ))}
    </div>
  );
}
