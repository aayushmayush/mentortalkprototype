'use client';

import { useEffect, useState } from 'react';
import { MENTORS } from '@/lib/fake/mentors';

/**
 * `PopularMentorsBloc`, as a hook.
 *
 * It is a separate bloc from `HomeBloc` in production — its own fetch, its own
 * `loading/error/loaded` union, its own retry — and the distinction is
 * load-bearing on the home tab: `HomeFeedPage` wraps the *entire* feed in a
 * `BlocBuilder<PopularMentorsBloc>` and replaces the whole screen with an
 * `AppErrorView` when it fails. So a popular-mentors outage blanks the feed,
 * not just the rail.
 *
 * `simulate` is the prototype affordance, driven by `/home?sim=`. It exists
 * because the failure branch is otherwise unreachable without a backend, and an
 * unverifiable branch is an untested one.
 */

export type PopularMentorsStatus = 'loading' | 'error' | 'loaded';

const LOAD_MS = 900;

export function usePopularMentors(simulate?: 'loading' | 'error' | null) {
  const [status, setStatus] = useState<PopularMentorsStatus>('loading');
  // Retry re-runs the load by bumping this, because `simulate` alone cannot:
  // a `?sim=error` retry has to actually succeed, not loop back into the error.
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (attempt === 0 && simulate === 'loading') {
      setStatus('loading');
      return;
    }
    if (attempt === 0 && simulate === 'error') {
      setStatus('error');
      return;
    }
    // Cleared on the way in as well as out: StrictMode runs this twice, and a
    // bare timeout would leave the first one pending and flip the state early.
    setStatus('loading');
    const t = setTimeout(() => setStatus('loaded'), LOAD_MS);
    return () => clearTimeout(t);
  }, [simulate, attempt]);

  return {
    status,
    mentors: status === 'loaded' ? MENTORS.slice(0, 6) : [],
    /** `PopularMentorsEvent.started()` on retry. */
    retry: () => setAttempt((n) => n + 1),
  };
}
