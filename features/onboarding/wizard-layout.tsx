'use client';

import type { ReactNode } from 'react';
import { AppButton, AppStepProgressIndicator, AppTopBar } from '@/design-system';
import { copy } from '@/lib/copy';

/**
 * The shape all three onboarding steps share, transcribed from the repeated
 * scaffolding in `basic_info_page.dart`, `category_page.dart` and
 * `education_page.dart`:
 *
 *   Column
 *     AppTopBar('Create Profile')            ← no back button on step 1
 *     Padding(h:24, StepProgressIndicator)   ← note: 24, not PagePadding's 16
 *     Expanded(scroll, padding 24/24/24/0)
 *     Padding(24/12/24/32, full-width button)
 *
 * The two gutters differ on purpose and are worth stating: the step indicator
 * and the scroll body use **24px**, while the rest of the app uses
 * `PagePadding`'s 16px. Reproducing that here once means no step can drift.
 *
 * `currentStep` is 0-indexed, and `AppStepProgressIndicator` treats the step
 * you are ON as complete — so step 0 shows one filled segment, not zero.
 */
export function WizardLayout({
  currentStep,
  onBack,
  children,
  buttonLabel,
  onButton,
  buttonDisabled = false,
  buttonLoading = false,
  footer,
}: {
  currentStep: number;
  onBack?: () => void;
  children: ReactNode;
  buttonLabel: string;
  onButton: () => void;
  buttonDisabled?: boolean;
  buttonLoading?: boolean;
  /** Rendered between the scroll body and the button — e.g. a skip link. */
  footer?: ReactNode;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <AppTopBar title={copy.createProfile} onBack={onBack} />

      <div style={{ padding: '0 24px' }}>
        <AppStepProgressIndicator totalSteps={3} currentStep={currentStep} />
      </div>

      <div
        className="no-scrollbar"
        style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '24px 24px 0' }}
      >
        {children}
      </div>

      {footer}

      <div style={{ padding: '12px 24px 32px' }}>
        <AppButton
          label={buttonLabel}
          fullWidth
          disabled={buttonDisabled}
          isLoading={buttonLoading}
          onClick={onButton}
        />
      </div>
    </div>
  );
}

/** Shared section heading: `headlineSmall` at w700, with a 4px gap to the body. */
export function StepHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <>
      <h2 className="type-headline-sm type-emphasis-bold" style={{ color: 'var(--text-heading)' }}>
        {title}
      </h2>
      <div style={{ height: 4 }} />
      <p className="type-body-md" style={{ color: 'var(--text-body-light)' }}>
        {subtitle}
      </p>
      <div style={{ height: 24 }} />
    </>
  );
}
