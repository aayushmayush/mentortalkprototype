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
import { CATEGORIES, type Category } from '@/lib/fake/categories';
import {
  FALLBACK_CATEGORY_IDS,
  FALLBACK_EDUCATION,
  FALLBACK_OPTION_IDS,
  STOCK_PHOTOS,
  type EditEducationEntry,
} from '@/lib/fake/edit-profile';
import { useProfile } from '@/lib/state/profile-provider';
import { TAKEN_USERNAMES, useOnboarding } from '@/lib/state/onboarding-provider';

/**
 * EditProfileProvider — port of `ui/edit_profile/bloc/edit_profile_bloc.dart`.
 *
 * ── Why this is a provider and not page state ───────────────────────────────
 *
 * In Flutter the bloc is created by `EditProfilePage` and then handed to two
 * pushed routes with `BlocProvider.value` — the category picker and the add/
 * edit-education page both READ AND WRITE the same instance. That is what makes
 * "Done" on the picker update the chips on the screen underneath, and what makes
 * a saved education entry appear without a refetch.
 *
 * App Router pages cannot share a route-scoped object, so the bloc's lifetime
 * moves up to the layout. The observable difference is that leaving
 * `/edit-profile` and coming back does not refetch — which is also what the
 * server would do, so this is the closer match, not the looser one. Same
 * reasoning as `SettingsProvider`.
 *
 * ── Every write is optimistic, and every one rolls back ─────────────────────
 *
 * The bloc does exactly this for categories and education-delete (`emit(updated)`
 * then `emit(current)` on failure) and NOT for add/update, which set a spinner
 * and then reload the list. Both shapes are reproduced as written, because the
 * difference is visible: deleting a row is instant, adding one spins.
 *
 * ── What is real and what is substituted ────────────────────────────────────
 *
 * Real: the load, the name/username save including the `StateConflictException`
 * branch that keeps you on the screen with an inline error, the category
 * auto-save, all four education operations, the photo remove, and the spinner
 * states. Substituted: the OS image picker and the cropper (see
 * `STOCK_PHOTOS`), and the avatar upload itself.
 *
 * ── Failures are reachable ──────────────────────────────────────────────────
 *
 * Five error branches in the source are unreachable against a fixture — the
 * load failure, and "Failed to save categories" / "Failed to add education" /
 * "Failed to update education" / "Failed to delete education". A branch nobody
 * can reach is a branch nobody reviews, so `?fail=` selects one and `?sim=error`
 * forces the load failure. The same reasoning as `/settings/privacy?sim=`.
 */

const LOAD_MS = 700;
const SAVE_MS = 800;
const EDUCATION_WRITE_MS = 700;
const PHOTO_UPLOAD_MS = 1100;

const GENERIC_LOAD_ERROR = 'Something went wrong. Please try again.';

/** Which write the simulated server should reject. `none` is the happy path. */
export type EditProfileFault = 'none' | 'categories' | 'add' | 'update' | 'delete' | 'photo';

export type EditProfileStatus = 'idle' | 'loading' | 'loaded' | 'error';

export type EditEducationInput = {
  institution: string;
  degree: string;
  fieldOfStudy: string | null;
  startYear: number | null;
  endYear: number | null;
};

/**
 * `EditProfileState.saved()` reaches the page as a flood of snacks and a pop;
 * `StateConflictException` as an inline field error that keeps you put; anything
 * else as a snackbar that also keeps you put. Three outcomes, three shapes — so
 * the page has to be able to tell them apart, and a bare boolean cannot.
 */
export type SaveOutcome =
  | { kind: 'saved' }
  | { kind: 'conflict'; message: string }
  | { kind: 'error'; message: string };

type EditProfileContextValue = {
  status: EditProfileStatus;
  errorMessage: string | null;
  /** Null unless `status === 'loaded'`. */
  profile: LoadedProfile | null;
  /**
   * From the bloc's `_onStarted`, which fetches the catalogue alongside the
   * profile. The prototype serves the same static table the onboarding wizard
   * used, so the two screens cannot disagree about what a category is.
   */
  availableCategories: Category[];
  /**
   * `EditProfileEvent.started()`. Called by `/edit-profile` on mount. NOT on app
   * start: the real bloc is built when its page is, and loading the catalogue on
   * every cold start would be a change in behaviour, not a shortcut.
   */
  start: () => void;
  reload: () => void;
  /** `?sim=error` — the profile fetch itself failed. */
  failLoad: () => void;
  /** `?sim=catalogue` — the profile loaded, the category fetch did not. */
  failCatalogue: () => void;
  /** Prototype affordance — which write should be rejected. */
  setFault: (fault: EditProfileFault) => void;
  /** The current fault, for the page's "this write will fail" note. */
  fault: EditProfileFault;

  saveNameAndUsername: (displayName: string, username: string) => Promise<SaveOutcome>;
  /** `categoriesSaved` — the picker's Done. Resolves false when it rolled back. */
  saveCategories: (categoryIds: string[], optionIds: string[]) => Promise<boolean>;
  addEducation: (entry: EditEducationInput) => Promise<boolean>;
  updateEducation: (id: string, entry: EditEducationInput) => Promise<boolean>;
  deleteEducation: (id: string) => Promise<boolean>;
  /** The substituted picker + upload. See `STOCK_PHOTOS`. */
  uploadPhoto: () => Promise<boolean>;
  removePhoto: () => Promise<boolean>;
  /** `_clearUsernameErrorOnEdit` — the field's own listener. */
  clearUsernameError: () => void;
};

