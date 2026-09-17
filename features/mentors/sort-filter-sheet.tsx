'use client';

import { useEffect, useRef, useState } from 'react';
import {
  AppBottomSheetHeader,
  AppButton,
  AppCheckbox,
  AppCheckboxGroup,
  AppRadio,
  AppRadioGroup,
} from '@/design-system';
import { copy } from '@/lib/copy';
import {
  genderFromSelection,
  LANGUAGE_OPTIONS,
  RESET_FILTERS,
  selectionFromGender,
  SORT_OPTIONS,
  type FilterState,
  type SortOption,
} from '@/lib/filters';

/**
 * SortFilterSheet — port of `ui/mentors/widgets/sort_filter_sheet.dart`.
 *
 * ── The sheet is 85% of the phone and draggable to 100% ─────────────────────
 *
 * `SortFilterSheet.show` wraps the sheet in a `DraggableScrollableSheet` at
 * `initialChildSize: 0.85, minChildSize: 0.85, maxChildSize: 1.0`. So it opens
 * most of the way up and can be pulled to full height but never pushed below
 * 85%. The grab handle below reproduces that range — drag it, or press it, and
 * it snaps between the two.
 *
 * ── State is local until Apply ──────────────────────────────────────────────
 *
 * Nothing is written back on change. The sheet seeds its three values from
 * `currentFilters` on open and returns a whole new `FilterState` from `_apply`,
 * so closing without applying discards everything. That is why the component is
 * mounted only while open (see the caller) rather than kept around: the seed
 * happens once, on open.
 *
 * ── Reset is not "undo" ─────────────────────────────────────────────────────
 *
 * `_reset()` sets `sortBy` to `ratingDesc` — the default, not the value the
 * sheet opened with. If you had arrived with `price_asc` selected, Reset gives
 * you `rating_desc`, not `price_asc`. Reproduced as-is.
 *
 * ── A divergence worth naming ───────────────────────────────────────────────
 *
 * The source carries a `_resetKey` integer that it bumps on Reset, keyed onto
 * each group (`ValueKey('sort_$_resetKey')`). That exists only to destroy and
 * rebuild the stateful Flutter widgets so they re-read `initialValue`. React's
 * groups are controlled — the caller owns the value — so there is nothing to
 * force. The observable behaviour is identical.
 */

/** `minChildSize` / `initialChildSize` and `maxChildSize`, as fractions. */
const SHEET_MIN_FRACTION = 0.85;
const SHEET_MAX_FRACTION = 1;

