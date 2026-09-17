'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '../cn';
import { AppListTile } from './app-list-tile';
import { AppTextField } from './app-text-field';

/**
 * AppAutocompleteField — port of
 * `design_system/lib/core/components/app_autocomplete_field.dart`.
 *
 * Wraps Flutter's `Autocomplete<T>` with `AppTextField` as the input and an
 * `AppListTile` dropdown, so it is a *composed* DS component rather than a new
 * visual — every pixel here already exists elsewhere. What it adds is behaviour.
 *
 * ── What the Flutter original actually does, and what carries over ──────────
 *
 * - **The dropdown opens on FOCUS, not on typing.** Flutter's `Autocomplete`
 *   renders `optionsViewBuilder` whenever the field has focus and
 *   `optionsBuilder` returned a non-empty list. Both call sites in
 *   `add_education_page.dart` return something for an EMPTY query — the degree
 *   field returns the whole degree list, the others return the whole pool — so
 *   tapping an empty field drops a full-height list on screen. Reproduced.
 *
 * - **The dropdown's `maxHeight` is 240 and it scrolls inside that.** A pool of
 *   130 institutions is a scroller, not a 130-row panel.
 *
 * - **The currently-selected option is tinted `surface.actionLight`.** Note
 *   what this compares: the OPTION STRING against the field's `initialValue`
 *   (or the external controller's text at build time), which is why the tint
 *   follows what you have committed rather than what you are typing.
 *
 * ── One divergence, and it is structural ────────────────────────────────────
 *
 * Flutter's `Autocomplete` owns its own `TextEditingController` and syncs it to
 * an optional `externalController`. React has no such widget, and a component
 * that owns a controller cannot be driven from outside — so this port is
 * CONTROLLED (`value` / `onChange`), which is strictly simpler and loses
 * nothing: the sync loop exists only to keep an external controller in step, and
 * with one source of truth there is nothing to sync.
 *
 * `initialValue` is therefore not a prop here. The caller passes `value`.
 */
export type AppAutocompleteFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  /**
   * Called when a suggestion is picked. Separate from `onChange` because the
   * add-education page records a *commit* for some fields and only a keystroke
   * for others — see `_selectedDegree`. Also fired for a free-typed value on
   * blur, mirroring how the degree field's `onChanged` keeps `_selectedDegree`
   * in step.
   */
  onSelected?: (value: string) => void;
  /** `optionsBuilder` — receives the current text, returns the suggestions. */
  options: (query: string) => string[];
  maxLength?: number;
  inputMode?: 'text' | 'numeric';
  className?: string;
};

const DROPDOWN_MAX_HEIGHT = 240;

export function AppAutocompleteField({
  label,
  value,
  onChange,
  onSelected,
  options,
  maxLength,
  inputMode,
  className,
}: AppAutocompleteFieldProps) {
  const [focused, setFocused] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const suggestions = options(value);

  /**
   * Closing is driven by a document-level mousedown rather than by the input's
   * blur, and that is not a style preference — blur is unusable here.
   *
   * A suggestion row is a `div`, so it cannot take focus; clicking one makes the
   * input blur with `relatedTarget: null`, which is indistinguishable from
   * clicking empty space. Closing on blur would therefore tear the list down on
   * mousedown, a tick before the click that selects a row could ever land —
   * every suggestion would look dead. Flutter has no such problem: its overlay
   * is a route and outlives the field's focus.
   *
   * So: a mousedown OUTSIDE the component closes it, and a mousedown on a row
   * does not — because the row's own onClick runs and closes it deliberately.
   * The keyboard path is handled separately and explicitly, below.
   */
  useEffect(() => {
    if (!focused) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [focused]);

  const open = focused && suggestions.length > 0;

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      {/* Focus bubbles in React, so an `onFocus` here catches the input's.
          AppTextField does not expose its own focus handlers, and widening the
          DS component's public surface for one call site would be the tail
          wagging the dog. */}
      <div
        onFocus={() => setFocused(true)}
        onKeyDownCapture={(e) => {
          // The keyboard half of the close behaviour: tabbing away or pressing
          // Escape dismisses the list. Enter is AppTextField's `onEnter`.
          if (e.key === 'Tab' || e.key === 'Escape') setFocused(false);
        }}
      >
        <AppTextField
          label={label}
          value={value}
          onChange={onChange}
          maxLength={maxLength}
          inputMode={inputMode}
          onEnter={() => {
            onSelected?.(value);
            setFocused(false);
          }}
        />
      </div>

      {open ? (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 4,
            zIndex: 20,
            maxHeight: DROPDOWN_MAX_HEIGHT,
            overflowY: 'auto',
            // `Material(elevation: 4)` — the source's shadow, which this
            // prototype maps to the same --shadow-bottom-sheet token the sheets
            // use rather than inventing a second elevation ramp.
            boxShadow: 'var(--shadow-bottom-sheet)',
            background: 'var(--surface-primary)',
            borderRadius: 16,
            padding: 4,
          }}
        >
          {suggestions.map((option) => (
            <AppListTile
              key={option}
              title={option}
              backgroundColor={
                option === value ? 'var(--surface-action-light)' : undefined
              }
              onClick={() => {
                onChange(option);
                onSelected?.(option);
                setFocused(false);
              }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
