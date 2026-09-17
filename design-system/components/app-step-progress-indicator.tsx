/**
 * AppStepProgressIndicator — port of
 * design_system/lib/core/components/app_step_progress_indicator.dart
 *
 * Equal-width segments across the full width, 4 tall, separated by a 16 gap.
 *
 * The fill rule is "completed OR current", i.e. the bar for the step you are ON
 * is already filled — a 3-step wizard on step 0 shows one filled segment, not
 * zero. Segments have no radius in the source; they are hard-edged bars.
 */
export type AppStepProgressIndicatorProps = {
  totalSteps: number;
  /** Zero-based. */
  currentStep: number;
  height?: number;
  gap?: number;
  className?: string;
};

export function AppStepProgressIndicator({
  totalSteps,
  currentStep,
  height = 4,
  gap = 16,
  className,
}: AppStepProgressIndicatorProps) {
  return (
    <div
      className={className}
      role="progressbar"
      aria-valuemin={1}
      aria-valuemax={totalSteps}
      aria-valuenow={Math.min(currentStep + 1, totalSteps)}
      style={{ display: 'flex' }}
    >
      {Array.from({ length: totalSteps }, (_, index) => (
        <div
          key={index}
          style={{
            flex: 1,
            height,
            marginRight: index < totalSteps - 1 ? gap : 0,
            background:
              index <= currentStep ? 'var(--border-action)' : 'var(--surface-primary)',
            transition: 'background 240ms var(--ease-out)',
          }}
        />
      ))}
    </div>
  );
}
