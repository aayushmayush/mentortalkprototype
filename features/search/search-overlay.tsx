'use client';

import { useEffect, useRef, useState } from 'react';
import { AppAvatar, AppIcon, AppIconButton, AppLoadingSpinner } from '@/design-system';
import { copy, fill } from '@/lib/copy';
import { searchMentors, type MentorSummary } from '@/lib/fake/mentors';

/**
 * SearchOverlayPage — port of `ui/search/pages/search_overlay_page.dart` and
 * the `SearchBloc` behind it.
 *
 * ── The debounce does not gate the spinner ──────────────────────────────────
 *
 * The single most misread thing about this screen. `_onQueryChanged` emits
 * `loading` *before* it starts the 600ms timer:
 *
 *     if (query.isEmpty) { emit(idle); return; }
 *     emit(SearchState.loading(...));        // ← immediately
 *     _debounceTimer?.cancel();
 *     _debounceTimer = Timer(600ms, ...);    // ← the call, 600ms later
 *
 * So the spinner appears on the first keystroke and stays up for the whole
 * debounce window. A port that debounced first and only then showed a spinner
 * would feel slower and would be wrong.
 *
 * ── Recents are written when you pick a result, not when you search ─────────
 *
 * `_saveRecent` runs from `SearchResultTapped` only. Typing a query and
 * backing out saves nothing; tapping a mentor in the results saves the query
 * you searched under. Capped at 10, newest first, deduped by exact string.
 * There is no way to clear them — the source has no such action and no UI.
 *
 * ── Why the recents live in a ref ───────────────────────────────────────────
 *
 * `_currentRecents` is read out of whatever state the bloc is in, because every
 * `SearchState` variant carries a copy. In React the recents outlive any single
 * state, so they are held separately and threaded into whichever branch renders
 * — the same values the bloc would have re-emitted.
 */

/** `_kDebounceDuration`. */
const DEBOUNCE_MS = 600;
/** `_kMaxRecents`. */
const MAX_RECENTS = 10;
/** The simulated round-trip once the debounce fires. */
const SEARCH_LATENCY_MS = 400;

type SearchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'loaded'; results: MentorSummary[] }
  | { status: 'error'; message: string };

export function SearchOverlay({ onMentorTap }: { onMentorTap?: (id: string) => void }) {
  const [query, setQuery] = useState('');
  const [state, setState] = useState<SearchState>({ status: 'idle' });
  const [recents, setRecents] = useState<string[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * `addPostFrameCallback(() => _focusNode.requestFocus())` — the field takes
   * focus on open, so the keyboard is up before you touch anything.
   */
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(
    () => () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    },
    [],
  );

  function runQuery(raw: string) {
    const trimmed = raw.trim();

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (trimmed === '') {
      setState({ status: 'idle' });
      return;
    }

    // Loading first, then debounce — see the note above.
    setState({ status: 'loading' });

    debounceRef.current = setTimeout(() => {
      const results = searchMentors(trimmed);
      setState({ status: 'loaded', results });
    }, DEBOUNCE_MS);
  }

  function handleChange(value: string) {
    setQuery(value);
    runQuery(value);
  }

  function handleClear() {
    setQuery('');
    runQuery('');
    inputRef.current?.focus();
  }

  /** `SearchResultTapped` — saves the query, then navigates. */
  function handleResultTap(mentor: MentorSummary) {
    setRecents((prev) => {
      const trimmed = query.trim();
      if (trimmed === '') return prev;
      const without = prev.filter((q) => q !== trimmed);
      return [trimmed, ...without].slice(0, MAX_RECENTS);
    });
    onMentorTap?.(mentor.id);
  }

  const hasText = query.length > 0;

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--surface-page)',
      }}
    >
      {/* ── Search bar row ── */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '8px 16px 0 8px' }}>
        <AppIconButton name="arrowBack" size="sm" label={copy.goBack} onClick={() => history.back()} />

        <div
          style={{
            flex: 1,
            minWidth: 0,
            height: 44,
            display: 'flex',
            alignItems: 'center',
            background: 'var(--surface-primary)',
            borderRadius: 'var(--ds-radius-lg)',
          }}
        >
          <div style={{ paddingLeft: 12, display: 'flex' }}>
            <AppIcon name="search" size="sm" color="var(--text-body-light)" />
          </div>

          <input
            ref={inputRef}
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={copy.searchPlaceholder}
            className="type-body-md"
            style={{
              flex: 1,
              minWidth: 0,
              height: '100%',
              padding: '12px 8px',
              border: 'none',
              outline: 'none',
              background: 'transparent',
              color: 'var(--text-heading)',
            }}
          />

          {/*
            `_ClearButton` is a ValueListenableBuilder that renders
            `SizedBox.shrink()` while the field is empty — so the X occupies no
            space at all until there is something to clear.
          */}
          {hasText ? (
            <button
              type="button"
              onClick={handleClear}
              aria-label={copy.close}
              style={{
                display: 'flex',
                padding: '0 12px',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <AppIcon name="close" size="xs" color="var(--icon-primary)" />
            </button>
          ) : null}
        </div>
      </div>

      <div style={{ height: 8 }} />

      {/* ── Body ── */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }} className="no-scrollbar">
        {state.status === 'idle' ? (
          <Recents recents={recents} onPick={(q) => {
            setQuery(q);
            runQuery(q);
          }} />
        ) : null}

        {state.status === 'loading' ? (
          <Centered>
            <AppLoadingSpinner size="md" />
          </Centered>
        ) : null}

        {state.status === 'loaded' ? (
          state.results.length === 0 ? (
            <Centered>
              <Muted>{fill(copy.noMentorsFoundFor, { query: query.trim() })}</Muted>
            </Centered>
          ) : (
            state.results.map((mentor) => (
              <SearchMentorTile
                key={mentor.id}
                mentor={mentor}
                onTap={() => handleResultTap(mentor)}
              />
            ))
          )
        ) : null}

        {state.status === 'error' ? (
          <Centered>
            <Muted>{state.message}</Muted>
          </Centered>
        ) : null}
      </div>
    </div>
  );
}

