'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AppBanner,
  AppButton,
  AppIcon,
  AppModal,
  AppTopBar,
  PagePadding,
} from '@/design-system';
import { PhoneOverlay } from '@/components/prototype/phone-frame';
import { copy, fill } from '@/lib/copy';
import {
  deleteAccount,
  formatDeletionDate,
  type DeleteAccountFailure,
} from '@/lib/fake/account';
import { useAuth } from '@/lib/state/auth-provider';
import { useWallet } from '@/lib/state/wallet-provider';
import { useSnackbar } from '@/lib/state/snackbar-provider';

/**
 * DeleteAccountPage — port of
 * `core/lib/auth/ui/widgets/delete_account_screen.dart`.
 *
 * ── It lives in `core`, not in the mentee app, and the role is a parameter ──
 *
 * `DeleteAccountScreen({ role, walletBalance })` is shared by both apps, and
 * three of its blocks branch on `role == 'mentor'`:
 *
 *   - a `walletBalance > 0` info banner about pending EARNINGS, then a
 *     "removed from mentor discovery" bullet
 *   - the mentee branch instead shows a `walletBalance > 0` WARNING that the
 *     balance "cannot be refunded and will be permanently lost"
 *   - the mentor bullet list is one item longer
 *
 * The mentee app always passes `role: 'mentee'`, so the whole mentor arm is
 * dead in this app. It is not ported — but it is also not invisible: the
 * `deleteAccountMentorPendingEarnings`, `deleteAccountBulletMentorDiscovery`
 * and `deleteAccountBulletProfile` keys exist in `copy.ts` because the mentor
 * app needs them, and a reader comparing the two would otherwise wonder why
 * this screen has strings it never renders.
 *
 * ── Four outcomes, three of them different UI ──────────────────────────────
 *
 *   1. success       → snackbar, then logout; the router redirects to
 *                      get-started (see the note on logout below)
 *   2. `ConflictException` (409) → a ONE-ACTION "Cannot Delete Account" dialog
 *                      carrying the server's message
 *   3. `ApiException` → snackbar with the server's message
 *   4. anything else → snackbar with the generic string
 *
 * 2 is the only modal; 3 and 4 are snackbars. The screen is also the only place
 * that re-enables the button after a failure — `setState(_isLoading = false)`
 * in all three failure arms, and nothing on success, because the account is
 * gone and the screen is about to be replaced.
 *
 * ── The success snackbar is shown AFTER the logout, and that is deliberate ──
 *
 * The source emits `logoutRequested` and *then* shows the snackbar, in that
 * order, because `AuthBloc`'s logout emits twice (a loading state, then
 * initial) and the router redirects on the second. Showing it first would race
 * the redirect and lose the message. The prototype keeps the order: `logout()`
 * is called, the snackbar is raised immediately after, and `SnackbarProvider`
 * lives outside `AuthProvider` in the layout so the redirect does not unmount
 * the host mid-message.
 *
 * ── Two honest gaps ────────────────────────────────────────────────────────
 *
 * - The source asks for a **6-second** snackbar (`duration: Duration(seconds:
 *   6)`). `SnackbarProvider` has a fixed 4 s, matching Material's default. The
 *   deletion message therefore clears two seconds early. Extending the provider
 *   with a per-call duration was not worth the blast radius for a toast on a
 *   screen you never return to.
 * - The source formats the date with `DateFormat('d MMMM yyyy')` under the
 *   active locale. `formatDeletionDate` pins `en-GB`, so a Hindi user sees an
 *   English date here. Same class of gap as the Language dropdown — the
 *   prototype is English literals throughout.
 *
 * ── The tick box is a raw checkbox, and it has to be ───────────────────────
 *
 * `AppCheckbox` is NOT a tick box — it is a pill chip with no check glyph (see
 * its own header). There is no tick-box component in the design system, so the
 * source drops to a raw `Checkbox` at 24×24 with `activeColor:
 * surface.action`. Reproduced raw for the same reason.
 *
 * ── Error branches need a URL to reach ─────────────────────────────────────
 *
 * `?blocked=session`, `?blocked=report` and `?fail=1` drive the three failure
 * arms in `initialize`. Without them the conflict dialog and the generic
 * snackbar would be unreachable, and an unreachable branch is an unreviewed
 * one.
 */

