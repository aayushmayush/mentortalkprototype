/**
 * Minimal class-name joiner.
 *
 * Deliberately not `clsx`/`tailwind-merge`: the design system must stay
 * dependency-free so it remains a faithful, liftable port of the Flutter
 * package. There are no conflicting-utility cases here worth a merge pass —
 * components own their own classes and callers only append.
 */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}
