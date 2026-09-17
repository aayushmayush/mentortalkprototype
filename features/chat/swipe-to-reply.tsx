'use client';

import { useEffect, useRef, useState } from 'react';
import { AppIcon } from '@/design-system';

/**
 * SwipeToReply — port of `widgets/swipe_to_reply.dart`.
 *
 * ── The snap-back is not a 180ms tween ──────────────────────────────────────
 *
 * The source runs an `AnimationController(duration: 180ms)` whose listener does
 * `_dx = _dx * (1 - controller.value)` — a per-frame MULTIPLY. That is not the
 * same as animating `dx` from its start to 0 over 180ms: after k frames at 60Hz
 * the remaining fraction is `Π(1 - i/11)`, which is 0.91, 0.74, 0.54, 0.34,
 * 0.19, 0.085 … — visually finished in about 110ms, with the last frames
 * sub-pixel. A linear or ease-out tween over the full 180ms reads noticeably
 * laggier than the app.
 *
 * The same formula is run here, frame by frame, so the collapse matches. The
 * frame count is fixed at 11 (180ms at 60Hz); on a 120Hz device the original
 * would actually collapse in about half the wall-clock time, which is a
 * refresh-rate dependence in the source rather than a behaviour worth copying.
 *
 * ── One deliberate divergence ───────────────────────────────────────────────
 *
 * The source has no `onHorizontalDragCancel`, so a gesture cancelled by the
 * scrolling parent leaves the bubble permanently offset with the reply icon
 * stuck visible, and never fires. That is a bug, not a design; `pointercancel`
 * is handled here and resets the offset. Everything else matches.
 */

const THRESHOLD = 60;
const MAX_DRAG = 90;
const SNAP_FRAMES = 11; // 180ms at 60Hz

export function SwipeToReply({
  mine,
  onReply,
  children,
}: {
  mine: boolean;
  onReply: () => void;
  children: React.ReactNode;
}) {
  const [dx, setDx] = useState(0);
  const [crossed, setCrossed] = useState(false);

  const dxRef = useRef(0);
  const snappedRef = useRef(false);
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const committedRef = useRef(false);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  function apply(next: number) {
    dxRef.current = next;
    setDx(next);
    // Latch on crossing so the haptic fires once per drag, and re-arm if the
    // drag retreats back inside the threshold.
    const nowCrossed = Math.abs(next) >= THRESHOLD;
    setCrossed((was) => {
      if (nowCrossed && !was) navigator.vibrate?.(10);
      return nowCrossed;
    });
  }

  function pointerDown(event: React.PointerEvent) {
    if (snappedRef.current) return;
    startRef.current = { x: event.clientX, y: event.clientY };
    committedRef.current = false;
  }

  function pointerMove(event: React.PointerEvent) {
    if (snappedRef.current || !startRef.current) return;
    const rawDx = event.clientX - startRef.current.x;
    const rawDy = event.clientY - startRef.current.y;

    // Until the gesture is clearly horizontal, leave it to the list. Once it is,
    // capture the pointer so the scroll cannot steal it mid-drag.
    if (!committedRef.current) {
      if (Math.abs(rawDx) < 8 && Math.abs(rawDy) < 8) return;
      if (Math.abs(rawDy) >= Math.abs(rawDx)) {
        startRef.current = null;
        return;
      }
      committedRef.current = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }

    const inDirection = mine ? rawDx < 0 : rawDx > 0;
    if (!inDirection && rawDx !== 0) {
      // A drag the wrong way is pinned to zero, not merely ignored — so a
      // wobble back across the origin does not leave a stale offset behind.
      apply(0);
      return;
    }
    const magnitude = Math.min(Math.abs(rawDx), MAX_DRAG);
    apply(mine ? -magnitude : magnitude);
  }

  function pointerUp() {
    if (snappedRef.current) return;
    // `fired` is decided BEFORE the animation, as in the source.
    const fired = Math.abs(dxRef.current) >= THRESHOLD;
    startRef.current = null;
    committedRef.current = false;
    setCrossed(false);
    snappedRef.current = true;

    let frame = 0;
    const tick = () => {
      frame += 1;
      // `_dx = _dx * (1 - value)` with value stepping 1/11, 2/11 … — the
      // product, not a straight line to zero. See the file header.
      const next = dxRef.current * (1 - frame / SNAP_FRAMES);
      if (frame >= SNAP_FRAMES) {
        dxRef.current = 0;
        setDx(0);
        snappedRef.current = false;
        rafRef.current = null;
        // Fires AFTER the snap-back completes, ~180ms after release. The strip
        // is meant to appear late; see the source's `whenComplete`.
        if (fired) onReply();
        return;
      }
      dxRef.current = next;
      setDx(next);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }

  function pointerCancel() {
    // Not in the source — see the header. Without this the bubble strands.
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    snappedRef.current = false;
    startRef.current = null;
    committedRef.current = false;
    setCrossed(false);
    apply(0);
  }

  const progress = Math.min(Math.abs(dx) / THRESHOLD, 1);
  const iconColor = crossed
    ? 'var(--icon-action)'
    : `color-mix(in srgb, var(--text-body-light) ${Math.round(progress * 100)}%, transparent)`;

  return (
    <div
      onPointerDown={pointerDown}
      onPointerMove={pointerMove}
      onPointerUp={pointerUp}
      onPointerCancel={pointerCancel}
      style={{
        position: 'relative',
        width: '100%',
        display: 'flex',
        justifyContent: mine ? 'flex-end' : 'flex-start',
        // Vertical scrolling stays native; only horizontal is ours to claim.
        touchAction: 'pan-y',
      }}
    >
      {dx !== 0 && (
        <span
          aria-hidden
          style={{
            position: 'absolute',
            top: '50%',
            [mine ? 'right' : 'left']: 8,
            transform: `translateY(-50%) scale(${0.6 + 0.4 * progress})`,
            opacity: progress,
            pointerEvents: 'none',
            display: 'flex',
          }}
        >
          <AppIcon name="reply" px={20} color={iconColor} />
        </span>
      )}
      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: mine ? 'flex-end' : 'flex-start',
          transform: `translateX(${dx}px)`,
        }}
      >
        {children}
      </div>
    </div>
  );
}
