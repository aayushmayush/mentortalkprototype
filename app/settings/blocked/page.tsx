'use client';

import { BlockedUsersPage } from '@/features/settings/blocked-users-page';

/**
 * Blocked users — route wrapper.

 *
 * Adds nothing but the address: the screen takes no arguments, and in production
 * it is a `Navigator.push` rather than a named route.
 */
export default function BlockedUsersPageRoute() {
  return <BlockedUsersPage />;
}
