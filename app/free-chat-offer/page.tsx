'use client';

import { Suspense } from 'react';
import { FreeChatOfferPage } from '@/features/free-chat/free-chat-offer-page';

/**
 * Free chat offer — route wrapper.
 *
 * Already linked from the home feed (features/home/home-feed.tsx), which is why
 * it sits in the Onboarding group in lib/routes.ts rather than with the rest of
 * T5 — it is an entry point, not a settings screen.
 *
 * `useSearchParams()` opts a page out of static prerendering unless it sits
 * under a `Suspense` boundary, and `next build` fails outright without one.
 * `next dev` never notices, which is why every one of these is wrapped rather
 * than only the ones that have failed a build so far.
 */
export default function FreeChatOfferPageRoute() {
  return (
    <Suspense fallback={null}>
      <FreeChatOfferPage />
    </Suspense>
  );
}
