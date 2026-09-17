'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { AppIcon } from './app-icon';

/**
 * AppRadio / AppRadioGroup — port of
 * design_system/lib/core/components/app_radio{,_group}.dart
 *
 * Flutter uses an InheritedWidget to publish the group's selection; React uses
 * context for the same job. Unlike the Flutter original — which holds its own
 * `_selected` and only seeds from `initialValue` — this group is CONTROLLED:
 * the caller owns the value. That removes a whole class of stale-state bugs in
 * sheets that reopen with a different selection.
 *
 * The row is a full-width card: radius 16, 2px border that is TRANSPARENT when
 * unselected and `border.focus` when selected (so selecting shifts nothing),
 * and radio glyphs in icon.action / icon.primary.
 */
type RadioGroupContextValue = {
  value: unknown;
  onChange: (value: unknown) => void;
};

const RadioGroupContext = createContext<RadioGroupContextValue | null>(null);

export type AppRadioGroupProps = {
  value: unknown;
  onChange: (value: unknown) => void;
  children: ReactNode;
  className?: string;
};

export function AppRadioGroup({
  value,
  onChange,
  children,
  className,
}: AppRadioGroupProps) {
  return (
    <RadioGroupContext.Provider value={{ value, onChange }}>
      <div className={className}>{children}</div>
    </RadioGroupContext.Provider>
  );
}

export type AppRadioProps = {
  value: unknown;
  title: string;
  leading?: ReactNode;
  className?: string;
};

export function AppRadio({ value, title, leading, className }: AppRadioProps) {
  const group = useContext(RadioGroupContext);
  if (!group) {
    throw new Error('AppRadio must be rendered inside an AppRadioGroup');
  }

  const selected = group.value === value;

  return (
    <div
      onClick={() => {
        if (!selected) group.onChange(value);
      }}
      className={className}
      role="radio"
      aria-checked={selected}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '12px 16px',
        borderRadius: 16,
        background: 'var(--surface-primary)',
        border: `2px solid ${selected ? 'var(--border-focus)' : 'transparent'}`,
        cursor: 'pointer',
      }}
    >
      {leading}
      <span
        className="type-title-md"
        style={{
          flex: 1,
          minWidth: 0,
          color: 'var(--text-body)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {title}
      </span>
      <AppIcon
        name={selected ? 'radioButtonChecked' : 'radioButtonOff'}
        size="md"
        color={selected ? 'var(--icon-action)' : 'var(--icon-primary)'}
      />
    </div>
  );
}
