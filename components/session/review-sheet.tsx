'use client';

import { useState } from 'react';
import { AppButton, AppIcon, AppTextAreaField } from '@/design-system';
import { copy, fill } from '@/lib/copy';

/**
 * ReviewSheet — port of `mentee_app/lib/ui/session/widgets/review_sheet.dart`.
 *
 * ── It has no close button and no skip, and that is the source ──────────────
 *
 * The sheet's doc comment says *"Dismissing without posting is fine — no nag"*,
 * and the only way to dismiss it is the scrim or a drag — there is no X and no
 * "Skip". The submit button is disabled until a star is tapped (`_rating > 0`),
 * so a reviewer who wants out has to tap outside. That combination is what the
 * real app does, so it is what this does.
 *
 * ── Rating is required, the comment is not ─────────────────────────────────
 *
 * `_handleSubmit` returns early on `_rating == 0`, and an empty comment is sent
 * as `null` rather than `''`. Both details matter: a review with no text and a
 * rating is a complete review.
 *
 * ── It is opened 500 ms after the session ends, by the chrome, not by itself ─
 *
 * `session_overlay_manager.dart` delays the `ReviewSheet.show` by
 * `Duration(milliseconds: 500)` — enough for the call overlay to be gone before
 * the sheet rises. That delay lives in `session-chrome.tsx`.
 *
 * ── The star colour is `icon.warning`, not a literal ───────────────────────
 *
 * `starIndex <= _rating ? colorScheme.icon.warning : colorScheme.icon.secondary`
 * — so it is the token, not `#FFC107`. (The *session-details* review card uses
 * the literal `Colors.amber`. Two different ambers two features apart.)
 */

export function ReviewSheet({
  open,
  mentorName,
  onSubmit,
}: {
  open: boolean;
  mentorName: string;
  /** Resolves when the review is posted; the sheet closes itself after. */
  onSubmit: (rating: number, comment: string | null) => Promise<void>;
}) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!open) return null;

  async function handleSubmit(): Promise<void> {
    if (rating === 0) return;
    setIsSubmitting(true);
    try {
      await onSubmit(rating, comment.length === 0 ? null : comment);
    } catch {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 60,
        pointerEvents: 'auto',
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}
    >
      <div
        className="sheet-enter"
        style={{
          background: 'var(--surface-primary)',
          borderRadius: 'var(--ds-radius-lg) var(--ds-radius-lg) 0 0',
          paddingBottom: 12,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            padding: '0 var(--page-padding-horizontal)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {/* ── Drag handle ── */}
          <div style={{ height: 'var(--spacing-sm)' }} />
          <div
            style={{
              width: 36,
              height: 4,
              borderRadius: 2,
              background: 'var(--border-secondary)',
            }}
          />
          <div style={{ height: 'var(--spacing-lg)' }} />

          {/* ── Title ── */}
          <span
            className="type-title-md"
            style={{ color: 'var(--text-heading)', fontWeight: 700 }}
          >
            {copy.howWasSession}
          </span>
          <div style={{ height: 'var(--spacing-xs)' }} />
          <span className="type-body-md" style={{ color: 'var(--text-body-light)' }}>
            {fill(copy.rateSessionWith, { name: mentorName })}
          </span>
          <div style={{ height: 'var(--spacing-lg)' }} />

          {/* ── Stars ── */}
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            {[1, 2, 3, 4, 5].map((starIndex) => (
              <div
                key={starIndex}
                onClick={() => setRating(starIndex)}
                style={{
                  padding: '0 var(--spacing-xs)',
                  cursor: 'pointer',
                  display: 'flex',
                }}
              >
                <AppIcon
                  px={40}
                  name={starIndex <= rating ? 'starRounded' : 'starOutlined'}
                  color={
                    starIndex <= rating
                      ? 'var(--icon-warning)'
                      : 'var(--icon-secondary)'
                  }
                />
              </div>
            ))}
          </div>
          <div style={{ height: 'var(--spacing-lg)' }} />

          {/* ── Comment ── */}
          <div style={{ width: '100%' }}>
            <AppTextAreaField
              value={comment}
              onChange={setComment}
              hintText={copy.shareExperience}
              maxLines={3}
            />
          </div>
          <div style={{ height: 'var(--spacing-lg)' }} />

          {/* ── Submit ──────────────────────────────────────────────────────
              The source passes `onPressed: _rating > 0 && !_isSubmitting ?
              _handleSubmit : null`, and `AppButton` treats a null callback as
              "disabled". In the port a disabled button is one with **no
              `onClick`**, so the two states are expressed by conditionally
              spreading the handler rather than by a `disabled` prop — that is
              what reproduces the source's own affordance rules (no ripple, no
              press feedback) instead of merely greying it out. */}
          <div style={{ width: '100%' }}>
            <AppButton
              label={copy.postReview}
              fullWidth
              isLoading={isSubmitting}
              {...(rating > 0 && !isSubmitting
                ? { onClick: () => void handleSubmit() }
                : {})}
            />
          </div>
          <div style={{ height: 'var(--spacing-md)' }} />
        </div>
      </div>
    </div>
  );
}
