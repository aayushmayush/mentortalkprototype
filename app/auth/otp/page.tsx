'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppButton, AppTextField, AppTopBar, PagePadding } from '@/design-system';
import { REJECTED_OTP, useAuth } from '@/lib/state/auth-provider';
import { DEMO_OTP, useDemo } from '@/lib/state/demo-provider';
import { copy, fill } from '@/lib/copy';

/**
 * OTP — port of `core/lib/auth/ui/widgets/otp_verification_page.dart`.
 *
 * The timer is the substance of this screen:
 *
 * - 30s cooldown (`_resendCooldown`), which restarts on mount AND again if the
 *   bloc re-emits `AuthAwaitingOtp` (i.e. after a resend).
 * - `_formatTime` renders MM:SS, so the first tick reads `00:30`.
 * - Three visual states for the resend row, and the first is easy to miss:
 *   while `remainingSeconds == 0 && !canResend` — a window that exists for one
 *   frame before the timer starts — the row collapses to an 8px spacer.
 *
 * The source declares `static const _otpExpiry = 120` but never reads it
 * anywhere in the file. Rather than invent a 2-minute expiry UI that production
 * does not have, it is left unimplemented here too — flagged so it is not
 * mistaken for an oversight.
 *
 * Validation mirrors the phone screen: gated behind the first submit, then
 * live. Empty → length ≠ 6 → non-digits.
 */
const RESEND_COOLDOWN_SECONDS = 30;

export default function OtpPage() {
  const router = useRouter();
  const { state, submitOtp, back } = useAuth();
  const phoneNumber = state.status === 'awaitingOtp' ? state.phoneNumber : '';

  const { autofill, ready } = useDemo();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [hasSubmittedOnce, setHasSubmittedOnce] = useState(false);
  const [remaining, setRemaining] = useState(RESEND_COOLDOWN_SECONDS);
  const [canResend, setCanResend] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Prototype chrome — see the phone screen for why this is gated on `ready`.
  useEffect(() => {
    if (ready && autofill && otp === '') setOtp(DEMO_OTP);
  }, [ready, autofill, otp]);

  /**
   * `_startTimer()`. StrictMode double-invokes effects, so the interval is
   * always cleared on the way in as well as on cleanup — otherwise two timers
   * tick the same counter and it runs at double speed in dev.
   */
  const startTimer = useCallback(() => {
    setRemaining(RESEND_COOLDOWN_SECONDS);
    setCanResend(false);
    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev > 0) return prev - 1;
        setCanResend(true);
        if (intervalRef.current) clearInterval(intervalRef.current);
        return 0;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    startTimer();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startTimer]);

  function validate(value: string): string | null {
    const v = value.trim();
    if (v.length === 0) return copy.otpRequired;
    if (v.length !== 6) return copy.otpInvalidLength;
    if (!/^\d{6}$/.test(v)) return copy.otpDigitsOnly;
    return null;
  }

  function handleChange(next: string) {
    setOtp(next);
    if (hasSubmittedOnce) setError(validate(next));
  }

  function handleVerify() {
    setHasSubmittedOnce(true);
    const message = validate(otp);
    setError(message);
    if (message) return;

    // A rejected code sets the error from the bloc's AuthFailure, which is
    // what `BlocListener` writes back into `_otpError`.
    if (otp.trim() === REJECTED_OTP) {
      setError('That code is incorrect. Please check and try again.');
      return;
    }

    submitOtp(otp.trim());
    router.push('/onboarding');
  }

  function handleResend() {
    if (!canResend) return;
    startTimer();
  }

  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <AppTopBar
        onBack={() => {
          back();
          router.push('/auth/phone');
        }}
      />

      <PagePadding style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div style={{ height: 12 }} />

        <h1 className="type-headline-lg type-emphasis-semibold" style={{ color: 'var(--text-heading)' }}>
          {copy.verifyCode}
        </h1>

        <div style={{ height: 4 }} />

        <p className="type-body-md" style={{ color: 'var(--text-body-light)' }}>
          {fill(copy.otpSentMessage, { phoneNumber })}
        </p>

        <div style={{ height: 24 }} />

        <AppTextField
          label={copy.enterOtp}
          value={otp}
          onChange={handleChange}
          errorText={error}
          maxLength={6}
          inputMode="numeric"
          autoFocus
        />

        <div style={{ height: 24 }} />

        <ResendRow
          canResend={canResend}
          remaining={remaining}
          formatted={formatTime(remaining)}
          onResend={handleResend}
        />

        {/* Spacer() — bottom-pins the button. */}
        <div style={{ flex: 1 }} />

        <AppButton label={copy.verify} fullWidth onClick={handleVerify} />

        {/* One button-height of clearance at the bottom. */}
        <div style={{ height: 48 }} />
      </PagePadding>
    </div>
  );
}

/**
 * `_ResendSection` — three states, in the source's own order.
 */
function ResendRow({
  canResend,
  remaining,
  formatted,
  onResend,
}: {
  canResend: boolean;
  remaining: number;
  formatted: string;
  onResend: () => void;
}) {
  if (remaining === 0 && !canResend) {
    return <div style={{ height: 'var(--spacing-xs)' }} />;
  }

  if (canResend) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span className="type-body-md" style={{ color: 'var(--text-body-light)' }}>
          {copy.didntGetCode}
        </span>
        <div style={{ width: 'var(--spacing-2xs)' }} />
        <AppButton label={copy.resendCode} type="plain" size="compact" onClick={onResend} />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      {/*
        `resendCodeIn` is `'Resend Code in '` — trailing space and all, because
        the ARB string has one and the Flutter source splits the line across two
        `Text` widgets exactly like this. It renders there; it does not here.

        CSS trims whitespace at the end of a line, and that trailing space is
        the end of its own span's line, so the gap collapses and the countdown
        butts straight up against "in". `white-space: pre` opts that one span out
        of the trimming, which reproduces Flutter's gap without editing the
        string — the copy stays a faithful transcription of the ARB entry.
      */}
      <span
        className="type-body-md"
        style={{ color: 'var(--text-body-light)', whiteSpace: 'pre' }}
      >
        {copy.resendCodeIn}
      </span>
      <span className="type-body-md type-emphasis-bold" style={{ color: 'var(--text-action)' }}>
        {formatted}
      </span>
    </div>
  );
}
