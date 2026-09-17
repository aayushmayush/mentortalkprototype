/**
 * The mentors-list filter model — port of
 * `ui/mentors/bloc/mentors_list_state.dart`'s `SortOption`, `GenderFilter` and
 * `FilterState`.
 *
 * Kept out of `lib/fake/` because it is not data: it is the shape of a piece of
 * UI state, and `SortOption`/`GenderFilter` are enums with an `apiValue` that
 * would be sent to a backend this prototype does not have. The `apiValue` is
 * retained on both anyway — dropping it would quietly turn a wire contract into
 * a display string, and if the prototype ever grows a fake API layer it is the
 * half that matters.
 *
 * ── Two quirks in the source worth knowing before reading the sheet ─────────
 *
 * 1. **Gender is multi-select in the widget but single-select in effect.**
 *    `_selectedGenders` is a `Set<String>` driven by an `AppCheckboxGroup`, so
 *    you can tick both Male and Female — and `_apply` then reads
 *    `length == 1 ? ... : GenderFilter.all`. Ticking both is therefore the same
 *    as ticking neither. Reproduced exactly, because "fixing" it to a radio
 *    would change what the screen does.
 *
 * 2. **`FilterState.selectedCategoryIds` exists but the sheet never touches
 *    it.** The sheet only writes `sortBy`, `gender` and `selectedLanguages`;
 *    `_apply` builds a fresh `FilterState` from those three and the category
 *    list silently reverts to its default. The category that *is* in play comes
 *    from the chip row above the list, not from this sheet.
 */

/** Exactly `SortOption` — order matters, it is the sheet's render order. */
export const SORT_OPTIONS = [
  { value: 'rating_desc', labelKey: 'sortRatingDesc' },
  { value: 'sessions_desc', labelKey: 'sortSessionsDesc' },
  { value: 'price_asc', labelKey: 'sortPriceAsc' },
  { value: 'price_desc', labelKey: 'sortPriceDesc' },
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number]['value'];

/** Exactly `GenderFilter`. */
export type GenderFilter = 'all' | 'male' | 'female';

export type FilterState = {
  sortBy: SortOption;
  gender: GenderFilter;
  selectedLanguages: string[];
};

/** `const FilterState()` — the defaults, which are also what Reset restores. */
export const DEFAULT_FILTERS: FilterState = {
  sortBy: 'rating_desc',
  gender: 'all',
  selectedLanguages: [],
};

/**
 * `_reset()` — note it resets `sortBy` to `ratingDesc` specifically rather than
 * to `widget.currentFilters.sortBy`, even though the two are the same on first
 * open. Reset means "back to the default", not "back to how you found it".
 */
export const RESET_FILTERS: FilterState = { ...DEFAULT_FILTERS };

/**
 * The language chips, in the source's own order and with its own labels.
 *
 * `'Language'` is a hardcoded section label in the sheet (`_SectionLabel(label:
 * 'Language')`) while Sort By and Gender read from l10n — an inconsistency in
 * the source, not here.
 *
 * The labels are the app's own endonyms, taken from the ARB files' `language*`
 * entries rather than invented: a language chip list labelled in English would
 * be a different list.
 */
export const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'हिन्दी' },
  { value: 'bn', label: 'বাংলা' },
  { value: 'ta', label: 'தமிழ்' },
  { value: 'te', label: 'తెలుగు' },
  { value: 'kn', label: 'ಕನ್ನಡ' },
  { value: 'mr', label: 'मराठी' },
  { value: 'pa', label: 'ਪੰਜਾਬੀ' },
] as const;

/**
 * `_apply()` — the Set→enum collapse, including the both-ticked case.
 */
export function genderFromSelection(selected: ReadonlySet<string>): GenderFilter {
  if (selected.size !== 1) return 'all';
  return selected.has('male') ? 'male' : 'female';
}

/** `GenderFilter` → the Set the checkbox group is seeded with. */
export function selectionFromGender(gender: GenderFilter): Set<string> {
  if (gender === 'male') return new Set(['male']);
  if (gender === 'female') return new Set(['female']);
  return new Set();
}
