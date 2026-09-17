'use client';

import { useSnackbar } from '@/lib/state/snackbar-provider';

/**
 * SnackbarHost — draws the current message at the bottom of the phone.
 *
 * ── Why it sits BELOW the overlay layer ─────────────────────────────────────
 *
 * A `showModalBottomSheet` in Flutter pushes a route above the Scaffold, and
 * the ScaffoldMessenger renders snackbars in the Scaffold — so a sheet covers
 * the message. That is the behaviour here too: this host is a sibling of the
 * overlay layer at a lower z-index, so a sheet or modal drawn over it hides it,
 * exactly as in the app. Several call sites pop their sheet *first* and then
 * show the snackbar, which is why that ordering matters and why it is not a bug
 * when the message appears the moment a sheet closes.
 *
 * ── Placement ───────────────────────────────────────────────────────────────
 *
 * Material's floating snackbar default margin is `fromLTRB(15, 5, 15, 10)`, and
 * `surface.page` shows through around it. The prototype has no system inset, so
 * the 10 is the whole bottom offset.
 */

export function SnackbarHost() {
  const { current, dismiss } = useSnackbar();

  if (current === null) return null;

  return (
    <div
      style={{
        position: 'absolute',
        left: 15,
        right: 15,
        bottom: 10,
        // Below the overlay layer's 50, so sheets and modals cover it.
        zIndex: 40,
        pointerEvents: 'auto',
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <div
        className="modal-enter"
        style={{
          width: '100%',
          minHeight: 48,
          display: 'flex',
          alignItems: 'center',
          padding: '14px 16px',
          borderRadius: 12,
          background: 'var(--snackbar-bg)',
          // Material's SnackBar carries elevation 6.
          boxShadow: '0 3px 5px rgba(0,0,0,0.2), 0 6px 10px rgba(0,0,0,0.14)',
        }}
      >
        <span
          className="type-body-md"
          style={{ flex: 1, color: 'var(--snackbar-text)', fontWeight: 500 }}
        >
          {current.message}
        </span>

        {current.action ? (
          <button
            type="button"
            onClick={() => {
              current.action?.onClick();
              dismiss();
            }}
            className="type-body-md type-emphasis-semibold"
            style={{
              marginLeft: 8,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--snackbar-action)',
            }}
          >
            {current.action.label}
          </button>
        ) : null}
      </div>
    </div>
  );
}
