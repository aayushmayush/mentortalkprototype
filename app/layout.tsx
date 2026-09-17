import type { Metadata, Viewport } from 'next';
import { manrope } from '@/lib/fonts';
import { ThemeProvider } from '@/lib/state/theme-provider';
import { AuthProvider } from '@/lib/state/auth-provider';
import { OnboardingProvider } from '@/lib/state/onboarding-provider';
import { ProfileProvider } from '@/lib/state/profile-provider';
import { WalletProvider } from '@/lib/state/wallet-provider';
import { SnackbarProvider } from '@/lib/state/snackbar-provider';
import { DemoProvider } from '@/lib/state/demo-provider';
import { SessionProvider } from '@/lib/state/session-provider';
import { ReviewsProvider } from '@/lib/state/reviews-provider';
import { CounsellingProvider } from '@/lib/state/counselling-provider';
import { SettingsProvider } from '@/lib/state/settings-provider';
import { EditProfileProvider } from '@/lib/state/edit-profile-provider';
import { SessionChrome } from '@/components/session/session-chrome';
import { PrototypeShell } from '@/components/prototype/prototype-shell';
import './globals.css';

export const metadata: Metadata = {
  title: 'Mentee app — prototype',
  description:
    'A clickable prototype of the Mentortalk mentee app, matching the production design system.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

/**
 * The root layout owns the providers and the phone.
 *
 * It also owns the session chrome that Flutter wraps around every route in
 * `_AppShell` — the network banner, the notification listener, the session
 * banner and the call overlay. From T3 those mount here, as siblings of the
 * page, so a running session's banner survives navigation exactly as it does
 * in production. Nothing about that belongs in a page.
 *
 * The providers sit here for the same reason, and it is load-bearing: App
 * Router does NOT remount a layout on client-side navigation, so auth and
 * onboarding survive every route change. That is what lets the wizard be real
 * routes instead of one screen holding all the state.
 *
 * Provider order mirrors the Flutter widget tree. Theme is outermost (it is
 * read by everything), then auth. Onboarding sits inside auth because its
 * outcome decides whether the wizard is even reachable. `ProfileProvider` sits
 * inside onboarding — deliberately — because it composes the account tab's name
 * and education from what the wizard collected, and `WalletProvider` is
 * independent of all of them, holding the balance that both the app-bar badge
 * and the session meter read.
 *
 * `SessionProvider` goes inside `WalletProvider` because the session meter
 * debits the wallet every second, and inside `DemoProvider` because the
 * simulated server reads `sessionFault` to pick its answer.
 *
 * `EditProfileProvider` sits inside both `ProfileProvider` and
 * `OnboardingProvider`, because it seeds its form from both. `SettingsProvider`
 * is a leaf — it reads nothing above it — and sits next to the shell.
 *
 * ── The page slot, and why the page is wrapped ──────────────────────────────
 *
 * Flutter's `_AppShell` is `Column[ SessionBannerHost, Expanded(page) ]`: the
 * page is FORCED to the height left over after the banner, and a screen that
 * needs to scroll does so internally. The prototype's phone scroller is that
 * Column, so the page goes in a `flex: 1 / minHeight: 0` slot to reproduce the
 * `Expanded`. Without the slot the page would still be measured at the full
 * phone height while the banner sat above it, and a session would push every
 * screen 92px past the bottom edge.
 *
 * Both page conventions survive it: a screen with `height: 100%` gets the
 * remainder (correct), and one with `minHeight: 100%` still grows past it.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={manrope.variable}>
      <body>
        <ThemeProvider>
          <DemoProvider>
            <AuthProvider>
              <OnboardingProvider>
                <ProfileProvider>
                  {/*
                    `EditProfileProvider` sits here because it reads BOTH of the
                    providers above it: the account tab's name and photo, and the
                    wizard's category and education answers, which it seeds from.
                    It is also the reason the edit-profile bloc cannot be page
                    state — two of its three screens share one instance.
                  */}
                  <EditProfileProvider>
                    <WalletProvider>
                      {/*
                        Snackbar sits directly inside the phone's providers rather
                        than around the shell: it is a device-level surface, like
                        the overlay layer, and its host is drawn by the frame.
                      */}
                      <SnackbarProvider>
                        <SessionProvider>
                          {/*
                            Reviews sits inside the session, and outermost of the
                            shell: the review sheet is the session's LAST step, so
                            the provider that receives what it submits has to be
                            mounted above the chrome that renders the sheet — and
                            it must outlive the session, or the review would
                            vanish the moment `reset()` clears the ended session
                            that triggered the sheet.
                          */}
                          <ReviewsProvider>
                            {/*
                              Counselling sits inside reviews and outside the shell
                              for the same reason reviews does: it carries a
                              half-filled intake across FOUR routes, so it has to
                              outlive every one of those route changes. Mounting it
                              in the shell would be enough to render the flow, and
                              wrong the moment you tap Back on the college step
                              and expect your marks to still be there.
                            */}
                            <CounsellingProvider>
                              {/*
                                Settings carries the privacy flags and the locale
                                choice. It depends on nothing above it and nothing
                                below it reads it at boot, so it sits here rather
                                than near the other leaf providers.
                              */}
                              <SettingsProvider>
                                <PrototypeShell>
                                  {/*
                                    A SIBLING of the page, never a wrapper: the banner
                                    renders in the flow (it pushes the page down, as in
                                    Flutter), while the call overlay and the modals
                                    portal into the frame's overlay layer. See
                                    session-chrome.tsx.
                                  */}
                                  <SessionChrome />
                                  <div
                                    style={{
                                      flex: 1,
                                      minHeight: 0,
                                      display: 'flex',
                                      flexDirection: 'column',
                                    }}
                                  >
                                    {children}
                                  </div>
                                </PrototypeShell>
                              </SettingsProvider>
                            </CounsellingProvider>
                          </ReviewsProvider>
                        </SessionProvider>
                      </SnackbarProvider>
                    </WalletProvider>
                  </EditProfileProvider>
                </ProfileProvider>
              </OnboardingProvider>
            </AuthProvider>
          </DemoProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