/** `_buildRecents` — the header padding is 20, the tiles use 16. Both as-is. */
function Recents({ recents, onPick }: { recents: string[]; onPick: (q: string) => void }) {
  if (recents.length === 0) {
    return (
      <Centered>
        <Muted>{copy.searchForMentors}</Muted>
      </Centered>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '8px 20px 4px' }}>
        <span
          className="type-label-sm type-emphasis-semibold"
          style={{ color: 'var(--text-body-light)' }}
        >
          {copy.recentSearches}
        </span>
      </div>

      {recents.map((q) => (
        <RecentSearchTile key={q} query={q} onTap={() => onPick(q)} />
      ))}
    </div>
  );
}

/**
 * `RecentSearchTile` — 🔍 query ↗
 *
 * The arrow is `north_west`, not a forward arrow: it is the "fill this into the
 * search box" affordance, pointing back at the field.
 */
function RecentSearchTile({ query, onTap }: { query: string; onTap: () => void }) {
  return (
    <div
      onClick={onTap}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: 'var(--spacing-sm) var(--page-padding-horizontal)',
        cursor: 'pointer',
      }}
    >
      <AppIcon name="search" size="sm" color="var(--icon-primary)" />
      <div style={{ width: 'var(--spacing-sm)' }} />
      <span
        className="type-body-md"
        style={{
          flex: 1,
          minWidth: 0,
          color: 'var(--text-body)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {query}
      </span>
      <AppIcon name="northWest" size="xs" color="var(--icon-primary)" />
    </div>
  );
}

/**
 * `SearchMentorTile` — avatar, name + verified badge, "Category +N · 1.3K
 * sessions", then the rate in bold.
 *
 * Note the verified tick here is `text.action` while the mentor profile hero's
 * is `icon.action` — two different tokens for the same glyph in two files.
 */
export function SearchMentorTile({
  mentor,
  onTap,
}: {
  mentor: MentorSummary;
  onTap: () => void;
}) {
  return (
    <div
      onClick={onTap}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: 'var(--spacing-sm) var(--page-padding-horizontal)',
        cursor: 'pointer',
      }}
    >
      <AppAvatar size="sm" imageUrl={mentor.profilePhotoUrl} name={mentor.displayName} />
      <div style={{ width: 'var(--spacing-sm)' }} />

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', minWidth: 0 }}>
          <span
            className="type-body-md type-emphasis-semibold"
            style={{
              color: 'var(--text-heading)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              minWidth: 0,
            }}
          >
            {mentor.displayName}
          </span>
          <div style={{ width: 4 }} />
          <AppIcon name="verified" size="xs" color="var(--text-action)" />
        </div>

        <div style={{ height: 'var(--spacing-2xs)' }} />

        <span
          className="type-body-sm"
          style={{
            color: 'var(--text-body-light)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {subtitle(mentor)}
        </span>

        <div style={{ height: 'var(--spacing-2xs)' }} />

        <span
          className="type-body-sm type-emphasis-semibold"
          style={{ color: 'var(--text-heading)' }}
        >
          {fill(copy.ratePerMinute, { rate: mentor.ratePerMinute })}
        </span>
      </div>
    </div>
  );
}

/** `_subtitle` — `categories + sessions`, joined by a middle dot. */
function subtitle(mentor: MentorSummary): string {
  const parts: string[] = [];
  if (mentor.categories.length > 0) parts.push(formatCategories(mentor.categories));
  parts.push(formatSessions(mentor.totalSessions));
  return parts.join(' · ');
}

/** `_formatCategories` — one name, or the first plus a "+N" count. */
function formatCategories(cats: string[]): string {
  const unique = Array.from(new Set(cats));
  if (unique.length === 1) return unique[0];
  return `${unique[0]} +${unique.length - 1}`;
}

/**
 * `_formatSessions` — 1.3K above a thousand, dropping a trailing ".0".
 *
 * Note the threshold: 1000, not 10000. A mentor with 1340 sessions reads
 * "1.3K sessions", and one with 2000 reads "2K sessions".
 */
function formatSessions(count: number): string {
  if (count >= 1000) {
    const k = count / 1000;
    const rounded = Number.isInteger(k) ? k.toFixed(0) : k.toFixed(1);
    return fill(copy.sessionCount, { count: `${rounded}K` });
  }
  return fill(copy.sessionCount, { count });
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 16px',
      }}
    >
      {children}
    </div>
  );
}

function Muted({ children }: { children: React.ReactNode }) {
  return (
    <span className="type-body-sm" style={{ color: 'var(--text-body-light)', textAlign: 'center' }}>
      {children}
    </span>
  );
}
