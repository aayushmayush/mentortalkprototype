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
import { CATEGORIES } from '@/lib/fake/categories';

/**
 * OnboardingProvider — port of `ui/onboarding/bloc/onboarding_bloc.dart`.
 *
 * The bloc is a single state union that *is* the wizard: `OnboardingShell`
 * switches on it to decide which page to render, so the step is not a route or
 * a local index — it is the state. Transcribing it that way means the wizard's
 * real behaviour comes along for free:
 *
 * - `alreadyComplete` short-circuits to home (the resume check: reopening
 *   onboarding after finishing must not restart it).
 * - `complete` waits 2 seconds before navigating, so the success animation is
 *   actually seen.
 * - `submitting` renders the completion page with `isComplete: false` — the
 *   same page, mid-flight. That is why there is no separate "loading" screen.
 * - Username availability is checked *within* `basicInfoStep`, returning
 *   `usernameError` alongside `isSubmitting` — the two are one state, because
 *   they arrive from the same round-trip.
 */

export type EducationEntry = {
  id: string;
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startYear: string;
  endYear: string;
};

export type OnboardingState =
  | { status: 'loading' }
  | { status: 'alreadyComplete' }
  | { status: 'basicInfoStep'; isSubmitting: boolean; usernameError: string | null }
  | { status: 'categoryStep' }
  | { status: 'educationStep'; isSaving: boolean }
  | { status: 'submitting' }
  | { status: 'complete' }
  | { status: 'error'; message: string };

export type BasicInfo = {
  fullName: string;
  username: string;
};

type Action =
  | { type: 'started' }
  | { type: 'basicInfoSubmitted' }
  | { type: 'usernameRejected'; message: string }
  | { type: 'basicInfoAccepted' }
  | { type: 'categoriesSubmitted' }
  | { type: 'educationSubmitted' }
  | { type: 'educationSkipped' }
  | { type: 'addEducationSaved' }
  | { type: 'back' }
  | { type: 'submitSucceeded' }
  | { type: 'failed'; message: string };

/** Taken, to exercise the inline username error without a backend. */
export const TAKEN_USERNAMES = ['admin', 'mentortalk', 'aayush'];

function reducer(state: OnboardingState, action: Action): OnboardingState {
  switch (action.type) {
    case 'started':
      return { status: 'basicInfoStep', isSubmitting: false, usernameError: null };

    case 'basicInfoSubmitted':
      return { status: 'basicInfoStep', isSubmitting: true, usernameError: null };

    case 'usernameRejected':
      return { status: 'basicInfoStep', isSubmitting: false, usernameError: action.message };

    case 'basicInfoAccepted':
      return { status: 'categoryStep' };

    case 'categoriesSubmitted':
      return { status: 'educationStep', isSaving: false };

    case 'educationSubmitted':
      return { status: 'submitting' };

    case 'educationSkipped':
      return { status: 'submitting' };

    case 'addEducationSaved':
      return { status: 'educationStep', isSaving: false };

    case 'back':
      if (state.status === 'categoryStep') {
        return { status: 'basicInfoStep', isSubmitting: false, usernameError: null };
      }
      if (state.status === 'educationStep') return { status: 'categoryStep' };
      return state;

    case 'submitSucceeded':
      return { status: 'complete' };

    case 'failed':
      return { status: 'error', message: action.message };

    default:
      return state;
  }
}

const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

