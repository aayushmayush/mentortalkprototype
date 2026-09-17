'use client';

import { FollowingPage } from '@/features/settings/following-page';

/**
 * Following — route wrapper.

 *
 * Adds nothing but the address: the screen takes no arguments, and in production
 * it is a `Navigator.push` rather than a named route.
 */
export default function FollowingPageRoute() {
  return <FollowingPage />;
}
