'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useOnboarding } from '@/lib/state/onboarding-provider';
import { composeEducationDetail, FALLBACK_PROFILE } from '@/lib/fake/profile';

/**
 * ProfileProvider — port of `ui/home/bloc/home_bloc.dart`.
 *
 * `HomeBloc` is small but it is load-bearing: its `loaded(profile)` state is
 * where `MenteeProfile` lives, and four separate screens read it — the account
 * tab's `ProfileCard`, the app bar's `WalletBadge`, `HomeFeedPage`'s
 * free-chat gate, and edit-profile. It is also the page the whole home shell
 * shows a spinner or an error for, which is why this provider models all three
 * states rather than just holding a value.
 *
 * ── Two deliberate divergences from production ──────────────────────────────
 *
 * 1. **The wallet balance is not on this profile.** In Flutter it is
 *    `profile.walletBalance`, refetched on `HomeEvent.refreshRequested` after a
 *    wallet pop or a session ends. Here the balance lives in `WalletProvider`
 *    alone and the badge reads it directly, so it decrements live during a
 *    metered session instead of jumping when a refresh lands. One source of
 *    truth beats two that agree eventually.
 *
 * 2. **The name and education are derived, not fetched.** There is no server to
 *    fetch them from, so they are composed from what the onboarding wizard
 *    collected, falling back to a demo profile when you deep-link into
 *    `/home?tab=account` without having walked the wizard. See
 *    `lib/fake/profile.ts`.
 *
 * `status` is real, though: the first load genuinely resolves after a beat so
 * the account tab's `AppLoadingSpinner` is reachable, and `simulate()` is the
 * prototype affordance that forces `loading` or `error` on demand (driven by
 * `/home?sim=`). Without it those two branches would be dead code in the
 * prototype and unverifiable.
 */

export type ProfileStatus = 'loading' | 'loaded' | 'error';

export type Profile = {
  username: string;
  displayName: string;
  phoneNumber: string | null;
  educationDetail: string | null;
  profilePhotoUrl: string | null;
  freeChatAvailable: boolean;
};

type ProfileContextValue = {
  status: ProfileStatus;
  /** Null while `status === 'error'` — the page renders the error view instead. */
  profile: Profile | null;
  /** The message `AppErrorView` shows. Only meaningful in the error state. */
  errorMessage: string | null;
  reload: () => void;
  update: (patch: Partial<Profile>) => void;
  simulate: (status: ProfileStatus) => void;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

/** Matches the simulation constants used elsewhere — long enough to be seen. */
const LOAD_MS = 700;

const GENERIC_ERROR = 'Something went wrong';

export function ProfileProvider({ children }: { children: ReactNode }) {
  const onboarding = useOnboarding();
  const [status, setStatus] = useState<ProfileStatus>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [override, setOverride] = useState<Partial<Profile>>({});

  /**
   * The wizard's answers win over the fallback, field by field, so a walk
   * through onboarding produces an account tab with *your* name on it.
   */
  const profile = useMemo<Profile>(() => {
    const firstEducation = onboarding.education[0];
    const name = onboarding.basicInfo.fullName.trim();
    const username = onboarding.basicInfo.username.trim();

    return {
      username: override.username ?? (username || FALLBACK_PROFILE.username),
      displayName: override.displayName ?? (name || FALLBACK_PROFILE.displayName),
      phoneNumber: override.phoneNumber ?? FALLBACK_PROFILE.phoneNumber,
      educationDetail:
        override.educationDetail ??
        (firstEducation
          ? composeEducationDetail(firstEducation.institution, firstEducation.degree)
          : FALLBACK_PROFILE.educationDetail),
      profilePhotoUrl: override.profilePhotoUrl ?? FALLBACK_PROFILE.profilePhotoUrl,
      freeChatAvailable: override.freeChatAvailable ?? FALLBACK_PROFILE.freeChatAvailable,
    };
  }, [onboarding.basicInfo, onboarding.education, override]);

  /**
   * Set the moment `simulate()` is called. The boot effect below checks it, and
   * the ordering is the reason it has to exist: React runs effects child-first,
   * so on a direct load of `/home?sim=error` the page's `simulate('error')`
   * fires BEFORE this provider's own effect. Without the latch the boot effect
   * would then overwrite the error with `loading` → `loaded` 700ms later, and
   * the error view would flash and vanish.
   */
  const simulatedRef = useRef(false);

  // `HomeEvent.started()` — the bloc's initial fetch. Cleared on the way in as
  // well as out, because StrictMode runs this effect twice and a bare timeout
  // would leave the first one pending.
  useEffect(() => {
    if (simulatedRef.current) return;
    setStatus('loading');
    setErrorMessage(null);
    const t = setTimeout(() => setStatus('loaded'), LOAD_MS);
    return () => clearTimeout(t);
  }, []);

  const reload = useCallback(() => {
    setStatus('loading');
    setErrorMessage(null);
    setTimeout(() => setStatus('loaded'), LOAD_MS);
  }, []);

  const simulate = useCallback((next: ProfileStatus) => {
    simulatedRef.current = true;
    setErrorMessage(next === 'error' ? GENERIC_ERROR : null);
    setStatus(next);
  }, []);

  const update = useCallback((patch: Partial<Profile>) => {
    setOverride((prev) => ({ ...prev, ...patch }));
  }, []);

  const value = useMemo<ProfileContextValue>(
    () => ({
      status,
      profile: status === 'error' ? null : profile,
      errorMessage,
      reload,
      update,
      simulate,
    }),
    [status, profile, errorMessage, reload, update, simulate],
  );

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  );
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used inside a ProfileProvider');
  return ctx;
}
