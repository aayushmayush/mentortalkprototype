'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppButton, AppLoadingSpinner, AppTopBar } from '@/design-system';
import { formatInr } from '@/lib/rates';
import { useSnackbar } from '@/lib/state/snackbar-provider';

/**
 * PackagesPage — port of `ui/packages/pages/packages_page.dart`.
 *
 * Admin-defined counselling packages a student can buy. **Buying one credits
 * nothing and unlocks nothing in-app** — it creates a follow-up task for the
 * MentorTalk team, which is why the success message is "Our team will reach out
 * for counselling shortly" and not a balance change. That is the single most
 * surprising thing about this screen and the source says it in a doc comment
 * above the class.
 *
 * ── The title is "Counselling", and so is the tile that opens it ────────────
 *
 * `AppTopBar(title: 'Counselling')`, hardcoded, and the wallet tile that pushes
 * this page is also labelled "Counselling". So the app has a wallet row called
 * Counselling that opens a page called Counselling which lists… packages. It
 * reads like a rename that stopped halfway, and it is reproduced rather than
 * corrected for the same reason the Chats tab's "Order History" title is: a
 * reviewer comparing against the app has to find the same label.
 *
 * ── Three load states, three different treatments ───────────────────────────
 *
 *   loading → a bare `CircularProgressIndicator`, centred. NOT `LoadingPage`,
 *             which every other screen in the app uses. No message, no padding.
 *   error   → the message itself, centred, in bodyMedium/bodyLight, with 24px
 *             of padding and NO retry affordance. The only way out is back.
 *   loaded  → the list, or a one-line empty state.
 *
 * The error state having no retry is the source's and is worth flagging — the
 * wallet's transaction error has a "Tap to retry" and this one does not.
 *
 * ── Purchase is simulated ───────────────────────────────────────────────────
 *
 * create-order → Razorpay checkout → verify. There is no Razorpay here, so the
 * "checkout" is a 1.4s round-trip followed by the source's success snackbar.
 * The per-card spinner is real, and it is scoped to the ONE package whose id is
 * pending — buy one and the others stay tappable, which is the source's
 * `_pendingPackageId == package.id` check.
 */

type PackageItem = {
  id: string;
  name: string;
  description: string | null;
  price: number;
};

/**
 * The fixture. Package names and prices are admin data (`GET /packages`), so
 * there is nothing to transcribe — these are representative of the counselling
 * packages the app sells.
 */
const PACKAGES: PackageItem[] = [
  {
    id: 'pkg_neet_counselling',
    name: 'NEET Counselling Support',
    description:
      'College prediction, choice filling strategy and document checks with a NEET counsellor.',
    price: 4999,
  },
  {
    id: 'pkg_jee_choice_filling',
    name: 'JEE Choice Filling',
    description: 'JoSAA round-by-round planning with an IIT counsellor.',
    price: 3499,
  },
  {
    id: 'pkg_cuet_university',
    name: 'CUET University Guidance',
    description: null,
    price: 1999,
  },
  {
    id: 'pkg_mentorship_monthly',
    name: 'Monthly Mentorship',
    description: 'Four sessions a month with a mentor in your target stream.',
    price: 2499,
  },
];

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'loaded'; packages: PackageItem[] };

export function PackagesPage() {
  const router = useRouter();
  const { show } = useSnackbar();

  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [pendingId, setPendingId] = useState<string | null>(null);

  /**
   * `PackagesCubit.load()`. There is no failure path in the fixture, so the
   * error branch below is unreachable in the prototype — noted rather than
   * faked, since a screen whose error state cannot be seen cannot be reviewed.
   * The treatment is transcribed from the source all the same.
   */
  const load = useCallback(() => {
    setState({ status: 'loading' });
    const timer = window.setTimeout(() => {
      setState({ status: 'loaded', packages: PACKAGES });
    }, 700);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => load(), [load]);

  /**
   * `_onBuyPressed` → create order → checkout → verify → `PackagePurchaseSuccess`.
   *
   * The `_pendingPackageId` guard is what keeps the spinner on one card. It is
   * set at the START of the flow and cleared on success; the source never
   * clears it on error either, because an error leaves the bloc in
   * `PackagePurchaseError` and the next tap overwrites it.
   */
  const onBuy = useCallback(
    (pkg: PackageItem) => {
      if (pendingId !== null) return;
      setPendingId(pkg.id);

      window.setTimeout(() => {
        setPendingId(null);
        show(
          'Payment successful! Our team will reach out for counselling shortly.',
        );
      }, 1400);
    },
    [pendingId, show],
  );

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--surface-page)',
      }}
    >
      <AppTopBar title="Counselling" onBack={() => router.back()} />

      <div
        className="no-scrollbar"
        style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}
      >
        {state.status === 'loading' && (
          <div
            style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AppLoadingSpinner size="lg" />
          </div>
        )}

        {state.status === 'error' && (
          <div
            style={{
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
            }}
          >
            <span
              className="type-body-md"
              style={{ color: 'var(--text-body-light)', textAlign: 'center' }}
            >
              {state.message}
            </span>
          </div>
        )}

        {state.status === 'loaded' &&
          (state.packages.length === 0 ? (
            <div
              style={{
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span className="type-body-md" style={{ color: 'var(--text-body-light)' }}>
                No packages available right now.
              </span>
            </div>
          ) : (
            <div
              style={{
                padding: '16px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              {state.packages.map((pkg) => (
                <PackageCard
                  key={pkg.id}
                  package={pkg}
                  isLoading={pendingId === pkg.id}
                  onBuy={() => onBuy(pkg)}
                />
              ))}
            </div>
          ))}
      </div>
    </div>
  );
}

/**
 * `_PackageCard` — name, optional description, then the price and a Buy button
 * on one row. 20px of padding, radius 16, no border.
 *
 * Every string on this screen is a literal in the source, not an l10n key —
 * including the title and the success message — so `copy` is deliberately not
 * consulted anywhere in this file.
 */
function PackageCard({
  package: pkg,
  isLoading,
  onBuy,
}: {
  package: PackageItem;
  isLoading: boolean;
  onBuy: () => void;
}) {
  return (
    <div
      style={{
        width: '100%',
        padding: 20,
        background: 'var(--surface-primary)',
        borderRadius: 16,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
      }}
    >
      <span
        className="type-title-sm type-emphasis-semibold"
        style={{ color: 'var(--text-heading)' }}
      >
        {pkg.name}
      </span>

      {pkg.description !== null && pkg.description !== '' && (
        <>
          <div style={{ height: 4 }} />
          <span className="type-body-sm" style={{ color: 'var(--text-body-light)' }}>
            {pkg.description}
          </span>
        </>
      )}

      <div style={{ height: 16 }} />

      <div
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          className="type-headline-sm type-emphasis-bold"
          style={{ color: 'var(--text-heading)' }}
        >
          {formatInr(pkg.price)}
        </span>

        <AppButton label="Buy" isLoading={isLoading} disabled={isLoading} onClick={onBuy} />
      </div>
    </div>
  );
}
