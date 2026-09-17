'use client';

import { useState } from 'react';

/**
 * AppTextAreaField — port of
 * design_system/lib/core/components/app_text_area_field.dart
 *
 * A bordered box with an always-visible (never floating) label, a plain
 * multi-line textarea, and a footer row carrying the error on the left and a
 * live word count on the right.
 *
 * The word count is a real feature, not decoration: intake answers are limited
 * by words (`maxWords`), so the footer must count consistently with the source
 * — trim, split on whitespace, drop empties. A blank or whitespace-only value
 * counts 0, not 1.
 *
 * Radius 16, border 2px, error wins over focus, transparent when idle.
 */
export type AppTextAreaFieldProps = {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  hintText?: string;
  errorText?: string | null;
  maxLines?: number;
  maxWords?: number;
  disabled?: boolean;
  className?: string;
};

export function countWords(value: string): number {
  const trimmed = value.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

export function AppTextAreaField({
  value,
  onChange,
  label,
  hintText = 'Enter your message',
  errorText,
  maxLines = 4,
  maxWords,
  disabled = false,
  className,
}: AppTextAreaFieldProps) {
  const [focused, setFocused] = useState(false);
  const words = countWords(value);

  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          padding: '12px 16px',
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
        {label ? (
          <span
            className="type-label-md"
            style={{ color: 'var(--text-body-light)', display: 'block' }}
          >
            {label}
          </span>
        ) : null}

        <textarea
          value={value}
          disabled={disabled}
          rows={maxLines}
          placeholder={hintText}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          aria-label={label}
          style={{
            marginTop: 8,
            width: '100%',
            resize: 'none',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            padding: 0,
            color: 'var(--text-body)',
            fontSize: 16,
            lineHeight: '24px',
            letterSpacing: '-0.24px',
            fontWeight: 500,
            fontFamily: 'inherit',
          }}
        />
      </div>

      <div
        style={{
          marginTop: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        {errorText ? (
          <span
            className="type-body-sm"
            style={{ flex: 1, color: 'var(--text-error)' }}
          >
            {errorText}
          </span>
        ) : (
          <span style={{ flex: 1 }} />
        )}

        <span className="type-body-sm" style={{ color: 'var(--text-body-light)' }}>
          {maxWords != null ? `${words} / ${maxWords} words` : `${words} words`}
        </span>
      </div>
    </div>
  );
}
