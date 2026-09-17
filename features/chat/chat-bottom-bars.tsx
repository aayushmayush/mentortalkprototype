'use client';

import { AppButton, AppIcon } from '@/design-system';
import { copy } from '@/lib/copy';
import { formatRate } from '@/lib/rates';

/**
 * The two bottom bars that replace the input field when a session is not live:
 * `_RequestingBar` while a request is in flight, and `_ContinueChatBar` once it
 * is over.
 *
 * ── The promo banner is a rich-text run, not a sentence ─────────────────────
 *
 * The line is assembled from spans with three different colours: the greeting
 * and tail in `text.body`, the *original* rate struck through in `text.body`,
 * and the promo rate in `text.action` at w700. The strikethrough renders only
 * when there is a real list rate to cross out — a mentor with no rate shows no
 * strikethrough at all, not a struck-through ₹0.
 *
 * The greeting embeds the mentee's own first name, lowercased into the middle of
 * a sentence that reads "Hi Ayush, continue this chat at ₹5/min for first 5
 * minutes". Note the missing article — "for first 5 minutes", not "for the
 * first" — that is the source's copy and it is left alone.
 *
 * ── A real contrast bug, reproduced ─────────────────────────────────────────
 *
 * The unavailable banner is `surface.actionLight` (#CDD9EF, a pale blue) with
 * `text.onAction` text — which resolves to pure WHITE in both themes. White on
 * #CDD9EF is roughly 1.4:1, far below any legible threshold. It is a genuine
 * bug in the app, not a misread here, and it is reproduced rather than fixed so
 * a reviewer auditing the prototype against the app sees the same defect. If it
 * is ever fixed upstream, this is the line to change.
 */

const PAGE_PADDING = 16;

function BottomBarShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: 'var(--surface-primary)',
        paddingLeft: PAGE_PADDING,
        paddingRight: PAGE_PADDING,
        paddingTop: 12,
        paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
      }}
    >
      {children}
    </div>
  );
}

/**
 * `_RequestingBar` — a 20px spinner, the l10n string, and a red-text Cancel.
 *
 * This is the bar for `SessionPhase.requesting` only. `waitingForMentor` and
 * `queued` fall through the source's switch to `SizedBox.shrink()` — an empty
 * bottom bar while the mentor is deciding. That looks like an oversight, but it
 * is what the app does, and the ringing UI lives in the session overlay above
 * the chat screen rather than here.
 */
export function RequestingBar({ onCancel }: { onCancel: () => void }) {
  return (
    <BottomBarShell>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <span
          aria-hidden
          style={{
            width: 20,
            height: 20,
            flexShrink: 0,
            borderRadius: '50%',
            border: '2px solid var(--surface-action)',
            borderTopColor: 'transparent',
            animation: 'spin 800ms linear infinite',
          }}
        />
        <div style={{ width: 12, flexShrink: 0 }} />
        <span
          style={{
            flex: 1,
            minWidth: 0,
            fontSize: 15,
            fontWeight: 500,
            color: 'var(--text-body-light)',
          }}
        >
          {copy.requestingSession}
        </span>
        <button
          type="button"
          onClick={onCancel}
          style={{
            border: 'none',
            background: 'transparent',
            padding: '8px 12px',
            margin: '-8px -12px -8px 0',
            cursor: 'pointer',
            fontSize: 15,
            fontWeight: 600,
            color: 'var(--text-error)',
          }}
        >
          {copy.cancel}
        </button>
      </div>
    </BottomBarShell>
  );
}

/**
 * `_ContinueChatBar` — the promo banner (or the unavailable banner), then a
 * full-width "Continue Chat".
 *
 * The two banners are mutually exclusive and the promo WINS: a mentor who is
 * offline *and* running an intro promo shows the promo and no unavailability
 * warning, so the mentee is invited to start a session that cannot connect.
 * That is the source's branch order — `introPromoEligible` is checked first and
 * the unavailable banner is additionally guarded on `!introPromoEligible`.
 */
export function ContinueChatBar({
  onTap,
  introPromoEligible,
  mentorRatePerMinute,
  introPromoRatePerMinute,
  mentorIsAvailable,
  menteeFirstName,
  disabled,
}: {
  onTap: () => void;
  introPromoEligible: boolean;
  mentorRatePerMinute: number;
  introPromoRatePerMinute: number | null;
  mentorIsAvailable: boolean;
  menteeFirstName: string;
  disabled: boolean;
}) {
  const greeting = menteeFirstName ? `Hi ${menteeFirstName}, ` : '';
  const promoRate = introPromoRatePerMinute ?? mentorRatePerMinute;

  return (
    <BottomBarShell>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {introPromoEligible && (
          <>
            <div
              style={{
                width: '100%',
                padding: '12px 12px',
                background: 'var(--surface-action-light)',
                borderRadius: 8,
                textAlign: 'center',
                fontSize: 14,
                fontWeight: 500,
                lineHeight: 1.4,
              }}
            >
              <span style={{ color: 'var(--text-body)' }}>
                {greeting}continue this chat at{' '}
              </span>
              {mentorRatePerMinute > 0 && (
                <span
                  style={{
                    color: 'var(--text-body)',
                    textDecoration: 'line-through',
                    textDecorationColor: 'var(--text-body)',
                  }}
                >
                  ₹{formatRate(mentorRatePerMinute)}/min{' '}
                </span>
              )}
              <span style={{ color: 'var(--text-action)', fontWeight: 700 }}>
                ₹{formatRate(promoRate)}/min
              </span>
              <span style={{ color: 'var(--text-body)' }}>
                {' '}
                for first 5 minutes
              </span>
            </div>
            <div style={{ height: 8 }} />
          </>
        )}

        {!introPromoEligible && !mentorIsAvailable && (
          <>
            <div
              style={{
                width: '100%',
                padding: '8px 12px',
                background: 'var(--surface-action-light)',
                borderRadius: 8,
                textAlign: 'center',
                fontSize: 14,
                fontWeight: 500,
                // See the header: white on #CDD9EF, ~1.4:1. The source's bug.
                color: 'var(--text-on-action)',
              }}
            >
              {copy.mentorUnavailable}
            </div>
            <div style={{ height: 8 }} />
          </>
        )}

        <AppButton
          label={copy.continueChat}
          onClick={onTap}
          disabled={disabled}
          fullWidth
        />
      </div>
    </BottomBarShell>
  );
}

/**
 * `SessionPhase.active when isInCall` — the input bar is replaced wholesale by a
 * locked-padlock line. Chat is unavailable during a voice or video call, and the
 * source says so rather than showing a disabled field.
 */
export function ChatUnavailableBar() {
  return (
    <BottomBarShell>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <AppIcon name="lockedOutline" size="xs" color="var(--text-body-light)" />
        <div style={{ width: 8, flexShrink: 0 }} />
        <span style={{ fontSize: 13, color: 'var(--text-body-light)' }}>
          {copy.chatUnavailableDuringCall}
        </span>
      </div>
    </BottomBarShell>
  );
}
