'use client';

import { SettingsPage } from '@/features/settings/settings-page';

/**
 * Settings — route wrapper.

 *
 * Adds nothing but the address: the screen takes no arguments, and in production
 * it is a `Navigator.push` rather than a named route.
 */
export default function SettingsPageRoute() {
  return <SettingsPage />;
}
