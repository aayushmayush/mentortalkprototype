'use client';

import { AppIcon } from '@/design-system';

/**
 * The counselling flow's own chrome — the two pieces all five screens share.
 *
 * ── Why this is not `AppTopBar` ─────────────────────────────────────────────
 *
 * Every page in the counselling flow builds a RAW Flutter `AppBar` rather than
 * using the design system's `AppTopBar`. That gives it a 56px height
 * (`kToolbarHeight`) instead of 64, a left-aligned title rather than a centred
 * one, and — on the intake page — a `TextButton` action rather than an icon
 * button. Three of the five bars have no title at all; only the exam picker and
 * the counsellor match do.
 *
 * `AppTopBar` cannot express any of that, so the flow carries its own. Kept in
 * one file because the three variations (bare, titled, action) are the same bar
 * with different slots, and because the 56 is a single number the five pages
 * must agree on.
 */

export function CounsellingTopBar({
  title,
  onBack,
  action,
}: {
  title?: string;
  onBack: () => void;
  /** A right-hand `TextButton` — the intake page's "Skip", in `text.action`. */
  action?: { label: string; onPress: () => void };
}) {
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
          marginLeft: 4,
          cursor: 'pointer',
          display: 'flex',
        }}
      >
        <AppIcon name="arrowBack" size="md" color="var(--icon-primary)" />
      </button>

      {title !== undefined && (
        <>
          <div style={{ width: 4 }} />
          <span className="type-title-md" style={{ color: 'var(--text-heading)' }}>
            {title}
          </span>
        </>
      )}

      <div style={{ flex: 1 }} />

      {action !== undefined && (
        <button
          type="button"
          onClick={action.onPress}
          style={{
            border: 'none',
            background: 'transparent',
            padding: '8px 16px',
            cursor: 'pointer',
          }}
        >
          <span className="type-body-md" style={{ color: 'var(--text-action)' }}>
            {action.label}
          </span>
        </button>
      )}
    </div>
  );
}

/**
 * `LinearProgressIndicator` — 4px tall, fully rounded, over `border.primaryLight`
 * with `surface.action` as the fill.
 *
 * The three steps use 0.33, 0.66 and (on the college page) nothing at all —
 * the connecting screen has no bar. So the flow reads two-thirds complete at
 * its last step, which is the source's value and not a rounding of 1.0.
 */
export function ProgressBar({ value }: { value: number }) {
  return (
    <div
      style={{
        height: 4,
        width: '100%',
        background: 'var(--border-primary-light)',
        borderRadius: 2,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${value * 100}%`,
          background: 'var(--surface-action)',
          borderRadius: 2,
        }}
      />
    </div>
  );
}
