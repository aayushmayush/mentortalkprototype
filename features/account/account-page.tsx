'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AppIcon,
  AppLoadingIndicator,
  AppLoadingSpinner,
  AppModal,
} from '@/design-system';
import { AppErrorView } from '@/components/app-error-view';
import { PhoneOverlay } from '@/components/prototype/phone-frame';
import { ProfileCard } from '@/features/account/profile-card';
import { AccountActionGrid } from '@/features/account/account-action-grid';
import { copy } from '@/lib/copy';
import { useProfile } from '@/lib/state/profile-provider';
import { useAuth } from '@/lib/state/auth-provider';

/**
 * AccountPage — port of `ui/account/pages/account_page.dart`. Tab 4 of the
 * home shell.
 *
 * The page is a `SingleChildScrollView` in its own right, not a child wrapped
 * by the shell — so each of the shell's four panels owns its scroll position,
 * which is half of what `IndexedStack` is preserving.
 *
 * Three nested loading states, in this order, and the order matters:
 *
 *   1. **Auth loading** — a full-screen `AppLoadingIndicator` with the word
 *      "Loading…". This is the logout in flight. The source comments that the
 *      user must *see* the app responding rather than a frozen page inviting a
 *      second tap on logout, which is why it takes over the whole tab instead
 *      of being a button spinner.
 *   2. **Home loading** — `AppLoadingSpinner.md()`, the profile fetch.
 *   3. **Home error** — `AppErrorView` with **two** actions, retry and logout,
 *      because a failed profile fetch is also the moment a user is most likely
 *      to want out.
 *
 * The logout confirmation is `AppModal.showConfirm` in Flutter, which is
 * imperative; here it is the controlled `AppModal`, portalled into the phone's
 * overlay layer so the scrim stays inside the bezel.
 *
 * Divergence worth naming: the source's grid tiles push `WalletPage`,
 * `ChatsPage`, `FollowingPage` and `SettingsPage`. Only the *routes* exist as
 * of T2 — those four screens are T4/T5 — so each tile is a no-op until its tier
 * lands, and the index marks them unbuilt rather than letting them dead-end.
 */
export function AccountPage({ onNavigate }: { onNavigate?: (path: string) => void }) {
  const router = useRouter();
  const { status, profile, errorMessage, reload } = useProfile();
  const auth = useAuth();
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  /**
   * The tail of the router's redirect, done at the call site.
   *
   * Production has one global `redirect` that turns `AuthInitial` into
   * get-started from anywhere. Scoping it to `loggingOut` here is deliberate:
   * a bare `status === 'initial'` check would also fire on a cold deep-link into
   * `/home`, because boot passes through `initial` before it settles — and that
   * would bounce every screen-index link straight back to the splash.
   */
  useEffect(() => {
    if (loggingOut && auth.state.status === 'initial') {
      router.replace('/get-started');
    }
  }, [loggingOut, auth.state.status, router]);

  // 1. Auth in flight — the logout. Takes over the tab.
  if (auth.state.status === 'loading') {
    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <AppLoadingIndicator message={copy.loading} />
      </div>
    );
  }

  // 2. The profile fetch.
  if (status === 'loading') {
    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <AppLoadingSpinner size="md" />
      </div>
    );
  }

  // 3. The profile fetch failed.
  if (status === 'error' || profile === null) {
    return (
      <AppErrorView
        message={errorMessage}
        onRetry={reload}
        onLogout={() => auth.logout()}
        logoutLabel={copy.logout}
      />
    );
  }

  return (
    <>
      <div
        className="no-scrollbar"
        style={{
          height: '100%',
          overflowY: 'auto',
          padding: 'var(--spacing-md) var(--spacing-md)',
        }}
      >
        <ProfileCard
          profile={profile}
          onEditTap={() => onNavigate?.('/edit-profile')}
        />

        <div style={{ height: 'var(--spacing-md)' }} />

        <AccountActionGrid
          onAction={(index) => {
            // Order matches `ACTIONS` in account-action-grid.tsx.
            const destinations = [
              '/wallet',
              '/chats',
              '/settings/following',
              '/settings',
            ] as const;
            onNavigate?.(destinations[index]);
          }}
        />

        <div style={{ height: 'var(--spacing-xl)' }} />

        <div
          onClick={() => setLogoutOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <AppIcon name="logout" size="sm" color="var(--text-destructive)" />
          <div style={{ width: 6 }} />
          <span
            className="type-body-lg type-emphasis-semibold"
            style={{ color: 'var(--text-destructive)' }}
          >
            {copy.logout}
          </span>
        </div>

        <div style={{ height: 'var(--spacing-2xl)' }} />
      </div>

      <PhoneOverlay>
        <AppModal
          open={logoutOpen}
          title={copy.logout}
          message={copy.logoutMessage}
          onClose={() => setLogoutOpen(false)}
          actions={[
            { label: copy.goBack },
            {
              label: copy.logout,
              destructive: true,
              // Two emits: `loading` (which is what makes the full-screen
              // indicator above reachable) then `initial`, which the effect
              // turns into the sign-in screen.
              onPress: () => {
                setLoggingOut(true);
                auth.logout();
              },
            },
          ]}
        />
      </PhoneOverlay>
    </>
  );
}
