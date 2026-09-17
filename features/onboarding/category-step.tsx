'use client';

import { useEffect, useState } from 'react';
import {
  AppBottomSheet,
  AppBottomSheetHeader,
  AppButton,
  AppCheckbox,
  AppCheckboxGroup,
} from '@/design-system';
import { CATEGORIES, groupCategoryOptions, type Category } from '@/lib/fake/categories';
import { useOnboarding } from '@/lib/state/onboarding-provider';
import { DEMO_CATEGORY_IDS, DEMO_OPTION_IDS, useDemo } from '@/lib/state/demo-provider';
import { copy } from '@/lib/copy';
import { StepHeading, WizardLayout } from './wizard-layout';

/**
 * Step 2 — port of `ui/onboarding/pages/category_page.dart`.
 *
 * The interaction worth getting right is `_onCategoriesChanged`:
 *
 * - Selecting a category that HAS options immediately opens the options sheet
 *   (via a post-frame callback, so it lands after the chip has drawn).
 * - Tapping an already-selected category with options re-opens that sheet.
 * - DESELECTING a category also drops its options — so you cannot end up with
 *   areas selected under a category you have removed.
 *
 * The chip carries a count badge of how many areas are chosen, shown only when
 * the category is selected, has options, and at least one is picked.
 *
 * The sheet's height is computed from the option count rather than fixed:
 * `ceil(options / 2) * 52 + 220`, as a fraction of the screen, clamped
 * 0.4–0.85. Two-per-row is assumed by that maths, which is why the chips sit in
 * a two-up wrap and the sheet is not square.
 */
