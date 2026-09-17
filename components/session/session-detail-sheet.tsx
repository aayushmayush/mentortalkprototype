'use client';

import { AppBottomSheet, AppBottomSheetHeader } from '@/design-system';
import type { SessionDetail } from '@/lib/session/session-detail';
import { SessionDetailsBlock } from './session-details-block';

/**
 * SessionDetailSheet — port of
 * `core/lib/session/ui/widgets/session_detail_sheet.dart`.
 *
 * A thin shell: a 16-radius top-only sheet on the PAGE ground (not the sheet
 * ground every other sheet uses — `surface.page`, not `surface.primary`), a
 * header, and the block in a scroll view.
 *
 * ── No drag handle, and no `onClose` on the header ──────────────────────────
 *
 * The sheet is `showModalBottomSheet` with no handle, so there is nothing to
 * grab. And the header is constructed as `AppBottomSheetHeader(title: 'Session
 * details')` — with no callback at all, because the Dart's `onClose` defaults to
 * `Navigator.pop(context)`. That is why `AppBottomSheetHeader` here falls back
 * to its enclosing sheet's `onClose`: without it this header would render a
 * Close button that does nothing.
 *
 * ── 90% max height, and why it matters ──────────────────────────────────────
 *
 * `maxHeight: screenHeight * 0.9`. A receipt with a long review comment and a
 * five-line address can exceed the phone, and the constraint is what turns that
 * into an internal scroll instead of a sheet whose top has left the screen.
 *
 * `isMentor` is a parameter rather than a lookup because the same sheet is
 * shared by both apps — it decides which participant the block shows and which
 * money field it reads.
 */
export function SessionDetailSheet({
  open,
  detail,
  isMentor,
  onClose,
}: {
  open: boolean;
  detail: SessionDetail | null;
  isMentor: boolean;
  onClose: () => void;
}) {
  if (!open || detail === null) return null;

  return (
    <AppBottomSheet open={open} onClose={onClose}>
      {/*
        The sheet's own ground. `AppBottomSheet` paints `surface.primary` for the
        modal-sheet default, but this screen wants `surface.page` — the block's
        two cards are `surface.primary` and would otherwise be invisible against
        their own background. Overriding on the child is the only way with the
        current API, so the wrapper carries the colour and the height.
      */}
      <div
        style={{
          background: 'var(--surface-page)',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          maxHeight: '90%',
        }}
      >
        <AppBottomSheetHeader title="Session details" />

        <div
          className="no-scrollbar"
          style={{ overflowY: 'auto', minHeight: 0, paddingBottom: 24 }}
        >
          <SessionDetailsBlock detail={detail} isMentor={isMentor} />
        </div>
      </div>
    </AppBottomSheet>
  );
}
