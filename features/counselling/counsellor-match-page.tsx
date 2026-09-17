'use client';

import { useRouter } from 'next/navigation';
import { AppButton } from '@/design-system';
import { examInfo } from '@/lib/counselling/intake';
import { useCounselling } from '@/lib/state/counselling-provider';
import { CounsellingTopBar } from './counselling-chrome';

/**
 * CounsellorMatchPage — port of
 * `ui/counselling/pages/counsellor_match_page.dart`.
 *
 * Step 3: one placeholder counsellor card with "Get Free Chat for 15 min" and
 * "Talk Now". BOTH buttons go to the same place — `CounsellingConnectingPage`
 * with the same name — so the two CTAs are a fork in the copy, not in the flow.
 * That is the source's state: the matching backend does not exist, and the
 * comment above the class says so ("dummy data for now, pending the real
 * matching backend").
 *
 * ── Everything except the name and the specialist label is a constant ───────
 *
 * `'Dr. Amit Verma'`, `'10+ years experience'`, `'Senior IIT admissions
 * strategy expert.'` are three literals, and 'D' is the avatar initial because
 * it is the first letter of the first literal. The ONE derived string is the
 * specialist label — `'${examType.label} Specialist'` — read off the intake
 * data, so a JEE run says "JEE Specialist" and a NEET run says "NEET
 * Specialist". That is the only trace of the four steps of answers on this
 * screen, and it is the thing to check when reviewing it.
 *
 * ── The avatar is a raw 48px `CircleAvatar`, not `AppAvatar` ────────────────
 *
 * radius 24 with a `titleMedium` w700 initial in `surface.action` over
 * `surface.actionLight`. `AppAvatar`'s smallest size is 48 with a real photo or
 * generated initials; this wants a single hardcoded letter in the brand colour,
 * so it is hand-rolled — same as the review card on the my-reviews screen.
 */

const COUNSELLOR_NAME = 'Dr. Amit Verma';
const COUNSELLOR_EXPERIENCE = '10+ years experience';
const COUNSELLOR_BIO = 'Senior IIT admissions strategy expert.';

export function CounsellorMatchPage() {
  const router = useRouter();
  const { data } = useCounselling();

  const specialistLabel = `${data ? examInfo(data.examType).label : ''} Specialist`;

  const connect = () => router.push('/counselling/connecting');

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--surface-page)',
      }}
    >
      {/* This bar has a centred-ish left-aligned title, like the exam picker. */}
      <CounsellingTopBar title="Find a Counsellor" onBack={() => router.back()} />

      <div
        className="no-scrollbar"
        style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px 16px' }}
      >
        <div
          style={{
            padding: 16,
            background: 'var(--surface-primary)',
            borderRadius: 16,
            border: '1px solid var(--border-primary-light)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
            {/* `CircleAvatar(radius: 24)` with the letter 'D'. */}
            <div
              style={{
                width: 48,
                height: 48,
                flex: '0 0 auto',
                borderRadius: '50%',
                background: 'var(--surface-action-light)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span
                className="type-title-md type-emphasis-bold"
                style={{ color: 'var(--surface-action)' }}
              >
                D
              </span>
            </div>

            <div style={{ width: 12 }} />

            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                className="type-body-lg type-emphasis-bold"
                style={{ color: 'var(--text-heading)' }}
              >
                {COUNSELLOR_NAME}
              </div>

              <div style={{ height: 4 }} />

              {/* The specialist chip — radius 6, actionLight ground, action
                  text, 8h/2v of padding. The only derived string on screen. */}
              <span
                style={{
                  display: 'inline-block',
                  padding: '2px 8px',
                  background: 'var(--surface-action-light)',
                  borderRadius: 6,
                }}
              >
                <span
                  className="type-body-sm type-emphasis-semibold"
                  style={{ color: 'var(--surface-action)' }}
                >
                  {specialistLabel}
                </span>
              </span>
            </div>
          </div>

          <div style={{ height: 12 }} />

          <span className="type-body-sm" style={{ color: 'var(--text-body-light)' }}>
            {COUNSELLOR_EXPERIENCE}
          </span>

          <div style={{ height: 4 }} />

          <span className="type-body-md" style={{ color: 'var(--text-heading)' }}>
            {COUNSELLOR_BIO}
          </span>

          <div style={{ height: 20 }} />

          {/* Both buttons push the same route. See the file header. */}
          <div style={{ display: 'flex', gap: 10, width: '100%' }}>
            <div style={{ flex: 1 }}>
              <AppButton label="Get Free Chat for 15 min" fullWidth onClick={connect} />
            </div>
            <div style={{ flex: 1 }}>
              <AppButton label="Talk Now" type="outlined" fullWidth onClick={connect} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
