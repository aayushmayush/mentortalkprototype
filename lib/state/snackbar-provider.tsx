'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

/**
 * Snackbars.
 *
 * The Flutter app has no snackbar widget of its own — every call site is a raw
 * `ScaffoldMessenger.of(context)..clearSnackBars()..showSnackBar(SnackBar(...))`
 * styled entirely by `AppTheme._snackBarLight()/_snackBarDark()`. So there is
 * nothing to port from `design_system`; what is reproduced is the *behaviour*
 * those call sites ask for:
 *
 * - `showSnackBar` in this app is almost always preceded by `clearSnackBars()`,
 *   so a second message REPLACES the first rather than queueing behind it. That
 *   is why this is one slot, not a list.
 * - Material's default duration is 4 seconds.
 * - The message is the only content at almost every call site; the theme's
 *   `actionTextColor` exists but nothing uses an action yet, so `show()` takes
 *   an optional action for the sites that will.
 *
 * The host lives in the phone frame, not in a page, for the same reason the
 * overlay layer does: a snackbar is a property of the device, and a page that
 * unmounts mid-message would take the message with it.
 */

export type SnackbarAction = { label: string; onClick: () => void };

type SnackbarState = { message: string; action?: SnackbarAction } | null;

const SnackbarContext = createContext<{
  current: SnackbarState;
  show: (message: string, action?: SnackbarAction) => void;
  dismiss: () => void;
} | null>(null);

/** Material's `SnackBar` default. */
const DURATION_MS = 4000;

export function SnackbarProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<SnackbarState>(null);

  /** Bumped on every show so the auto-dismiss timer restarts for a message
      that replaces another mid-flight. */
  const [nonce, setNonce] = useState(0);
  const timeoutRef = useRef<number | null>(null);

  const dismiss = useCallback(() => {
    setCurrent(null);
  }, []);

  const show = useCallback((message: string, action?: SnackbarAction) => {
    setCurrent({ message, action });
    setNonce((n) => n + 1);
  }, []);

  useEffect(() => {
    if (current === null) return;

    // Cleared on every re-run: without this a replaced message would inherit
    // the previous one's remaining time, and StrictMode's double-invoke would
    // leave two timers racing to dismiss the same message.
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    timeoutRef.current = window.setTimeout(() => setCurrent(null), DURATION_MS);

    return () => {
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    };
  }, [current, nonce]);

  return (
    <SnackbarContext.Provider value={{ current, show, dismiss }}>
      {children}
    </SnackbarContext.Provider>
  );
}

export function useSnackbar() {
  const ctx = useContext(SnackbarContext);
  if (!ctx) {
    throw new Error('useSnackbar must be used inside <SnackbarProvider>');
  }
  return ctx;
}
