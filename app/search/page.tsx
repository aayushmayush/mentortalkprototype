'use client';

import { useRouter } from 'next/navigation';
import { SearchOverlay } from '@/features/search/search-overlay';

/**
 * The search overlay, given a URL.
 *
 * In production `_openSearch` does `Navigator.push(MaterialPageRoute(builder:
 * (_) => const SearchOverlayPage()))` — there is no route for it, and
 * `SearchOverlayPage` even constructs its own `SearchBloc` internally rather
 * than receiving one. So the screen is already self-contained; the only thing
 * this file adds is the address.
 *
 * Closing pops back. The overlay's own back button calls `history.back()`
 * directly, which is the same pop for a pushed route.
 */
export default function SearchPage() {
  const router = useRouter();

  return <SearchOverlay onMentorTap={(id) => router.push(`/mentors/${id}`)} />;
}
