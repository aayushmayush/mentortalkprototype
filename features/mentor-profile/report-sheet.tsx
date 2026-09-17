'use client';

import { useState } from 'react';
import {
  AppBottomSheetHeader,
  AppButton,
  AppTextField,
} from '@/design-system';
import { PhoneOverlay } from '@/components/prototype/phone-frame';
import { copy, fill } from '@/lib/copy';

/**
 * ReportSheet — port of `core/lib/shared/widgets/report_sheet.dart`.
 *
 * ── The reasons are a wire contract, not copy ───────────────────────────────
 *
 * `ReportReason` carries a `value` alongside its label because the backend
 * validates against those exact strings. The enum's own comment says so:
 * "Reasons must match the backend's valid reasons." So the values below are the
 * Dart enum's, verbatim, and only the labels come from copy.
 *
 * ── Container colours differ from every other sheet ─────────────────────────
 *
 * The sheet paints `surface.page` (grey), not `surface.primary` (white), and
 * its radius is a literal 16 — not `borderRadiusLg` (24) and not the theme's
 * bottom-sheet shape. It also sets `isScrollControlled: true` and
 * `backgroundColor: Colors.transparent`, which is what lets it grow to 85% of
 * the screen with the app's own grey as its face. All three reproduced.
 *
 * ── Selection is a hand-built box, not a radio ──────────────────────────────
 *
 * There is no radio group here and no check glyph: the selected row is a filled
 * `surface.actionLight` box with a 1.5px `surface.action` border and its label
 * in `text.action` at w600 (unselected: `surface.primary`, no border, `text.body`
 * at w400). It is a custom container in the source and it is a custom container
 * here.
 */

/** `ReportReason` — value is the backend contract, label is the copy key. */
const REPORT_REASONS = [
  { value: 'inappropriate_behavior', label: copy.reportInappropriateBehavior },
  { value: 'spam_scam', label: copy.reportSpamScam },
  { value: 'unprofessional_conduct', label: copy.reportUnprofessionalConduct },
  { value: 'abusive_language', label: copy.reportAbusiveLanguage },
  { value: 'harassment', label: copy.reportHarassment },
  { value: 'other', label: copy.reportOther },
] as const;

export type ReportResult = { reason: string; description: string | null };

export function ReportSheet({
  open,
  userName,
  onClose,
  onSubmit,
}: {
  open: boolean;
  userName: string;
  onClose: () => void;
  onSubmit: (result: ReportResult) => void;
}) {
  const [reason, setReason] = useState<string | null>(null);
  const [description, setDescription] = useState('');

  if (!open) return null;

  /** `_canSubmit` — a description alone is not enough; a reason is required. */
  const canSubmit = reason !== null;

  return (
    <PhoneOverlay>
      <div
        className="scrim-enter"
        onClick={onClose}
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
          onClick={(e) => e.stopPropagation()}
          style={{
            // `maxHeight: size.height * 0.85`.
            maxHeight: '85%',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--surface-page)',
            // A literal 16 in the source, not the theme's sheet radius.
            borderRadius: '16px 16px 0 0',
          }}
        >
          <AppBottomSheetHeader
            title={fill(copy.reportUser, { userName })}
            onClose={onClose}
          />

          <div
            className="no-scrollbar"
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              padding: '0 var(--page-padding-horizontal)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
            }}
          >
            <span className="type-body-md" style={{ color: 'var(--text-body-light)' }}>
              {copy.reportReasonPrompt}
            </span>

            <div style={{ height: 'var(--spacing-md)' }} />

            {REPORT_REASONS.map((option) => {
              const isSelected = reason === option.value;
              return (
                <div
                  key={option.value}
                  onClick={() => setReason(option.value)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '14px 16px',
                    marginBottom: 8,
                    cursor: 'pointer',
                    background: isSelected
                      ? 'var(--surface-action-light)'
                      : 'var(--surface-primary)',
                    borderRadius: 'var(--ds-radius-md)',
                    border: isSelected
                      ? '1.5px solid var(--surface-action)'
                      : '1.5px solid transparent',
                  }}
                >
                  <span
                    className="type-body-md"
                    style={{
                      color: isSelected ? 'var(--text-action)' : 'var(--text-body)',
                      fontWeight: isSelected ? 600 : 400,
                    }}
                  >
                    {option.label}
                  </span>
                </div>
              );
            })}

            <div style={{ height: 'var(--spacing-md)' }} />

            <div style={{ width: '100%' }}>
              <AppTextField
                label={copy.additionalDetailsOptional}
                value={description}
                onChange={setDescription}
              />
            </div>

            <div style={{ height: 'var(--spacing-lg)' }} />

            <AppButton
              label={copy.submitReport}
              fullWidth
              disabled={!canSubmit}
              onClick={() => {
                if (!canSubmit) return;
                const trimmed = description.trim();
                onSubmit({
                  reason,
                  description: trimmed !== '' ? trimmed : null,
                });
              }}
            />

            <div style={{ height: 'var(--spacing-lg)' }} />
          </div>
        </div>
      </div>
    </PhoneOverlay>
  );
}
