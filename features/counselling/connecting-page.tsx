'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppButton, AppIcon, AppLoadingSpinner } from '@/design-system';
import { CounsellingTopBar } from './counselling-chrome';

/**
 * CounsellingConnectingPage — port of
 * `ui/counselling/pages/counselling_connecting_page.dart`.
 *
 * Step 4: a "Calling…" spinner that, after TWO SECONDS, gives up and admits the
 * connection was never going to happen. The source's doc comment is unusually
 * blunt about why: "Backend for actually connecting a counsellor session isn't
 * live yet, so this is an honest placeholder rather than faking a real
 * connection or a fake error."
 *
 * That honesty is the whole design of the screen and it is reproduced exactly:
 *
 *   before 2s   spinner in a 44-radius circle, "Calling {name}…",
 *               "Initiating secure connection…", no button
 *   after 2s    `hourglass_top_rounded`, "Session connection coming soon",
 *               a two-sentence explanation, and "Back to Home"
 *
 * Nothing else in the flow is time-based, so nothing else needs a timer.
 *
 * ── "Back to Home" is `popUntil((route) => route.isFirst)` ─────────────────
 *
 * Not `pop()` — it unwinds the WHOLE counselling flow back to the shell. In the
 * prototype the equivalent is a push to `/home`, which lands on the same place
 * from any depth and also works if the user deep-linked straight here from the
 * screen index.
 *
 * ── The counsellor's name comes from the route, not the intake ─────────────
 *
 * `CounsellingConnectingPage(counsellorName: counsellorName)` — the name is
 * pushed, and the intake data is NOT carried past the match page. So this
 * screen is the one place in the flow that does not read the provider, and its
 * copy is a literal again because there is nothing to derive it from.
 */

const COUNSELLOR_NAME = 'Dr. Amit Verma';
const PENDING_DELAY_MS = 2000;

export function ConnectingPage() {
  const router = useRouter();
  const [showPending, setShowPending] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => setShowPending(true), PENDING_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--surface-page)',
      }}
    >
      {/* No title — just the arrow. Leaving mid-"call" pops one step. */}
      <CounsellingTopBar onBack={() => router.back()} />

      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0 32px',
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
          {/* `CircleAvatar(radius: 44)` holding either the spinner or the
              hourglass — the two states swap the CHILD, not the circle. */}
          <div
            style={{
              width: 88,
              height: 88,
              borderRadius: '50%',
              background: 'var(--surface-action-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {showPending ? (
              <AppIcon name="hourglass" px={32} color="var(--surface-action)" />
            ) : (
              <AppLoadingSpinner size="lg" />
            )}
          </div>

          <div style={{ height: 24 }} />

          <div
            className="type-title-md type-emphasis-bold"
            style={{ color: 'var(--text-heading)' }}
          >
            {showPending
              ? 'Session connection coming soon'
              : `Calling ${COUNSELLOR_NAME}...`}
          </div>

          <div style={{ height: 8 }} />

          <div className="type-body-md" style={{ color: 'var(--text-body-light)' }}>
            {showPending
              ? "We're still building the live counsellor connection. "
                + 'Your details have been saved and our team will '
                + 'reach out to you directly.'
              : 'Initiating secure connection...'}
          </div>

          {showPending && (
            <>
              <div style={{ height: 28 }} />
              <div style={{ width: '100%' }}>
                <AppButton
                  label="Back to Home"
                  fullWidth
                  onClick={() => router.push('/home')}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
