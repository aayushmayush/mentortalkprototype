'use client';

import { AppIcon, type IconName } from '@/design-system';
import { useTheme, type ThemePreference } from '@/lib/state/theme-provider';
import { useDemo, type SessionFault } from '@/lib/state/demo-provider';
import { useSession } from '@/lib/state/session-provider';
import type { SessionType } from '@/lib/session/types';

/**
 * ChromeControls — the review controls floating above the phone.
 *
 * Theme switching is the one control the T0 tier promised, and it lives OUT
 * here rather than in the app's own Settings screen on purpose: a reviewer
 * needs to flip the phone between light and dark while looking at any screen,
 * not only from Settings. The in-app Settings → Appearance control is still
 * built in T5, because the app has one and parity is the goal; the two share
 * the same provider, so they cannot disagree.
 *
 * Autofill lives here for the same reason, and it is the control that keeps
 * this file out of the app: switching it OFF makes every screen behave exactly
 * as production does, validation paths included.
 *
 * ── The two session controls, and why they must live out here ───────────────
 *
 * `sessionFault` picks which failure the *simulated server* answers the next
 * session request with. It is a control rather than a branch in the screens
 * because the decision it stands in for belongs to the backend — the screens
 * merely render whatever answer comes back, exactly as they do in production.
 * See demo-provider.tsx.
 *
 * The incoming-upgrade trigger is the one control with no production analogue
 * at all: in the real app the *mentor's* client raises the request, and there
 * is no mentor here. Without this button the `modeSwitchPending` state — and
 * the confirm modal the chrome pops for it — would be unreachable, and an
 * unreachable state is one nobody can review. It is enabled only while a
 * session is live, because the reducer ignores the action otherwise and a
 * button that silently does nothing reads as broken.
 */
const THEME_OPTIONS: { value: ThemePreference; icon: IconName; label: string }[] = [
  { value: 'light', icon: 'lightMode', label: 'Light' },
  { value: 'dark', icon: 'darkMode', label: 'Dark' },
  { value: 'system', icon: 'brightness', label: 'System' },
];

/**
 * The six answers `session_bloc.dart` maps, plus the happy path. The labels
 * name the SERVER's behaviour, not the screen's, so the control reads as "what
 * should the backend say" rather than "what should the app do".
 */
const FAULT_OPTIONS: { value: SessionFault; label: string }[] = [
  { value: 'none', label: 'none — accepts' },
  { value: 'insufficient', label: '402 insufficient balance' },
  { value: 'rejected', label: 'mentor declines' },
  { value: 'unavailable', label: 'mentor unavailable' },
  { value: 'busy', label: '409 already in a session' },
  { value: 'maintenance', label: '503 no mentors' },
];

