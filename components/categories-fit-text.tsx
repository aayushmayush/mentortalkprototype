'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';

/**
 * `useLayoutEffect` warns when React renders on the server, where it never
 * runs. Aliasing it to `useEffect` on the server silences the warning without
 * changing client behaviour — the measurement still happens before paint where
 * it matters, and the server output is the un-measured full string, which is
 * then corrected on hydration.
 */
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect;

/**
 * `CategoriesFitText` — port of
 * `ui/core/widgets/categories_fit_text.dart`.
 *
 * Fits as many categories as possible on ONE line, joined by `', '`, and
 * summarises the rest as `'+N'`:
 *
 *   ['JEE', 'NEET', 'CUET']  →  'JEE, NEET, CUET'   (if it fits)
 *                            →  'JEE, NEET +1'
 *                            →  'JEE +2'
 *                            →  'JEE…'               (even one category is too wide)
 *
 * ── Why this is measured rather than wrapped ────────────────────────────────
 *
 * The obvious CSS answer — `white-space: nowrap; text-overflow: ellipsis` —
 * gives `'JEE, NE…'`, which is not the same thing at all: the Flutter widget
 * never truncates a whole category mid-word, it drops WHOLE categories and
 * replaces them with a count. `'JEE +2'` tells the reader there are three
 * categories; `'JEE, NE…'` does not. So the fit has to be computed, and the
 * browser's only measuring stick is `CanvasRenderingContext2D.measureText`.
 *
 * The font is read off the rendered element rather than hardcoded, so the
 * measurement follows whatever `.type-body-sm` resolves to — including a theme
 * swap, which is why the measure re-runs when `className` changes.
 *
 * ── This is NOT `mentor_card.dart`'s `_formatCategories` ────────────────────
 *
 * The mentor card has its own, simpler formatter that always renders
 * `'{First} +N'` regardless of width — that one is `formatCategories` in
 * `components/mentor-card.tsx`. Two different widgets that both turn a category
 * list into a short string, with different rules. This file is the fitting one.
 *
 * ── `LayoutBuilder` becomes a ResizeObserver ───────────────────────────────
 *
 * Flutter's `LayoutBuilder` re-runs its builder whenever the constraint
 * changes; the browser equivalent is a `ResizeObserver` on the container. The
 * first paint cannot measure (the ref has no width yet), so the component
 * renders the full list, measures in a layout effect, and replaces it — one
 * frame of the long string before it collapses to `+N`. `useLayoutEffect` keeps
 * that invisible by running before paint; `useEffect` on the server-safe path
 * is the fallback for SSR, where `useLayoutEffect` warns.
 */

export function CategoriesFitText({
  categories,
  className,
  style,
}: {
  categories: string[];
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const [text, setText] = useState(() => categories.join(', '));

  const measure = useCallback(() => {
    const el = ref.current;
    if (el === null) return;
    // `if (categories.isEmpty) return const SizedBox.shrink();` — the source
    // renders nothing at all for an empty list, and the page above already
    // guards on it, so this is belt and braces.
    if (categories.length === 0) return;

    const maxWidth = el.clientWidth;
    if (maxWidth === 0) return;

    const computed = window.getComputedStyle(el);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx === null) return;

    // `getComputedStyle().font` is a shorthand and is empty in some browsers,
    // so the parts are composed by hand.
    ctx.font = `${computed.fontStyle} ${computed.fontWeight} ${computed.fontSize} ${computed.fontFamily}`;

    const widthOf = (s: string) => ctx.measureText(s).width;

    const full = categories.join(', ');
    if (widthOf(full) <= maxWidth) {
      setText(full);
      return;
    }

    // Drop from the END, keeping the leading categories in source order.
    for (let i = categories.length - 1; i >= 1; i--) {
      const candidate = `${categories.slice(0, i).join(', ')} +${categories.length - i}`;
      if (widthOf(candidate) <= maxWidth) {
        setText(candidate);
        return;
      }
    }

    // Even one category plus a count does not fit. The source falls back to the
    // first category alone with an ellipsis, and keeps `+N` when there is more
    // than one — so 'JEE +2' overflows visibly rather than becoming 'JEE…'.
    const first = categories[0];
    if (first === undefined) return;
    setText(
      categories.length === 1 ? first : `${first} +${categories.length - 1}`,
    );
  }, [categories]);

  useIsomorphicLayoutEffect(() => {
    measure();
  }, [measure, className, style?.fontSize]);

  useEffect(() => {
    const el = ref.current;
    if (el === null) return;
    const observer = new ResizeObserver(() => measure());
    observer.observe(el);
    return () => observer.disconnect();
  }, [measure]);

  return (
    <span
      ref={ref}
      className={className}
      style={{
        display: 'block',
        minWidth: 0,
        // The fallback is the source's: single line, ellipsis, and only ever
        // reached when the measured candidate still overflows.
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {text}
    </span>
  );
}
