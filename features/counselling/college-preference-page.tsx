'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppButton, AppIcon } from '@/design-system';
import type { CollegeType } from '@/lib/counselling/intake';
import { useCounselling } from '@/lib/state/counselling-provider';
import { CounsellingTopBar, ProgressBar } from './counselling-chrome';

/**
 * CollegePreferencePage — port of
 * `ui/counselling/pages/college_preference_page.dart`.
 *
 * Step 2: Government or Private/Deemed, over a 66% bar, with a Back and a
 * "Connect with a Counsellor" button pinned to the bottom.
 *
 * ── The two buttons are 1:2, not 50/50 ──────────────────────────────────────
 *
 * `Expanded(child: Back)` next to `Expanded(flex: 2, child: Connect…)`, so Canc
 * gets a third of the width and the primary action gets two thirds. Worth
 * stating because it is the only asymmetric button row in the app and it is
 * easy to "tidy" into an even split.
 *
 * ── Connect is DISABLED until something is selected ─────────────────────────
 *
 * `onPressed: _selected == null ? null : _onConnect`. This is the one place the
 * flow blocks rather than nudges — the intake page's Next is always enabled.
 *
 * ── The selection is NOT written back until Connect ─────────────────────────
 *
 * `_selected` is local; `widget.data.collegeType` is only assigned inside
 * `_onConnect`. So Back leaves `collegeType` as it was, and the buttons' own
 * Back and the app bar's back arrow do the same thing — both `pop`. The screen
 * has four ways to leave and three of them discard the tap.
 *
 * ── A `Spacer` between the options and the buttons ──────────────────────────
 *
 * The body is a `Column` with a `Spacer()` before the button row, so the
 * buttons sit at the bottom of the screen whatever the content height. That is
 * why this page is a fixed-height column and not a scroll view — unlike the
 * intake page, which is a scroll view and has no pinned footer.
 */

export function CollegePreferencePage() {
  const router = useRouter();
  const { data, update } = useCounselling();

  // `_selected = widget.data.collegeType` in `initState` — the second visit
  // shows what you picked the first time, even though Back discarded it.
  const [selected, setSelected] = useState<CollegeType | null>(data?.collegeType ?? null);

  const onConnect = () => {
    update({ collegeType: selected });
    router.push('/counselling/counsellor');
  };

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--surface-page)',
      }}
    >
      {/* No title on this bar — just the arrow. */}
      <CounsellingTopBar onBack={() => router.back()} />

      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
          padding: '0 16px',
        }}
      >
        <ProgressBar value={0.66} />

        <div style={{ height: 24 }} />

        <div
          className="type-headline-sm type-emphasis-bold"
          style={{ color: 'var(--text-heading)' }}
        >
          College Preference
        </div>

        <div style={{ height: 6 }} />

        <div className="type-body-md" style={{ color: 'var(--text-body-light)' }}>
          Select the type of institution you are aiming for.
        </div>

        <div style={{ height: 24 }} />

        <CollegeOption
          icon="accountBalance"
          title="Government College"
          subtitle="Seats in govt/aided institutions"
          isSelected={selected === 'government'}
          onTap={() => setSelected('government')}
        />

        <div style={{ height: 12 }} />

        {/* `Icons.apartment_rounded` — the glyph that had to be added to the
            icon table for this screen; nothing else in either app uses it. */}
        <CollegeOption
          icon="apartment"
          title="Private/Deemed College"
          subtitle="Management quota & fee support"
          isSelected={selected === 'private'}
          onTap={() => setSelected('private')}
        />

        {/* `Spacer()` — the buttons stay at the bottom regardless of height. */}
        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <AppButton label="Back" type="outlined" fullWidth onClick={() => router.back()} />
          </div>
          <div style={{ flex: 2 }}>
            <AppButton
              label="Connect with a Counsellor"
              fullWidth
              disabled={selected === null}
              onClick={onConnect}
            />
          </div>
        </div>

        <div style={{ height: 24 }} />
      </div>
    </div>
  );
}

/**
 * `_CollegeOption` — a full-width card, radius 14, with the glyph in
 * `surface.action`, a title and subtitle, and a radio glyph on the right.
 *
 * The trailing glyph is a raw `Icons.radio_button_checked` /
 * `radio_button_unchecked`, NOT the design system's `AppRadio` — so it is a
 * display-only indicator here, and the whole card is the tap target (there is
 * no `AppRadioGroup`). Selected adds a 1.5px `surface.action` border and
 * `surface.action` on the glyph; the border width changes with selection.
 */
function CollegeOption({
  icon,
  title,
  subtitle,
  isSelected,
  onTap,
}: {
  icon: 'accountBalance' | 'apartment';
  title: string;
  subtitle: string;
  isSelected: boolean;
  onTap: () => void;
}) {
  return (
    <div
      onClick={onTap}
      style={{
        width: '100%',
        padding: 16,
        background: 'var(--surface-primary)',
        borderRadius: 14,
        border: `${isSelected ? 1.5 : 1}px solid ${
          isSelected ? 'var(--surface-action)' : 'var(--border-primary-light)'
        }`,
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
      }}
    >
      <AppIcon name={icon} size="md" color="var(--surface-action)" />

      <div style={{ width: 14 }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          className="type-body-md type-emphasis-semibold"
          style={{ color: 'var(--text-heading)' }}
        >
          {title}
        </div>
        <div style={{ height: 2 }} />
        <div className="type-body-sm" style={{ color: 'var(--text-body-light)' }}>
          {subtitle}
        </div>
      </div>

      <AppIcon
        name={isSelected ? 'radioButtonChecked' : 'radioButtonOff'}
        size="md"
        color={isSelected ? 'var(--surface-action)' : 'var(--icon-secondary)'}
      />
    </div>
  );
}
