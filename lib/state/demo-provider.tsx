'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

/**
 * DemoProvider — prototype-only affordance, deliberately kept OUT of the app.
 *
 * Walking the flow while typing a phone number, an OTP, a name and a username
 * every single time is friction with no reviewing value. So forms prefill with
 * valid values and you can click straight through.
 *
 * The important design choice: this is a toggle in the prototype **chrome**,
 * not a branch inside the screens. Nothing in `app/` renders differently
 * because of it — the screens read these values as their *initial* state, so
 * with autofill off every screen behaves exactly as production does, including
 * every validation path. A demo flag sprinkled through the app would have made
 * "is this what the real app does?" unanswerable.
 *
 * Default ON, because the point is to click through.
 */

const STORAGE_KEY = 'mentee-prototype:autofill';
const FAULT_KEY = 'mentee-prototype:session-fault';

/** Valid by the app's own rules — `^[6-9]\d{9}$` and a real 6-digit code. */
export const DEMO_PHONE = '9876543210';
export const DEMO_OTP = '123456';
export const DEMO_NAME = 'Aayush Sharma';
export const DEMO_USERNAME = 'aayush_sharma';
export const DEMO_REFERRAL = 'MT2026';

/** Preselected on the category step so its Next button is live. */
export const DEMO_CATEGORY_IDS = ['jee', 'neet'];
export const DEMO_OPTION_IDS = ['jee-physics', 'jee-maths', 'neet-biology'];

export const DEMO_EDUCATION = {
  institution: 'Delhi Public School',
  degree: 'Class 12',
  fieldOfStudy: 'Science (PCM)',
  startYear: '2024',
  endYear: '2026',
};

/**
 * Which failure the simulated server should answer the next session request
 * with. `none` is the happy path.
 *
 * These are the error branches `session_bloc.dart` maps — 402, 404, 409 and the
 * free-chat 503 — and they are unreachable in a prototype with no server, so
 * they need a switch somewhere. Putting it here rather than in the screens
 * keeps the screens honest: nothing in `app/` branches on this, the *server*
 * does, which is exactly where the real decision is made.
 */
export type SessionFault =
  | 'none'
  | 'insufficient'
  | 'rejected'
  | 'unavailable'
  | 'busy'
  | 'maintenance';

type DemoContextValue = {
  autofill: boolean;
  /**
   * False until the stored preference has been read.
   *
   * Screens must gate their prefill on this. React runs child effects before
   * parent effects, so without it a screen would prefill from the `true`
   * default a tick before a stored `false` arrived — and a reviewer who had
   * turned autofill off would still find the field filled.
   */
  ready: boolean;
  setAutofill: (value: boolean) => void;
  sessionFault: SessionFault;
  setSessionFault: (value: SessionFault) => void;
};

const DemoContext = createContext<DemoContextValue | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [autofill, setAutofillState] = useState(true);
  const [ready, setReady] = useState(false);
  const [sessionFault, setSessionFaultState] = useState<SessionFault>('none');

  // Read after mount, not during render — reading localStorage in the
  // initialiser would desync server and client markup.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored !== null) setAutofillState(stored === 'true');
      const storedFault = window.localStorage.getItem(FAULT_KEY);
      if (storedFault !== null) setSessionFaultState(storedFault as SessionFault);
    } catch {
      /* private mode / storage blocked — the defaults stand */
    }
    setReady(true);
  }, []);

  const value = useMemo<DemoContextValue>(
    () => ({
      autofill,
      ready,
      setAutofill: (next: boolean) => {
        setAutofillState(next);
        try {
          window.localStorage.setItem(STORAGE_KEY, String(next));
        } catch {
          /* non-fatal */
        }
      },
      sessionFault,
      setSessionFault: (next: SessionFault) => {
        setSessionFaultState(next);
        try {
          window.localStorage.setItem(FAULT_KEY, next);
        } catch {
          /* non-fatal */
        }
      },
    }),
    [autofill, ready, sessionFault],
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo(): DemoContextValue {
  const ctx = useContext(DemoContext);
  if (!ctx) throw new Error('useDemo must be used inside a DemoProvider');
  return ctx;
}
