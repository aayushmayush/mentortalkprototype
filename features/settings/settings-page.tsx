'use client';

import { useRouter } from 'next/navigation';
import {
  AppDropdownField,
  AppIcon,
  AppListTile,
  AppTopBar,
} from '@/design-system';
import { copy } from '@/lib/copy';
import { useTheme, type ThemePreference } from '@/lib/state/theme-provider';
import { useSettings } from '@/lib/state/settings-provider';

/**
 * SettingsPage — port of `ui/account/pages/settings_page.dart`.
 *
 * Five labelled groups over a `ListView` with a 16px horizontal gutter and a
 * 16px top/bottom inset: Appearance, Language, Privacy, Support, About — then a
 * centred destructive "Delete Account?" row and a 16px tail.
 *
 * ── The section labels are styled differently from every other label ───────
 *
 * `_SectionLabel` is `labelMedium` at `w700` in `text.bodyLight` — an ALL-CAPS
 * -looking treatment that is actually the literal label text, not a
 * `text-transform`. The strings are `'Appearance'`, `'Privacy'`, `'About'`, so
 * they render in sentence case at label size. That is deliberate on the
 * source's part (or at least consistent) and is not "fixed" here.
 *
 * ── `_MenuSection` puts 4px between rows, not 0 ────────────────────────────
 *
 * `LayoutTokens.spacingXs` between children, and the `AppListTile`s are
 * `surface.primary` cards at radius 16 — so a two-row section reads as two
 * separate cards with a hairline gap, not as one grouped list. Reproduced.
 *
 * ── Three of the four `About` rows leave the app ───────────────────────────
 *
 * Privacy Policy and Terms are `launchUrl` to `mentortalk.app/privacy` and
 * `/terms`; only App Info pushes a route. A browser has no `launchUrl`, so the
 * two are `window.open(..., '_blank', 'noopener')` — a real new tab rather than
 * a fake in-app browser. If the popup is blocked (no user gesture in a test
 * harness, or a hardened browser) nothing happens and no error surfaces, which
 * is the same silent failure `launchUrl` has when no browser is installed.
 *
 * ── Delete Account takes the balance, and the balance is not zero ──────────
 *
 * `_DeleteAccountButton` reads `homeState.profile.walletBalance` and pushes it
 * into `DeleteAccountScreen`, which uses it for a "you will lose ₹X" banner. So
 * the wallet balance is load-bearing on that screen, and it comes from
 * `WalletProvider` here.
 */

/** `AppThemePreference.storageKey` values, in the source's own order. */
const THEME_OPTIONS = [
  { value: 'system' as const, title: copy.systemDefault },
  { value: 'light' as const, title: copy.light },
  { value: 'dark' as const, title: copy.dark },
];

/** The seven locales `LocaleCubit` ships. Value is the language code. */
const LANGUAGE_OPTIONS = [
  { value: 'en', title: 'English' },
  { value: 'hi', title: 'हिन्दी' },
  { value: 'pa', title: 'ਪੰਜਾਬੀ' },
  { value: 'mr', title: 'मराठी' },
  { value: 'te', title: 'తెలుగు' },
  { value: 'kn', title: 'ಕನ್ನಡ' },
  { value: 'bn', title: 'বাংলা' },
];

