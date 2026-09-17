'use client';

import { useEffect, useState } from 'react';
import { AppIcon, AppTextField } from '@/design-system';
import { useOnboarding } from '@/lib/state/onboarding-provider';
import {
  DEMO_NAME,
  DEMO_REFERRAL,
  DEMO_USERNAME,
  useDemo,
} from '@/lib/state/demo-provider';
import { copy } from '@/lib/copy';
import { generateUsername, validateUsername } from '@/lib/username';
import { StepHeading, WizardLayout } from './wizard-layout';

/**
 * Step 1 — port of `ui/onboarding/pages/basic_info_page.dart`.
 *
 * Two validation layers, and the difference matters:
 *
 * - `_isFormValid` (both fields non-empty) gates the Next button, so it is
 *   DISABLED until you have typed something in each. The button being disabled
 *   is the first feedback, not an error message.
 * - `_validate()` on press adds the messages: name required, then username
 *   required, then the `UsernameValidator` format rules.
 *
 * The username field carries a refresh suffix that generates a
 * `swift_hawk_4821`-style handle — a raw `Icons.refresh_rounded` in the source,
 * not an `AppIcons` constant.
 *
 * The referral field is optional and prefilled from Play-install attribution in
 * production. The prototype has no Play referrer, so the demo value stands in
 * for it when Autofill is on — and erasing it here does not write back to
 * prefs, because there are none.
 */
export function BasicInfoStep() {
  const {
    state,
    basicInfo,
    setBasicInfo,
    submitBasicInfo,
  } = useOnboarding();
  const { autofill, ready } = useDemo();

  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [referral, setReferral] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  const isSubmitting =
    state.status === 'basicInfoStep' ? state.isSubmitting : false;
  const serverUsernameError =
    state.status === 'basicInfoStep' ? state.usernameError : null;

  // Prototype chrome: arrive filled so the wizard can be clicked through.
  useEffect(() => {
    if (!ready || !autofill) return;
    setName((v) => (v === '' ? DEMO_NAME : v));
    setUsername((v) => (v === '' ? DEMO_USERNAME : v));
    setReferral((v) => (v === '' ? DEMO_REFERRAL : v));
  }, [ready, autofill]);

  // The bloc reports an unavailable username back through the step's props
  // (`didUpdateWidget` in the source sets `_usernameError` from it).
  useEffect(() => {
    if (serverUsernameError) setUsernameError(serverUsernameError);
  }, [serverUsernameError]);

  const isFormValid = name.trim().length > 0 && username.trim().length > 0;

  function handleNext() {
    let valid = true;
    setNameError(null);
    setUsernameError(null);

    if (name.trim().length === 0) {
      setNameError(copy.nameRequired);
      valid = false;
    }

    const u = username.trim();
    if (u.length === 0) {
      setUsernameError(copy.usernameRequired);
      valid = false;
    } else {
      const formatError = validateUsername(u);
      if (formatError) {
        setUsernameError(formatError);
        valid = false;
      }
    }

    if (!valid) return;

    setBasicInfo({ fullName: name.trim(), username: u });
    submitBasicInfo();
  }

  return (
    <WizardLayout
      currentStep={0}
      // No back button on step 1 — there is nowhere behind it, which is why
      // `AppTopBar` is given no handler here.
      buttonLabel={copy.next}
      onButton={handleNext}
      buttonDisabled={!isFormValid || isSubmitting}
    >
      <StepHeading title={copy.basicInformation} subtitle={copy.basicInfoSubtitle} />

      <AppTextField
        label={copy.fullName}
        value={name}
        onChange={(v) => {
          setName(v);
          if (nameError) setNameError(null);
        }}
        errorText={nameError}
      />

      <div style={{ height: 'var(--spacing-sm)' }} />

      <AppTextField
        label={copy.username}
        value={username}
        onChange={(v) => {
          setUsername(v);
          if (usernameError) setUsernameError(null);
        }}
        errorText={usernameError}
        maxLength={30}
        suffixIcon={
          <button
            type="button"
            aria-label="Generate a username"
            onClick={() => {
              setUsername(generateUsername());
              setUsernameError(null);
            }}
            style={{ display: 'flex', alignItems: 'center' }}
          >
            <AppIcon name="refresh" size="sm" color="var(--text-body-light)" />
          </button>
        }
      />

      <div style={{ height: 'var(--spacing-sm)' }} />

      <AppTextField
        label={copy.referralCodeOptional}
        value={referral}
        onChange={setReferral}
      />
    </WizardLayout>
  );
}