export function ChromeControls() {
  const { preference, setPreference, resolved } = useTheme();
  const { autofill, setAutofill, sessionFault, setSessionFault } = useDemo();
  const { state, simulateIncomingSwitch } = useSession();

  const sessionLive =
    state.status === 'active' || state.status === 'inCall';

  return (
    <div
      style={{
        position: 'absolute',
        top: 20,
        right: 24,
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: 4,
        borderRadius: 12,
        background: 'var(--chrome-bg-raised)',
        border: '1px solid var(--chrome-border)',
      }}
    >
      {THEME_OPTIONS.map((option) => {
        const active = preference === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => setPreference(option.value)}
            title={option.label}
            aria-label={option.label}
            aria-pressed={active}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 10px',
              borderRadius: 8,
              background: active ? 'var(--chrome-selected)' : 'transparent',
              color: active ? 'var(--chrome-accent)' : 'var(--chrome-text-muted)',
            }}
          >
            <AppIcon
              name={option.icon}
              size="sm"
              color={active ? 'var(--chrome-accent)' : 'var(--chrome-text-muted)'}
            />
            <span className="type-label-md">{option.label}</span>
          </button>
        );
      })}

      <span
        style={{
          width: 1,
          height: 20,
          background: 'var(--chrome-border)',
          margin: '0 4px',
        }}
      />

      <span
        className="type-label-sm"
        style={{ padding: '0 6px', color: 'var(--chrome-text-faint)' }}
        title="The phone is showing this theme"
      >
        {resolved}
      </span>

      <span
        style={{
          width: 1,
          height: 20,
          background: 'var(--chrome-border)',
          margin: '0 4px',
        }}
      />

      {/*
        Autofill. Default on so the auth and onboarding flows can be clicked
        straight through; turning it off restores production behaviour exactly,
        which is what makes the validation paths reviewable.
      */}
      <button
        type="button"
        onClick={() => setAutofill(!autofill)}
        aria-pressed={autofill}
        title={
          autofill
            ? 'Forms prefill with valid demo values — click to type your own'
            : 'Forms start empty, exactly as production does'
        }
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 10px',
          borderRadius: 8,
          background: autofill ? 'var(--chrome-selected)' : 'transparent',
          color: autofill ? 'var(--chrome-accent)' : 'var(--chrome-text-muted)',
        }}
      >
        <AppIcon
          name="edit"
          size="sm"
          color={autofill ? 'var(--chrome-accent)' : 'var(--chrome-text-muted)'}
        />
        <span className="type-label-md">Autofill</span>
      </button>

      <span
        style={{
          width: 1,
          height: 20,
          background: 'var(--chrome-border)',
          margin: '0 4px',
        }}
      />

      {/*
        The server's next answer to a session request. A native <select> rather
        than a custom menu: it is a review control, it must not look like part
        of the app, and the platform picker is the least ambiguous affordance
        for "choose one of six".
      */}
      <label
        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 4px' }}
        title="What the simulated backend answers the next session request with"
      >
        <AppIcon name="storefront" size="sm" color="var(--chrome-text-muted)" />
        <span className="type-label-md" style={{ color: 'var(--chrome-text-muted)' }}>
          Server
        </span>
        <select
          value={sessionFault}
          onChange={(event) => setSessionFault(event.target.value as SessionFault)}
          style={{
            padding: '6px 8px',
            borderRadius: 8,
            background:
              sessionFault === 'none' ? 'transparent' : 'var(--chrome-selected)',
            color:
              sessionFault === 'none'
                ? 'var(--chrome-text-muted)'
                : 'var(--chrome-accent)',
            border: '1px solid var(--chrome-border)',
            font: 'inherit',
          }}
        >
          {FAULT_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      {/*
        The one control with no production analogue. In the real app the mentor
        asks to upgrade the call; there is no mentor here. Disabled while no
        session is live, because the reducer drops the action otherwise, and a
        button that silently does nothing reads as broken.
      */}
      <button
        type="button"
        disabled={!sessionLive}
        onClick={() => simulateIncomingSwitch(incomingUpgradeType(state.status))}
        title={
          sessionLive
            ? 'Raise an upgrade request as if the mentor sent it'
            : 'Available only while a session is live'
        }
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 10px',
          borderRadius: 8,
          background: 'transparent',
          color: sessionLive ? 'var(--chrome-text-muted)' : 'var(--chrome-text-faint)',
          cursor: sessionLive ? 'pointer' : 'not-allowed',
          opacity: sessionLive ? 1 : 0.5,
        }}
      >
        <AppIcon
          name="videoCamPlus"
          size="sm"
          color={sessionLive ? 'var(--chrome-text-muted)' : 'var(--chrome-text-faint)'}
        />
        <span className="type-label-md">Upgrade</span>
      </button>
    </div>
  );
}

/**
 * Which upgrade the mentor is pretending to ask for. A chat session is offered
 * video — the upgrade the promo flow actually pushes — and anything already in
 * a call is offered audio, so the button always proposes a *change* rather than
 * the state it is already in.
 */
function incomingUpgradeType(status: string): SessionType {
  return status === 'inCall' ? 'audio' : 'video';
}