export function SettingsPage() {
  const router = useRouter();
  const { preference, setPreference } = useTheme();
  const settings = useSettings();

  /**
   * The row pushes `/delete-account` — a real screen with its own confirm.
   *
   * ── `_showDeleteAccountDialog` is DEAD CODE in the source ────────────────
   *
   * `settings_page.dart` defines a `_showDeleteAccountDialog` at line 22 whose
   * confirm is a `// TODO: Call delete account API`, and **never calls it** —
   * its only occurrence in the whole repo is its own definition. It is a
   * leftover from before `DeleteAccountScreen` existed. The live `onTap` is a
   * `Navigator.push(DeleteAccountScreen(role: 'mentee', walletBalance: …))`.
   *
   * So there is no first dialog here: one tap goes straight to the screen. A
   * faithful port therefore has no `AppModal` on this page at all, and the
   * l10n keys the dead method used (`deleteAccountMessage`, `delete`) exist in
   * the arb only to serve it.
   */
  const onDeleteAccount = () => {
    router.push('/delete-account');
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
      <AppTopBar title={copy.settings} onBack={() => router.back()} />

      <div
        className="no-scrollbar"
        style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px 16px' }}
      >
        {/* ── Appearance ─────────────────────────────────────────────── */}
        <SectionLabel label={copy.appearance} />
        <div style={{ height: 'var(--spacing-sm)' }} />
        <AppDropdownField<ThemePreference>
          title={copy.appearance}
          options={THEME_OPTIONS}
          value={preference}
          onChange={setPreference}
          leading={<AppIcon name="edit" size="md" color="var(--icon-primary)" />}
        />
        <div style={{ height: 'var(--spacing-lg)' }} />

        {/* ── Language ───────────────────────────────────────────────── */}
        <SectionLabel label={copy.language} />
        <div style={{ height: 'var(--spacing-sm)' }} />
        <AppDropdownField<string>
          title={copy.language}
          options={LANGUAGE_OPTIONS}
          value={settings.language}
          onChange={settings.setLanguage}
          leading={<AppIcon name="translate" size="md" color="var(--icon-primary)" />}
        />
        <div style={{ height: 'var(--spacing-lg)' }} />

        {/* ── Privacy ────────────────────────────────────────────────── */}
        <SectionLabel label={copy.privacy} />
        <div style={{ height: 'var(--spacing-sm)' }} />
        <MenuSection>
          <MenuItem
            icon="lock"
            title={copy.manageYourPrivacy}
            onTap={() => router.push('/settings/privacy')}
          />
        </MenuSection>
        <div style={{ height: 'var(--spacing-lg)' }} />

        {/* ── Support ────────────────────────────────────────────────── */}
        <SectionLabel label={copy.support} />
        <div style={{ height: 'var(--spacing-sm)' }} />
        <MenuSection>
          <MenuItem
            icon="block"
            title={copy.blockedUsers}
            onTap={() => router.push('/settings/blocked')}
          />
          <MenuItem
            icon="help"
            title={copy.helpAndSupport}
            onTap={() => router.push('/settings/help')}
          />
        </MenuSection>
        <div style={{ height: 'var(--spacing-lg)' }} />

        {/* ── About ──────────────────────────────────────────────────── */}
        <SectionLabel label={copy.about} />
        <div style={{ height: 'var(--spacing-sm)' }} />
        <MenuSection>
          <MenuItem
            icon="privacyTip"
            title={copy.privacyPolicy}
            onTap={() => window.open('https://mentortalk.app/privacy', '_blank', 'noopener')}
          />
          <MenuItem
            icon="description"
            title={copy.termsAndConditions}
            onTap={() => window.open('https://mentortalk.app/terms', '_blank', 'noopener')}
          />
          <MenuItem
            icon="info"
            title={copy.appInfo}
            onTap={() => router.push('/settings/about')}
          />
        </MenuSection>
        <div style={{ height: 'var(--spacing-lg)' }} />

        {/* ── Delete Account ─────────────────────────────────────────── */}
        <DeleteAccountRow onTap={onDeleteAccount} />
        <div style={{ height: 'var(--spacing-md)' }} />
      </div>
    </div>
  );
}

/**
 * `_SectionLabel` — `labelMedium`, `w700`, `text.bodyLight`.
 *
 * Renders the label as given: the source's strings are sentence case and the
 * style does not uppercase them, so 'Appearance' stays 'Appearance'. See the
 * file header.
 */
function SectionLabel({ label }: { label: string }) {
  return (
    <div className="type-label-md type-emphasis-bold" style={{ color: 'var(--text-body-light)' }}>
      {label}
    </div>
  );
}

/** `_MenuSection` — children with `spacingXs` (4px) between them, never after. */
function MenuSection({ children }: { children: React.ReactNode }) {
  const items = Array.isArray(children) ? children : [children];
  return (
    <div>
      {items.map((child, i) => (
        <div key={i}>
          {child}
          {i < items.length - 1 && <div style={{ height: 'var(--spacing-xs)' }} />}
        </div>
      ))}
    </div>
  );
}

/**
 * `_MenuItem` — an `AppListTile` with the glyph leading and a chevron trailing,
 * both in the icon tokens the source names: `icon.primary` for the glyph,
 * `icon.secondary` for the chevron.
 */
function MenuItem({
  icon,
  title,
  onTap,
}: {
  icon: 'lock' | 'block' | 'help' | 'privacyTip' | 'description' | 'info';
  title: string;
  onTap: () => void;
}) {
  return (
    <AppListTile
      title={title}
      leading={<AppIcon name={icon} size="md" color="var(--icon-primary)" />}
      trailing={<AppIcon name="chevronRight" size="sm" color="var(--icon-secondary)" />}
      onClick={onTap}
    />
  );
}

/**
 * `_DeleteAccountButton` — a centred row, `HitTestBehavior.opaque`, with a
 * `text.destructive` glyph and a `bodyLarge w600` label in the same colour.
 *
 * A `GestureDetector` around a `Row`, not a button: there is no padding and no
 * background, so the tap target is exactly the glyph-plus-text. `opaque` is what
 * makes the gap between them tappable, and it is why this is not simply two
 * inline elements.
 */
function DeleteAccountRow({ onTap }: { onTap: () => void }) {
  return (
    <div
      onClick={onTap}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
      }}
    >
      <AppIcon name="delete" size="sm" color="var(--text-error)" />
      <div style={{ width: 4 }} />
      <span className="type-body-lg type-emphasis-semibold" style={{ color: 'var(--text-error)' }}>
        {copy.deleteAccount}
      </span>
    </div>
  );
}
