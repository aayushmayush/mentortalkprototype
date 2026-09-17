'use client';

import { useRouter } from 'next/navigation';
import { AppBrandBar, AppButton, PagePadding } from '@/design-system';
import { useAuth } from '@/lib/state/auth-provider';
import { copy } from '@/lib/copy';

/**
 * Get Started — port of `ui/auth/widgets/get_started_page.dart`.
 *
 * The layout is a Column with the hero in an `Expanded`, so the illustration
 * takes all the slack and the text block sits pinned above the button. That is
 * why the copy is bottom-weighted rather than vertically centred.
 *
 * The title is a `Text.rich` with a manual `letterSpacing: -1.32` overriding the
 * style's own — the only screen in the app that tightens `headlineLarge` by
 * hand. The copy itself is unusual: `findYourPerfect` ends in a newline and
 * `mentor` is the single word MENTOR, so it renders as two lines with the
 * second in the action colour.
 */
export default function GetStartedPage() {
  const router = useRouter();
  const { getStarted, state } = useAuth();
  const isLoading = state.status === 'loading';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <AppBrandBar />

      <PagePadding style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Expanded(child: _HeroImage()) — the hero absorbs all remaining height. */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/images/onboarding_hero.png"
            alt=""
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
          />
        </div>

        <div className="type-headline-lg" style={{ marginTop: 24, color: 'var(--text-heading)', letterSpacing: -1.32 }}>
          {copy.findYourPerfect}
          <span style={{ color: 'var(--text-action)' }}>{copy.mentor}</span>
        </div>

        <p className="type-body-lg" style={{ marginTop: 24, color: 'var(--text-body-light)' }}>
          {copy.getStartedSubtitle}
        </p>

        <div style={{ marginTop: 24 }}>
          <AppButton
            label={copy.getStarted}
            fullWidth
            // The source disables the button while `AuthLoading || AuthSuccess`
            // — a second tap during the transition would double-dispatch.
            disabled={isLoading}
            onClick={() => {
              getStarted();
              router.push('/auth/phone');
            }}
          />
        </div>

        <div style={{ height: 16 }} />
      </PagePadding>
    </div>
  );
}
