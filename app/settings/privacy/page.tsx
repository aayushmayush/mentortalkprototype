'use client';

import { Suspense } from 'react';
import { PrivacySettingsPage } from '@/features/settings/privacy-settings-page';

/**
 * Privacy settings — route wrapper.
 *
 * Reads `?sim=` to force the load-failure and save-failure branches, neither of
 * which is reachable against a local fixture.
 *
 * `useSearchParams()` opts a page out of static prerendering unless it sits
 * under a `Suspense` boundary, and `next build` fails outright without one.
 * `next dev` never notices, which is why every one of these is wrapped rather
 * than only the ones that have failed a build so far.
 */
export default function PrivacySettingsPageRoute() {
  return (
    <Suspense fallback={null}>
      <PrivacySettingsPage />
    </Suspense>
  );
}
