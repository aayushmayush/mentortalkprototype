'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/state/auth-provider';

/**
 * Splash — port of `ui/splash/splash_video_page.dart`.
 *
 * Three behaviours from the source that are easy to lose in a rewrite:
 *
 * 1. **White ground, not `surface.page`.** The source sets
 *    `backgroundColor: Colors.white` outright. It is the one screen in the app
 *    that ignores the theme, because the intro video is authored on white.
 * 2. **The video plays ONCE and the final frame is held.** Not looped, not
 *    faded out — the player simply stops on the last frame and stays there
 *    while startup finishes.
 * 3. **Navigation waits for the video.** The router awaits `SplashVideoPage.done`
 *    so the animation always plays in full, with a 4s safety cap for a missing
 *    or broken asset — `Timer(Duration(seconds: 4), _markDone)`.
 */

/** The router's safety cap, in ms. */
const SAFETY_CAP_MS = 4000;

export default function SplashPage() {
  const router = useRouter();
  const { state } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  /**
   * `SplashVideoPage.done` — the future the router awaits on every redirect
   * *while the path is `/`*. It completes when the intro finishes playing, or
   * when the 4s safety cap fires if the asset never loads.
   */
  const [introDone, setIntroDone] = useState(false);

  useEffect(() => {
    const cap = setTimeout(() => setIntroDone(true), SAFETY_CAP_MS);
    return () => clearTimeout(cap);
  }, []);

  /**
   * The router's `redirect` callback, reduced to the branches reachable here.
   *
   * Both halves matter and neither is decoration:
   *
   * 1. **`await SplashVideoPage.done` applies only on the splash.** The hold
   *    sits before the state branches, so it delays whichever destination the
   *    state picks — it is not a "wait for auth" gate.
   * 2. **`AuthInitial` redirects to get-started.** It is the state the check
   *    settles on when there is no stored session, so treating it as
   *    not-yet-decided (as this did) means the redirect never fires at all.
   *
   * `AuthLoading` is the one genuine hold: the router returns null for it.
   */
  useEffect(() => {
    if (!introDone) return;
    if (state.status === 'loading') return;

    if (state.status === 'banned') router.replace('/banned');
    else if (state.status === 'success') router.replace('/home');
    else router.replace('/get-started');
  }, [introDone, state.status, router]);

  return (
    <div
      style={{
        background: '#FFFFFF',
        minHeight: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <video
        ref={videoRef}
        src="/assets/videos/splash_intro.mp4"
        autoPlay
        muted
        playsInline
        // No `loop`, no `controls` — mirrors the source, which never calls
        // setLooping and holds the last frame on completion.
        // The intro's own end releases the router's wait.
        onEnded={() => setIntroDone(true)}
        onLoadedData={() => {
          void videoRef.current?.play().catch(() => {
            /* autoplay refused; the safety cap still releases the redirect */
          });
        }}
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          // Matches `AspectRatio(child: VideoPlayer(...))` inside a Center.
          objectFit: 'contain',
        }}
      />
    </div>
  );
}
