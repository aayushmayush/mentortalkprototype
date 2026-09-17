'use client';

import { AppIcon } from '@/design-system';
import { copy } from '@/lib/copy';

/**
 * Completion — port of `ui/onboarding/pages/onboarding_complete_page.dart`.
 *
 * ONE page with two modes, not two screens: `isComplete` false during
 * submission (`submitting` state) and true once done. The bloc renders
 * `submitting` and `complete` with the same widget and a different flag, and
 * waits 2 seconds on `complete` before navigating home — so this animation is
 * always seen in full.
 *
 * The icon is a 96px circle inside a 120px box (12px margin all round), and the
 * two states are genuinely different components:
 *
 *   loading   surface.primary circle, action@15% glow, pulsing scale 1.00→1.05
 *             on a reversing 1.5s controller, holding a 3px spinner coloured
 *             `border.action` on an `surface.actionLight` track
 *   success   surface.action circle, action@30% glow, a 48px check in
 *             `text.onAction`, scaling in on `elasticOut` over the first 60% of
 *             an 800ms controller
 *
 * The subtitle swaps treatment too: the loading one pulses its *opacity*
 * (0.5→1.0) on the same 1.5s controller, while the success one slides up 20px
 * and fades in on the 800ms one. Both titles/subtitles animate together as one
 * block — the source wraps each in its own AnimatedBuilder but drives them from
 * the same controller, so they cannot drift.
 */
export function CompleteStep({ isComplete }: { isComplete: boolean }) {
  return (
    <div
      style={{
        minHeight: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 32px',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{ width: 120, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {isComplete ? <SuccessIcon /> : <LoadingIcon />}
        </div>

        <div style={{ height: 32 }} />

        {isComplete ? (
          <div className="onb-rise">
            <h1
              className="type-headline-sm type-emphasis-bold"
              style={{ color: 'var(--text-heading)', textAlign: 'center' }}
            >
              {copy.youAreAllSet}
            </h1>
            <div style={{ height: 8 }} />
            <p
              className="type-body-md"
              style={{ color: 'var(--text-body-light)', textAlign: 'center' }}
            >
              {copy.welcomeToMentorTalk}
            </p>
          </div>
        ) : (
          <>
            <h1
              className="type-headline-sm type-emphasis-bold"
              style={{ color: 'var(--text-heading)', textAlign: 'center' }}
            >
              {copy.settingUpProfile}
            </h1>
            <div style={{ height: 8 }} />
            <p
              className="type-body-md onb-pulse"
              style={{ color: 'var(--text-body-light)', textAlign: 'center' }}
            >
              {copy.onlyTakeAMoment}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

/** `_buildLoadingIcon` — note the spinner is 96px tall inside a 120px box. */
function LoadingIcon() {
  return (
    <div
      className="onb-breathe"
      style={{
        width: 96,
        height: 96,
        borderRadius: '50%',
        background: 'var(--surface-primary)',
        boxShadow: 'var(--shadow-onboarding-ring)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <span
        className="onb-spin"
        style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          border: '3px solid var(--surface-action-light)',
          borderTopColor: 'var(--border-action)',
        }}
      />
    </div>
  );
}

/** `_buildSuccessIcon` — 48px check, `text.onAction` on `surface.action`. */
function SuccessIcon() {
  return (
    <div
      className="onb-pop"
      style={{
        width: 96,
        height: 96,
        borderRadius: '50%',
        background: 'var(--surface-action)',
        boxShadow: 'var(--shadow-onboarding-success)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/*
        `Icon(Icons.check_rounded, size: 48)` — a raw Icons glyph, not an
        AppIcons constant, and 48px is outside AppIcon's 16/20/24/32 ladder, so
        the size is set directly rather than snapped to `lg` (32).
      */}
      <AppIcon
        name="check"
        size="lg"
        color="var(--text-on-action)"
        filled
        style={{ fontSize: 48, width: 48, height: 48 }}
      />
    </div>
  );
}
