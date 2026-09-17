'use client';

import { Suspense } from 'react';
import { AddEducationPage } from '@/features/edit-profile/add-education-page';

/**
 * Add / edit education — route wrapper.
 *
 * One page, two jobs: `/edit-profile/add-education` adds, and adding
 * `?id=<entryId>` edits. The query param IS the source's `existingEntry`
 * argument, so both flows reach the same screen.
 *
 * `useSearchParams()` opts a page out of static prerendering unless it sits
 * under a `Suspense` boundary, and `next build` fails outright without one.
 * `next dev` never notices, which is why every one of these is wrapped rather
 * than only the ones that have failed a build so far.
 */
export default function AddEducationPageRoute() {
  return (
    <Suspense fallback={null}>
      <AddEducationPage />
    </Suspense>
  );
}
