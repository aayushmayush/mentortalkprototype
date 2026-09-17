'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react';

/**
 * AuthProvider — port of `core/lib/auth/ui/bloc/auth_bloc.dart`.
 *
 * The bloc's state union is transcribed one-for-one, because the router's
 * redirect logic branches on it by name (`is AuthLoading`, `is AuthBanned`, …)
 * and collapsing states here would quietly change which screen the splash
 * redirects to.
 *
 *   initial → loading → awaitingPhone → awaitingOtp → success | banned
 *                                    ↘ failure (any step)
 *
 * Two behaviours that look like details but are not:
 *
 * 1. `AuthLoading` holds the splash. The router returns `null` (no redirect)
 *    while loading, so the splash cannot be skipped — that is what keeps the
 *    1.7s branded intro from being cut short on a fast start.
 * 2. `backPressed` from OTP returns to `awaitingPhone`, NOT to a fresh phone
 *    screen — the typed number survives. Transcribed as-is.
 */

export type AuthUser = {
  id: string;
  phone: string;
  firstName: string;
  lastName: string | null;
  username: string;
  avatarUrl: string | null;
};

export type AuthState =
  | { status: 'initial' }
  | { status: 'loading' }
  | { status: 'awaitingPhone' }
  | { status: 'awaitingOtp'; phoneNumber: string }
  | { status: 'success'; user: AuthUser }
  | { status: 'banned'; reason?: string }
  | { status: 'failure'; message: string };

type Action =
  | { type: 'initialized' }
  | { type: 'noStoredSession' }
  | { type: 'getStarted' }
  | { type: 'phoneSubmitted'; phoneNumber: string }
  | { type: 'otpSubmitted'; otpCode: string }
  | { type: 'resendOtp' }
  | { type: 'back' }
  | { type: 'banned'; reason?: string }
  | { type: 'failed'; message: string }
  | { type: 'logoutRequested' }
  | { type: 'logoutCompleted' }
  | { type: 'hydrate'; user: AuthUser };

/** The one phone number that lands on the banned screen, for demoing that path. */
export const BANNED_PHONE = '9999999999';
/** Any 6-digit code works except this one, which is rejected to show the error path. */
export const REJECTED_OTP = '000000';

export const DEMO_USER: AuthUser = {
  id: 'u1',
  phone: '9876543210',
  firstName: 'Aayush',
  lastName: 'Sharma',
  username: 'aayush',
  avatarUrl: null,
};

/**
 * The production fake-OTP convention: the app treats `123456` as the always-valid
 * code in test builds. Kept here so the prototype's default path matches what a
 * reviewer would expect to type.
 */
export const VALID_OTP = '123456';

/**
 * How long the simulated secure-storage read takes before the boot sequence
 * concludes there is no stored session. See the boot effect below.
 */
const SESSION_RESTORE_MS = 800;

/** Stands in for `_authRepository.logout()` — the cleanup between the two emits. */
const LOGOUT_CLEANUP_MS = 600;

