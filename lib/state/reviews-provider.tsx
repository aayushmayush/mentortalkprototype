'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Review } from '@/lib/fake/reviews';

/**
 * ReviewsProvider — the reviews *this browser session* has posted.
 *
 * ── Why this exists at all ──────────────────────────────────────────────────
 *
 * The review sheet sits at the end of the loop this prototype exists to
 * demonstrate: request → session → end → rate. Without somewhere to put the
 * result, that last step resolves into nothing and the loop has no observable
 * end — you rate a mentor and the review is nowhere. This provider is the seam
 * that closes it: the sheet writes here, and `/reviews` reads here first.
 *
 * ── What it is NOT ──────────────────────────────────────────────────────────
 *
 * It is not a review store. `MyReviewsPage` in the app pages through
 * `MenteeReviewRepository.getReviews(limit, offset, sort)` against the server;
 * `/reviews` still does that for the seeded history. This holds only the
 * handful of rows added since the tab was opened, newest first, and they are
 * prepended to whatever the repository would have returned.
 *
 * It is deliberately NOT persisted to localStorage. A review is a server-side
 * write with a `createdAt` the server assigns; keeping it across a reload would
 * invent durability the backend has and this provider does not. Reload and it
 * is gone, exactly as an unsent write would be.
 */

export type PostedReview = {
  id: string;
  rating: number;
  comment: string | null;
  mentorName: string;
  mentorAvatar: string | null;
  createdAt: number;
};

type ReviewsContextValue = {
  posted: PostedReview[];
  post: (args: {
    rating: number;
    comment: string | null;
    mentorName: string;
    mentorAvatar: string | null;
  }) => void;
};

const ReviewsContext = createContext<ReviewsContextValue | null>(null);

export function ReviewsProvider({ children }: { children: ReactNode }) {
  const [posted, setPosted] = useState<PostedReview[]>([]);

  const post = useCallback<ReviewsContextValue['post']>((args) => {
    setPosted((current) => [
      {
        id: `local-review-${current.length + 1}`,
        rating: args.rating,
        comment: args.comment,
        mentorName: args.mentorName,
        mentorAvatar: args.mentorAvatar,
        createdAt: Date.now(),
      },
      ...current,
    ]);
  }, []);

  const value = useMemo<ReviewsContextValue>(() => ({ posted, post }), [posted, post]);

  return <ReviewsContext.Provider value={value}>{children}</ReviewsContext.Provider>;
}

export function useReviews(): ReviewsContextValue {
  const ctx = useContext(ReviewsContext);
  if (!ctx) throw new Error('useReviews must be used inside a ReviewsProvider');
  return ctx;
}

/**
 * A locally-posted review reshaped into the `Review` the list renders.
 *
 * `mentee` is null — you are the author, and the mentee-centred list shows the
 * MENTOR on each card, not the author, so the field the mentor-facing card
 * would use has no reader here. `sessionDate` and `sessionId` are synthesised:
 * the sheet's callback carries neither, because in production the server joins
 * them from the session the review belongs to.
 */
export function postedToReview(review: PostedReview): Review {
  return {
    id: review.id,
    rating: review.rating,
    comment: review.comment,
    sessionId: 'local',
    sessionDate: new Date(review.createdAt).toISOString(),
    mentee: null,
    mentor: { name: review.mentorName, avatar: review.mentorAvatar },
    createdAt: new Date(review.createdAt).toISOString(),
  };
}