export function CategoryStep() {
  const {
    state,
    selectedCategoryIds,
    selectedOptionIds,
    toggleCategory,
    toggleOption,
    submitCategories,
    back,
  } = useOnboarding();
  const { autofill, ready } = useDemo();

  const [sheetCategory, setSheetCategory] = useState<Category | null>(null);

  // Prototype chrome: arrive with a selection so Next is live.
  useEffect(() => {
    if (!ready || !autofill) return;
    if (selectedCategoryIds.length > 0) return;

    DEMO_CATEGORY_IDS.forEach((id) => toggleCategory(id));
    DEMO_OPTION_IDS.forEach((id) => toggleOption(id));
    // Runs once when the step settles; the guard above stops it re-firing.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, autofill]);

  const isSaving = state.status === 'educationStep' && state.isSaving;

  function handleCategoryTap(category: Category, isSelected: boolean) {
    if (isSelected) {
      // Already selected: re-open the sheet if it has areas, otherwise let the
      // checkbox toggle it off.
      if (category.options.length > 0) {
        setSheetCategory(category);
        return;
      }
      toggleCategory(category.id);
      return;
    }

    // Newly selected.
    toggleCategory(category.id);
    if (category.options.length > 0) setSheetCategory(category);
  }

  function optionCountFor(categoryId: string): number {
    const category = CATEGORIES.find((c) => c.id === categoryId);
    if (!category) return 0;
    return category.options.filter((o) => selectedOptionIds.includes(o.id)).length;
  }

  return (
    <>
      <WizardLayout
        currentStep={1}
        onBack={back}
        buttonLabel={copy.next}
        // `_hasSelection` — at least one category, regardless of options.
        buttonDisabled={selectedCategoryIds.length === 0 || isSaving}
        onButton={submitCategories}
      >
        <StepHeading
          title={copy.chooseYourExam}
          subtitle={copy.chooseYourExamSubtitle}
        />

        <AppCheckboxGroup
          selected={new Set(selectedCategoryIds)}
          onChange={() => {
            /* selection is driven by the chip taps below, matching the source */
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-sm)' }}>
            {CATEGORIES.map((category) => {
              const isSelected = selectedCategoryIds.includes(category.id);
              const count = optionCountFor(category.id);
              const showBadge =
                isSelected && category.options.length > 0 && count > 0;

              return (
                <div key={category.id} style={{ position: 'relative' }}>
                  <div
                    onClick={() => handleCategoryTap(category, isSelected)}
                    style={{ cursor: 'pointer' }}
                  >
                    <AppCheckbox value={category.id} title={category.name} />
                  </div>

                  {showBadge ? (
                    <span
                      className="type-label-sm"
                      style={{
                        position: 'absolute',
                        right: -4,
                        top: -4,
                        padding: '2px 6px',
                        borderRadius: 10,
                        background: 'var(--surface-action)',
                        color: 'var(--text-on-action)',
                      }}
                    >
                      {count}
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </AppCheckboxGroup>
      </WizardLayout>

      {/*
        `_OptionsBottomSheet`. Background is `surface.page` (not the default
        sheet surface) with a 16px top radius, and it is sized to its contents.
      */}
      <AppBottomSheet
        open={sheetCategory !== null}
        onClose={() => setSheetCategory(null)}
        heightFraction={sheetCategory ? sheetHeightFraction(sheetCategory) : 0.5}
      >
        {sheetCategory ? (
          <>
            <AppBottomSheetHeader
              title={sheetCategory.name}
              closeLabel={copy.close}
              onClose={() => setSheetCategory(null)}
            />

            <div style={{ padding: '0 16px' }}>
              <p className="type-body-md" style={{ color: 'var(--text-body-light)' }}>
                {copy.selectAreasSubtitle}
              </p>
            </div>

            <div
              className="no-scrollbar"
              style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 16 }}
            >
              <AppCheckboxGroup
                selected={new Set(selectedOptionIds)}
                onChange={(next) => {
                  // The sheet owns a draft selection in the source and only
                  // commits on Continue; the prototype commits live, which is
                  // observationally identical because the sheet has no cancel.
                  const current = new Set(selectedOptionIds);
                  for (const option of sheetCategory.options) {
                    const was = current.has(option.id);
                    const now = next.has(option.id);
                    if (was !== now) toggleOption(option.id);
                  }
                }}
              >
                <OptionsContent
                  category={sheetCategory}
                  selectedOptionIds={selectedOptionIds}
                  onToggleOption={toggleOption}
                />
              </AppCheckboxGroup>
            </div>

            <div style={{ padding: 16 }}>
              <AppButton
                label={copy.continueLabel}
                fullWidth
                onClick={() => setSheetCategory(null)}
              />
            </div>
          </>
        ) : null}
      </AppBottomSheet>
    </>
  );
}

/**
 * The options sheet's contents — a flat wrap, or headings when the category's
 * options carry `group_label`.
 *
 * This was a flat wrap only until `groupCategoryOptions` moved into the fixture:
 * the source branches on `hasGroups` here exactly as the edit-profile picker
 * does, and JEE's options now carry labels, so the branch is live in both.
 * Heading treatment is the source's — titleMedium at w600 in `text.heading`,
 * `spacingSm` to the chips, `spacingLg` under each group.
 */
function OptionsContent({
  category,
  selectedOptionIds,
  onToggleOption,
}: {
  category: Category;
  selectedOptionIds: string[];
  onToggleOption: (optionId: string) => void;
}) {
  const grouped = groupCategoryOptions(category);

  const wrap = (options: Category['options']) => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-sm)' }}>
      {options.map((option) => (
        <AppCheckbox key={option.id} value={option.id} title={option.name} />
      ))}
    </div>
  );

  if (!grouped.hasGroups) return wrap(category.options);

  return (
    <>
      {grouped.groups.map(([label, options]) => (
        <div key={label} style={{ paddingBottom: 'var(--spacing-lg)' }}>
          <div
            className="type-title-md type-emphasis-semibold"
            style={{ color: 'var(--text-heading)' }}
          >
            {label}
          </div>
          <div style={{ height: 'var(--spacing-sm)' }} />
          {wrap(options)}
        </div>
      ))}
    </>
  );
}

/**
 * `(56 + 60 + 56 + 48 + bottomPadding + optionRows * 52) / screenHeight`,
 * clamped 0.4–0.85. The phone is a fixed 844 tall, so `screenHeight` is known.
 */
const PHONE_HEIGHT = 844;
const BOTTOM_INSET = 0;

function sheetHeightFraction(category: Category): number {
  const optionRows = Math.ceil(category.options.length / 2);
  const optionsHeight = optionRows * 52;
  const fixedHeight = 56 + 60 + 56 + 48 + BOTTOM_INSET;
  const total = fixedHeight + optionsHeight;
  return Math.min(0.85, Math.max(0.4, total / PHONE_HEIGHT));
}
