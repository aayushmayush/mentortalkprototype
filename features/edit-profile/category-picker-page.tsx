'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AppBottomSheet,
  AppBottomSheetHeader,
  AppButton,
  AppCheckbox,
  AppCheckboxGroup,
  AppLoadingSpinner,
  AppTopBar,
} from '@/design-system';
import { AppErrorView } from '@/components/app-error-view';
import { copy } from '@/lib/copy';
import { useEditProfile } from '@/lib/state/edit-profile-provider';
import { useSnackbar } from '@/lib/state/snackbar-provider';
import { groupCategoryOptions, type Category } from '@/lib/fake/categories';

/**
 * CategoryPickerPage — port of `_CategoryPickerPage` in
 * `edit_profile_page.dart`.
 *
 * Private to that file and pushed with `Navigator.push`, but it is a full page
 * with its own app bar, so it gets its own route here — which also makes it
 * deep-linkable, and the chips on `/edit-profile` are the only way in.
 *
 * ── Two levels, and the second one is not optional ─────────────────────────
 *
 * A category with `options` cannot simply be ticked: ticking it opens a sheet
 * for its areas, and the count you have chosen shows as a badge on the chip. A
 * category with NO options (UPSC, Boards, Olympiads, …) is a plain toggle.
 *
 * ── `_onCategoriesChanged` reacts only to the DIFFERENCE ───────────────────
 *
 * The group reports the whole new set on every change; the handler diffs it
 * against the old one and:
 *
 *   - on an ADD, opens that category's options sheet from a post-frame callback
 *     (so the sheet opens after the chip has painted selected), and
 *   - on a REMOVE, drops both the category and every option chosen under it.
 *
 * The auto-open fires for the FIRST added id only — `added.first` — which is
 * unobservable through a single tap but is why the code reads as it does.
 *
 * ── The Done button is gated on a category, not on areas ───────────────────
 *
 * `_hasSelection` is `_selectedCategoryIds.isNotEmpty`. Choosing a category and
 * picking zero areas is a valid save — the chip list on `/edit-profile` then
 * shows the category with no pills under it.
 */

export function CategoryPickerPage() {
  const router = useRouter();
  const edit = useEditProfile();
  const snackbar = useSnackbar();

  const loaded = edit.profile;
  const initialCategoryIds = loaded?.selectedCategoryIds ?? [];
  const initialOptionIds = loaded?.selectedOptionIds ?? [];

  /**
   * Seeded ONCE from the bloc's snapshot. The screenshot is deliberately not
   * reactive: this is a picker, and re-seeding it from the store as the user
   * ticks would fight them.
   */
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<string>>(
    () => new Set(initialCategoryIds),
  );
  const [optionsByCategory, setOptionsByCategory] = useState<Record<string, Set<string>>>(
    () => reconstruct(edit.availableCategories, initialOptionIds),
  );
  const [sheetCategory, setSheetCategory] = useState<Category | null>(null);

  // Only used to keep the seed honest on a cold load: `/edit-profile` may still
  // have been spinning when this route was opened directly, in which case the
  // initial state above is empty and the real values arrive a beat later.
  const [seeded, setSeeded] = useState(loaded !== null);
  useEffect(() => {
    if (seeded || loaded === null) return;
    setSeeded(true);
    setSelectedCategoryIds(new Set(loaded.selectedCategoryIds));
    setOptionsByCategory(reconstruct(edit.availableCategories, loaded.selectedOptionIds));
  }, [seeded, loaded, edit.availableCategories]);

  const hasSelection = selectedCategoryIds.size > 0;

  const onCategoriesChanged = (next: Set<unknown>) => {
    const asStrings = new Set([...next] as string[]);
    const added = [...asStrings].filter((id) => !selectedCategoryIds.has(id));
    const removed = [...selectedCategoryIds].filter((id) => !asStrings.has(id));

    if (added.length > 0) {
      const categoryId = added[0]!;
      setSelectedCategoryIds(asStrings);
      const category = edit.availableCategories.find((c) => c.id === categoryId);
      // `addPostFrameCallback` — the sheet opens after the chip paints selected.
      if (category && category.options.length > 0) {
        window.setTimeout(() => setSheetCategory(category), 0);
      }
      return;
    }

    if (removed.length > 0) {
      const gone = removed[0]!;
      setSelectedCategoryIds(asStrings);
      setOptionsByCategory((current) => {
        const copyOf = { ...current };
        delete copyOf[gone];
        return copyOf;
      });
    }
  };

  const onDone = async () => {
    const optionIds = Object.values(optionsByCategory).flatMap((s) => [...s]);
    const ok = await edit.saveCategories([...selectedCategoryIds], optionIds);
    if (!ok) snackbar.show(copy.failedToSaveCategories);
    router.back();
  };

  if (edit.status === 'loading' || edit.status === 'idle') {
    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--surface-page)',
        }}
      >
        <AppTopBar title={copy.selectExams} onBack={() => router.back()} />
        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AppLoadingSpinner size="md" />
        </div>
      </div>
    );
  }

  if (edit.status === 'error') {
    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          background: 'var(--surface-page)',
        }}
      >
        <AppTopBar title={copy.selectExams} onBack={() => router.back()} />
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          <AppErrorView message={edit.errorMessage} onRetry={edit.reload} />
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--surface-page)',
      }}
    >
      <AppTopBar title={copy.selectExams} onBack={() => router.back()} />

      <div
        className="no-scrollbar"
        style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '24px 24px 0' }}
      >
        <div className="type-body-md" style={{ color: 'var(--text-body-light)' }}>
          {copy.selectExamsSubtitle}
        </div>

        <div style={{ height: 24 }} />

        <AppCheckboxGroup selected={selectedCategoryIds} onChange={onCategoriesChanged}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-sm)' }}>
            {edit.availableCategories.map((category) => (
              <PickerCategoryChip
                key={category.id}
                category={category}
                isSelected={selectedCategoryIds.has(category.id)}
                optionCount={optionsByCategory[category.id]?.size ?? 0}
                onTapSheet={() => setSheetCategory(category)}
              />
            ))}
          </div>
        </AppCheckboxGroup>
      </div>

      {/* `EdgeInsets.fromLTRB(24, 12, 24, 32)`, full-width, disabled with no
          selection — passing no handler is how the DS spells disabled. */}
      <div style={{ padding: '12px 24px 32px', flexShrink: 0 }}>
        <AppButton
          label={copy.done}
          fullWidth
          onClick={hasSelection ? () => void onDone() : undefined}
        />
      </div>

      <OptionsSheet
        category={sheetCategory}
        initialSelections={
          sheetCategory ? (optionsByCategory[sheetCategory.id] ?? new Set()) : new Set()
        }
        onClose={() => setSheetCategory(null)}
        onConfirm={(selections) => {
          const id = sheetCategory?.id;
          if (id === undefined) return;
          setOptionsByCategory((current) => ({ ...current, [id]: selections }));
        }}
      />
    </div>
  );
}

