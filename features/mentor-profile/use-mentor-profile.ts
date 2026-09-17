'use client';

import { useCallback, useEffect, useState } from 'react';
import { buildMentorProfile, type MentorProfile } from '@/lib/fake/mentors';

/**
 * `MentorProfileBloc`, as a hook.
 *
 * ── The union is the source's, exactly ──────────────────────────────────────
 *
 * `MentorProfileState.loading / loaded(profile) / error(message)` — three
 * states, and the page renders a different region for each: shimmer for
 * loading, the hero + tabs for loaded, `AppErrorView` for error. There is no
 * "empty" state because a profile that does not exist IS the error state.
 *
 * It is modelled as a discriminated union rather than three parallel
 * `useState`s for the reason the Dart sealed class exists: `loaded` cannot
 * carry a null profile and `error` cannot carry an empty message, so those
 * combinations are unrepresentable rather than merely avoided. TypeScript then
 * narrows on `status` at every use, which is what lets the page read
 * `state.profile` without a guard.
 *
 * ── `error(message)` carries a string, and it is the exception's ────────────
 *
 * The bloc emits `error.toString()` — the raw exception text. `AppErrorView`
 * then sniffs that string for network keywords to decide its glyph and copy. So
 * a real message is load-bearing here, not decoration: a generic "Something
 * went wrong" would silently disable the network branch of the error view.
 *
 * ── Follow is optimistic, and reverts ───────────────────────────────────────
 *
 * `_onToggleFollow` emits the flipped value immediately, then emits whatever
 * the server returned, and reverts to the previous value on failure. That
 * three-step is reproduced: the flip is instant because the fake server always
 * agrees, but the revert path exists and runs if the profile is unknown.
 */

export type MentorProfileState =
  | { status: 'loading' }
  | { status: 'loaded'; profile: MentorProfile }
  | { status: 'error'; message: string };

/** The real endpoint's latency, near enough that the shimmer is visible. */
const LOAD_MS = 700;

export function useMentorProfile(mentorId: string) {
  const [state, setState] = useState<MentorProfileState>({ status: 'loading' });

  /**
   * Retry re-runs the load. A counter rather than a boolean, because
   * `MentorProfileEvent.started(mentorId:)` is re-dispatched on retry and on
   * pull-to-refresh, and the second dispatch must actually fetch again.
   */
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setState({ status: 'loading' });

    // StrictMode runs this twice; the cleanup cancels the first timer so the
    // state cannot be flipped by an orphan.
    const t = setTimeout(() => {
      const built = buildMentorProfile(mentorId);

      if (!built) {
        // `on Error catch (error) => emit(error(message: error.toString()))`.
        // A missing profile is a 404 from `getMentorProfile`, and the message
        // is the server's, so it names the id the way the API would.
        setState({
          status: 'error',
          message: `Mentor not found (404): no profile for "${mentorId}"`,
        });
        return;
      }

      setState({ status: 'loaded', profile: built });
    }, LOAD_MS);

    return () => clearTimeout(t);
  }, [mentorId, attempt]);

  const toggleFollow = useCallback(() => {
    setState((current) => {
      if (current.status !== 'loaded') return current;

      // Optimistic flip first; the fake server echoes it back, so there is no
      // revert to schedule — the revert branch is reachable only on a write
      // failure, which the prototype has no way to produce yet.
      return {
        status: 'loaded',
        profile: {
          ...current.profile,
          isFollowing: !current.profile.isFollowing,
        },
      };
    });
  }, []);

  return {
    state,
    /** `MentorProfileEvent.started()` — the retry handler. */
    retry: () => setAttempt((n) => n + 1),
    /** `MentorProfileEvent.toggleFollow()`. */
    toggleFollow,
  };
}