function reducer(state: AuthState, action: Action): AuthState {
  switch (action.type) {
    case 'initialized':
      return { status: 'loading' };

    // The tail of `AuthCheckRequested`: it reads stored auth, finds none, and
    // emits `AuthState.initial()`. Landing back on `initial` is the whole point
    // — the router redirects from it, so it is a terminal state, not a
    // not-started-yet one.
    case 'noStoredSession':
      return { status: 'initial' };

    case 'getStarted':
      return { status: 'awaitingPhone' };

    case 'phoneSubmitted':
      if (action.phoneNumber === BANNED_PHONE) {
        return {
          status: 'banned',
          reason: 'Your account has been suspended for violating our terms.',
        };
      }
      return { status: 'awaitingOtp', phoneNumber: action.phoneNumber };

    case 'otpSubmitted':
      if (action.otpCode === REJECTED_OTP) {
        return {
          status: 'failure',
          message: 'That code is incorrect. Please check and try again.',
        };
      }
      // Returning to awaitingOtp on failure is the bloc's behaviour: the user
      // stays on the OTP screen with the error inline, rather than being
      // bounced back a step.
      return { status: 'success', user: DEMO_USER };

    case 'resendOtp':
      return state;

    case 'back':
      if (state.status === 'awaitingOtp') return { status: 'awaitingPhone' };
      if (state.status === 'awaitingPhone') return { status: 'initial' };
      if (state.status === 'banned' || state.status === 'failure') {
        return { status: 'awaitingPhone' };
      }
      return state;

    case 'banned':
      return { status: 'banned', reason: action.reason };

    case 'failed':
      return { status: 'failure', message: action.message };

    // `_onLogoutRequested` emits TWICE: `loading` while `_authRepository.logout()`
    // cleans up, then `initial`. The first emit is not cosmetic — the account
    // page renders a full-screen indicator for `AuthLoading` precisely so the
    // user sees the app working instead of a frozen page. Landing on `initial`
    // is what the router then redirects to get-started from, so logout must NOT
    // short-circuit to `awaitingPhone`: that would skip both the indicator and
    // the sign-in screen, and drop the user onto the phone-entry step instead.
    case 'logoutRequested':
      return { status: 'loading' };

    case 'logoutCompleted':
      return { status: 'initial' };

    case 'hydrate':
      return { status: 'success', user: action.user };

    default:
      return state;
  }
}

type AuthContextValue = {
  state: AuthState;
  initialize: () => void;
  getStarted: () => void;
  submitPhone: (phoneNumber: string) => void;
  submitOtp: (otpCode: string) => boolean;
  resendOtp: () => void;
  back: () => void;
  logout: () => void;
  /** True only in `success` — what the splash redirect branches on. */
  isAuthenticated: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { status: 'initial' });

  /**
   * `AuthCheckRequested`, the boot sequence.
   *
   * Two dispatches, because the bloc emits twice: `loading` while it reads
   * storage, then `initial` when it finds no stored session. Only the first
   * half was here originally, which left the state pinned on `loading` — and
   * the router holds the splash on `AuthLoading`, so the app never got past the
   * intro. Transcribing the terminal emit is what makes the redirect fire.
   *
   * The delay stands in for the secure-storage read. It is short on purpose:
   * the splash's real hold is the intro video, not this.
   */
  useEffect(() => {
    const start = setTimeout(() => dispatch({ type: 'initialized' }), 0);
    const restore = setTimeout(
      () => dispatch({ type: 'noStoredSession' }),
      SESSION_RESTORE_MS,
    );
    return () => {
      clearTimeout(start);
      clearTimeout(restore);
    };
  }, []);

  const submitOtp = useCallback((otpCode: string) => {
    // The caller needs the verdict synchronously to decide whether to clear
    // its input, so the guard is evaluated here as well as in the reducer.
    dispatch({ type: 'otpSubmitted', otpCode });
    return otpCode !== REJECTED_OTP;
  }, []);

  /**
   * Both emits of `_onLogoutRequested`, in order. The timeout is not cleared on
   * unmount because the provider outlives every screen — it lives in the root
   * layout — and a logout that is interrupted by navigation must still finish,
   * or the app would sit in `loading` with no way out.
   */
  const logout = useCallback(() => {
    dispatch({ type: 'logoutRequested' });
    setTimeout(() => dispatch({ type: 'logoutCompleted' }), LOGOUT_CLEANUP_MS);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      state,
      initialize: () => dispatch({ type: 'initialized' }),
      getStarted: () => dispatch({ type: 'getStarted' }),
      submitPhone: (phoneNumber) =>
        dispatch({ type: 'phoneSubmitted', phoneNumber }),
      submitOtp,
      resendOtp: () => dispatch({ type: 'resendOtp' }),
      back: () => dispatch({ type: 'back' }),
      logout,
      isAuthenticated: state.status === 'success',
    }),
    [state, submitOtp, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside an AuthProvider');
  return ctx;
}
