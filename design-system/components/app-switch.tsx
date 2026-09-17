'use client';

/**
 * AppSwitch — port of design_system/lib/core/components/app_switch.dart
 *
 * Fixed 64×32 track (not Material's default), radius fully round, and a border
 * of width 0 in both states — the source explicitly zeroes the track outline,
 * so there is no hairline ring around the track.
 *
 * Thumb is `icon.onAction` (white) in BOTH states; only the track changes.
 * Off-track is `surface.disabled`, on-track is `icon.action` (brand blue).
 */
export type AppSwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  className?: string;
};

const TRACK_W = 64;
const TRACK_H = 32;
const THUMB = 24;
const INSET = (TRACK_H - THUMB) / 2;

export function AppSwitch({
  checked,
  onChange,
  disabled = false,
  label,
  className,
}: AppSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={className}
      style={{
        position: 'relative',
        width: TRACK_W,
        height: TRACK_H,
        flexShrink: 0,
        borderRadius: TRACK_H / 2,
        border: 'none',
        background: checked ? 'var(--icon-action)' : 'var(--surface-disabled)',
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'default' : 'pointer',
        transition: 'background 180ms var(--ease-out)',
        padding: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: INSET,
          left: checked ? TRACK_W - THUMB - INSET : INSET,
          width: THUMB,
          height: THUMB,
          borderRadius: '50%',
          background: 'var(--icon-on-action)',
          transition: 'left 180ms var(--ease-out)',
        }}
      />
    </button>
  );
}
