'use client';

import { Suspense } from 'react';
import { ForceUpdatePage } from '@/features/blocking/force-update-page';

/**
 * Force update — route wrapper.
 *
 * A BLOCKING STATE, like maintenance above. `?force=0` renders the dismissible
 * variant; anything else — including no param at all — renders the hard block.
 *
 * `useSearchParams()` opts a page out of static prerendering unless it sits
 * under a `Suspense` boundary, and `next build` fails outright without one.
 * `next dev` never notices, which is why every one of these is wrapped rather
 * than only the ones that have failed a build so far.
 */
export default function ForceUpdatePageRoute() {
  return (
    <Suspense fallback={null}>
      <ForceUpdatePage />
    </Suspense>
  );
}
