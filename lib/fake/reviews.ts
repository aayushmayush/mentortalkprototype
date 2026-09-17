/**
 * Fake reviews for the mentor profile's Reviews tab.
 *
 * A field-for-field port of `core/lib/review/data/models/review.dart`, minus
 * `modes` — no screen reads it. `mentor` is here, but optional: the mentor
 * profile's Reviews tab authorises each card by `review.mentee` and never
 * touches it, while the mentee's own My Reviews page shows the MENTOR on every
 * card and always has it. Both endpoints return the same model; they populate
 * different halves of it.
 *
 * ── Two lists, not one ──────────────────────────────────────────────────────
 *
 * `getReviews(mentorId, total)` answers the mentor profile: reviews *about* a
 * mentor, authored by many mentees. `buildMenteeReviews()` answers My Reviews:
 * reviews *by* the current mentee, about many mentors — the transpose. They are
 * separate generators because they are separate endpoints
 * (`/mentors/{id}/reviews` and `/mentee/reviews`) with different summary
 * arithmetic.
 *
 * ── Why the list is generated rather than hand-written ──────────────────────
 *
 * The tab paginates at 15 a page and the profile header claims
 * `totalReviews` (54–218 across the fake mentors). A hand-written list of
 * eight reviews under a header reading "218 reviews" makes the Load more
 * button a lie, and the pagination is one of the things this screen actually
 * does. So the set is generated to the mentor's real count and paged for real.
 *
 * The generation is seeded off the mentor id, so a given mentor's reviews are
 * stable across reloads — a list that reshuffles on every refresh reads as a
 * bug rather than as fake data.
 */

/** Exactly `ReviewParticipant`. */
export type ReviewParticipant = { name: string; avatar: string | null };

/** Exactly `Review`, minus `modes` — see above. */
export type Review = {
  id: string;
  rating: number;
  comment: string | null;
  sessionId: string;
  sessionDate: string;
  /** Null when the mentee has `show_name_in_reviews` off — renders as "Mentee". */
  mentee: ReviewParticipant | null;
  /**
   * The mentor being reviewed. Present on `/mentee/reviews` (My Reviews renders
   * it), absent on the mentor-profile response (that tab renders `mentee`).
   */
  mentor?: ReviewParticipant | null;
  createdAt: string;
};

/** `_SortOption` — the reviews tab's own enum, unrelated to `SortOption`. */
export const REVIEW_SORTS = [
  { value: 'newest', label: 'Newest' },
  { value: 'rating_high_low', label: 'Rating: high to low' },
  { value: 'rating_low_high', label: 'Rating: low to high' },
] as const;

export type ReviewSort = (typeof REVIEW_SORTS)[number]['value'];

/** `_kPageSize` — `_fetchReviews(limit: 15, ...)` at both call sites. */
export const REVIEWS_PAGE_SIZE = 15;

import { portraitForReviewer, mentorPortrait } from '@/lib/fake/portraits';
import { MENTORS } from '@/lib/fake/mentors';

const NAMES = [
  'Aarav Sharma',
  'Diya Patel',
  'Ishaan Verma',
  'Meera Krishnan',
  'Kabir Bose',
  'Riya Gupta',
  'Vivaan Joshi',
  'Anika Rao',
  'Aditya Nair',
  'Saanvi Reddy',
  'Reyansh Malik',
  'Zara Khan',
  'Dhruv Chopra',
  'Naina Bhatt',
  'Aryan Pillai',
  'Tanvi Desai',
  'Yash Agarwal',
  'Ira Menon',
];

/**
 * Comments are generic enough to fit any subject, because the same list is
 * generated for a physics mentor and an English mentor. A comment naming a
 * subject would be wrong half the time.
 */
const COMMENTS = [
  'Really clear explanation. Broke the topic into pieces I could actually follow, and checked I understood before moving on.',
  'Patient and to the point. I came in confused about one specific thing and left with it sorted.',
  'Very helpful session. We worked through problems together rather than just watching them get solved.',
  'Good session overall. Would have liked a bit more time on practice questions but the concepts landed.',
  'Exactly what I needed before my test. Went over my weak areas and gave me a revision plan.',
  'Explained the approach rather than the answer, which is what I was missing. Recommended.',
  'Solid session. The pace was right and I never felt rushed to keep up.',
  'Honestly the most useful hour of study I have had in weeks. Thank you!',
  'Helpful, though the connection dropped once in the middle. Picked straight back up though.',
  'Great at spotting where my understanding was actually breaking down, not just where I got the answer wrong.',
  null,
  null,
];

/**
 * A tiny deterministic PRNG (mulberry32). Only purpose is stable fake data —
 * `Math.random()` would give a different list on every render pass, and the
 * reviews would visibly reshuffle when you toggled the sort.
 */
