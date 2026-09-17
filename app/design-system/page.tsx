'use client';

import { useRef, useState } from 'react';
import {
  AppAvatar,
  AppBanner,
  AppBottomBar,
  AppBottomSheet,
  AppBottomSheetHeader,
  AppButton,
  AppCheckbox,
  AppCheckboxGroup,
  AppDropdownField,
  AppIcon,
  AppIconButton,
  AppIconCircle,
  AppListTile,
  AppLoadingIndicator,
  AppLoadingSpinner,
  AppModal,
  AppOnlineBadge,
  AppPrimaryBar,
  AppRadio,
  AppRadioGroup,
  AppStateIndicator,
  AppStepProgressIndicator,
  AppSwitch,
  AppTabBar,
  AppTextAreaField,
  AppTextField,
  AppTopBar,
  LiveBadge,
  PagePadding,
  type AppBannerVariant,
  type AppStateIndicatorType,
} from '@/design-system';

/**
 * /design-system — the component gallery.
 *
 * Not an app screen. It exists so the port can be reviewed against the Flutter
 * package component by component, and so a regression in a shared widget shows
 * up here rather than three tiers later inside a screen. Everything on this
 * page is rendered with the real component, at the real size, on the real
 * surface — no mock-ups.
 */
export default function DesignSystemGallery() {
  const [text, setText] = useState('');
  const [errorText, setErrorText] = useState('9876543210');
  const [area, setArea] = useState('');
  const [radio, setRadio] = useState<unknown>('b');
  const [checks, setChecks] = useState<Set<unknown>>(new Set(['x']));
  const [dropdown, setDropdown] = useState<string | null>(null);
  const [switchOn, setSwitchOn] = useState(true);
  const [tab, setTab] = useState(0);
  const [bottomTab, setBottomTab] = useState(0);
  const [modal, setModal] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [bannerVisible, setBannerVisible] = useState(true);
  const sheetBody = useRef<HTMLDivElement>(null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', paddingBottom: 48 }}>
      <AppPrimaryBar title="Design system" />

      <PagePadding>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <Section title="Top bar" note="64 tall, transparent, 8px gutters">
            <div style={{ background: 'var(--surface-primary)', borderRadius: 16 }}>
              <AppTopBar
                title="Session history"
                onBack={() => {}}
                actions={<AppIconButton name="moreVert" label="More" />}
              />
            </div>
          </Section>

          <Section title="Buttons" note="solid / outlined / plain · compact 32, regular 48 · radius 24">
            <Row>
              <AppButton label="Solid" onClick={() => {}} />
              <AppButton label="Outlined" type="outlined" onClick={() => {}} />
              <AppButton label="Plain" type="plain" onClick={() => {}} />
            </Row>
            <Row>
              <AppButton label="Destructive" type="plain" intent="destructive" onClick={() => {}} />
              <AppButton label="Secondary" type="plain" intent="secondary" onClick={() => {}} />
              <AppButton label="Disabled" />
            </Row>
            <Row>
              <AppButton label="Compact" size="compact" onClick={() => {}} />
              <AppButton label="Loading" isLoading onClick={() => {}} />
            </Row>
            <AppButton label="Full width" fullWidth onClick={() => {}} />
          </Section>

          <Section title="Icon buttons" note="sm 32/20 · md 48/24 · lg 64/48 — note lg's oversized glyph">
            <Row>
              <AppIconButton name="search" size="sm" label="Search" />
              <AppIconButton name="tune" size="md" label="Filter" />
              <AppIconButton name="add" size="lg" label="Add" />
              <AppIconButton name="call" type="filled" size="md" label="Call" />
              <AppIconButton name="chat" type="filled" size="lg" label="Chat" />
            </Row>
          </Section>

          <Section title="Text field" note="56 tall · label floats on focus OR content · 2px border, transparent when idle">
            <AppTextField
              label="Phone number"
              value={errorText}
              onChange={setErrorText}
              hintText="10-digit mobile number"
              errorText={errorText.length > 0 && errorText.length !== 10 ? 'Enter a valid 10-digit number' : null}
              prefixIcon={<AppIcon name="smartphone" size="sm" color="var(--icon-primary)" />}
            />
            <AppTextField
              label="Full name"
              value={text}
              onChange={setText}
              hintText="As it should appear to mentors"
            />
            <AppTextField
              label="Locked field"
              value="arjun@example.com"
              onChange={() => {}}
              disabled
            />
          </Section>

          <Section title="Text area" note="live word count · error on the left, count on the right">
            <AppTextAreaField
              label="What do you want help with?"
              value={area}
              onChange={setArea}
              maxWords={80}
              hintText="A sentence or two is plenty"
            />
          </Section>

          <Section title="List tiles" note="min-height 56 · radius 16 · 1px transparent border by default">
            <AppListTile
              title="Notifications"
              subtitle="Session reminders and offers"
              leading={<AppIconCircle name="notification" iconColor="var(--category-wallet-icon)" backgroundColor="var(--category-wallet-bg)" />}
              trailing={<AppIcon name="chevronRight" size="sm" color="var(--icon-primary)" />}
              onClick={() => {}}
              borderColor="var(--border-primary-light)"
            />
            <AppListTile
              title="Disabled row"
              subtitle="Read-only state"
              enabled={false}
              leading={<AppIconCircle name="lock" iconColor="var(--icon-primary)" backgroundColor="var(--surface-disabled)" />}
            />
          </Section>

          <Section title="Dropdown field" note="opens a radio sheet sized to the option count">
            <AppDropdownField
              title="Preferred language"
              value={dropdown}
              onChange={setDropdown}
              options={[
                { value: 'en', title: 'English' },
                { value: 'hi', title: 'हिन्दी' },
                { value: 'ta', title: 'தமிழ்' },
                { value: 'te', title: 'తెలుగు' },
              ]}
            />
          </Section>

          <Section title="Radio" note="radius 16 card · 2px border, transparent when unselected so nothing shifts">
            <AppRadioGroup value={radio} onChange={setRadio}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <AppRadio value="a" title="Option A" />
                <AppRadio value="b" title="Option B" />
              </div>
            </AppRadioGroup>
          </Section>

          <Section title="Checkbox" note="pill chips, not tick boxes — selection is the text treatment">
            <AppCheckboxGroup selected={checks} onChange={setChecks}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <AppCheckbox value="x" title="JEE" />
                <AppCheckbox value="y" title="NEET" />
                <AppCheckbox value="z" title="CUET" />
              </div>
            </AppCheckboxGroup>
          </Section>

          <Section title="Tab bar" note="4px total inset (2 outer + 2 inner) · segment 40">
            <AppTabBar tabs={['About', 'Reviews', 'Sessions']} index={tab} onChange={setTab} />
          </Section>

          <Section title="Switch" note="64×32 track · white thumb in both states">
            <Row>
              <AppSwitch checked={switchOn} onChange={setSwitchOn} label="Demo" />
              <AppSwitch checked={!switchOn} onChange={(v) => setSwitchOn(!v)} label="Demo" />
              <span className="type-label-md" style={{ color: 'var(--text-body-light)' }}>
                {switchOn ? 'On' : 'Off'}
              </span>
            </Row>
          </Section>

          <Section title="Avatars" note="initials fall back to surface.actionLight · online dot in surface.page ring">
            <Row>
              <AppAvatar name="Arjun Mehta" size="sm" badge={<AppOnlineBadge isOnline />} />
              <AppAvatar name="Priya" size="md" badge={<AppOnlineBadge isBusy />} />
              <AppAvatar name="Rahul Verma" size="lg" badge={<AppOnlineBadge />} />
            </Row>
          </Section>

          <Section title="State indicators" note="warning is a bare icon at the CONTAINER size — 32px, not 20px">
            <Row>
              {(['success', 'info', 'error', 'warning'] as AppStateIndicatorType[]).map((type) => (
                <div key={type} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <AppStateIndicator type={type} size="sm" />
                  <span className="type-label-sm" style={{ color: 'var(--text-body-light)' }}>
                    {type}
                  </span>
                </div>
              ))}
            </Row>
          </Section>

          <Section title="Banners" note="indicator + bold variant title + neutral body">
            {(['info', 'warning', 'error', 'success'] as AppBannerVariant[]).map((variant) => (
              <AppBanner
                key={variant}
                variant={variant}
                title={variant[0].toUpperCase() + variant.slice(1)}
                message="Mentor replies usually arrive within a minute."
              />
            ))}
            {bannerVisible ? (
              <AppBanner
                variant="warning"
                message="Low balance — top up to keep chatting."
                onDismiss={() => setBannerVisible(false)}
              />
            ) : (
              <AppButton label="Bring the dismissable banner back" type="plain" size="compact" onClick={() => setBannerVisible(true)} />
            )}
          </Section>

          <Section title="Live badge" note="xl drops the radius 24 to 8 and goes bold">
            <Row>
              <LiveBadge size="sm" />
              <LiveBadge size="md" viewers="1.2k" />
              <LiveBadge size="lg" viewers="84" />
              <LiveBadge size="xl" viewers="Watching" />
            </Row>
          </Section>

          <Section title="Step progress" note="the step you are ON is already filled">
            <AppStepProgressIndicator totalSteps={3} currentStep={0} />
            <AppStepProgressIndicator totalSteps={3} currentStep={2} />
          </Section>

          <Section title="Loading" note="spinner 16/24/40 · indicator 56 with stroke 4">
            <Row>
              <AppLoadingSpinner size="sm" />
              <AppLoadingSpinner size="md" />
              <AppLoadingSpinner size="lg" />
            </Row>
            <AppLoadingIndicator message="Finding a mentor" subtitle="This usually takes a few seconds" />
          </Section>

          <Section title="Overlays" note="both stay inside the bezel — that is the whole point of the overlay layer">
            <Row>
              <AppButton label="Open modal" type="outlined" onClick={() => setModal(true)} />
              <AppButton label="Open sheet" type="outlined" onClick={() => setSheet(true)} />
            </Row>
          </Section>

          <Section title="Bottom bar" note="selected icon is the DARKER one — icon.secondary, not action">
            <div style={{ borderRadius: 16, overflow: 'hidden' }}>
              <AppBottomBar
                items={[
                  { label: 'Home', icon: 'home', activeIcon: 'homeFilled' },
                  { label: 'Chat', icon: 'chat', activeIcon: 'chatFilled' },
                  { label: 'Call', icon: 'call' },
                  { label: 'Account', icon: 'person', activeIcon: 'personFilled' },
                ]}
                currentIndex={bottomTab}
                onTap={setBottomTab}
              />
            </div>
          </Section>

          <Section title="Icons" note="Material Symbols ligatures — the app's own glyphs">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
              {(['home', 'chat', 'call', 'wallet', 'person', 'school', 'star', 'verified', 'search', 'tune', 'settings', 'logout', 'payment', 'receipt', 'shield', 'gift'] as const).map((name) => (
                <div key={name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: 56 }}>
                  <AppIcon name={name} size="md" color="var(--icon-secondary)" />
                  <span className="type-label-sm" style={{ color: 'var(--text-body-light)', fontSize: 9 }}>
                    {name}
                  </span>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </PagePadding>

      <AppModal
        open={modal}
        title="End this session?"
        message="You will be billed for the time used so far."
        onClose={() => setModal(false)}
        actions={[
          { label: 'Cancel' },
          { label: 'End session', destructive: true },
        ]}
      />

      <AppBottomSheet open={sheet} onClose={() => setSheet(false)} heightFraction={0.6}>
        <AppBottomSheetHeader
          title="Sort by"
          onClose={() => setSheet(false)}
          action={<AppButton label="Reset" type="plain" size="compact" intent="secondary" onClick={() => {}} />}
        />
        <div ref={sheetBody} style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <AppListTile title="Rating: high to low" onClick={() => {}} borderColor="var(--border-primary-light)" />
          <AppListTile title="Price: low to high" onClick={() => {}} borderColor="var(--border-primary-light)" />
          <AppListTile title="Experience: most first" onClick={() => {}} borderColor="var(--border-primary-light)" />
        </div>
      </AppBottomSheet>
    </div>
  );
}

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="type-title-md type-emphasis-bold" style={{ color: 'var(--text-heading)' }}>
        {title}
      </div>
      {note ? (
        <div className="type-body-sm" style={{ color: 'var(--text-body-light)', marginTop: 2 }}>
          {note}
        </div>
      ) : null}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
        {children}
      </div>
    </section>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 10 }}>
      {children}
    </div>
  );
}
