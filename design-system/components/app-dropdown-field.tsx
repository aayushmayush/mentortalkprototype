'use client';

import { useState, type ReactNode } from 'react';
import { AppListTile } from './app-list-tile';
import { AppIcon } from './app-icon';
import { AppRadio, AppRadioGroup } from './app-radio';
import { AppBottomSheet, AppBottomSheetHeader } from './app-bottom-sheet';

/**
 * AppDropdownField — port of
 * design_system/lib/core/components/app_dropdown_field.dart
 *
 * A list tile that looks like a field and opens a bottom sheet of radio rows.
 * The displayed title falls back to the field's own `title` when nothing is
 * selected — so an unset dropdown reads as its own label rather than "Select…".
 *
 * A disabled field shows a LOCK glyph instead of a chevron and does not open.
 *
 * The Flutter version computes a draggable-sheet height from the option count
 * (56 per row + 120 chrome, clamped to 0.3–0.95 of screen). Reproduced as a
 * fraction of the phone height, same formula, so sheets of different lengths
 * still feel right.
 */
export type AppDropdownOption<T> = {
  value: T;
  title: string;
};

export type AppDropdownFieldProps<T> = {
  title: string;
  options: AppDropdownOption<T>[];
  value: T | null;
  onChange: (value: T) => void;
  leading?: ReactNode;
  disabled?: boolean;
  /** Overrides the computed sheet height. 0–1 of the phone height. */
  sheetFraction?: number;
  className?: string;
};

export function AppDropdownField<T extends string | number>({
  title,
  options,
  value,
  onChange,
  leading,
  disabled = false,
  sheetFraction,
  className,
}: AppDropdownFieldProps<T>) {
  const [open, setOpen] = useState(false);

  const selectedTitle =
    value === null
      ? title
      : (options.find((o) => o.value === value)?.title ?? title);

  // 56 per row + 120 of header/padding, against the 844px phone, clamped the
  // same way the source clamps against MediaQuery height.
  const fraction =
    sheetFraction ?? Math.min(0.95, Math.max(0.3, (options.length * 56 + 120) / 844));

  return (
    <div className={className}>
      <AppListTile
        leading={leading}
        title={selectedTitle}
        onClick={disabled ? undefined : () => setOpen(true)}
        trailing={
          <AppIcon
            name={disabled ? 'lockedOutline' : 'chevronDown'}
            size="sm"
            color="var(--icon-secondary)"
          />
        }
      />

      <AppBottomSheet
        open={open}
        onClose={() => setOpen(false)}
        heightFraction={fraction}
      >
        <AppBottomSheetHeader title={title} onClose={() => setOpen(false)} />
        <div
          className="no-scrollbar"
          style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px' }}
        >
          <AppRadioGroup
            value={value}
            onChange={(next) => {
              onChange(next as T);
              setOpen(false);
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {options.map((option) => (
                <AppRadio key={String(option.value)} value={option.value} title={option.title} />
              ))}
            </div>
          </AppRadioGroup>
        </div>
      </AppBottomSheet>
    </div>
  );
}