function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(value: string): number {
  let h = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const CACHE = new Map<string, Review[]>();

/**
 * Every review for a mentor, newest first — the order the API returns for the
 * default `sort=newest`.
 *
 * Roughly one in six reviews has no author, matching the privacy opt-out the
 * source tolerates in both its shapes (`mentee: null` and
 * `mentee: { name: null }`), so the "Mentee" fallback is visible without
 * having to hunt for it.
 */
export function getReviews(mentorId: string, total: number): Review[] {
  const cached = CACHE.get(mentorId);
  if (cached) return cached;

  const rand = seeded(hashString(mentorId));
  const now = Date.now();
  const day = 86_400_000;

  const reviews: Review[] = Array.from({ length: total }, (_, i) => {
    // Ratings cluster high, as they do on a real mentor profile: 5s and 4s
    // dominate and anything below 3 is rare.
    const roll = rand();
    const rating = roll > 0.62 ? 5 : roll > 0.28 ? 4 : roll > 0.12 ? 3 : 2;

    const authorName = NAMES[Math.floor(rand() * NAMES.length)];
    const anonymous = rand() < 0.17;

    // Newest first, drifting further back with each index.
    const createdAt = new Date(now - i * (day * 1.6) - rand() * day);
    // The session it came from happened shortly before the review.
    const sessionDate = new Date(createdAt.getTime() - day - rand() * day * 3);

    return {
      id: `${mentorId}-r${i + 1}`,
      rating,
      comment: COMMENTS[Math.floor(rand() * COMMENTS.length)],
      sessionId: `${mentorId}-s${1000 + i}`,
      sessionDate: sessionDate.toISOString(),
      mentee: anonymous
        ? null
        : {
            name: authorName,
            // Deterministic per name, so the same reviewer keeps the same face
            // across reloads. An unknown name yields null, which the card
            // renders as its initial-letter circle — the branch production uses
            // for a mentee with no photo.
            avatar: portraitForReviewer(authorName),
          },
      createdAt: createdAt.toISOString(),
    };
  });

  CACHE.set(mentorId, reviews);
  return reviews;
}

/**
 * How many reviews the mentee has given. Fixed rather than derived: there is no
 * session fixture whose length it should match, and the number has to clear a
 * page of 15 twice over or the pagination this screen exists to demonstrate
 * never runs. 34 gives two full pages and a short third.
 */
export const MENTEE_REVIEWS_TOTAL = 34;

let menteeCache: Review[] | null = null;

/**
 * Every review this mentee has given, newest first — the transpose of
 * `getReviews`: many mentors, one author.
 *
 * Seeded off a constant so the history is identical on every reload, and each
 * review is attached to a real mentor from `MENTORS` by index, so tapping
 * through to a card's mentor lands on a profile that exists. `mentee` is null
 * throughout: the mentee's own page renders the MENTOR on each card, and the
 * author is the person reading the screen — the field has no reader here.
 */
export function buildMenteeReviews(): Review[] {
  if (menteeCache) return menteeCache;

  const rand = seeded(hashString('mentee-reviews'));
  const now = Date.now();
  const day = 86_400_000;

  menteeCache = Array.from({ length: MENTEE_REVIEWS_TOTAL }, (_, i) => {
    const mentor = MENTORS[i % MENTORS.length];

    // The mentee's own ratings skew kinder than a stranger's — they chose
    // these mentors and kept coming back.
    const roll = rand();
    const rating = roll > 0.55 ? 5 : roll > 0.2 ? 4 : 3;

    // Newest first, drifting further back with each index — one session every
    // week or two.
    const createdAt = new Date(now - i * (day * 9) - rand() * day * 4);
    const sessionDate = new Date(createdAt.getTime() - day * 0.2 - rand() * day);

    return {
      id: `me-r${i + 1}`,
      rating,
      comment: COMMENTS[Math.floor(rand() * COMMENTS.length)],
      sessionId: `me-s${2000 + i}`,
      sessionDate: sessionDate.toISOString(),
      mentee: null,
      mentor: {
        name: mentor.displayName,
        avatar: mentorPortrait(mentor.id),
      },
      createdAt: createdAt.toISOString(),
    };
  });

  return menteeCache;
}

/**
 * `/mentee/reviews` — page over the mentee's own history under the sheet's
 * sort, with the summary the header reads.
 *
 * `avgRating` is the mean of the whole set, not of the page: the server
 * aggregates over all rows, and a header that moved every time you paged would
 * be visibly wrong.
 */
export function fetchMenteeReviews({
  sort,
  limit,
  offset,
}: {
  sort: ReviewSort;
  limit: number;
  offset: number;
}): { reviews: Review[]; hasMore: boolean; avgRating: number; totalReviews: number } {
  const all = sortReviews(buildMenteeReviews(), sort);
  const page = all.slice(offset, offset + limit);
  const mean = all.reduce((sum, r) => sum + r.rating, 0) / (all.length || 1);

  return {
    reviews: page,
    hasMore: offset + limit < all.length,
    avgRating: Math.round(mean * 10) / 10,
    totalReviews: all.length,
  };
}

/**
 * `_fetchReviews` — limit/offset over the full set, with the tab's own sort
 * applied first. Returns `hasMore` from the same `pagination.has_more` idea:
 * true when the window does not reach the end.
 */
export function fetchReviews({
  mentorId,
  total,
  sort,
  limit,
  offset,
}: {
  mentorId: string;
  total: number;
  sort: ReviewSort;
  limit: number;
  offset: number;
}): { reviews: Review[]; hasMore: boolean } {
  const all = sortReviews(getReviews(mentorId, total), sort);
  const page = all.slice(offset, offset + limit);
  return { reviews: page, hasMore: offset + limit < all.length };
}

/**
 * The three orders. `newest` is by `createdAt` descending; the two rating sorts
 * fall back to date so equally-rated reviews keep a stable, meaningful order
 * rather than an arbitrary one.
 */
function sortReviews(reviews: Review[], sort: ReviewSort): Review[] {
  const byDate = (a: Review, b: Review) =>
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

  switch (sort) {
    case 'rating_high_low':
      return [...reviews].sort((a, b) => b.rating - a.rating || byDate(a, b));
    case 'rating_low_high':
      return [...reviews].sort((a, b) => a.rating - b.rating || byDate(a, b));
    case 'newest':
      return [...reviews].sort(byDate);
  }
}

/**
 * `DateFormat('MMM dd')` from the review card — "Sep 14". The app uses the
 * device locale; `en-US` is the prototype's only locale (see `copy.ts`).
 */
export function formatReviewDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
  });
}