export function DeleteAccountPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const snackbar = useSnackbar();
  const { logout } = useAuth();
  const { balance } = useWallet();

  const [checked, setChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);

  /** `role` is always `'mentee'` here — this is the mentee app. */
  const walletBalance = balance;

  const run = async () => {
    setConfirmOpen(false);
    setIsLoading(true);

    const blockedParam = searchParams.get('blocked');
    const failure: DeleteAccountFailure | null =
      blockedParam === 'session' || blockedParam === 'report' ? blockedParam : null;

    const result = await deleteAccount({
      failure,
      networkFail: searchParams.get('fail') === '1',
    });

    if (!result.ok) {
      setIsLoading(false);
      if (result.kind === 'conflict') {
        setConflictMessage(result.message);
      } else {
        snackbar.show(copy.deleteAccountGenericError);
      }
      return;
    }

    let message: string = copy.deleteAccountSuccessGeneric;
    if (result.deletionDate) {
      message = fill(copy.deleteAccountSuccessWithDate, {
        date: formatDeletionDate(result.deletionDate),
      });
    }

    // Order matters — see the header.
    logout();
    snackbar.show(message);
  };

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        // The source sets no `backgroundColor` on this Scaffold, unlike every
        // sibling, so it inherits `surface.page` from the theme.
        background: 'var(--surface-page)',
      }}
    >
      <AppTopBar title={copy.deleteAccountTitle} onBack={() => router.back()} />

      <div
        className="no-scrollbar"
        style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}
      >
        <PagePadding>
          <div style={{ height: 'var(--spacing-md)' }} />

          <AppBanner
            variant="warning"
            title={copy.deleteAccountWarningTitle}
            message={copy.deleteAccountWarningMessage}
          />
          <div style={{ height: 'var(--spacing-lg)' }} />

          <div
            className="type-title-md type-emphasis-semibold"
            style={{ color: 'var(--text-heading)' }}
          >
            {copy.deleteAccountWhatTitle}
          </div>
          <div style={{ height: 'var(--spacing-sm)' }} />
          <BulletItem text={copy.deleteAccountBulletProfile} />
          <BulletItem text={copy.deleteAccountBulletSessions} />
          <BulletItem text={copy.deleteAccountBulletEducation} />
          <BulletItem text={copy.deleteAccountBulletSupport} />
          <div style={{ height: 'var(--spacing-lg)' }} />

          {/* Mentee arm only — the mentor arm shows an earnings banner and a
              discovery bullet instead. See the header. */}
          {walletBalance > 0 && (
            <>
              <AppBanner
                variant="warning"
                message={fill(copy.deleteAccountMenteeWalletWarning, {
                  amount: `₹${walletBalance.toFixed(0)}`,
                })}
              />
              <div style={{ height: 'var(--spacing-lg)' }} />
            </>
          )}

          <div
            className="type-title-md type-emphasis-semibold"
            style={{ color: 'var(--text-heading)' }}
          >
            {copy.deleteAccountGracePeriodTitle}
          </div>
          <div style={{ height: 'var(--spacing-xs)' }} />
          <div className="type-body-md" style={{ color: 'var(--text-body)' }}>
            {copy.deleteAccountGracePeriodMessage}
          </div>
          <div style={{ height: 'var(--spacing-lg)' }} />

          {/* Checkbox + label. The label is part of the tap target, which is
              why the source wraps BOTH in one `GestureDetector`. */}
          <div
            onClick={() => setChecked((v) => !v)}
            role="checkbox"
            aria-checked={checked}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setChecked((v) => !v);
              }
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              cursor: 'pointer',
            }}
          >
            <RawCheckbox checked={checked} onToggle={() => setChecked((v) => !v)} />
            <div style={{ width: 'var(--spacing-sm)' }} />
            <div
              className="type-body-md"
              style={{ flex: 1, minWidth: 0, color: 'var(--text-body)' }}
            >
              {copy.deleteAccountConfirmCheckbox}
            </div>
          </div>
          <div style={{ height: 'var(--spacing-lg)' }} />
        </PagePadding>
      </div>

      {/* The button is pinned below the scroller, not inside it. */}
      <PagePadding>
        <AppButton
          label={copy.deleteAccountButton}
          intent="destructive"
          fullWidth
          isLoading={isLoading}
          disabled={!checked}
          onClick={() => setConfirmOpen(true)}
        />
        <div style={{ height: 'var(--spacing-md)' }} />
      </PagePadding>

      <PhoneOverlay>
        <AppModal
          open={confirmOpen}
          title={copy.deleteAccountConfirmTitle}
          message={copy.deleteAccountConfirmMessage}
          actions={[
            { label: copy.deleteAccountCancelButton, onPress: () => setConfirmOpen(false) },
            { label: copy.deleteAccountConfirmButton, destructive: true, onPress: run },
          ]}
          onClose={() => setConfirmOpen(false)}
        />

        {/*
          The conflict dialog. `cancelLabel: ''` in the source makes this a
          single-action dialog, and it is NOT dismissible by tapping out —
          `showConfirm` with no cancel still only closes on its button. It is
          rendered as a second, independent `AppModal` rather than reusing the
          one above, because the two have different action counts.
        */}
        <AppModal
          open={conflictMessage !== null}
          title={copy.deleteAccountCannotDeleteTitle}
          message={conflictMessage ?? ''}
          actions={[
            { label: copy.deleteAccountOkButton, onPress: () => setConflictMessage(null) },
          ]}
          onClose={() => setConflictMessage(null)}
          dismissible={false}
        />
      </PhoneOverlay>
    </div>
  );
}

