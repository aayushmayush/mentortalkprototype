'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CompleteStep } from '@/features/onboarding/complete-step';

/**
 * The completion animation, given its own URL.
 *
 * **Production has no such route.** In the Flutter app this is a *state* of
 * `OnboardingShell` — `submitting` and `complete` both render
 * `OnboardingCompletePage` with a different `isComplete` flag, and `complete`
 * navigates home after 2 seconds. There is nothing to walk to.
 *
 * The route exists only so the screen index can deep-link the animation without
 * making a reviewer step through the whole wizard. It renders the real
 * component in its real states and nothing else; in particular it does NOT
 * touch the onboarding provider or navigate, because doing so would make it
 * behave differently from the state it is standing in for.
 *
 * `?mode=loading` shows the `submitting` state. Both are the same widget, so
 * there is no second screen being invented here.
 *
 * The `Suspense` boundary is required for the same reason as `/onboarding`:
 * `useSearchParams()` needs one or `next build` fails on prerender.
 */
export default function OnboardingCompletePage() {
  return (
    <Suspense fallback={null}>
      <OnboardingCompleteContent />
    </Suspense>
  );
}

function OnboardingCompleteContent() {
  const searchParams = useSearchParams();
  const isComplete = searchParams.get('mode') !== 'loading';

  return <CompleteStep isComplete={isComplete} />;
}
