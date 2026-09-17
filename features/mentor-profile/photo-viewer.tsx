'use client';

import { useState } from 'react';
import { AppIcon, AppLoadingSpinner } from '@/design-system';
import { PhoneOverlay } from '@/components/prototype/phone-frame';
import { STATUS_BAR_HEIGHT } from '@/components/prototype/status-bar';
import { copy } from '@/lib/copy';
import type { MentorPhoto } from '@/lib/fake/mentors';

/**
 * MentorPhotoViewer — port of
 * `ui/mentor_profile/widgets/mentor_photo_viewer.dart`.
 *
 * A black full-screen `Scaffold` over everything, with the photos in a
 * `PageView` and a counter that tracks the current page.
 *
 * ── Why the content is inset by the status bar ──────────────────────────────
 *
 * The frame's overlay layer is `inset: 0` on the screen element, so an overlay
 * rendered through `PhoneOverlay` covers the fake status bar as well as the
 * app. The black backdrop *should* cover it: in the source the route is pushed
 * with `PageRouteBuilder(opaque: false, barrierColor: Colors.black)` on the
 * root navigator, so the black scaffold paints behind the OS status bar and the
 * dynamic island reads as black-on-black.
 *
 * The *content*, though, sits inside `SafeArea` — the photos, the close button
 * and the counter all start below the status bar. So the backdrop is full-bleed
 * and the content is inset by `STATUS_BAR_HEIGHT`, which is the same 54px the
 * real bar occupies. Without that the close button would creep up under the
 * dynamic island.
 *
 * ── Swipe, not scroll ───────────────────────────────────────────────────────
 *
 * The source is a `PageView` — one photo per page, snapping, with the counter
 * driven by `onPageChanged`. CSS scroll-snap is the same interaction with the
 * browser owning the gesture, so the counter is read off a scroll listener
 * instead of a page controller. The arithmetic is the same: which page are we
 * on is `round(scrollLeft / pageWidth)`.
 */

export function PhotoViewer({
  photos,
  initialIndex,
  onClose,
}: {
  photos: MentorPhoto[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);

  return (
    <PhoneOverlay>
      <div
        // `.overlay-fade-in` — motion.css already reserves this keyframe for
        // "the call overlay and the photo viewer" by name.
        className="overlay-fade-in"
        style={{
          position: 'absolute',
          inset: 0,
          background: '#000',
          pointerEvents: 'auto',
        }}
      >
        {/* The SafeArea body. */}
        <div
          style={{
            position: 'absolute',
            top: STATUS_BAR_HEIGHT,
            left: 0,
            right: 0,
            bottom: 0,
            overflow: 'hidden',
          }}
        >
          <div
            className="no-scrollbar"
            onScroll={(e) => {
              const el = e.currentTarget;
              setIndex(Math.round(el.scrollLeft / el.clientWidth));
            }}
            style={{
              height: '100%',
              display: 'flex',
              overflowX: 'auto',
              overflowY: 'hidden',
              scrollSnapType: 'x mandatory',
            }}
          >
            {photos.map((photo) => (
              <div
                key={photo.id}
                style={{
                  flex: '0 0 100%',
                  width: '100%',
                  height: '100%',
                  scrollSnapAlign: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ViewerImage photo={photo} />
              </div>
            ))}
          </div>

          {/* Close — `Positioned(top: 8, left: 8)`. */}
          <div style={{ position: 'absolute', top: 8, left: 8 }}>
            <CircleButton label={copy.close} onClick={onClose}>
              {/* `Icons.close_rounded`, size 22. */}
              <AppIcon name="close" style={{ fontSize: 22, width: 22, height: 22 }} />
            </CircleButton>
          </div>

          {/* Counter — `Positioned(top: 16, right: 16)`, only when there is
              more than one photo. */}
          {photos.length > 1 ? (
            <div
              style={{
                position: 'absolute',
                top: 16,
                right: 16,
                padding: '4px 10px',
                background: 'rgba(0,0,0,0.55)',
                borderRadius: 'var(--ds-radius-sm)',
              }}
            >
              <span
                style={{
                  color: '#FFFFFF',
                  fontWeight: 600,
                  // A raw 13px and no `type-*` class: the source passes only
                  // `fontSize` and `fontWeight` to this Text, so none of the
                  // theme's textTheme slots apply to it.
                  fontSize: 13,
                }}
              >
                {index + 1} / {photos.length}
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </PhoneOverlay>
  );
}

/**
 * One page's image, `BoxFit.contain`, with the source's two fallbacks: a white
 * spinner while it loads, and a broken-image glyph if it fails.
 */
function ViewerImage({ photo }: { photo: MentorPhoto }) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {status === 'loading' ? <AppLoadingSpinner size="md" color="#FFFFFF" /> : null}

      {status === 'error' ? (
        // `Icons.broken_image_outlined` — a raw Material icon, not one of the
        // 87 AppIcons constants, so it is the one glyph in the app named here
        // rather than through a constant. `white54`.
        <AppIcon name="brokenImage" size="lg" color="rgba(255,255,255,0.54)" />
      ) : null}

      {/* Kept mounted while hidden so the load/error events still fire — the
          same reason the photos strip does it. */}
      <img
        src={photo.url}
        alt=""
        onLoad={() => setStatus('loaded')}
        onError={() => setStatus('error')}
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'contain',
          display: status === 'loaded' ? 'block' : 'none',
        }}
      />
    </div>
  );
}

/**
 * `_IconButtonOverlay` — a 40px black 55% circle behind a white glyph.
 *
 * The source's `InteractiveViewer(minScale: 1, maxScale: 4)` pinch-zoom has no
 * CSS equivalent worth faking: the browser already pinch-zooms the whole page
 * on a trackpad, and nesting a second zoom gesture inside a scroll-snapping
 * carousel fights the swipe. Recorded as a gap rather than half-built.
 */
function CircleButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      style={{
        width: 40,
        height: 40,
        borderRadius: '50%',
        background: 'rgba(0,0,0,0.55)',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: '#FFFFFF',
      }}
    >
      {children}
    </button>
  );
}