/**
 * `_PickerCategoryChip` — an `AppCheckbox` with a count badge pinned to its
 * top-right corner, OUTSIDE the chip.
 *
 * The badge is `Positioned(right: -4, top: -4)` under `Clip.none`, so it
 * overhangs the chip by 4px on two sides. It exists only when the chip is
 * selected, the category HAS options, and at least one is chosen — a selected
 * category with an empty sheet shows no badge at all, which is how you tell
 * "picked, nothing chosen" from "picked, three chosen" at a glance.
 *
 * ── The wrapping GestureDetector is NOT the chip's toggle ──────────────────
 *
 * The source wraps the whole stack in `GestureDetector(onTap: isSelected &&
 * hasOptions ? onTap : null)` — but the `AppCheckbox` inside has its own
 * `onTap` that toggles the group, and in Flutter's gesture arena the inner one
 * wins. So tapping a chip toggles it, and the wrapper only ever receives hits
 * the chip itself does not cover: the overhanging badge.
 *
 * Reproduced here by putting the re-open handler on the BADGE, not on a wrapper
 * — the same hit regions, stated plainly. So the badge is not decoration: it is
 * the "edit my areas" affordance, and a chip with no badge (because nothing is
 * chosen yet) is re-opened by unticking and re-ticking it.
 */
function PickerCategoryChip({
  category,
  isSelected,
  optionCount,
  onTapSheet,
}: {
  category: Category;
  isSelected: boolean;
  optionCount: number;
  onTapSheet: () => void;
}) {
  const hasOptions = category.options.length > 0;

  return (
    <div style={{ position: 'relative', display: 'inline-flex' }}>
      <AppCheckbox value={category.id} title={category.name} />

      {isSelected && hasOptions && optionCount > 0 ? (
        <div
          onClick={(e) => {
            e.stopPropagation();
            onTapSheet();
          }}
          style={{
            position: 'absolute',
            right: -4,
            top: -4,
            padding: '2px 6px',
            borderRadius: 10,
            background: 'var(--surface-action)',
            cursor: 'pointer',
          }}
        >
          <span
            className="type-label-sm type-emphasis-bold"
            style={{ color: 'var(--text-on-action)' }}
          >
            {optionCount}
          </span>
        </div>
      ) : null}
    </div>
  );
}