type OnboardingContextValue = {
  state: OnboardingState;
  basicInfo: BasicInfo;
  selectedCategoryIds: string[];
  selectedOptionIds: string[];
  education: EducationEntry[];
  setBasicInfo: (info: BasicInfo) => void;
  submitBasicInfo: () => void;
  toggleCategory: (id: string) => void;
  toggleOption: (id: string) => void;
  /**
   * The wizard's answer, replaced wholesale rather than toggled.
   *
   * This exists for `/edit-profile`: its category picker saves BOTH lists in one
   * call (`EditProfileEvent.categoriesSaved(categoryIds, optionIds)`), and the
   * wizard holds the same two lists. Writing through here keeps
   * `/onboarding?step=category` from disagreeing with the edit-profile screen
   * about what you picked — which is exactly the kind of drift two independent
   * copies of one answer produce.
   */
  setCategories: (categoryIds: string[], optionIds: string[]) => void;
  submitCategories: () => void;
  addEducation: (entry: Omit<EducationEntry, 'id'>) => void;
  updateEducation: (id: string, entry: Omit<EducationEntry, 'id'>) => void;
  removeEducation: (id: string) => void;
  submitEducation: () => void;
  skipEducation: () => void;
  back: () => void;
  jumpTo: (step: 'basic' | 'category' | 'education') => void;
  reset: () => void;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { status: 'loading' });
  const [basicInfo, setBasicInfoState] = useReducer(
    (s: BasicInfo, next: BasicInfo) => next,
    { fullName: '', username: '' },
  );
  const [selectedCategoryIds, setCategoryIds] = useReducer(
    (s: string[], next: string[]) => next,
    [] as string[],
  );
  const [selectedOptionIds, setOptionIds] = useReducer(
    (s: string[], next: string[]) => next,
    [] as string[],
  );
  const [education, setEducation] = useReducer(
    (s: EducationEntry[], next: EducationEntry[]) => next,
    [] as EducationEntry[],
  );

  // `OnboardingEvent.started()` — the shell's first act.
  useEffect(() => {
    const t = setTimeout(() => dispatch({ type: 'started' }), 0);
    return () => clearTimeout(t);
  }, []);

  /**
   * Username availability. The real bloc awaits the repository and then emits
   * either `usernameRejected` or the next step; the round-trip is simulated so
   * the `isSubmitting` spinner is genuinely visible rather than instantaneous.
   */
  const submitBasicInfo = useCallback(() => {
    dispatch({ type: 'basicInfoSubmitted' });
    const taken = TAKEN_USERNAMES.includes(basicInfo.username.trim().toLowerCase());
    setTimeout(() => {
      dispatch(
        taken
          ? { type: 'usernameRejected', message: 'That username is already taken' }
          : { type: 'basicInfoAccepted' },
      );
    }, 900);
  }, [basicInfo.username]);

  const addEducation = useCallback((entry: Omit<EducationEntry, 'id'>) => {
    setEducation([...education, { ...entry, id: `e${Date.now()}` }]);
  }, [education]);

  const updateEducation = useCallback(
    (id: string, entry: Omit<EducationEntry, 'id'>) => {
      setEducation(education.map((e) => (e.id === id ? { ...entry, id } : e)));
    },
    [education],
  );

  const removeEducation = useCallback(
    (id: string) => setEducation(education.filter((e) => e.id !== id)),
    [education],
  );

  const submitEducation = useCallback(() => {
    dispatch({ type: 'educationSubmitted' });
    // The completion animation holds for 2s, then the shell navigates home.
    setTimeout(() => dispatch({ type: 'submitSucceeded' }), 1600);
  }, []);

  const value = useMemo<OnboardingContextValue>(
    () => ({
      state,
      basicInfo,
      selectedCategoryIds,
      selectedOptionIds,
      education,
      setBasicInfo: setBasicInfoState,
      submitBasicInfo,
      toggleCategory: (id: string) =>
        setCategoryIds(
          selectedCategoryIds.includes(id)
            ? selectedCategoryIds.filter((c) => c !== id)
            : [...selectedCategoryIds, id],
        ),
      toggleOption: (id: string) =>
        setOptionIds(
          selectedOptionIds.includes(id)
            ? selectedOptionIds.filter((o) => o !== id)
            : [...selectedOptionIds, id],
        ),
      setCategories: (categoryIds: string[], optionIds: string[]) => {
        setCategoryIds(categoryIds);
        setOptionIds(optionIds);
      },
      submitCategories: () => dispatch({ type: 'categoriesSubmitted' }),
      addEducation,
      updateEducation,
      removeEducation,
      submitEducation,
      skipEducation: () => dispatch({ type: 'educationSkipped' }),
      back: () => dispatch({ type: 'back' }),
      jumpTo: (step) => {
        if (step === 'basic') {
          dispatch({ type: 'started' });
        } else if (step === 'category') {
          dispatch({ type: 'basicInfoAccepted' });
        } else {
          dispatch({ type: 'categoriesSubmitted' });
        }
      },
      reset: () => {
        setCategoryIds([]);
        setOptionIds([]);
        setEducation([]);
        setBasicInfoState({ fullName: '', username: '' });
        dispatch({ type: 'started' });
      },
    }),
    [
      state,
      basicInfo,
      selectedCategoryIds,
      selectedOptionIds,
      education,
      submitBasicInfo,
      addEducation,
      updateEducation,
      removeEducation,
      submitEducation,
    ],
  );

  return (
    <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>
  );
}

export function useOnboarding(): OnboardingContextValue {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used inside an OnboardingProvider');
  return ctx;
}

/** Only the categories that actually have areas can be drilled into. */
export function categoriesWithOptions(ids: string[]) {
  return CATEGORIES.filter((c) => ids.includes(c.id) && c.options.length > 0);
}
