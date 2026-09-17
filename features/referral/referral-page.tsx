'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppButton, AppTopBar, LoadingPage } from '@/design-system';
import { copy } from '@/lib/copy';
import { useSnackbar } from '@/lib/state/snackbar-provider';

/**
 * ReferralPage — port of `core/lib/referral/ui/widgets/referral_share_page.dart`.
 *
 * Three states: `LoadingPage` while the code is in flight, a centred message
 * plus a Retry button on failure, and the content otherwise.
 *
 * ── What gets copied and shared is the LINK, not the code ───────────────────
 *
 * `buildReferralPlayStoreLink(code)` →
 * `…details?id=app.mentortalk.mentee&referrer=mt_code%3D<CODE>`
 *
 * The Play Store records `referrer` against the install, and the app reads it
 * back on first launch to pre-fill the signup field. So the code only earns
 * when it reaches a signup, and it only reaches a signup through the link —
 * which is why the Copy button copies the link and the snackbar says "Referral
 * link copied" rather than "Code copied". The code itself stays on screen for
 * anyone who wants to read it out.
 *
 * ── Every string here is a literal in the source ────────────────────────────
 *
 * The `AppTopBar` title is `'Refer & Earn'`; the loading message and the error
 * fallback are hardcoded too. `copy.referAndEarn` exists in `lib/copy.ts`
 * already and is used, but the two long sentences below are not localised in
 * the app and are literals here for the same reason.
 *
 * ── Divergence: Share has no native sheet ───────────────────────────────────
 *
 * `SharePlus.instance.share(ShareParams(...))` opens the OS share sheet. A
 * browser's nearest equivalent is `navigator.share`, which needs a secure
 * context and a user gesture and is absent on most desktop browsers — so this
 * copies the message to the clipboard and says so, rather than rendering a
 * button that does nothing. The message itself is byte-for-byte the source's.
 */

/** `ReferralInfo` from `GET /auth/referral/me`. */
type ReferralInfo = {
  code: string;
  rewardReferrerAmount: number;
  rewardReferredAmount: number;
  isActive: boolean;
  totalReferred: number;
  totalCredited: number;
  totalEarned: number;
};

const MENTEE_PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=app.mentortalk.mentee';

/** `buildReferralPlayStoreLink` — `Uri.encodeComponent('mt_code=$code')`. */
function buildReferralPlayStoreLink(code: string): string {
  return `${MENTEE_PLAY_STORE_URL}&referrer=${encodeURIComponent(`mt_code=${code}`)}`;
}

/**
 * The fixture. One code, two bonuses, and lifetime stats that agree with the
 * two referral rows in the wallet's payment log (`lib/fake/transactions.ts`)
 * — ₹80 each, so "Earned" reads ₹160 in both places.
 */
const REFERRAL_INFO: ReferralInfo = {
  code: 'AAYUSH42',
  rewardReferrerAmount: 80,
  rewardReferredAmount: 80,
  isActive: true,
  totalReferred: 2,
  totalCredited: 2,
  totalEarned: 160,
};

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'loaded'; info: ReferralInfo };

export function ReferralPage() {
  const router = useRouter();
  const { show } = useSnackbar();
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  const load = useCallback(() => {
    setState({ status: 'loading' });
    const timer = window.setTimeout(() => {
      setState({ status: 'loaded', info: REFERRAL_INFO });
    }, 700);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => load(), [load]);

  const copyLink = async (code: string) => {
    try {
      await navigator.clipboard.writeText(buildReferralPlayStoreLink(code));
      show('Referral link copied');
    } catch {
      // Clipboard access can be refused outright (insecure context, denied
      // permission). The code is on screen; say what happened rather than
      // claiming a copy that did not occur.
      show('Could not copy — long-press the code instead');
    }
  };

  const share = async (info: ReferralInfo) => {
    const link = buildReferralPlayStoreLink(info.code);
    const message =
      'Join me on MentorTalk! Install the app from this link and my code '
      + `${info.code} is attached automatically — we both get rewarded.\n${link}`;

    try {
      await navigator.clipboard.writeText(message);
      show('Share message copied');
    } catch {
      show('Could not copy the share message');
    }
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
      <AppTopBar title={copy.referAndEarn} onBack={() => router.back()} />

      <div
        className="no-scrollbar"
        style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}
      >
        {state.status === 'loading' && (
          <LoadingPage message="Loading your referral code…" />
        )}

        {state.status === 'error' && (
          <div
            style={{
              minHeight: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 16,
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              <span className="type-body-lg" style={{ color: 'var(--text-body)' }}>
                {state.message}
              </span>
              <div style={{ height: 24 }} />
              <AppButton label="Retry" onClick={load} />
            </div>
          </div>
        )}

        {state.status === 'loaded' && (
          <div style={{ padding: '0 16px' }}>
            <div style={{ height: 16 }} />

            {/* The intro sentence carries both reward amounts, formatted with
                `toStringAsFixed(0)` — so a ₹80 bonus reads "₹80" and there is
                no decimal anywhere on this screen even if the API sends one. */}
            <span className="type-body-md" style={{ color: 'var(--text-body-light)' }}>
              {'Share this link with anyone. When they install from it and sign up, '
                + `you both get rewarded — ₹${state.info.rewardReferrerAmount.toFixed(0)} `
                + `for you, ₹${state.info.rewardReferredAmount.toFixed(0)} for them.`}
            </span>

            <div style={{ height: 32 }} />

            <CodeChip code={state.info.code} />

            <div style={{ height: 16 }} />

            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <AppButton
                  label="Copy"
                  type="outlined"
                  fullWidth
                  onClick={() => copyLink(state.info.code)}
                />
              </div>
              <div style={{ flex: 1 }}>
                <AppButton label="Share" fullWidth onClick={() => share(state.info)} />
              </div>
            </div>

            <div style={{ height: 32 }} />

            <div style={{ display: 'flex', gap: 16 }}>
              <StatTile label="Referred" value={`${state.info.totalReferred}`} />
              <StatTile label="Earned" value={`₹${state.info.totalEarned.toFixed(0)}`} />
            </div>

            <div style={{ height: 24 }} />
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * `_CodeChip` — the code itself, centred, headlineLarge, w700, letterSpacing 4,
 * in a `surface.primary` box with radius 12 and an ACTION-coloured border — the
 * only border in the app drawn in `border.action` rather than `border.primaryLight`.
 *
 * The 4px of tracking is what makes a six-character code read as a code rather
 * than as a word, so it is kept exactly.
 */
function CodeChip({ code }: { code: string }) {
  return (
    <div
      style={{
        padding: '24px 16px',
        background: 'var(--surface-primary)',
        borderRadius: 12,
        border: '1px solid var(--border-action)',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <span
        className="type-headline-lg type-emphasis-bold"
        style={{ color: 'var(--text-heading)', letterSpacing: 4 }}
      >
        {code}
      </span>
    </div>
  );
}

/** `_StatTile` — the value ABOVE the label, which is the reverse of a stat card. */
function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        padding: 16,
        background: 'var(--surface-primary)',
        borderRadius: 12,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
      }}
    >
      <span
        className="type-headline-sm type-emphasis-bold"
        style={{ color: 'var(--text-heading)' }}
      >
        {value}
      </span>
      <div style={{ height: 4 }} />
      <span className="type-body-sm" style={{ color: 'var(--text-body-light)' }}>
        {label}
      </span>
    </div>
  );
}
