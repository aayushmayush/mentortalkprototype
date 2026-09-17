'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AppBottomSheet,
  AppBottomSheetHeader,
  AppButton,
  AppIcon,
  AppListTile,
  AppTextField,
  AppTopBar,
  PagePadding,
} from '@/design-system';
import { useOnboarding } from '@/lib/state/onboarding-provider';
import { DEMO_EDUCATION, useDemo } from '@/lib/state/demo-provider';
import { copy } from '@/lib/copy';

/**
 * Add Education — port of `ui/onboarding/pages/add_education_page.dart`.
 *
 * Reached by `Navigator.push` from the education step — the method is named
 * `_showAddEducationSheet` but it is a full page, not a sheet. Modelled as a
 * real route here, which also makes it deep-linkable from the screen index.
 *
 * Two things worth noting:
 *
 * 1. **The Save button is gated on institution AND degree only.** Field of
 *    study and the years are genuinely optional — `_canSave` never looks at
 *    them, and the years are parsed with `int.tryParse`, so non-numeric text
 *    silently becomes null rather than erroring.
 * 2. **The degree field is a disabled text field that opens a sheet.** The
 *    source wraps the `AppTextField` in an `AbsorbPointer` so the field itself
 *    cannot take focus, and puts a `chevron_down` in the suffix — the tap is
 *    caught by a `GestureDetector` around it. That is why it reads as a
 *    dropdown while being a text field.
 *
 * The degree list is the source's own 23 entries, in its order.
 */
const DEGREES = [
  '10th / SSC',
  '12th / HSC',
  'Diploma',
  'B.Tech',
  'B.E.',
  'B.Sc',
  'B.Com',
  'BBA',
  'BA',
  'MBBS',
  'BDS',
  'B.Pharma',
  'LLB',
  'M.Tech',
  'M.Sc',
  'M.Com',
  'MBA',
  'MA',
  'MD',
  'CA',
  'CS',
  'PhD',
  'Other',
];

export default function AddEducationPage() {
  const router = useRouter();
  const { addEducation } = useOnboarding();
  const { autofill, ready } = useDemo();

  const [institution, setInstitution] = useState('');
  const [degree, setDegree] = useState<string | null>(null);
  const [fieldOfStudy, setFieldOfStudy] = useState('');
  const [startYear, setStartYear] = useState('');
  const [endYear, setEndYear] = useState('');
  const [degreeSheetOpen, setDegreeSheetOpen] = useState(false);

  // Prototype chrome: arrive filled so Save is live immediately.
  useEffect(() => {
    if (!ready || !autofill) return;
    setInstitution((v) => (v === '' ? DEMO_EDUCATION.institution : v));
    setDegree((v) => v ?? DEMO_EDUCATION.degree);
    setFieldOfStudy((v) => (v === '' ? DEMO_EDUCATION.fieldOfStudy : v));
    setStartYear((v) => (v === '' ? DEMO_EDUCATION.startYear : v));
    setEndYear((v) => (v === '' ? DEMO_EDUCATION.endYear : v));
  }, [ready, autofill]);

  const canSave = institution.trim().length > 0 && degree !== null;

  function handleSave() {
    if (!canSave) return;
    addEducation({
      institution: institution.trim(),
      degree: degree!,
      fieldOfStudy: fieldOfStudy.trim(),
      startYear: startYear.trim(),
      endYear: endYear.trim(),
    });
    // `Navigator.pop(context)` — the entry lands on the step behind.
    router.push('/onboarding?step=education');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <AppTopBar
        title={copy.addEducation}
        onBack={() => router.push('/onboarding?step=education')}
      />

      <div
        className="no-scrollbar"
        style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}
      >
        {/* Note: 16px gutters here, unlike the wizard's 24. */}
        <PagePadding>
          <div style={{ height: 16 }} />

          <AppTextField
            label={copy.institutionNameRequired}
            value={institution}
            onChange={setInstitution}
          />

          <div style={{ height: 'var(--spacing-sm)' }} />

          <div onClick={() => setDegreeSheetOpen(true)} style={{ cursor: 'pointer' }}>
            {/* AbsorbPointer + chevron_down suffix, per the source. */}
            <AppTextField
              label={copy.degreeRequired}
              value={degree ?? ''}
              onChange={() => {}}
              suffixIcon={
                <AppIcon name="chevronDown" size="md" color="var(--icon-primary)" />
              }
            />
          </div>

          <div style={{ height: 'var(--spacing-sm)' }} />

          <AppTextField
            label={copy.fieldOfStudy}
            value={fieldOfStudy}
            onChange={setFieldOfStudy}
          />

          <div style={{ height: 'var(--spacing-sm)' }} />

          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <AppTextField
                label={copy.startYear}
                value={startYear}
                onChange={setStartYear}
                maxLength={4}
                inputMode="numeric"
              />
            </div>
            <div style={{ flex: 1 }}>
              <AppTextField
                label={copy.endYear}
                value={endYear}
                onChange={setEndYear}
                maxLength={4}
                inputMode="numeric"
              />
            </div>
          </div>

          <div style={{ height: 'var(--spacing-lg)' }} />
        </PagePadding>
      </div>

      <PagePadding>
        <AppButton
          label={copy.save}
          fullWidth
          disabled={!canSave}
          onClick={handleSave}
        />
        <div style={{ height: 16 }} />
      </PagePadding>

      {/* The degree picker: a plain checkable list, not the radio sheet that
          AppDropdownField builds — hence the bespoke sheet here. */}
      <AppBottomSheet
        open={degreeSheetOpen}
        onClose={() => setDegreeSheetOpen(false)}
        heightFraction={0.7}
      >
        <AppBottomSheetHeader
          title={copy.degreeRequired}
          closeLabel={copy.close}
          onClose={() => setDegreeSheetOpen(false)}
        />
        <div
          className="no-scrollbar"
          style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 16px 16px' }}
        >
          {/*
            The source builds this as `ListView(children: _degrees.map(ListTile(
            title, trailing: check when selected, onTap: pop(d))))` — a plain
            list of tiles, NOT the radio sheet `AppDropdownField` builds and not
            the pill chips `AppCheckbox` renders. Hence the bespoke sheet.
          */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {DEGREES.map((d) => (
              <AppListTile
                key={d}
                title={d}
                onClick={() => {
                  setDegree(d);
                  setDegreeSheetOpen(false);
                }}
                trailing={
                  degree === d ? (
                    <AppIcon name="check" size="sm" color="var(--icon-action)" />
                  ) : undefined
                }
              />
            ))}
          </div>
        </div>
      </AppBottomSheet>
    </div>
  );
}
