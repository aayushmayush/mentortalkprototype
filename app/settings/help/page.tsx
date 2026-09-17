'use client';

import { HelpCenterPage } from '@/features/settings/help-center-page';

/**
 * Help centre — route wrapper.

 *
 * Adds nothing but the address: the screen takes no arguments, and in production
 * it is a `Navigator.push` rather than a named route.
 */
export default function HelpCenterPageRoute() {
  return <HelpCenterPage />;
}
