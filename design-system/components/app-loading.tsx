/**
 * Loading components — ports of app_loading_spinner.dart,
 * app_loading_indicator.dart and loading_page.dart.
 *
 * Three separate widgets in the source, kept separate here because they are
 * genuinely different sizes and colours:
 *
 *   AppLoadingSpinner   16/24/40, stroke 2/2.5/3, colour icon.action
 *   AppLoadingIndicator 56 by default, stroke 4, colour border.action,
 *                       with an optional message (bodyLarge, text.body)
 *                       and subtitle (bodySmall, text.bodyLight)
 *   LoadingPage         a full page in surface.page wrapping the above
 *
 * Every spinner is a conic sweep on a transparent-to-coloured ring — matching
 * Material's CircularProgressIndicator, which is an arc that grows and shrinks
 * rather than a uniform ring. A plain CSS rotation of a 3/4 ring is the closest
 * cheap equivalent and reads correctly at these sizes.
 */

const SPINNER_SPEC = {
  sm: { size: 16, stroke: 2 },
  md: { size: 24, stroke: 2.5 },
  lg: { size: 40, stroke: 3 },
} as const;

export type AppLoadingSpinnerSize = keyof typeof SPINNER_SPEC;

export function AppLoadingSpinner({
  size = 'md',
  color = 'var(--icon-action)',
  className,
}: {
  size?: AppLoadingSpinnerSize;
  color?: string;
  className?: string;
}) {
  const spec = SPINNER_SPEC[size];

  return (
    <span
      role="status"
      aria-label="Loading"
      className={className}
      style={{
        display: 'inline-block',
        width: spec.size,
        height: spec.size,
        flexShrink: 0,
        borderRadius: '50%',
        border: `${spec.stroke}px solid ${color}`,
        borderTopColor: 'transparent',
        animation: 'spin 800ms linear infinite',
      }}
    />
  );
}

export type AppLoadingIndicatorProps = {
  message?: string;
  subtitle?: string;
  size?: number;
  className?: string;
};

export function AppLoadingIndicator({
  message,
  subtitle,
  size = 56,
  className,
}: AppLoadingIndicatorProps) {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      <span
        role="status"
        aria-label={message ?? 'Loading'}
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          border: '4px solid var(--border-action)',
          borderTopColor: 'transparent',
          animation: 'spin 900ms linear infinite',
        }}
      />
      {message ? (
        <span
          className="type-body-lg"
          style={{ marginTop: 24, color: 'var(--text-body)' }}
        >
          {message}
        </span>
      ) : null}
      {subtitle ? (
        <span
          className="type-body-sm"
          style={{ marginTop: 8, color: 'var(--text-body-light)' }}
        >
          {subtitle}
        </span>
      ) : null}
    </div>
  );
}

export function LoadingPage({
  message,
  className,
}: {
  message: string;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{
        minHeight: '100%',
        background: 'var(--surface-page)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <AppLoadingIndicator message={message} />
    </div>
  );
}
