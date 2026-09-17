/**
 * Mentorship categories.
 *
 * Mirrors the backend's `mentorship_categories` + options shape that
 * `CategoryPage` consumes: a category with `options` renders as a chip that,
 * once selected, becomes tappable to pick areas (and shows a count badge);
 * a category without options is a plain toggle.
 *
 * That two-level behaviour is the whole reason this file is structured rather
 * than a flat string list — the chip's badge and the second-level sheet both
 * depend on `options` being present or absent.
 */

export type CategoryOption = {
  id: string;
  name: string;
  /**
   * `mentorship_category_options.group_label` — a nullable column the backend
   * selects (`mentortalk-mentee-onboarding/index.mjs:118`) and passes through as
   * `opt.group_label || null`.
   *
   * When ANY option in a category carries one, the options sheet stops being a
   * flat wrap and renders under headings. Both screens that show that sheet —
   * `onboarding/category_step.tsx` and `edit-profile/category-picker-page.tsx` —
   * ported the grouping, but the fixture had no labels, so the branch could not
   * be reached by any amount of tapping. JEE's options now carry them, which
   * makes it reachable in both. The grouping is the fixture's, standing in for
   * whatever the database holds; the CODE is the source's.
   */
  groupLabel?: string | null;
};

export type Category = {
  id: string;
  name: string;
  options: CategoryOption[];
};

export const CATEGORIES: Category[] = [
  {
    id: 'jee',
    name: 'JEE',
    options: [
      { id: 'jee-physics', name: 'Physics', groupLabel: 'Subjects' },
      { id: 'jee-chemistry', name: 'Chemistry', groupLabel: 'Subjects' },
      { id: 'jee-maths', name: 'Mathematics', groupLabel: 'Subjects' },
      { id: 'jee-advanced', name: 'JEE Advanced', groupLabel: 'Exams' },
      { id: 'jee-mains', name: 'JEE Mains', groupLabel: 'Exams' },
    ],
  },
  {
    id: 'neet',
    name: 'NEET',
    options: [
      { id: 'neet-biology', name: 'Biology' },
      { id: 'neet-physics', name: 'Physics' },
      { id: 'neet-chemistry', name: 'Chemistry' },
      { id: 'neet-zoology', name: 'Zoology' },
      { id: 'neet-botany', name: 'Botany' },
    ],
  },
  {
    id: 'cuet',
    name: 'CUET',
    options: [
      { id: 'cuet-english', name: 'English' },
      { id: 'cuet-general', name: 'General Test' },
      { id: 'cuet-economics', name: 'Economics' },
      { id: 'cuet-accountancy', name: 'Accountancy' },
    ],
  },
  {
    id: 'gate',
    name: 'GATE',
    options: [
      { id: 'gate-cs', name: 'Computer Science' },
      { id: 'gate-me', name: 'Mechanical' },
      { id: 'gate-ee', name: 'Electrical' },
      { id: 'gate-ce', name: 'Civil' },
    ],
  },
  { id: 'cat', name: 'CAT', options: [
    { id: 'cat-qa', name: 'Quantitative Ability' },
    { id: 'cat-varc', name: 'VARC' },
    { id: 'cat-lrdi', name: 'LRDI' },
  ] },
  { id: 'upsc', name: 'UPSC', options: [] },
  { id: 'boards', name: 'Class 11–12 Boards', options: [] },
  { id: 'olympiad', name: 'Olympiads', options: [] },
  { id: 'study-abroad', name: 'Study Abroad', options: [] },
  { id: 'career', name: 'Career Guidance', options: [] },
];

export function findCategory(id: string): Category | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

/**
 * `_buildOptionsContent`'s grouping, shared by the two screens that show an
 * options sheet.
 *
 * The source carries this function twice — `category_page.dart:270` and
 * `edit_profile_page.dart:928` — byte-identical in both. Flutter can afford the
 * duplication; the prototype cannot afford the two copies drifting apart, so it
 * lives once here. If the two ever diverge upstream, split them again rather
 * than parameterising this one.
 *
 * `hasGroups` is "ANY option has a label", not "all of them do" — so a mixed
 * category takes the grouped path and its unlabelled options land under the
 * literal heading `Other`. That fallback is hardcoded in the Dart, not an l10n
 * key.
 *
 * Insertion order is the source's too: `LinkedHashMap` iteration, i.e. first
 * appearance in `options`, which is the API's `sort_order`.
 */
export function groupCategoryOptions(category: Category | null): {
  hasGroups: boolean;
  groups: [string, CategoryOption[]][];
} {
  if (category === null) return { hasGroups: false, groups: [] };

  const hasGroups = category.options.some((o) => o.groupLabel != null);
  if (!hasGroups) return { hasGroups: false, groups: [] };

  const grouped = new Map<string, CategoryOption[]>();
  for (const option of category.options) {
    const label = option.groupLabel ?? 'Other';
    const bucket = grouped.get(label);
    if (bucket) bucket.push(option);
    else grouped.set(label, [option]);
  }
  return { hasGroups: true, groups: [...grouped.entries()] };
}
