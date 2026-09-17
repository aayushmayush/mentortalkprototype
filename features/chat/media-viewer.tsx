'use client';

import { useEffect, useRef, useState } from 'react';
import { AppIcon } from '@/design-system';
import { PhoneOverlay } from '@/components/prototype/phone-frame';

/**
 * `_FullscreenImageViewer` — `image_message_bubble.dart:365`.
 *
 * A black ground, a transparent app bar carrying nothing but a white close
 * icon, and the image centred with `BoxFit.contain`. Tapping ANYWHERE dismisses
 * it, not just the close button — the whole body is a `GestureDetector`, so the
 * close icon is a second affordance rather than the only one.
 *
 * `InteractiveViewer(minScale: 0.5, maxScale: 4.0)` is the source's pinch-zoom.
 * Ported with a wheel-and-drag approximation: `scale` from wheel or pinch,
 * `offset` from a drag that is only claimed once the image is larger than its
 * frame. Zooming out below 1 is allowed down to 0.5, exactly as the source
 * permits, which leaves the image floating smaller than the viewport.
 *
 * The viewer is a dialog in Flutter and an overlay sibling here, so it sits
 * above the whole phone — including the prototype chrome — rather than inside
 * the page's scroll container.
 */

const MIN_SCALE = 0.5;
const MAX_SCALE = 4.0;

export function MediaViewer({
  src,
  onClose,
}: {
  src: string | null;
  onClose: () => void;
}) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);

  // Escape closes. Not in the source — there is no keyboard on a phone — but a
  // desktop reviewer will reach for it, and it cannot diverge from anything.
  useEffect(() => {
    if (!src) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [src, onClose]);

  // Reset the transform on each open, so reopening the same photo does not
  // inherit the last session's zoom.
  useEffect(() => {
    if (src) {
      setScale(1);
      setOffset({ x: 0, y: 0 });
    }
  }, [src]);

  if (!src) return null;

  function clampScale(next: number): number {
    return Math.min(MAX_SCALE, Math.max(MIN_SCALE, next));
  }

  return (
    <PhoneOverlay>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Image"
        onClick={onClose}
        onWheel={(event) => {
          // The source has no wheel; a trackpad pinch arrives as ctrl+wheel.
          event.preventDefault();
          setScale((current) => clampScale(current * (1 - event.deltaY / 400)));
        }}
        style={{
          position: 'absolute',
          inset: 0,
          // `barrierColor: Colors.black87` plus the viewer's own black Scaffold.
          background: 'rgba(0, 0, 0, 0.94)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 40,
        }}
      >
        <div
          style={{
            height: 56,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            paddingLeft: 4,
          }}
        >
          <button
            type="button"
            aria-label="Close"
            onClick={(event) => {
              event.stopPropagation();
              onClose();
            }}
            style={{
              width: 48,
              height: 48,
              border: 'none',
              background: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <AppIcon name="close" size="md" color="#ffffff" />
          </button>
        </div>

        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            touchAction: 'none',
          }}
          onPointerDown={(event) => {
            if (scale <= 1) return; // Nothing to pan at or below fit.
            event.currentTarget.setPointerCapture(event.pointerId);
            dragRef.current = {
              x: event.clientX,
              y: event.clientY,
              ox: offset.x,
              oy: offset.y,
            };
          }}
          onPointerMove={(event) => {
            const drag = dragRef.current;
            if (!drag) return;
            event.stopPropagation();
            setOffset({
              x: drag.ox + (event.clientX - drag.x),
              y: drag.oy + (event.clientY - drag.y),
            });
          }}
          onPointerUp={() => {
            dragRef.current = null;
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt=""
            onClick={(event) => event.stopPropagation()}
            style={{
              maxWidth: '100%',
              maxHeight: '100%',
              objectFit: 'contain',
              transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
              transition: dragRef.current ? 'none' : 'transform 120ms ease-out',
              userSelect: 'none',
            }}
          />
        </div>
      </div>
    </PhoneOverlay>
  );
}