export type LoadedProfile = {
  phoneNumber: string;
  displayName: string;
  username: string;
  profilePhotoUrl: string | null;
  selectedCategoryIds: string[];
  selectedOptionIds: string[];
  education: EditEducationEntry[];
  isSaving: boolean;
  isSavingEducation: boolean;
  isUpdatingEducation: boolean;
  isUploadingPhoto: boolean;
  usernameError: string | null;
};

const EditProfileContext = createContext<EditProfileContextValue | null>(null);

export function EditProfileProvider({ children }: { children: ReactNode }) {
  const { profile: homeProfile } = useProfile();
  const onboarding = useOnboarding();

  const [status, setStatus] = useState<EditProfileStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loaded, setLoaded] = useState<LoadedProfile | null>(null);
  const [fault, setFaultState] = useState<EditProfileFault>('none');

  /**
   * Refs, not state, for the two things the async load reads at FIRE time.
   *
   * `start()` is called from the page's mount effect, but `ProfileProvider`
   * boots on its own 700ms timer from the app's first render — so on a cold
   * deep-link to `/edit-profile` the two are racing, and a `homeProfile`
   * captured in `start`'s closure would be the null it was at call time. Reading
   * through a ref means the load always seeds from whatever has arrived.
   * `WalletProvider` and `SettingsProvider` keep their mutable values in refs
   * for the same class of reason.
   */
  const profileRef = useRef(homeProfile);
  profileRef.current = homeProfile;
  const onboardingRef = useRef(onboarding);
  onboardingRef.current = onboarding;

  /**
   * `?empty=1` — the two empty states, on purpose.
   *
   * Set by the page before `start()`. With it, the category block renders "Tap
   * to select exams" and education renders the Add card; without it both render
   * populated. Tapping alone can reach both (untick every category; delete every
   * entry), but not from a cold load, and a cold load is how the screen index
   * opens it.
   */
  const emptyRef = useRef(false);
  const setEmpty = useCallback((empty: boolean) => {
    emptyRef.current = empty;
  }, []);

  /** Prototype affordance — see `?fail=`. A ref for the same fire-time reason. */
  const faultRef = useRef<EditProfileFault>('none');
  const setFault = useCallback((next: EditProfileFault) => {
    faultRef.current = next;
    setFaultState(next);
  }, []);

  const seed = useCallback((): LoadedProfile => {
    const home = profileRef.current;
    const wizard = onboardingRef.current;
    const empty = emptyRef.current;

    // The wizard's education wins over the fallback, entry for entry — walk the
    // education step and this list is yours. Its years are strings; the Dart
    // entry's are `int?`, so they are parsed exactly as `int.tryParse` would:
    // unparseable text becomes null rather than NaN.
    const fromWizard: EditEducationEntry[] = empty
      ? []
      : wizard.education.map((e) => ({
          id: e.id,
          institution: e.institution,
          degree: e.degree,
          fieldOfStudy: e.fieldOfStudy.trim() === '' ? null : e.fieldOfStudy,
          startYear: parseYear(e.startYear),
          endYear: parseYear(e.endYear),
        }));

    return {
      phoneNumber: home?.phoneNumber ?? '',
      displayName: home?.displayName ?? '',
      username: home?.username ?? '',
      profilePhotoUrl: home?.profilePhotoUrl ?? null,
      selectedCategoryIds: empty
        ? []
        : wizard.selectedCategoryIds.length > 0
          ? [...wizard.selectedCategoryIds]
          : [...FALLBACK_CATEGORY_IDS],
      selectedOptionIds: empty
        ? []
        : wizard.selectedOptionIds.length > 0
          ? [...wizard.selectedOptionIds]
          : [...FALLBACK_OPTION_IDS],
      education: fromWizard.length > 0 ? fromWizard : empty ? [] : [...FALLBACK_EDUCATION],
      isSaving: false,
      isSavingEducation: false,
      isUpdatingEducation: false,
      isUploadingPhoto: false,
      usernameError: null,
    };
  }, []);

  const start = useCallback(() => {
    setStatus('loading');
    setErrorMessage(null);
    setLoaded(null);
    window.setTimeout(() => {
      setLoaded(seed());
      setStatus('loaded');
    }, LOAD_MS);
  }, [seed]);

  const reload = useCallback(() => {
    start();
  }, [start]);

  const failLoad = useCallback(() => {
    setLoaded(null);
    setStatus('error');
    setErrorMessage(GENERIC_LOAD_ERROR);
  }, []);

  /**
   * The bloc's OTHER load failure, and a different one worth its own switch.
   *
   * `_onStarted` has two `await`s and two ways to fail: `getEditProfile()` can
   * fail (→ `error.toString()`, i.e. `failLoad`), and then the category fetch can
   * fail *after* a successful profile load (→ the literal "Something went wrong.
   * Please try again.", unconditionally). Same rendered screen, different
   * message and different cause — so `?sim=catalogue` and `?sim=error` are
   * separate, rather than one switch standing in for both.
   */
  const failCatalogue = useCallback(() => {
    setLoaded(null);
    setStatus('error');
    setErrorMessage(GENERIC_LOAD_ERROR);
  }, []);

  /** The current loaded state, read at fire time by every write below. */
  const loadedRef = useRef(loaded);
  loadedRef.current = loaded;

  const patch = useCallback((changes: Partial<LoadedProfile>) => {
    setLoaded((current) => (current === null ? current : { ...current, ...changes }));
  }, []);

  const saveNameAndUsername = useCallback(
    (displayName: string, username: string): Promise<SaveOutcome> => {
      patch({ isSaving: true, usernameError: null });

      return new Promise((resolve) => {
        window.setTimeout(() => {
          const taken = TAKEN_USERNAMES.includes(username.trim().toLowerCase());
          if (taken) {
            // `StateConflictException` — the error text is the server's, shown
            // inline under the field rather than as a snackbar, and `isSaving`
            // goes back to false without leaving the screen.
            patch({ isSaving: false, usernameError: 'That username is already taken' });
            resolve({ kind: 'conflict', message: 'That username is already taken' });
            return;
          }
          // `saved()` carries no payload; the bloc simply finishes. The page's
          // listener then refreshes home and pops.
          resolve({ kind: 'saved' });
        }, SAVE_MS);
      });
    },
    [patch],
  );

  const saveCategories = useCallback(
    (categoryIds: string[], optionIds: string[]): Promise<boolean> => {
      const before = loadedRef.current;
      if (before === null) return Promise.resolve(false);

      // Optimistic, exactly as the bloc does it.
      patch({ selectedCategoryIds: categoryIds, selectedOptionIds: optionIds });

      return new Promise((resolve) => {
        window.setTimeout(() => {
          if (faultRef.current === 'categories') {
            // `emit(current)` — the pre-edit snapshot, restored wholesale.
            setLoaded(before);
            resolve(false);
            return;
          }
          // The wizard's copy of the same answer is updated too, so
          // `/onboarding?step=category` does not disagree with this screen.
          onboardingRef.current.setCategories(categoryIds, optionIds);
          resolve(true);
        }, EDUCATION_WRITE_MS);
      });
    },
    [patch],
  );

  const addEducation = useCallback(
    (entry: EditEducationInput): Promise<boolean> => {
      patch({ isSavingEducation: true, isUpdatingEducation: false });

      return new Promise((resolve) => {
        window.setTimeout(() => {
          if (faultRef.current === 'add') {
            patch({ isSavingEducation: false, isUpdatingEducation: false });
            resolve(false);
            return;
          }
          const current = loadedRef.current;
          // The bloc re-GETs the list after a write; the server would assign the
          // id, so the prototype does the same rather than trusting a local one.
          const created: EditEducationEntry = { ...entry, id: `edu-${Date.now()}` };
          setLoaded(
            current === null
              ? current
              : {
                  ...current,
                  education: [...current.education, created],
                  isSavingEducation: false,
                  isUpdatingEducation: false,
                },
          );
          resolve(true);
        }, EDUCATION_WRITE_MS);
      });
    },
    [patch],
  );

  const updateEducation = useCallback(
    (id: string, entry: EditEducationInput): Promise<boolean> => {
      patch({ isSavingEducation: true, isUpdatingEducation: true });

      return new Promise((resolve) => {
        window.setTimeout(() => {
          if (faultRef.current === 'update') {
            patch({ isSavingEducation: false, isUpdatingEducation: false });
            resolve(false);
            return;
          }
          setLoaded((current) =>
            current === null
              ? current
              : {
                  ...current,
                  education: current.education.map((e) =>
                    e.id === id ? { ...entry, id } : e,
                  ),
                  isSavingEducation: false,
                  isUpdatingEducation: false,
                },
          );
          resolve(true);
        }, EDUCATION_WRITE_MS);
      });
    },
    [patch],
  );

  const deleteEducation = useCallback((id: string): Promise<boolean> => {
    const before = loadedRef.current;
    if (before === null) return Promise.resolve(false);

    // Optimistic removal — the row disappears on tap, before the round-trip.
    setLoaded({ ...before, education: before.education.filter((e) => e.id !== id) });

    return new Promise((resolve) => {
      window.setTimeout(() => {
        if (faultRef.current === 'delete') {
          setLoaded(before);
          resolve(false);
          return;
        }
        resolve(true);
      }, EDUCATION_WRITE_MS);
    });
  }, []);

  const uploadPhoto = useCallback((): Promise<boolean> => {
    patch({ isUploadingPhoto: true });

    return new Promise((resolve) => {
      window.setTimeout(() => {
        if (faultRef.current === 'photo') {
          patch({ isUploadingPhoto: false });
          resolve(false);
          return;
        }
        const current = loadedRef.current;
        // The bloc re-GETs the profile after the upload and takes the URL the
        // SERVER returns. Here the substitution is the picker, so the URL is
        // chosen locally — see STOCK_PHOTOS — and walked rather than randomised.
        const index = current?.profilePhotoUrl
          ? (STOCK_PHOTOS.indexOf(current.profilePhotoUrl) + 1) % STOCK_PHOTOS.length
          : 0;
        patch({ profilePhotoUrl: STOCK_PHOTOS[index], isUploadingPhoto: false });
        resolve(true);
      }, PHOTO_UPLOAD_MS);
    });
  }, [patch]);

  const removePhoto = useCallback((): Promise<boolean> => {
    patch({ isUploadingPhoto: true });

    return new Promise((resolve) => {
      window.setTimeout(() => {
        if (faultRef.current === 'photo') {
          patch({ isUploadingPhoto: false });
          resolve(false);
          return;
        }
        patch({ profilePhotoUrl: null, isUploadingPhoto: false });
        resolve(true);
      }, PHOTO_UPLOAD_MS);
    });
  }, [patch]);

  const clearUsernameError = useCallback(() => {
    setLoaded((current) =>
      current === null || current.usernameError === null
        ? current
        : { ...current, usernameError: null },
    );
  }, []);

  const value = useMemo<EditProfileContextValue>(
    () => ({
      status,
      errorMessage,
      profile: status === 'loaded' ? loaded : null,
      availableCategories: CATEGORIES,
      start,
      reload,
      failLoad,
      failCatalogue,
      setFault,
      fault,
      saveNameAndUsername,
      saveCategories,
      addEducation,
      updateEducation,
      deleteEducation,
      uploadPhoto,
      removePhoto,
      clearUsernameError,
    }),
    [
      status,
      errorMessage,
      loaded,
      fault,
      start,
      reload,
      failLoad,
      failCatalogue,
      setFault,
      saveNameAndUsername,
      saveCategories,
      addEducation,
      updateEducation,
      deleteEducation,
      uploadPhoto,
      removePhoto,
      clearUsernameError,
    ],
  );

  return (
    <EditProfileContext.Provider value={value}>
      <EmptySetterContext.Provider value={setEmpty}>
        {children}
      </EmptySetterContext.Provider>
    </EditProfileContext.Provider>
  );
}

export function useEditProfile(): EditProfileContextValue {
  const value = useContext(EditProfileContext);
  if (value === null) {
    throw new Error('useEditProfile must be used inside an EditProfileProvider');
  }
  return value;
}

/**
 * `?empty=1` has to be read by the PAGE (it owns `useSearchParams`) but acted on
 * by the PROVIDER (it owns the seed). This is the one-line channel between them,
 * deliberately separate from the main context so a page cannot accidentally read
 * the setter as if it were data.
 */
const EmptySetterContext = createContext<((empty: boolean) => void) | null>(null);

export function useEditProfileEmptyFlag(): (empty: boolean) => void {
  const value = useContext(EmptySetterContext);
  if (value === null) {
    throw new Error('useEditProfileEmptyFlag must be used inside an EditProfileProvider');
  }
  return value;
}

/** `int.tryParse` — null for anything that is not a whole number. */
function parseYear(text: string): number | null {
  const trimmed = text.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  return Number.parseInt(trimmed, 10);
}

// Re-exported so the pages import their entry type from one place rather than
// reaching into `lib/fake/`.
export type { EditEducationEntry };
