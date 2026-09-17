'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppButton, AppIcon, AppLoadingSpinner, AppModal } from '@/design-system';
import { AppErrorView } from '@/components/app-error-view';
import { PhoneOverlay } from '@/components/prototype/phone-frame';
import { copy, fill } from '@/lib/copy';
import { BLOCKED_USERS, LISTS_LOAD_MS, UNBLOCK_MS, type BlockedUser } from '@/lib/fake/lists';
import { useSnackbar } from '@/lib/state/snackbar-provider';

/**
 * BlockedUsersPage — port of `ui/account/pages/blocked_users_page.dart`.
 *
 * ── This bar is NOT `AppTopBar` ─────────────────────────────────────────────
 *
 * Every other account screen builds `AppTopBar`. This one builds a **raw
 * `AppBar`** — `backgroundColor: surface.page`, both elevations zeroed, a
 * hand-made `IconButton` with `Icons.arrow_back_ios_new_rounded` at **size 20**
 * (not the DS glyph, and not the DS size), and a `titleLarge w700` title set
 * left-aligned rather than centred. Four small deviations that together make
 * this bar look different from the four screens either side of it in the same
 * Settings section. It is reproduced rather than normalised, because "why does
 * this one screen's back arrow look wrong" is a real observation about the app.
 *
 * ── Three body states, and the empty one has no retry ──────────────────────
 *
 * `_isLoading` → centred `AppLoadingSpinner.md()`; `_error != null` →
 * `AppErrorView(message, onRetry: _load)`; empty → a centred plain text line,
 * **not** an error view and not an illustration. Then the list.
 *
 * The empty state is a bare `Text` with no icon — unlike `/settings/following`,
 * which shows a 48px `people` glyph above its empty message. Two empty states
 * for the same shape of list, in the same settings section, styled differently.
 * That is the source's, and it is why these two files do not share a component.
 *
 * ── Unblock is confirmed, and the row is removed by id ─────────────────────
 *
 * `AppModal.showConfirm(title: unblockUser(name), …)` and on confirm the list
 * drops every entry with that `user_id` — `removeWhere`, not a single splice, so
 * a duplicate id would remove both. Reproduced with the same `filter`, since a
 * dedupe here would change behaviour the source does not have.
 *
 * ── The 'Unknown' name, and the avatar initial that does not use it ────────
 *
 * `name` is `display_name?.trim() ?? 'Unknown'` — but the initial is
 * `name.isNotEmpty ? name[0].toUpperCase() : '?'`, computed off the *fallback*,
 * so a null name renders a row labelled "Unknown" with an "U" avatar. The
 * fixture includes one null name so this is visible rather than assumed.
 */

/** `surface.secondary` — the avatar ground, distinct from `surface.primary`. */
const AVATAR_BG = 'var(--surface-secondary)';

export function BlockedUsersPage() {
  const router = useRouter();
  const snackbar = useSnackbar();

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<BlockedUser[]>([]);
  const [pendingUnblock, setPendingUnblock] = useState<BlockedUser | null>(null);

  const load = () => {
    setIsLoading(true);
    setError(null);
    window.setTimeout(() => {
      setUsers(BLOCKED_USERS);
      setIsLoading(false);
    }, LISTS_LOAD_MS);
  };

  // `initState` → `_load()`. The effect runs once, so the 700ms timer is not
  // restarted by a re-render.
  useEffect(load, []);

  /** The label the row shows — `display_name?.trim() ?? 'Unknown'`. */
  const nameOf = (user: BlockedUser) => user.display_name?.trim() ?? 'Unknown';

  const onConfirmUnblock = () => {
    const user = pendingUnblock;
    if (user === null) return;
    const name = nameOf(user);
    setPendingUnblock(null);

    window.setTimeout(() => {
      setUsers((current) => current.filter((u) => u.user_id !== user.user_id));
      snackbar.show(fill(copy.userUnblocked, { name }));
    }, UNBLOCK_MS);
  };

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--surface-page)',
      }}
    >
      <RawAppBar title={copy.blockedUsers} onBack={() => router.back()} />

      {isLoading && (
        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AppLoadingSpinner size="md" />
        </div>
      )}

      {!isLoading && error !== null && <AppErrorView message={error} onRetry={load} />}

      {!isLoading && error === null && users.length === 0 && (
        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* A bare text line — no glyph, unlike the following page's empty
              state. See the file header. */}
          <span className="type-body-md" style={{ color: 'var(--text-body-light)' }}>
            {copy.noBlockedUsers}
          </span>
        </div>
      )}

      {!isLoading && error === null && users.length > 0 && (
        <div
          className="no-scrollbar"
          style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px 16px' }}
        >
          {users.map((user, i) => {
            const name = nameOf(user);
            return (
              <div key={user.user_id}>
                <div
                  style={{
                    padding: 16,
                    background: 'var(--surface-primary)',
                    borderRadius: 'var(--ds-radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  {/* `CircleAvatar(radius: 20)` — 40px, not `AppAvatar`'s 48. */}
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      flexShrink: 0,
                      borderRadius: '50%',
                      background: AVATAR_BG,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <span
                      className="type-title-md"
                      style={{ color: 'var(--text-body-light)' }}
                    >
                      {/* Off the FALLBACK name, so a null row gets 'U'. */}
                      {name.length > 0 ? name[0]?.toUpperCase() : '?'}
                    </span>
                  </div>

                  <div style={{ width: 12 }} />

                  <div
                    className="type-body-lg"
                    style={{ flex: 1, minWidth: 0, color: 'var(--text-heading)' }}
                  >
                    {name}
                  </div>

                  <AppButton
                    label={copy.unblock}
                    type="plain"
                    size="compact"
                    intent="destructive"
                    onClick={() => setPendingUnblock(user)}
                  />
                </div>
                {i < users.length - 1 && <div style={{ height: 'var(--spacing-xs)' }} />}
              </div>
            );
          })}
        </div>
      )}

      <PhoneOverlay>
        <AppModal
          open={pendingUnblock !== null}
          title={
            pendingUnblock
              ? fill(copy.unblockUser, { name: nameOf(pendingUnblock) })
              : ''
          }
          message={copy.unblockUserMessage}
          actions={[
            { label: copy.cancel, onPress: () => setPendingUnblock(null) },
            {
              label: copy.unblock,
              destructive: true,
              onPress: onConfirmUnblock,
            },
          ]}
          onClose={() => setPendingUnblock(null)}
        />
      </PhoneOverlay>
    </div>
  );
}

/**
 * The raw `AppBar` this page builds instead of `AppTopBar`. See the header.
 *
 * Height is Flutter's default `kToolbarHeight` (56), not `AppTopBar`'s 64 — the
 * same 56 the counselling flow's own bar uses, for the same reason: a raw
 * `AppBar` is 56 unless something overrides it.
 */
function RawAppBar({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div
      style={{
        height: 56,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        background: 'var(--surface-page)',
      }}
    >
      <button
        type="button"
        onClick={onBack}
        aria-label="Back"
        style={{
          border: 'none',
          background: 'transparent',
          padding: 12,
          cursor: 'pointer',
          display: 'flex',
        }}
      >
        {/* `arrow_back_ios_new_rounded` at size 20 — the iOS chevron, which is
            why this arrow reads narrower than every other back button. */}
        <AppIcon name="arrowBackIos" px={20} color="var(--icon-primary)" />
      </button>

      <span
        className="type-title-lg type-emphasis-bold"
        style={{ color: 'var(--text-heading)' }}
      >
        {title}
      </span>
    </div>
  );
}