/**
 * `_PickerOptionsBottomSheet`.
 *
 * ── The height is COMPUTED, and the arithmetic is the source's ─────────────
 *
 * `DraggableScrollableSheet` is given a fraction derived from an estimate of the
 * content: `(fixedHeight + optionRows * 52) / screenHeight`, clamped to
 * 0.4–0.85, where fixedHeight is 56 (header) + 60 (subtitle) + 56 (button) + 48
 * (gap) + the safe-area inset. Two consequences worth knowing:
 *
 *   - `optionRows = ceil(optionCount / 2)` assumes TWO PER ROW, which is a guess
 *     about how the chips wrap. A long option name wraps to one per row and the
 *     sheet is then too short — hence `maxChildSize: 0.85` and an inner scroll.
 *   - the clamp is what stops a 3-option category from opening a sliver: nothing
 *     is ever shorter than 40% of the screen.
 *
 * The prototype takes the same arithmetic and expresses it as a pixel height
 * against the phone's 844px, because `AppBottomSheet` sizes in fractions too but
 * there is no `DraggableScrollableSheet` to hand a `minChildSize` to. The
 * user-facing behaviour — opens at a computed height, scrolls inside, capped —
 * is what is reproduced; drag-to-resize is not, and is not reachable by tapping.
 */
function OptionsSheet({
  category,
  initialSelections,
  onClose,
  onConfirm,
}: {
  category: Category | null;
  initialSelections: Set<string>;
  onClose: () => void;
  onConfirm: (selections: Set<string>) => void;
}) {
  const [selections, setSelections] = useState<Set<string>>(new Set());

  // Re-seed whenever a different category's sheet opens. Keyed on the category
  // id rather than on the Set, which is a new object on every parent render.
  const categoryId = category?.id ?? null;
  useEffect(() => {
    setSelections(new Set(initialSelections));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  const grouped = useMemo(() => groupCategoryOptions(category), [category]);

  if (category === null) return null;

  const optionRows = Math.ceil(category.options.length / 2);
  const optionsHeight = optionRows * 52;
  const fixedHeight = 56 + 60 + 56 + 48;
  const fraction = clamp((fixedHeight + optionsHeight) / PHONE_HEIGHT, 0.4, 0.85);

  return (
    <AppBottomSheet open onClose={onClose} heightFraction={fraction}>
      <AppBottomSheetHeader
        title={category.name}
        closeLabel={copy.close}
        onClose={onClose}
      />

      <div
        className="type-body-md"
        style={{ padding: '0 16px', color: 'var(--text-body-light)', textAlign: 'center' }}
      >
        {copy.selectAreasSubtitle}
      </div>

      <div style={{ height: 'var(--spacing-lg)' }} />

      <div
        className="no-scrollbar"
        style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 16px' }}
      >
        <AppCheckboxGroup
          selected={selections}
          onChange={(next) => setSelections(new Set([...next] as string[]))}
        >
          {grouped.hasGroups
            ? grouped.groups.map(([label, options]) => (
                <div key={label} style={{ paddingBottom: 'var(--spacing-lg)' }}>
                  <div
                    className="type-title-md type-emphasis-semibold"
                    style={{ color: 'var(--text-heading)' }}
                  >
                    {label}
                  </div>
                  <div style={{ height: 'var(--spacing-sm)' }} />
                  <div
                    style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-sm)' }}
                  >
                    {options.map((option) => (
                      <AppCheckbox key={option.id} value={option.id} title={option.name} />
                    ))}
                  </div>
                </div>
              ))
            : (
                <div
                  style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-sm)' }}
                >
                  {category.options.map((option) => (
                    <AppCheckbox key={option.id} value={option.id} title={option.name} />
                  ))}
                </div>
              )}
        </AppCheckboxGroup>
      </div>

      <div style={{ padding: 16, flexShrink: 0 }}>
        <AppButton
          label={copy.done}
          fullWidth
          onClick={() => {
            onConfirm(selections);
            onClose();
          }}
        />
      </div>
    </AppBottomSheet>
  );
}

/** The phone's own height — the sheet's fraction is against the device. */
const PHONE_HEIGHT = 844;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * `_reconstructOptionsByCategory` — the bloc stores option ids FLAT, with no
 * record of which category they belong to, so the picker rebuilds the mapping by
 * asking every category which of its options are in the flat set.
 *
 * Worth noting what this cannot do: an option id that no longer exists in the
 * catalogue is silently dropped, and a category that has since gained options
 * shows only the ones that were chosen. Both are the source's behaviour.
 */
function reconstruct(
  categories: Category[],
  optionIds: string[],
): Record<string, Set<string>> {
  const wanted = new Set(optionIds);
  const result: Record<string, Set<string>> = {};
  for (const category of categories) {
    const matched = category.options.filter((o) => wanted.has(o.id)).map((o) => o.id);
    if (matched.length > 0) result[category.id] = new Set(matched);
  }
  return result;
}
