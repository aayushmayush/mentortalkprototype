'use client';

import { MyReviewsPage } from '@/features/account/my-reviews-page';

/**
 * My Reviews.
 *
 * In production this is a `Navigator.push` from the account tab's action grid —
 * there is no route. The screen takes no arguments, so this file adds nothing
 * but the address.
 */
export default function ReviewsRoute() {
  return <MyReviewsPage />;
}
