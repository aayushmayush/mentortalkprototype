'use client';

import { useId, useRef, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '../cn';

/**
 * AppTextField — port of design_system/lib/core/components/app_text_field.dart
 *
 * A hand-rolled floating-label field (the source does not use Material's own
 * decoration). The geometry is exact and worth stating, because it is not
 * guessable from the screenshot:
 *
 *   box        56 tall, padding 8v/16h, radius 16, 2px border, bg surface.primary
 *   inner      40 tall
 *   label      top 0,      bodyLarge 16/24 when resting · labelLarge 13/16 floated
 *   input      top 16,     24 tall (bodyLarge 16/24), cursor 24
 *   hint       top 18,     bodyLarge — only when floated AND empty
 *
 * The label floats on focus OR on non-empty text. That means an unfocused field
 * with content still shows the floated label — that is the source's
 * `_shouldFloat`, and it is the single most common way to get this component
 * wrong.
 *
 * The border is TRANSPARENT when idle, error wins over focus, and it is 2px in
 * every state so nothing shifts by a pixel as you tab through a form.
 */
export type AppTextFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hintText?: string;
  errorText?: string | null;
  disabled?: boolean;
  prefixIcon?: ReactNode;
  suffixIcon?: ReactNode;
  type?: InputHTMLAttributes<HTMLInputElement>['type'];
  inputMode?: InputHTMLAttributes<HTMLInputElement>['inputMode'];
  autoComplete?: string;
  maxLength?: number;
  autoFocus?: boolean;
  onEnter?: () => void;
  className?: string;
};

export function AppTextField({
  label,
  value,
  onChange,
  hintText,
  errorText,
  disabled = false,
  prefixIcon,
  suffixIcon,
  type = 'text',
  inputMode,
  autoComplete,
  maxLength,
  autoFocus,
  onEnter,
  className,
}: AppTextFieldProps) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const id = useId();

  const shouldFloat = focused || value.length > 0;

  return (
    <div className={cn('flex flex-col', className)}>
      <div
        onClick={() => {
          if (!disabled) inputRef.current?.focus();
        }}
        style={{
          height: 56,
          display: 'flex',
          alignItems: 'center',
          gap: prefixIcon || suffixIcon ? 8 : 0,
          padding: '8px 16px',
          background: 'var(--surface-primary)',
          borderRadius: 16,
          border: `2px solid ${
            errorText
              ? 'var(--border-error)'
              : focused
                ? 'var(--border-focus)'
                : 'transparent'
          }`,
        }}
      >
        {prefixIcon}

        <div style={{ position: 'relative', flex: 1, minWidth: 0, height: '100%' }}>
          <input
            id={id}
            ref={inputRef}
            type={type}
            inputMode={inputMode}
            autoComplete={autoComplete}
            maxLength={maxLength}
            autoFocus={autoFocus}
            disabled={disabled}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && onEnter) {
                e.preventDefault();
                onEnter();
              }
            }}
            aria-label={label}
            style={{
              position: 'absolute',
              inset: '16px 0 0 0',
              width: '100%',
              height: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              padding: 0,
              caretColor: 'var(--border-action-hover)',
              color: 'var(--text-body)',
              fontSize: 16,
              lineHeight: '24px',
              letterSpacing: '-0.24px',
              fontWeight: 500,
            }}
          />

          <span
            aria-hidden
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              pointerEvents: 'none',
              transition: 'font-size 120ms ease, line-height 120ms ease',
              color: 'var(--text-body-light)',
              ...(shouldFloat
                ? { fontSize: 13, lineHeight: '16px', letterSpacing: '-0.24px' }
                : { fontSize: 16, lineHeight: '24px', letterSpacing: '-0.24px' }),
            }}
          >
            {label}
          </span>

          {hintText && shouldFloat && value.length === 0 ? (
            <span
              aria-hidden
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 18,
                pointerEvents: 'none',
                color: 'var(--text-body-light)',
                fontSize: 16,
                lineHeight: '24px',
                letterSpacing: '-0.24px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {hintText}
            </span>
          ) : null}
        </div>

        {suffixIcon}
      </div>

      {errorText ? (
        <span
          className="type-body-md"
          style={{ marginTop: 2, color: 'var(--text-error)' }}
        >
          {errorText}
        </span>
      ) : null}
    </div>
  );
}
