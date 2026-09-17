'use client';

import { CategoryPickerPage } from '@/features/edit-profile/category-picker-page';

/**
 * Category picker — route wrapper.
 *
 * The source keeps this private to edit_profile_page.dart and pushes it with
 * `BlocProvider.value` so it writes back into the same bloc. Here the bloc is a
 * layout-mounted provider (see edit-profile-provider.tsx), so the shared state —
 * and therefore the save-back — is unchanged.
 *
 * Adds nothing but the address: the screen takes no arguments, and in production
 * it is a `Navigator.push` rather than a named route.
 */
export default function CategoryPickerPageRoute() {
  return <CategoryPickerPage />;
}
