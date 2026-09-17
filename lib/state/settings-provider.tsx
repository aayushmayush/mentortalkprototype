'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  DEFAULT_PRIVACY_SETTINGS,
  PRIVACY_KEY_TO_FIELD,
  PRIVACY_LOAD_MS,
  PRIVACY_WRITE_MS,
  type PrivacyFlagKey,
  type PrivacySettings,
} from '@/lib/fake/privacy';

/**
 * `PrivacySettingsCubit` + `LocaleCubit`, as one provider.
 *
 * ── Why this is a provider and not page state ───────────────────────────────
 *
 * `PrivacySettingsPage` builds its own `PrivacySettingsCubit` in a
 * `BlocProvider`, so in Flutter the state dies with the route. Lifting it here
 * changes one observable thing: leave the screen and come back, and the toggles
 * hold what you set instead of refetching. That is what the real server does, so
 * the provider is the closer match, not the looser one — the page-scoped cubit
 * is the source's shortcut, not its intent.
 *
 * ── The load has three states, and all three are reachable ──────────────────
 *
 * `PrivacySettingsCubit.load()` emits loading → loaded | error, and the page
 * renders `AppLoadingSpinner.md()` / `AppErrorView(onRetry:)` for the first and
 * last. Driven by `simulate()`, which `/settings/privacy?sim=` calls — the same
 * affordance `ProfileProvider` gives the account tab. Without it the error
 * branch would be dead code in the prototype and could not be reviewed at all.
 *
 * ── A flag write is optimistic, and rolls back ──────────────────────────────
 *
 * This is the one place the prototype is deliberately *better* than the source,
 * and it is worth being explicit about. `AppSwitch` is uncontrolled
 * (`initialValue:`), so when `setFlag` returns `false` the source shows the
 * error snackbar and leaves the switch **flipped anyway** — the UI now disagrees
 * with the server, and nothing resyncs it until the page is rebuilt from a fresh
 * load. Reproducing that would mean shipping a known desync. The prototype
 * instead flips back and shows the same snackbar, which is what a `false` return
 * obviously intends.
 *
 * ── The Language dropdown changes nothing, and says so ──────────────────────
 *
 * `LocaleCubit.changeLocale` swaps the app's whole string table through
 * `AppLocalizations`. The prototype ships one language's copy — `lib/copy.ts`
 * is English literals, not a resource table — so `setLanguage` records the
 * choice and the screen keeps rendering English. That is a real gap, and a
 * visible one: pick हिन्दी and the dropdown says हिन्दी while every other word
 * on the screen stays English. Flagged rather than hidden, and the alternative
 * (dropping the dropdown) would be a worse lie about what the app contains.
 */

export type SettingsLoadStatus = 'loading' | 'loaded' | 'error';

type SettingsContextValue = {
  status: SettingsLoadStatus;
  errorMessage: string | null;
  privacy: PrivacySettings;
  reload: () => void;
  /** Resolves `true` when the write stuck, `false` when it rolled back. */
  setFlag: (key: PrivacyFlagKey, value: boolean) => Promise<boolean>;
  /** The Language dropdown's value. Nothing reads it for translation. */
  language: string;
  setLanguage: (code: string) => void;
  /** Prototype affordance — forces the load outcome. See the header. */
  simulate: (status: SettingsLoadStatus, failWrites?: boolean) => void;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

const GENERIC_ERROR = 'Something went wrong';

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SettingsLoadStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [privacy, setPrivacy] = useState<PrivacySettings>(DEFAULT_PRIVACY_SETTINGS);
  const [language, setLanguage] = useState('en');

  /**
   * A ref, not state: `setFlag`'s timer must read the CURRENT value at fire
   * time, and a state variable captured in the closure would read whatever it
   * was when the callback was created. `WalletProvider` keeps its balance in one
   * for the same reason.
   */
  const failWrites = useRef(false);

  const reload = useCallback(() => {
    setStatus('loading');
    setErrorMessage(null);
    window.setTimeout(() => {
      if (failWrites.current) {
        setStatus('error');
        setErrorMessage(GENERIC_ERROR);
        return;
      }
      setPrivacy(DEFAULT_PRIVACY_SETTINGS);
      setStatus('loaded');
    }, PRIVACY_LOAD_MS);
  }, []);

  const setFlag = useCallback(
    (key: PrivacyFlagKey, value: boolean): Promise<boolean> => {
      const field = PRIVACY_KEY_TO_FIELD[key];

      // Optimistic: flip now, roll back if the write comes back rejected.
      setPrivacy((current) => ({ ...current, [field]: value }));

      return new Promise((resolve) => {
        window.setTimeout(() => {
          if (failWrites.current) {
            setPrivacy((current) => ({ ...current, [field]: !value }));
            resolve(false);
            return;
          }
          resolve(true);
        }, PRIVACY_WRITE_MS);
      });
    },
    [],
  );

  const simulate = useCallback(
    (next: SettingsLoadStatus, fail = false) => {
      failWrites.current = fail;
      if (next === 'error') {
        setStatus('error');
        setErrorMessage(GENERIC_ERROR);
        return;
      }
      setStatus('loaded');
      setPrivacy(DEFAULT_PRIVACY_SETTINGS);
    },
    [],
  );

  const value = useMemo<SettingsContextValue>(
    () => ({
      status,
      errorMessage,
      privacy,
      reload,
      setFlag,
      language,
      setLanguage,
      simulate,
    }),
    [status, errorMessage, privacy, reload, setFlag, language, simulate],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const value = useContext(SettingsContext);
  if (value === null) {
    throw new Error('useSettings must be used inside a SettingsProvider');
  }
  return value;
}