/**
 * `_BulletItem` — a bullet glyph, two spaces, then the text, `bodyMedium` in
 * `text.body`. The bullet is a separate `Text` (not a list marker) in
 * `text.bodyLight`, and the row is `crossAxisAlignment: start` so a wrapped
 * line aligns under the text, not under the bullet.
 */
function BulletItem({ text }: { text: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        paddingBottom: 'var(--spacing-xs)',
      }}
    >
      <span className="type-body-md" style={{ color: 'var(--text-body-light)' }}>
        {'•  '}
      </span>
      <span className="type-body-md" style={{ flex: 1, minWidth: 0, color: 'var(--text-body)' }}>
        {text}
      </span>
    </div>
  );
}

/**
 * The raw 24×24 `Checkbox` the source uses because the DS has no tick box.
 *
 * `activeColor: colors.surface.action` — the box fills with the brand colour
 * when checked. The glyph is `AppIcons.check`, which is what Flutter's own
 * `Checkbox` draws, so this is the same tick at the same weight rather than a
 * browser `<input type="checkbox">` (whose tick, size and radius differ by
 * engine and would be the one visibly non-Flutter control on the screen).
 */
function RawCheckbox({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
  return (
    <div
      onClick={(e) => {
        // The row above also toggles; without this a tap on the box would fire
        // both handlers and cancel itself out.
        e.stopPropagation();
        onToggle();
      }}
      style={{
        width: 24,
        height: 24,
        flexShrink: 0,
        boxSizing: 'border-box',
        borderRadius: 2,
        background: checked ? 'var(--surface-action)' : 'transparent',
        border: checked ? 'none' : '2px solid var(--icon-secondary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {checked && <AppIcon name="check" px={18} color="var(--icon-on-action)" />}
    </div>
  );
}
