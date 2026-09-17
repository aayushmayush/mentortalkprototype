'use client';

import { Suspense } from 'react';
import { MaintenancePage } from '@/features/blocking/maintenance-page';

/**
 * Maintenance — route wrapper.
 *
 * A BLOCKING STATE. The router renders it in place of the whole shell — there is
 * no top bar and no bottom bar, because in production the app never builds them.
 * `?sim=` forces the variant that carries an ETA against the one that does not.
 *
 * `useSearchParams()` opts a page out of static prerendering unless it sits
 * under a `Suspense` boundary, and `next build` fails outright without one.
 * `next dev` never notices, which is why every one of these is wrapped rather
 * than only the ones that have failed a build so far.
 */
export default function MaintenancePageRoute() {
  return (
    <Suspense fallback={null}>
      <MaintenancePage />
    </Suspense>
  );
}
