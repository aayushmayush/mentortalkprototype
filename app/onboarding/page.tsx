'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppLoadingSpinner } from '@/design-system';
import { AppErrorView } from '@/components/app-error-view';
import { BasicInfoStep } from '@/features/onboarding/basic-info-step';
import { CategoryStep } from '@/features/onboarding/category-step';
import { EducationStep } from '@/features/onboarding/education-step';
import { CompleteStep } from '@/features/onboarding/complete-step';
import { useOnboarding } from '@/lib/state/onboarding-provider';

/**
 * The onboarding shell — port of `ui/onboarding/onboarding_shell.dart`.
 *
 * The state union IS the wizard: `state.when(...)` picks the page, so there is
 * no step index anywhere. Rendering it that way instead of as nested routes is
 * what keeps the bloc's real behaviour — including `alreadyComplete` short-
 * circuiting and the 2s hold on `complete` — rather than reimplementing it.
 *
 * `?step=` is a prototype addition, and a narrow one: it only calls `jumpTo`
 * on mount so the screen index can deep-link into the middle of the wizard.
 * It does not become the source of truth — `state` stays authoritative, which
 * is why jumping forward and then pressing Back still behaves.
 *
 * The `Suspense` boundary is not optional: `useSearchParams()` opts a page out
 * of static prerendering without one, and `next build` fails outright on it —
 * `next dev` happily serves it and never says a word.
 */
export default function OnboardingPage() {
  return (
    <Suspense fallback={null}>
      <OnboardingShellContent />
    </Suspense>
  );
}

function OnboardingShellContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state, jumpTo } = useOnboarding();

  const stepParam = searchParams.get('step');

  useEffect(() => {
    if (!stepParam) return;
    if (stepParam === 'basic') jumpTo('basic');
    else if (stepParam === 'category') jumpTo('category');
    else if (stepParam === 'education') jumpTo('education');
    // Only on the param itself — `jumpTo` is stable enough in practice and
    // re-running on every state change would fight the user's own navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepParam]);

  // `alreadyComplete` → straight home. `complete` → home after the 2s hold,
  // which is the source's `Future.delayed(Duration(seconds: 2))`.
  useEffect(() => {
    if (state.status === 'alreadyComplete') {
      router.replace('/home');
      return;
    }
    if (state.status === 'complete') {
      const t = setTimeout(() => router.replace('/home'), 2000);
      return () => clearTimeout(t);
    }
  }, [state.status, router]);

  switch (state.status) {
    case 'loading':
      return (
        <div style={{ minHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <AppLoadingSpinner size="md" />
        </div>
      );

    case 'alreadyComplete':
      // The effect above is navigating home; render nothing in the meantime.
      return <div style={{ minHeight: '100%' }} />;

    case 'complete':
      // Held for 2s so the success animation is seen in full, then home.
      return <CompleteStep isComplete />;

    case 'basicInfoStep':
      return <BasicInfoStep />;

    case 'categoryStep':
      return <CategoryStep />;

    case 'educationStep':
      return <EducationStep />;

    case 'submitting':
      // Same page, `isComplete: false` — the source never has a separate
      // "submitting" screen.
      return <CompleteStep isComplete={false} />;

    case 'error':
      return (
        <AppErrorView message={state.message} onRetry={() => jumpTo('basic')} />
      );
  }
}
