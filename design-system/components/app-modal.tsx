'use client';

import { useEffect } from 'react';
import { cn } from '../cn';

/**
 * AppModal — port of design_system/lib/core/components/app_modal.dart
 *
 * The Flutter version is imperative (`AppModal.showConfirm(context, ...)`)
 * because Flutter dialogs are pushed onto a Navigator. React has no such
 * navigator, so this is a controlled component: the caller owns `open`.
 *
 * CONTAINMENT IS THE POINT. A modal must stay inside the phone bezel, so the
 * scrim is `position: absolute` against the phone screen element (which is
 * `position: relative; overflow: hidden`) — never `position: fixed`, which
 * would escape the device and cover the whole browser window.
 *
 * Actions are laid out as equal-width columns divided by hairlines. Exactly
 * matching the source: an action CLOSES first, then runs its own handler.
 */
export type AppModalAction = {
  label: string;
  onPress?: () => void;
  /** Renders the label in the error colour at w600. */
  destructive?: boolean;
};

export type AppModalProps = {
  open: boolean;
  title: string;
  message: string;
  actions: AppModalAction[];
  onClose: () => void;
  /** Clicking the scrim dismisses. Defaults to true. */
  dismissible?: boolean;
  className?: string;
};

export function AppModal({
  open,
  title,
  message,
  actions,
  onClose,
  dismissible = true,
  className,
}: AppModalProps) {
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
    <div
      className={cn('scrim-enter', className)}
      onClick={dismissible ? onClose : undefined}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 60,
        // The overlay layer is pointer-events:none so an empty layer never
        // blocks the app; each overlay re-enables hits on its own root.
        pointerEvents: 'auto',
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '0 48px',
      }}
    >
      <div
        className="modal-enter"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 342,
          background: 'var(--surface-primary)',
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        <div style={{ padding: '24px 24px 16px 24px', textAlign: 'center' }}>
          <div
            className="type-title-md type-emphasis-semibold"
            style={{ color: 'var(--text-heading)' }}
          >
            {title}
          </div>
          <div
            className="type-body-md"
            style={{ marginTop: 12, color: 'var(--text-body-light)' }}
          >
            {message}
          </div>
        </div>

        <div style={{ height: 1, background: 'var(--border-primary-light)' }} />

        <div style={{ display: 'flex' }}>
          {actions.map((action, i) => (
            <div key={action.label} style={{ display: 'contents' }}>
              {i > 0 ? (
                <div style={{ width: 1, background: 'var(--border-primary-light)' }} />
              ) : null}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  action.onPress?.();
                }}
                className={cn(
                  'type-title-sm',
                  action.destructive && 'type-emphasis-semibold',
                )}
                style={{
                  flex: 1,
                  padding: '16px 0',
                  color: action.destructive ? 'var(--text-error)' : 'var(--text-body)',
                }}
              >
                {action.label}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
