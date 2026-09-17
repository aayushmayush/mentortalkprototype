'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

/**
 * ThemeProvider — mirrors the Flutter `ThemeCubit`.
 *
 * Three preferences: system, light, dark. The DEFAULT IS LIGHT, not system —
 * that is what the app ships with, and it matters because the prototype opens
 * on the light UI regardless of the reviewer's OS.
 *
 * `system` is resolved through `prefers-color-scheme` and kept live with a
 * matchMedia listener, so changing the OS theme flips the phone without a
 * reload. The preference is persisted to localStorage.
 *
 * The resolved value is written as `data-theme` on the PHONE ROOT element, not
 * on <html> — see the note in colors.css. The prototype chrome around the phone
 * deliberately follows the browser's own preference so a reviewer can compare
 * the app in dark against a light chrome.
 */
export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

const STORAGE_KEY = 'mentee-prototype:theme';

type ThemeContextValue = {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function systemTheme(): ResolvedTheme {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>('light');
  const [system, setSystem] = useState<ResolvedTheme>('light');

  // Restore the saved preference after mount. Reading localStorage during
  // render would desync server and client markup, so it happens here.
  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      setPreferenceState(stored);
    }
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => setSystem(mq.matches ? 'dark' : 'light');
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private mode / storage disabled. The preference still applies for this
      // session; it just will not survive a reload.
    }
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      preference,
      resolved: preference === 'system' ? system : preference,
      setPreference,
    }),
    [preference, system, setPreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used inside a ThemeProvider');
  return ctx;
}
