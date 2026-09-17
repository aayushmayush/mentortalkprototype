'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { cn } from '../cn';

/**
 * AppCheckbox / AppCheckboxGroup — port of
 * design_system/lib/core/components/app_checkbox{,_group}.dart
 *
 * These are NOT tick boxes. Each one is a pill chip (radius 24) that reads as
 * selected through its text treatment: selected is w600 in `text.body` with a
 * 1px `border.primary`; unselected is w500 in `text.bodyLight` with a
 * transparent 1px border. There is no check glyph anywhere — which is why the
 * component name is misleading if you have not read the source.
 *
 * Like the radio group, this is controlled rather than self-owning state.
 */
type CheckboxGroupContextValue = {
  selected: ReadonlySet<unknown>;
  toggle: (value: unknown) => void;
};

const CheckboxGroupContext = createContext<CheckboxGroupContextValue | null>(null);

export type AppCheckboxGroupProps = {
  selected: ReadonlySet<unknown>;
  onChange: (selected: Set<unknown>) => void;
  children: ReactNode;
  className?: string;
};

export function AppCheckboxGroup({
  selected,
  onChange,
  children,
  className,
}: AppCheckboxGroupProps) {
  const toggle = (value: unknown) => {
    const next = new Set(selected);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    onChange(next);
  };

  return (
    <CheckboxGroupContext.Provider value={{ selected, toggle }}>
      <div className={className}>{children}</div>
    </CheckboxGroupContext.Provider>
  );
}

export type AppCheckboxProps = {
  value: unknown;
  title: string;
  leading?: ReactNode;
  className?: string;
};

export function AppCheckbox({ value, title, leading, className }: AppCheckboxProps) {
  const group = useContext(CheckboxGroupContext);
  if (!group) {
    throw new Error('AppCheckbox must be rendered inside an AppCheckboxGroup');
  }

  const isSelected = group.selected.has(value);

  return (
    <div
      onClick={() => group.toggle(value)}
      role="checkbox"
      aria-checked={isSelected}
      className={cn('inline-flex cursor-pointer items-center gap-2', className)}
      style={{
        padding: '8px 16px',
        borderRadius: 24,
        background: 'var(--surface-primary)',
        border: `1px solid ${isSelected ? 'var(--border-primary)' : 'transparent'}`,
      }}
    >
      {leading}
      <span
        className={cn('type-title-md', isSelected && 'type-emphasis-semibold')}
        style={{ color: isSelected ? 'var(--text-body)' : 'var(--text-body-light)' }}
      >
        {title}
      </span>
    </div>
  );
}
