'use client';

import { Suspense } from 'react';
import { DeleteAccountPage } from '@/features/settings/delete-account-page';

/**
 * Delete account — route wrapper.
 *
 * Reads `?sim=` / `?empty=` for its unreachable branches, and is only reachable
 * while "signed in" — the confirmation is a typed word, not a boolean.
 *
 * `useSearchParams()` opts a page out of static prerendering unless it sits
 * under a `Suspense` boundary, and `next build` fails outright without one.
 * `next dev` never notices, which is why every one of these is wrapped rather
 * than only the ones that have failed a build so far.
 */
export default function DeleteAccountPageRoute() {
  return (
    <Suspense fallback={null}>
      <DeleteAccountPage />
    </Suspense>
  );
}
