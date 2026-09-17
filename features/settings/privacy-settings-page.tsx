'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppLoadingSpinner, AppSwitch, AppTopBar } from '@/design-system';
import { AppErrorView } from '@/components/app-error-view';
import { copy } from '@/lib/copy';
import { useSettings } from '@/lib/state/settings-provider';
import { useSnackbar } from '@/lib/state/snackbar-provider';
import type { PrivacyFlagKey } from '@/lib/fake/privacy';

/**
 * PrivacySettingsPage — port of `ui/account/pages/privacy_settings_page.dart`.
 *
 * Five toggles, each a `surface.primary` card at radius 16 with **8px** vertical
 * and **16px** horizontal padding, title in `bodyLarge w600` over an 8px-gap
 * subtitle in `bodySmall text.bodyLight`, and the `AppSwitch` pinned right.
 *
 * ── All five read from one loaded object, and the page blocks on it ────────
 *
 * The source `switch`es on the cubit state and renders a centred
 * `AppLoadingSpinner.md()` for loading and `AppErrorView(onRetry:)` for error —
 * there is no partial render and no optimistic first paint. So the whole screen
 * is one of three states, and the toggles only exist in the third.
 *
 * `cached` on the widget exists to paint instantly from
 * `UserResponse.privacySettings` while a fresh fetch lands. Nothing in the
 * mentee app passes it — the settings page pushes `PrivacySettingsPage()` bare —
 * so the cached path is dead code and is not reproduced.
 *
 * ── `listenWhen: (prev, curr) => false` ───────────────────────────────────
 *
 * The `BlocConsumer`'s listener is explicitly disabled with a comment saying
 * snackbars are handled at the `setFlag` call site instead. The prototype has no
 * bloc, so this is just a note: the snackbar is fired by the write, not by a
 * state transition, which is why a rolled-back write and a successful one
 * produce different toasts from the same `setFlag` call.
 *
 * ── Two query switches, both for review ───────────────────────────────────
 *
 * `?sim=error` fails the initial load so the `AppErrorView` and its retry are
 * reachable; `?fail=1` rejects every flag write so `privacyUpdateError` is
 * reachable and the switch's rollback is visible. Neither exists in the app.
 */

export function PrivacySettingsPage() {
  const router = useRouter();
  const params = useSearchParams();
  const settings = useSettings();
  const snackbar = useSnackbar();

  const sim = params.get('sim');
  const fail = params.get('fail');
  const { simulate, reload } = settings;

  /**
   * The URL drives the simulation, so a reload of the same URL reproduces the
   * same state — the same contract `/home?sim=` follows.
   */
  useEffect(() => {
    if (sim === 'error') {
      simulate('error');
      return;
    }
    if (fail === '1') {
      simulate('loaded', true);
      return;
    }
    reload();
  }, [sim, fail, simulate, reload]);

  /**
   * `_setFlag` — write, and on `false` show `privacyUpdateError`. The snackbar
   * is the ONLY feedback: the switch's own position is not mentioned, because in
   * the source it does not move back. Here it does (see the provider), and the
   * toast is the same string either way.
   */
  const setFlag = async (key: PrivacyFlagKey, value: boolean) => {
    const ok = await settings.setFlag(key, value);
    if (!ok) {
      snackbar.show(copy.privacyUpdateError);
    }
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
      <AppTopBar title={copy.manageYourPrivacy} onBack={() => router.back()} />

      {settings.status === 'loading' && (
        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AppLoadingSpinner size="md" />
        </div>
      )}

      {settings.status === 'error' && (
        <AppErrorView
          message={settings.errorMessage ?? copy.somethingWentWrongBare}
          onRetry={reload}
        />
      )}

      {settings.status === 'loaded' && (
        <div
          className="no-scrollbar"
          style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px 16px' }}
        >
          <PrivacyToggle
            title={copy.privacyShowNameTitle}
            subtitle={copy.privacyShowNameSubtitle}
            value={settings.privacy.showNameInReviews}
            onChanged={(v) => setFlag('show_name_in_reviews', v)}
          />
          <div style={{ height: 'var(--spacing-md)' }} />

          <PrivacyToggle
            title={copy.privacyChatAccessTitle}
            subtitle={copy.privacyChatAccessSubtitle}
            value={settings.privacy.mentorChatAccess}
            onChanged={(v) => setFlag('mentor_chat_access', v)}
          />
          <div style={{ height: 'var(--spacing-md)' }} />

          <PrivacyToggle
            title={copy.privacyDownloadAccessTitle}
            subtitle={copy.privacyDownloadAccessSubtitle}
            value={settings.privacy.mentorDownloadAccess}
            onChanged={(v) => setFlag('mentor_download_access', v)}
          />
          <div style={{ height: 'var(--spacing-md)' }} />

          <PrivacyToggle
            title={copy.privacyBlockScreenshotsTitle}
            subtitle={copy.privacyBlockScreenshotsSubtitle}
            value={settings.privacy.blockScreenshots}
            onChanged={(v) => setFlag('block_screenshots', v)}
          />
          <div style={{ height: 'var(--spacing-md)' }} />

          <PrivacyToggle
            title={copy.privacyBlockCallRecordingTitle}
            subtitle={copy.privacyBlockCallRecordingSubtitle}
            value={settings.privacy.blockCallRecording}
            onChanged={(v) => setFlag('block_call_recording', v)}
          />
          <div style={{ height: 'var(--spacing-lg)' }} />
        </div>
      )}
    </div>
  );
}

/**
 * `_PrivacyToggle` — the card. Padding is `spacingMd` horizontal and
 * `spacingSm` vertical: 16 and 8, which is the one card in the app whose
 * vertical inset is smaller than its horizontal.
 *
 * The title/subtitle column is `Expanded`, so a long subtitle wraps under the
 * switch rather than pushing it off the card, and the switch keeps its fixed
 * 64×32 track at `spacingMd` to the right.
 */
function PrivacyToggle({
  title,
  subtitle,
  value,
  onChanged,
}: {
  title: string;
  subtitle: string;
  value: boolean;
  onChanged: (value: boolean) => void;
}) {
  return (
    <div
      style={{
        // `spacingSm` vertical (12) over `spacingMd` horizontal (16) — the one
        // card in the app whose vertical inset is smaller than its horizontal.
        padding: '12px 16px',
        background: 'var(--surface-primary)',
        borderRadius: 'var(--ds-radius-sm)',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          className="type-body-lg type-emphasis-semibold"
          style={{ color: 'var(--text-heading)' }}
        >
          {title}
        </div>
        <div style={{ height: 2 }} />
        <div className="type-body-sm" style={{ color: 'var(--text-body-light)' }}>
          {subtitle}
        </div>
      </div>

      <div style={{ width: 'var(--spacing-md)' }} />

      <AppSwitch checked={value} onChange={onChanged} label={title} />
    </div>
  );
}
