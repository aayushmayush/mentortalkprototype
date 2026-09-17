'use client';

import { use } from 'react';
import { MentorProfilePage } from '@/features/mentor-profile/mentor-profile-page';

/**
 * The mentor profile, given a URL.
 *
 * In production this is `Navigator.push(MaterialPageRoute(builder: (_) =>
 * MentorProfilePage(mentorId: id)))` from a mentor card, a search result, a
 * chat header or a review — five call sites, no route. The page already takes
 * its id as a constructor argument, so the only thing this file adds is the
 * address, and with it a deep link into any mentor.
 *
 * The id is read with `use(params)` rather than destructured from props: Next
 * 15 hands `params` to a client page as a promise.
 */
export default function MentorProfileRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  return <MentorProfilePage mentorId={id} />;
}
