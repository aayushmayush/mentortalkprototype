'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import { copy } from '@/lib/copy';

/**
 * Inline "… Read more" / "Read less" text — port of `_ExpandableBio` in
 * `mentor_about_tab.dart` and `_ExpandableComment` in
 * `core/lib/review/ui/widgets/review_card.dart`.
 *
 * Those two widgets are the same implementation with one constant changed
 * (4 lines for a bio, 3 for a review comment), so they are one component here
 * with a `collapsedLines` prop. The `core` copy predates the mentee-app copy or
 * vice versa; nothing distinguishes them but the clamp.
 *
 * ── Why this is not `-webkit-line-clamp` ────────────────────────────────────
 *
 * The cheap CSS answer clamps the paragraph and shows an ellipsis, then you put
 * a "Read more" button underneath — which lands on its own line, below the
 * clamped text. Flutter does not do that. It binary-searches the longest prefix
 * of the text that, *followed by the literal string "… Read more"*, still fits
 * inside the line cap, and renders that inline. The toggle therefore sits at
 * the end of the last visible line, mid-sentence, exactly where the cut is.
 *
 * So this reproduces the algorithm rather than the look: it measures a hidden
 * probe with the same width and styles, counts the line boxes the text actually
 * occupies via `Range.getClientRects()`, and binary-searches — which is exactly
 * what `TextPainter(maxLines:)..layout()` + `didExceedMaxLines` does in Flutter.
 *
 * The measurement is a layout effect, so the clamped form is what paints; there
 * is no flash of the full text first.
 */
export function ExpandableText({
  text,
  collapsedLines,
  className,
  style,
}: {
  text: string;
  /** `_collapsedLines` — 4 for the bio, 3 for a review comment. */
  collapsedLines: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const probeRef = useRef<HTMLSpanElement>(null);
  const [expanded, setExpanded] = useState(false);
  const [visiblePrefix, setVisiblePrefix] = useState<string | null>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const probe = probeRef.current;
    if (!container || !probe) return;

    let cancelled = false;

    /** Line boxes the probe's current text occupies, at the container's width. */
    const measureLines = (): number => {
      const range = document.createRange();
      range.selectNodeContents(probe);
      return range.getClientRects().length;
    };

    const compute = () => {
      if (cancelled) return;

      // Does it even overflow? If not there is no toggle at all.
      probe.textContent = text;
      if (measureLines() <= collapsedLines) {
        setVisiblePrefix(null);
        return;
      }

      const suffix = `… ${copy.readMore}`;
      const fits = (prefix: string) => {
        probe.textContent = prefix + suffix;
        return measureLines() <= collapsedLines;
      };

      // `lo` is the longest prefix that still fits. Same search as the source.
      let lo = 0;
      let hi = text.length;
      while (lo < hi) {
        const mid = Math.floor((lo + hi + 1) / 2);
        if (fits(text.slice(0, mid))) lo = mid;
        else hi = mid - 1;
      }

      const visible = text.slice(0, lo).replace(/\s+$/, '');
      probe.textContent = '';
      setVisiblePrefix(visible);
    };

    compute();

    // Flutter re-runs its `LayoutBuilder` on every constraint change, so a
    // rotation re-clamps. A ResizeObserver is the DOM equivalent.
    const observer = new ResizeObserver(compute);
    observer.observe(container);

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [text, collapsedLines]);

  const overflowed = visiblePrefix !== null;

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      {/*
        The probe. Absolute so it never affects layout, `visibility: hidden` so
        it is not painted, and inheriting the paragraph's own classes and style
        so it wraps at exactly the same points.
      */}
      <span
        ref={probeRef}
        aria-hidden
        className={className}
        style={{
          ...style,
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          visibility: 'hidden',
          pointerEvents: 'none',
          zIndex: -1,
        }}
      />

      {!overflowed ? (
        <span className={className} style={style}>
          {text}
        </span>
      ) : expanded ? (
        <span className={className} style={style}>
          {text}
          {/* `TextSpan(text: '${widget.text}  ')` — the source's two spaces. */}
          {'  '}
          <strong
            className="type-emphasis-bold"
            onClick={() => setExpanded(false)}
            style={{ cursor: 'pointer' }}
          >
            {copy.readLess}
          </strong>
        </span>
      ) : (
        <span className={className} style={style}>
          {visiblePrefix}…{' '}
          <strong
            className="type-emphasis-bold"
            onClick={() => setExpanded(true)}
            style={{ cursor: 'pointer' }}
          >
            {copy.readMore}
          </strong>
        </span>
      )}
    </div>
  );
}
