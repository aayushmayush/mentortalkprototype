/**
 * AppOnlineBadge — port of
 * design_system/lib/core/components/app_online_badge.dart
 *
 * The presence dot overlaid on an avatar. Renders NOTHING when the mentor is
 * offline — not a grey dot, nothing — which is why it is safe to pass
 * unconditionally as `<AppAvatar badge={<AppOnlineBadge ... />} />`.
 *
 * The colours are two unnamed hexes in the source (there is no token for them),
 * collected as --status-online / --status-busy in colors.css.
 *
 * Absolutely positioned bottom-right, with a 2px ring in the page colour so the
 * dot reads as separate from the photo behind it.
 */
export type AppOnlineBadgeProps = {
  isOnline?: boolean;
  isBusy?: boolean;
  size?: number;
};

export function AppOnlineBadge({
  isOnline = false,
  isBusy = false,
  size = 12,
}: AppOnlineBadgeProps) {
  if (!isOnline && !isBusy) return null;

  return (
    <span
      aria-hidden
      style={{
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: size,
        height: size,
        borderRadius: '50%',
        background: isOnline ? 'var(--status-online)' : 'var(--status-busy)',
        border: '2px solid var(--surface-page)',
      }}
    />
  );
}
