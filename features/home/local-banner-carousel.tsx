'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * LocalBannerCarousel — port of `ui/home/widgets/local_banner_carousel.dart`.
 *
 * Bundled images, so it always renders — there is no backend state to model
 * and therefore no loading or error path here, exactly as in the source.
 *
 * Three details are load-bearing:
 *
 * - **4s autoplay, 350ms `easeInOut` slide**, both from the source's own
 *   literals. They are tokens now (`--interval-carousel-autoplay`,
 *   `--duration-carousel-scroll`) so the timing is visible in one place.
 * - **The dot indicator is not a dot.** The active one is a 16×6 pill and the
 *   inactive ones are 6×6 circles, animating width over 200ms — reading them as
 *   uniform dots loses the only affordance showing which banner you are on.
 * - **The aspect ratio is 2.5**, with the whole thing clipped to a 14px radius
 *   — note 14, which is neither `borderRadiusSm` (8) nor `md` (16).
 *
 * The autoplay timer wraps with `% length`, and pausing on manual swipe is not
 * implemented in the source — it keeps ticking, which is why the timer is not
 * reset by `onPageChanged` here either.
 */
const BANNERS = [
  '/assets/images/home_banners/banner_1.png',
  '/assets/images/home_banners/banner_2.png',
  '/assets/images/home_banners/banner_3.png',
];

const AUTOPLAY_MS = 4000;

export function LocalBannerCarousel() {
  const [current, setCurrent] = useState(0);
  const currentRef = useRef(0);

  currentRef.current = current;

  // StrictMode double-invokes effects, so the cleanup must actually clear —
  // otherwise two timers advance the carousel at double speed in dev.
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % BANNERS.length);
    }, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, []);

  return (
    <div style={{ padding: '0 var(--spacing-md)' }}>
      <div
        style={{
          borderRadius: 14,
          overflow: 'hidden',
          aspectRatio: '2.5',
          position: 'relative',
          background: 'var(--surface-primary)',
        }}
      >
        {BANNERS.map((src, index) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src}
            src={src}
            alt=""
            style={{
              position: 'absolute',
              inset: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: index === current ? 1 : 0,
              transition: 'opacity var(--duration-carousel-scroll) var(--ease-in-out)',
            }}
          />
        ))}
      </div>

      <div style={{ height: 8 }} />

      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        {BANNERS.map((src, index) => {
          const active = index === current;
          return (
            <div
              key={src}
              style={{
                margin: '0 3px',
                width: active ? 16 : 6,
                height: 6,
                borderRadius: 3,
                background: active ? 'var(--surface-action)' : 'var(--border-primary-light)',
                transition: 'width var(--duration-carousel-dot) var(--ease-out)',
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
