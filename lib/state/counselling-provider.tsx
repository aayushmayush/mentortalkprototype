'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  newIntakeData,
  type CounsellingIntakeData,
  type ExamType,
} from '@/lib/counselling/intake';

/**
 * CounsellingProvider — the object the Dart flow passes down its four
 * `Navigator.push`es.
 *
 * The Flutter flow has no state management at all: `CounsellingIntakePage`
 * takes a `CounsellingIntakeData`, mutates it in place, and constructs the next
 * page with the same instance. Because the instance IS the state, popping back
 * to a step finds the previous answers still sitting in it.
 *
 * Routes cannot pass an object, so the prototype keeps that one instance here
 * and hands it to all five screens.
 *
 * ── One deliberate divergence: `update` copies instead of mutating ──────────
 *
 * The source writes straight through (`data.totalMarks = …`). Here `update`
 * spreads, because React reconciles on identity: mutating the held object and
 * re-setting it would bail out of the render and the form would silently stop
 * updating. The shape the screens see is identical — one accumulating object —
 * and the copy is shallow, which is all these flat fields need.
 *
 * ── It lives in the ROOT LAYOUT, which is more forgiving than the app ───────
 *
 * A half-filled intake survives navigating away and back; in the app, popping
 * to Home discards it. Starting a new flow calls `reset(examType)` from the
 * exam picker, which is the equivalent of constructing a fresh `IntakeData`.
 */

type CounsellingContextValue = {
  /** Null until an exam is picked — the later routes render an empty form. */
  data: CounsellingIntakeData | null;
  /** `CounsellingIntakeData(examType: …)` — a fresh object for a new flow. */
  reset: (examType: ExamType) => void;
  /** `data..field = value`, in one call. */
  update: (patch: Partial<CounsellingIntakeData>) => void;
};

const CounsellingContext = createContext<CounsellingContextValue | null>(null);

export function CounsellingProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<CounsellingIntakeData | null>(null);

  const reset = useCallback((examType: ExamType) => {
    setData(newIntakeData(examType));
  }, []);

  const update = useCallback((patch: Partial<CounsellingIntakeData>) => {
    setData((current) => (current === null ? current : { ...current, ...patch }));
  }, []);

  const value = useMemo<CounsellingContextValue>(
    () => ({ data, reset, update }),
    [data, reset, update],
  );

  return (
    <CounsellingContext.Provider value={value}>{children}</CounsellingContext.Provider>
  );
}

export function useCounselling(): CounsellingContextValue {
  const ctx = useContext(CounsellingContext);
  if (!ctx) throw new Error('useCounselling must be used inside a CounsellingProvider');
  return ctx;
}
