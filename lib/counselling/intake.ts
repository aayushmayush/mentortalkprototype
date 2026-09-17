/**
 * The counselling flow's shared vocabulary — port of
 * `ui/counselling/models/exam_type.dart` and `counselling_intake_data.dart`.
 *
 * It lives in `lib/`, not `features/counselling/`, because the provider that
 * carries it between routes is in `lib/state/` — and `lib/` importing upward
 * from `features/` would invert the layering. Same reason `session-detail.ts`
 * and `transaction.ts` sit here.
 *
 * ── The intake data is MUTABLE and passed by reference ──────────────────────
 *
 * The Dart `CounsellingIntakeData` is a plain class with non-final fields whose
 * `examType` is the only `required`/final one. Each page mutates the SAME
 * instance it was handed and pushes the next page with it:
 *
 *     _marksController → data.totalMarks = …; push(CollegePreferencePage(data))
 *
 * So the answers accumulate across four pushes with no state management at all
 * — the object is the state. The prototype's equivalent is a provider holding
 * one mutable object across the five routes, which is modelled in
 * `lib/state/counselling-provider.tsx`. Nothing is submitted anywhere: the
 * source's own comment says "Purely local/in-memory for now".
 */

import type { IconName } from '@/design-system';

export type ExamType = 'neet' | 'jee' | 'cuet';

export type ExamTypeInfo = {
  value: ExamType;
  label: string;
  subtitle: string;
  icon: IconName;
};

/** `ExamType.values`, in declaration order — the picker renders them in this order. */
export const EXAM_TYPES: ExamTypeInfo[] = [
  {
    value: 'neet',
    label: 'NEET',
    subtitle: 'Medical & Dental Admissions',
    icon: 'medicalServices',
  },
  {
    value: 'jee',
    label: 'JEE',
    subtitle: 'Engineering Admissions',
    icon: 'architecture',
  },
  {
    value: 'cuet',
    label: 'CUET',
    subtitle: 'Central University Admissions',
    icon: 'accountBalance',
  },
];

export function examInfo(type: ExamType): ExamTypeInfo {
  return EXAM_TYPES.find((e) => e.value === type) ?? EXAM_TYPES[0];
}

export type ExamExperience = 'easy' | 'moderate' | 'hard';
export type CollegeType = 'government' | 'private';

/**
 * `CounsellingIntakeData`. Every field but `examType` is nullable and starts
 * null — the form is prefilled FROM this object, so re-entering a step shows
 * what you already answered.
 */
export type CounsellingIntakeData = {
  examType: ExamType;
  experience: ExamExperience | null;
  totalMarks: string | null;
  allIndiaRank: string | null;
  preferredStream: string | null;
  budget: string | null;
  state: string | null;
  category: string | null;
  collegeType: CollegeType | null;
};

export function newIntakeData(examType: ExamType): CounsellingIntakeData {
  return {
    examType,
    experience: null,
    totalMarks: null,
    allIndiaRank: null,
    preferredStream: null,
    budget: null,
    state: null,
    category: null,
    collegeType: null,
  };
}
