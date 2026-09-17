import localFont from 'next/font/local';

/**
 * Manrope — the Latin/default family, and the only one the prototype ships.
 *
 * The Flutter package carries five more families (Noto Sans Devanagari,
 * Gurmukhi, Telugu, Kannada, Bengali) that swap in by locale. They are NOT
 * ported, because switching to them is only meaningful alongside actual
 * translations, which are out of scope for v1. See the plan's Out of scope.
 *
 * Exactly four weights exist in the source — 400/500/600/700. There is no
 * italic and no 300/800/900, so nothing should ask for them.
 *
 * `variable` puts the family on the <html> element as --font-manrope, which
 * globals.css wires into Tailwind's --font-sans. The type-* classes in
 * typography.css reference it directly.
 */
export const manrope = localFont({
  src: [
    { path: '../public/fonts/manrope/Manrope-Regular.ttf', weight: '400', style: 'normal' },
    { path: '../public/fonts/manrope/Manrope-Medium.ttf', weight: '500', style: 'normal' },
    { path: '../public/fonts/manrope/Manrope-SemiBold.ttf', weight: '600', style: 'normal' },
    { path: '../public/fonts/manrope/Manrope-Bold.ttf', weight: '700', style: 'normal' },
  ],
  variable: '--font-manrope',
  display: 'swap',
  fallback: ['system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
});
