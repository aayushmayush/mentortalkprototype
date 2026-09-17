'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AppButton,
  AppRadio,
  AppRadioGroup,
  AppTextField,
  AppTopBar,
} from '@/design-system';
import { copy } from '@/lib/copy';
import { formatInr } from '@/lib/rates';
import { useSnackbar } from '@/lib/state/snackbar-provider';
import { useWallet } from '@/lib/state/wallet-provider';

/**
 * AddBalancePage — port of `ui/wallet/pages/add_balance_page.dart`.
 *
 * An amount field, six preset chips, and a Proceed button that hands off to
 * Razorpay. There is no Razorpay here, so the "checkout" is a simulated
 * round-trip that credits the wallet — the one place in T4 where the prototype
 * invents behaviour rather than transcribing it, because the alternative is a
 * button that does nothing.
 *
 * ── The preset chips are `AppRadio`s, and the AMOUNT is the selection ───────
 *
 * Not `ChoiceChip`s and not a segmented control: each chip is an
 * `AppRadio<int>` whose `value` is the rupee amount, inside an
 * `AppRadioGroup<int>` inside a `Wrap`. That is why the group is keyed on the
 * selection in the source (`key: ValueKey(_selectedPreset)`) — the Dart group
 * is UNCONTROLLED and holds its own state, so it has to be rebuilt when typing
 * changes which preset is active. This prototype's group is controlled, so the
 * key is unnecessary and the selection is derived instead:
 *
 *     selectedPreset = _presetAmounts.contains(entered) ? entered : null
 *
 * which is what `_onAmountChanged` computes. Typing `100` lights the ₹100 chip;
 * typing `101` lights none.
 *
 * ── Two amount limits, and they disagree with the chips ─────────────────────
 *
 * The smallest preset is ₹50, but the minimum the button accepts is ₹30 — so a
 * typed ₹30 is valid and matches no chip. The maximum is ₹10,000 and no preset
 * comes near it. Both bounds are snackbars, not disabled buttons: the source
 * leaves Proceed enabled and tells you off after the tap.
 *
 * ── `AmountChip` is dead code, and is NOT ported ────────────────────────────
 *
 * `ui/wallet/widgets/amount_chip.dart` defines a pill-shaped amount selector
 * with a radio glyph and a `₹` prefix. Nothing in either app constructs one —
 * `AddBalancePage` uses `AppRadio` instead — so it is not ported here. Noted
 * because a reviewer will find the file and wonder where it went.
 */

/** `_presetAmounts`. */
const PRESET_AMOUNTS = [50, 100, 200, 500, 1000, 2000];

const MIN_RECHARGE = 30;
const MAX_RECHARGE = 10000;

export function AddBalancePage() {
  const router = useRouter();
  const { credit, balance } = useWallet();
  const { show } = useSnackbar();

  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const entered = Number.parseInt(amount.trim(), 10) || 0;
  const selectedPreset = PRESET_AMOUNTS.includes(entered) ? entered : null;

  const selectPreset = (value: number) => setAmount(String(value));

  /**
   * `_onProceed`, with the Razorpay hop replaced.
   *
   * The real flow is create-order → open checkout → verify → `pop(true)`, and
   * the caller reloads the list on that `true`. Here it is a 1.2s "order" and
   * then a credit, then a snackbar carrying the new balance — the source's
   * `paymentSuccessful` message takes `{balance}` and it is the balance AFTER
   * the top-up, not before.
   */
  const onProceed = useCallback(() => {
    if (entered < MIN_RECHARGE) {
      show(copy.minRechargeAmount);
      return;
    }
    if (entered > MAX_RECHARGE) {
      show(copy.maxRechargeAmount);
      return;
    }

    setIsLoading(true);
    window.setTimeout(() => {
      credit(entered);
      setIsLoading(false);
      // `newBalance.inr` — the balance the backend reports back after crediting.
      const newBalance = balance + entered;
      show(
        copy.paymentSuccessful.replace('{balance}', formatInr(newBalance)),
      );
      router.push('/wallet');
    }, 1200);
  }, [entered, credit, balance, show, router]);

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--surface-page)',
      }}
    >
      {/*
        `onBackPressed: isLoading ? null : pop` — the bar's back button goes
        dead while the order is in flight. There is no blocking dialog and no
        PopScope: the comment above it in the source says the webhook and the
        pending-payment store make it safe to leave, so nothing blocks the
        route out. Only this button is disabled.
      */}
      <AppTopBar
        title={copy.addBalance}
        onBack={isLoading ? undefined : () => router.back()}
      />

      <div
        className="no-scrollbar"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          padding: '0 16px',
        }}
      >
        <div style={{ height: 16 }} />

        {/* ── Amount input ──
             `maxLength: 5` and digits-only. The ₹ is a prefixIcon, not part of
             the value. */}
        <AppTextField
          label={copy.enterAmount}
          hintText="0"
          value={amount}
          onChange={setAmount}
          inputMode="numeric"
          maxLength={5}
          prefixIcon={
            <span
              className="type-body-lg type-emphasis-semibold"
              style={{ color: 'var(--text-heading)' }}
            >
              ₹
            </span>
          }
        />

        <div style={{ height: 24 }} />

        {/* ── Preset chips ──
             A `Wrap(spacing: 8, runSpacing: 8)` of intrinsically-sized radios.
             `fit-content` is the browser's `IntrinsicWidth`. */}
        <AppRadioGroup value={selectedPreset} onChange={(v) => selectPreset(v as number)}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {PRESET_AMOUNTS.map((preset) => (
              <AppRadio
                key={preset}
                value={preset}
                title={`₹${preset}`}
                className="w-fit"
              />
            ))}
          </div>
        </AppRadioGroup>

        <div style={{ height: 32 }} />

        <AppButton
          label={copy.proceedToPay}
          isLoading={isLoading}
          disabled={isLoading}
          fullWidth
          onClick={onProceed}
        />

        <div style={{ height: 24 }} />
      </div>
    </div>
  );
}
