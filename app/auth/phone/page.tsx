'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppButton, AppTextField, AppTopBar, PagePadding } from '@/design-system';
import { useAuth } from '@/lib/state/auth-provider';
import { DEMO_PHONE, useDemo } from '@/lib/state/demo-provider';
import { copy } from '@/lib/copy';

/**
 * Phone input — port of `core/lib/auth/ui/widgets/phone_input_page.dart`.
 *
 * The validation contract, transcribed exactly:
 *
 * - Errors appear **only after the first submit**. `_hasSubmittedOnce` gates
 *   the listener, so typing a first digit does not immediately shout at you —
 *   a behaviour that is easy to "simplify" away and immediately regret.
 * - Three distinct messages, checked in order: empty → length ≠ 10 → fails
 *   `^[6-9]\d{9}$`. The third is what rejects a 10-digit number starting 0–5.
 * - `maxLength: 10` on the field, so the length branch is only reachable by
 *   pasting or by the field being cleared.
 *
 * The prefix is a plain `Text('+91')` in bodyLarge bold — not an image or an
 * icon — which is why it inherits the field's text colour.
 */
export default function PhoneInputPage() {
  const router = useRouter();
  const { submitPhone, back, state } = useAuth();
  const { autofill, ready } = useDemo();
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [hasSubmittedOnce, setHasSubmittedOnce] = useState(false);
  const isLoading = state.status === 'loading';

  /**
   * Prototype chrome, not app behaviour: with Autofill on the field arrives
   * filled so the flow can be clicked straight through. Gated on `ready` so a
   * stored "off" is honoured, and on `phone === ''` so it never overwrites
   * something already typed.
   */
  useEffect(() => {
    if (ready && autofill && phone === '') setPhone(DEMO_PHONE);
  }, [ready, autofill, phone]);

  function validate(value: string): string | null {
    const v = value.trim();
    if (v.length === 0) return copy.phoneNumberRequired;
    if (v.length !== 10) return copy.phoneNumberInvalidLength;
    if (!/^[6-9]\d{9}$/.test(v)) return copy.phoneNumberInvalidFormat;
    return null;
  }

  function handleChange(next: string) {
    setPhone(next);
    // `_onInputChanged` — re-validate live, but only once the user has been
    // told there is a problem at least once.
    if (hasSubmittedOnce) setError(validate(next));
  }

  function handleSendOtp() {
    setHasSubmittedOnce(true);
    const message = validate(phone);
    setError(message);
    if (message) return;

    submitPhone(phone.trim());
    router.push('/auth/otp');
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <AppTopBar
        onBack={() => {
          back();
          router.push('/get-started');
        }}
      />

      <PagePadding style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: 12 }} />

        <h1 className="type-headline-lg type-emphasis-semibold" style={{ color: 'var(--text-heading)' }}>
          {copy.enterYourPhoneNumber}
        </h1>

        <div style={{ height: 4 }} />

        <p className="type-body-md" style={{ color: 'var(--text-body-light)' }}>
          {copy.phoneVerificationSubtitle}
        </p>

        <div style={{ height: 32 }} />

        <AppTextField
          label={copy.phoneNumber}
          value={phone}
          onChange={handleChange}
          errorText={error}
          maxLength={10}
          inputMode="numeric"
          // The source passes a plain `Text('+91')` in bodyLarge bold here,
          // not an icon — so it inherits the field's own text colour.
          prefixIcon={
            <span className="type-body-lg type-emphasis-bold" style={{ color: 'var(--text-body)' }}>
              +91
            </span>
          }
        />

        {/* Spacer() — bottom-pins the button. */}
        <div style={{ flex: 1 }} />

        <AppButton label={copy.verify} fullWidth isLoading={isLoading} onClick={handleSendOtp} />

        {/* One button-height of clearance at the bottom. */}
        <div style={{ height: 48 }} />
      </PagePadding>
    </div>
  );
}
