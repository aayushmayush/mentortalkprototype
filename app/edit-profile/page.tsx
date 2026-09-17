'use client';

import { Suspense } from 'react';
import { EditProfilePage } from '@/features/edit-profile/edit-profile-page';

/**
 * Edit profile — route wrapper.
 *
 * In production this is a `Navigator.push` from the account tab. The screen
 * reads `?sim=` / `?fail=` / `?empty=` to force its unreachable error and empty
 * branches — see the note in edit-profile-page.tsx.
 *
 * `useSearchParams()` opts a page out of static prerendering unless it sits
 * under a `Suspense` boundary, and `next build` fails outright without one.
 * `next dev` never notices, which is why every one of these is wrapped rather
 * than only the ones that have failed a build so far.
 */
export default function EditProfilePageRoute() {
  return (
    <Suspense fallback={null}>
      <EditProfilePage />
    </Suspense>
  );
}