export function SortFilterSheet({
  open,
  currentFilters,
  onClose,
  onApply,
}: {
  open: boolean;
  currentFilters: FilterState;
  onClose: () => void;
  onApply: (next: FilterState) => void;
}) {
  const [sortBy, setSortBy] = useState<SortOption>(currentFilters.sortBy);
  const [genders, setGenders] = useState<Set<string>>(
    selectionFromGender(currentFilters.gender),
  );
  const [languages, setLanguages] = useState<Set<string>>(
    new Set(currentFilters.selectedLanguages),
  );
  const [expanded, setExpanded] = useState(false);

  /**
   * Re-seed whenever the sheet is opened. Without this the values from the
   * previous open would persist, because the component stays mounted across the
   * open/close cycle — the Flutter sheet gets a fresh State each time it is
   * pushed, so this is the equivalent.
   */
  useEffect(() => {
    if (!open) return;
    setSortBy(currentFilters.sortBy);
    setGenders(selectionFromGender(currentFilters.gender));
    setLanguages(new Set(currentFilters.selectedLanguages));
    setExpanded(false);
  }, [open, currentFilters]);

  useDismissOnEscape(open, onClose);

  if (!open) return null;

  const reset = () => {
    setSortBy(RESET_FILTERS.sortBy);
    setGenders(selectionFromGender(RESET_FILTERS.gender));
    setLanguages(new Set(RESET_FILTERS.selectedLanguages));
  };

  return (
    <div
      className="scrim-enter"
      onClick={onClose}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 60,
        pointerEvents: 'auto',
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
      }}
    >
      <div
        className="sheet-enter"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          height: `${(expanded ? SHEET_MAX_FRACTION : SHEET_MIN_FRACTION) * 100}%`,
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          overflow: 'hidden',
          background: 'var(--surface-primary)',
          borderRadius: '16px 16px 0 0',
          boxShadow: 'var(--shadow-bottom-sheet)',
          transition: 'height 180ms ease-out',
        }}
      >
        <DragHandle
          expanded={expanded}
          onToggle={() => setExpanded((v) => !v)}
          onDrag={(up) => setExpanded(up)}
        />

        <AppBottomSheetHeader
          closeLabel={copy.close}
          title={copy.filtering}
          onClose={onClose}
          action={
            <AppButton
              label={copy.reset}
              intent="secondary"
              type="plain"
              size="compact"
              onClick={reset}
            />
          }
        />

        <div className="no-scrollbar" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          <div style={{ padding: '0 var(--page-padding-horizontal)' }}>
            <SectionLabel label={copy.sortBy} />
            <div style={{ height: 'var(--spacing-xs)' }} />

            <AppRadioGroup value={sortBy} onChange={(v) => setSortBy(v as SortOption)}>
              {SORT_OPTIONS.map((option) => (
                <div key={option.value} style={{ paddingBottom: 'var(--spacing-xs)' }}>
                  <AppRadio
                    value={option.value}
                    title={copy[option.labelKey]}
                  />
                </div>
              ))}
            </AppRadioGroup>

            <div style={{ height: 'var(--spacing-md)' }} />

            <SectionLabel label={copy.gender} />
            <div style={{ height: 'var(--spacing-xs)' }} />

            {/*
              An `AppCheckboxGroup`, so both can be ticked — and `_apply` then
              reads `length == 1 ? ... : all`. Ticking both is the same as
              ticking neither. See the note in `lib/filters.ts`.
            */}
            <AppCheckboxGroup
              selected={genders}
              onChange={(next) => setGenders(next as Set<string>)}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-xs)' }}>
                <AppCheckbox value="male" title={copy.male} />
                <AppCheckbox value="female" title={copy.female} />
              </div>
            </AppCheckboxGroup>

            <div style={{ height: 'var(--spacing-md)' }} />

            {/* Hardcoded `'Language'` in the source, not an l10n key. */}
            <SectionLabel label="Language" />
            <div style={{ height: 'var(--spacing-xs)' }} />

            <AppCheckboxGroup
              selected={languages}
              onChange={(next) => setLanguages(next as Set<string>)}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--spacing-xs)' }}>
                {LANGUAGE_OPTIONS.map((option) => (
                  <AppCheckbox key={option.value} value={option.value} title={option.label} />
                ))}
              </div>
            </AppCheckboxGroup>

            <div style={{ height: 'var(--spacing-lg)' }} />
          </div>
        </div>

        <div style={{ padding: 'var(--spacing-sm) var(--page-padding-horizontal)' }}>
          <AppButton
            label={copy.apply}
            intent="primary"
            type="solid"
            fullWidth
            onClick={() =>
              onApply({
                sortBy,
                gender: genderFromSelection(genders),
                selectedLanguages: Array.from(languages),
              })
            }
          />
        </div>
      </div>
    </div>
  );
}

/**
 * The `DraggableScrollableSheet` grab area.
 *
 * Flutter's drag is velocity-aware and follows the finger; this snaps between
 * the two sizes on release, which is the same two-state outcome with less
 * machinery. Clicking the handle toggles too, so it is reachable without a
 * drag gesture at all.
 */
function DragHandle({
  expanded,
  onToggle,
  onDrag,
}: {
  expanded: boolean;
  onToggle: () => void;
  onDrag: (up: boolean) => void;
}) {
  const startY = useRef<number | null>(null);

  return (
    <div
      onClick={onToggle}
      onPointerDown={(e) => {
        startY.current = e.clientY;
      }}
      onPointerMove={(e) => {
        if (startY.current === null) return;
        const dy = startY.current - e.clientY;
        if (dy > 24 && !expanded) onDrag(true);
        if (dy < -24 && expanded) onDrag(false);
      }}
      onPointerUp={() => {
        startY.current = null;
      }}
      style={{
        padding: '10px 0 2px',
        display: 'flex',
        justifyContent: 'center',
        cursor: 'grab',
        flexShrink: 0,
        touchAction: 'none',
      }}
      aria-label={expanded ? 'Collapse' : 'Expand'}
    >
      <div
        style={{
          width: 36,
          height: 4,
          borderRadius: 2,
          background: 'var(--border-secondary)',
        }}
      />
    </div>
  );
}

function SectionLabel({ label }: { label: string }) {
  return (
    <span className="type-body-sm" style={{ color: 'var(--text-body-light)' }}>
      {label}
    </span>
  );
}

/** `showModalBottomSheet` is dismissible by escape in Flutter's default. */
function useDismissOnEscape(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
}
