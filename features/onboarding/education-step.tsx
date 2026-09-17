'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppIcon, AppListTile, AppLoadingSpinner } from '@/design-system';
import { useOnboarding } from '@/lib/state/onboarding-provider';
import { DEMO_EDUCATION, useDemo } from '@/lib/state/demo-provider';
import { copy } from '@/lib/copy';
import { StepHeading, WizardLayout } from './wizard-layout';

/**
 * Step 3 — port of `ui/onboarding/pages/education_page.dart`.
 *
 * The button label is conditional and that is the whole point of the step:
 * with no entries it reads **"Skip & Finish"**, with at least one it reads
 * **"Finish"**. Either way it submits — the distinction is purely what the
 * student is told they are doing.
 *
 * Note the order: the "Add Education" card comes BEFORE the saved entries, not
 * after, and the saving row (a list tile with a spinner) sits between them.
 *
 * `_showAddEducationSheet` is a `Navigator.push`, not a bottom sheet despite
 * the name — so it is a real route here (`/onboarding/education/add`), which
 * also makes it deep-linkable from the screen index.
 */
export function EducationStep() {
  const router = useRouter();
  const { state, education, addEducation, removeEducation, submitEducation, back } =
    useOnboarding();
  const { autofill, ready } = useDemo();

  const isSaving = state.status === 'educationStep' && state.isSaving;

  // Prototype chrome: one pre-saved entry so the "Finish" branch is visible.
  useEffect(() => {
    if (!ready || !autofill) return;
    if (education.length > 0) return;
    addEducation(DEMO_EDUCATION);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, autofill]);

  return (
    <WizardLayout
      currentStep={2}
      onBack={back}
      // Entries present → "Finish"; none → "Skip & Finish". Same action.
      buttonLabel={education.length === 0 ? copy.skipAndFinish : copy.finish}
      buttonDisabled={isSaving}
      onButton={submitEducation}
    >
      <StepHeading
        title={copy.academicProfile}
        subtitle={copy.educationPageSubtitle}
      />

      {/* Add card — sits ABOVE the entries in the source. */}
      <button
        type="button"
        onClick={() => router.push('/onboarding/education/add')}
        style={{
          width: '100%',
          padding: 'var(--spacing-md) 0',
          background: 'var(--surface-primary)',
          borderRadius: 16,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 'var(--spacing-2xs)',
        }}
      >
        <AppIcon name="plus" size="md" color="var(--icon-primary)" />
        <span className="type-title-md" style={{ color: 'var(--text-body-light)' }}>
          {copy.addEducation}
        </span>
      </button>

      <div style={{ height: 12 }} />

      {isSaving ? (
        <div style={{ marginBottom: 12 }}>
          <AppListTile
            leading={<AppLoadingSpinner size="md" />}
            title={copy.addingEducation}
          />
        </div>
      ) : null}

      {education.map((entry) => (
        <div key={entry.id} style={{ marginBottom: 12 }}>
          <EducationCard entry={entry} onDelete={() => removeEducation(entry.id)} />
        </div>
      ))}
    </WizardLayout>
  );
}

/**
 * `_EducationCard` — `surface.primary`, radius 16, 16px padding, with a delete
 * affordance on the trailing edge.
 */
function EducationCard({
  entry,
  onDelete,
}: {
  entry: {
    institution: string;
    degree: string;
    fieldOfStudy: string;
    startYear: string;
    endYear: string;
  };
  onDelete: () => void;
}) {
  const yearRange = [entry.startYear, entry.endYear].filter(Boolean).join(' - ');

  return (
    <div
      style={{
        padding: 16,
        background: 'var(--surface-primary)',
        borderRadius: 16,
        display: 'flex',
        alignItems: 'flex-start',
        gap: 8,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="type-title-md type-emphasis-semibold" style={{ color: 'var(--text-heading)' }}>
          {entry.institution}
        </div>

        <div className="type-body-md" style={{ marginTop: 2, color: 'var(--text-body)' }}>
          {entry.degree}
          {entry.fieldOfStudy ? `, ${entry.fieldOfStudy}` : ''}
        </div>

        {yearRange ? (
          <div className="type-body-sm" style={{ marginTop: 2, color: 'var(--text-body-light)' }}>
            {yearRange}
          </div>
        ) : null}
      </div>

      <button type="button" aria-label="Remove this education entry" onClick={onDelete}>
        <AppIcon name="delete" size="sm" color="var(--icon-primary)" />
      </button>
    </div>
  );
}
