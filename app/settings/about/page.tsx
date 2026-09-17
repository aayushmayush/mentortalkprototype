'use client';

import { AppInfoPage } from '@/features/settings/app-info-page';

/**
 * App info — route wrapper.
 *
 * The empty route the home bar's support button reaches for is
 * `/settings/help`; this one is reached from the settings list.
 *
 * Adds nothing but the address: the screen takes no arguments, and in production
 * it is a `Navigator.push` rather than a named route.
 */
export default function AppInfoPageRoute() {
  return <AppInfoPage />;
}
