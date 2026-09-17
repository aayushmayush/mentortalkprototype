'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppAvatar, AppIcon, AppLoadingSpinner, AppTopBar } from '@/design-system';
import { AppErrorView } from '@/components/app-error-view';
import { CategoriesFitText } from '@/components/categories-fit-text';
import { copy, fill } from '@/lib/copy';
import { followedMentors, LISTS_LOAD_MS } from '@/lib/fake/lists';
import type { MentorSummary } from '@/lib/fake/mentors';

/**
 * FollowingPage — port of `ui/account/pages/following_page.dart`.
 *
 * ── FOUR body states, and the order they are checked in matters ────────────
 *
 *   1. `isLoading && mentors.isEmpty`  → `AppLoadingSpinner.sm()`  (centred)
 *   2. `error != null && mentors.isEmpty` → `AppErrorView(onRetry:)`
 *   3. `mentors.isEmpty`               → glyph + message, centred
 *   4. otherwise                       → the list
 *
 * The first two both carry `mentors.isEmpty`, which is what makes a *refresh*
 * behave differently from a *first load*: once you have rows, a failed reload
 * leaves them on screen instead of replacing them with an error page, and a
 * reloading state likewise does not blank the list. Only the empty case falls
 * through to the error and loading branches. That is the whole reason the
 * guards have two clauses rather than one, and collapsing them to `isLoading`
 * and `error != null` would look equivalent and not be.
 *
 * ── The spinner is `sm`, not `md` ──────────────────────────────────────────
 *
 * Every other list screen in this section — blocked users, privacy — centres a
 * `md`. This one centres a **`sm`**, which is 16px against their 24. A third
 * inconsistency in the same settings folder, after the raw `AppBar` and the
 * bare-text empty state on blocked users.
 *
 * ── The empty state here DOES have a glyph ────────────────────────────────
 *
 * A 48px `AppIcons.people` in `icon.secondary`, 12px, then the message in
 * `bodyMedium text.bodyLight` — against blocked users' bare text line. The two
 * screens are the same shape and differ deliberately; see the blocked-users
 * header for the other half of this note.
 *
 * ── The card is 8px of padding, not 16 ────────────────────────────────────
 *
 * `_FollowingCard` uses `LayoutTokens.spacingSm` (12) all round... except the
 * separator between rows is a hardcoded `SizedBox(height: 8)`. So `spacingSm`
 * (12) inside the card and 8 between cards. Both are reproduced; neither is
 * derived from the other.
 */

export function FollowingPage() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mentors, setMentors] = useState<MentorSummary[]>([]);

  /**
   * `FollowingCubit.load()` — and note it does **not** clear `mentors` first,
   * which is what makes the two `isEmpty` clauses above meaningful.
   */
  const load = () => {
    setIsLoading(true);
    setError(null);
    window.setTimeout(() => {
      setMentors(followedMentors());
      setIsLoading(false);
    }, LISTS_LOAD_MS);
  };

  useEffect(load, []);

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--surface-page)',
      }}
    >
      <AppTopBar title={copy.myFollowing} onBack={() => router.back()} />

      {/* 1 — first load only. */}
      {isLoading && mentors.length === 0 && (
        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AppLoadingSpinner size="sm" />
        </div>
      )}

      {/* 2 — a failed first load only. */}
      {error !== null && mentors.length === 0 && (
        <AppErrorView message={error} onRetry={load} />
      )}

      {/* 3 — genuinely nothing to follow. */}
      {!isLoading && error === null && mentors.length === 0 && (
        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AppIcon name="people" px={48} color="var(--icon-secondary)" />
          <div style={{ height: 12 }} />
          <span className="type-body-md" style={{ color: 'var(--text-body-light)' }}>
            {copy.noFollowingYet}
          </span>
        </div>
      )}

      {/* 4 — the list. */}
      {mentors.length > 0 && (
        <div
          className="no-scrollbar"
          style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '12px 16px' }}
        >
          {mentors.map((mentor, i) => (
            <div key={mentor.id}>
              <FollowingCard
                mentor={mentor}
                onTap={() => router.push(`/mentors/${mentor.id}`)}
              />
              {i < mentors.length - 1 && <div style={{ height: 8 }} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * `_FollowingCard` — `AppAvatar.md` (64px), 12px, then a name row with a
 * verified tick, the categories, and the rate.
 *
 * ── The categories are deduped case-insensitively, in order ────────────────
 *
 * `_orderedCategories()` runs a `Set` over `c.toLowerCase()` and keeps the
 * FIRST spelling of each — so `['JEE', 'jee', 'NEET']` renders `JEE, NEET` and
 * the original casing survives. A naive `new Set(categories)` would be
 * case-sensitive and keep both. The dedupe is reproduced because the API
 * genuinely returns near-duplicate categories and the card genuinely relies on
 * this to not print "JEE, JEE".
 *
 * ── `CategoriesFitText` ───────────────────────────────────────────────────
 *
 * Reproduced as `components/categories-fit-text.tsx`, which measures with a
 * canvas and drops WHOLE categories for a `+N` count — `'JEE, NEET +1'`, never
 * `'JEE, NE…'`. The Flutter widget uses a `TextPainter` per candidate; the
 * canvas is the browser's equivalent and the candidates are the same.
 */
function FollowingCard({
  mentor,
  onTap,
}: {
  mentor: MentorSummary;
  onTap: () => void;
}) {
  const ordered = orderedCategories(mentor.categories);

  return (
    <div
      onClick={onTap}
      style={{
        padding: 'var(--spacing-sm)',
        background: 'var(--surface-primary)',
        borderRadius: 'var(--ds-radius-md)',
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
      }}
    >
      <AppAvatar size="md" name={mentor.displayName} imageUrl={mentor.profilePhotoUrl} />

      <div style={{ width: 12 }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <span
            className="type-title-md type-emphasis-semibold"
            style={{
              color: 'var(--text-heading)',
              minWidth: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {mentor.displayName}
          </span>
          <div style={{ width: 4 }} />
          {/* `AppIcon.xs` — the tick is one step below the DS's smallest named
              size, sitting at 16 against `sm`'s 20. */}
          <AppIcon name="verified" px={16} color="var(--text-action)" />
        </div>

        <div style={{ height: 'var(--spacing-2xs)' }} />

        {mentor.categories.length > 0 && (
          <CategoriesFitText
            categories={ordered}
            className="type-body-sm"
            style={{ color: 'var(--text-body-light)' }}
          />
        )}

        <div style={{ height: 'var(--spacing-2xs)' }} />

        <div
          className="type-body-sm type-emphasis-bold"
          style={{ color: 'var(--text-heading)' }}
        >
          {fill(copy.ratePerMinute, { rate: mentor.ratePerMinute })}
        </div>
      </div>
    </div>
  );
}

/**
 * The first spelling of each category, compared case-insensitively.
 * See the card's header — a plain `Set` would be case-sensitive and would let
 * "JEE" and "jee" both through.
 */
function orderedCategories(categories: string[]): string[] {
  const seen = new Set<string>();
  return categories.filter((c) => {
    const key = c.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
