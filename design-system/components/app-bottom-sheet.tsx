'use client';

import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { cn } from '../cn';
import { AppButton } from './app-button';

/**
 * AppBottomSheet — the shell around every `showModalBottomSheet` in the app.
 *
 * The Flutter app has no shared sheet widget: each call site builds a Column
 * under a showModalBottomSheet with `AppBottomSheetHeader` at the top. This
 * component supplies the parts that the showModalBottomSheet machinery used to
 * supply — the scrim, the rise animation and the page background.
 *
 * Sheet theme, from app_theme.dart `_bottomSheet`: 16px TOP radius only,
 * elevation 45 — reproduced as --shadow-bottom-sheet. A sheet is flush with the
 * bottom edge of the phone and can never exceed 90% of its height, so a long
 * list scrolls inside the sheet rather than pushing it off-screen.
 *
 * Like the modal, it is absolute against the phone screen, not fixed against
 * the viewport.
 */
export type AppBottomSheetProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Height as a fraction of the phone, 0–1. Omit to size to content. */
  heightFraction?: number;
  /** Set false for sheets that demand a decision (e.g. insufficient balance). */
  dismissible?: boolean;
  className?: string;
};

export function AppBottomSheet({
  open,
  onClose,
  children,
  heightFraction,
  dismissible = true,
  className,
}: AppBottomSheetProps) {
  useEffect(() => {
    if (!open || !dismissible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, dismissible, onClose]);

  if (!open) return null;

  return (
    <SheetCloseContext.Provider value={onClose}>
    <div
      className="scrim-enter"
      onClick={dismissible ? onClose : undefined}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 55,
        // See the note in app-modal.tsx: the overlay layer is pointer-events
        // none, so overlays restore hit-testing on their own root.
        pointerEvents: 'auto',
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}
    >
      <div
        className={cn('sheet-enter', className)}
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          ...(heightFraction
            ? { height: `${heightFraction * 100}%` }
            : { maxHeight: '90%' }),
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          overflow: 'hidden',
          background: 'var(--surface-primary)',
          borderRadius: '16px 16px 0 0',
          boxShadow: 'var(--shadow-bottom-sheet)',
        }}
      >
        {children}
      </div>
    </div>
    </SheetCloseContext.Provider>
  );
}

/**
 * AppBottomSheetHeader — port of the design-system component of the same name.
 *
 * A 64 / flex / 64 three-column row: a compact plain "Close" button on the left,
 * the title centred and bold, and an optional action on the right. The two 64px
 * gutters are what keep the title optically centred regardless of the action's
 * width — so the action is clipped to that width by design.
 */
export type AppBottomSheetHeaderProps = {
  title: string;
  closeLabel?: string;
  /**
   * Omit to close the enclosing sheet.
   *
   * The Dart takes `VoidCallback? onClose` and defaults it to
   * `Navigator.pop(context)` — the header finds its route and pops it. The
   * context below is the same trick: `AppBottomSheet` publishes its own
   * `onClose`, so a header that passes nothing still dismisses its sheet
   * rather than rendering a dead button. `SessionDetailSheet` relies on this;
   * it constructs the header with a title and nothing else.
   */
  onClose?: () => void;
  action?: ReactNode;
};

/** How a header with no `onClose` finds the sheet it belongs to. */
const SheetCloseContext = createContext<(() => void) | null>(null);

export function AppBottomSheetHeader({
  title,
  closeLabel = 'Close',
  onClose,
  action,
}: AppBottomSheetHeaderProps) {
  const sheetClose = useContext(SheetCloseContext);
  const handleClose = onClose ?? sheetClose ?? undefined;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '20px 16px',
        flexShrink: 0,
      }}
    >
      <div style={{ width: 64 }}>
        <AppButton
          label={closeLabel}
          intent="secondary"
          type="plain"
          size="compact"
          onClick={handleClose}
        />
      </div>

      <div style={{ flex: 1, minWidth: 0, display: 'flex', justifyContent: 'center' }}>
        <span
          className="type-title-md type-emphasis-bold"
          style={{
            color: 'var(--text-body)',
            textAlign: 'center',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </span>
      </div>

      <div
        style={{
          width: 64,
          display: 'flex',
          justifyContent: 'flex-end',
        }}
      >
        {action}
      </div>
    </div>
  );
}
