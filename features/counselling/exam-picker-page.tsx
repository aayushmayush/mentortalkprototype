'use client';

import { useRouter } from 'next/navigation';
import { AppIcon } from '@/design-system';
import { EXAM_TYPES, type ExamTypeInfo } from '@/lib/counselling/intake';
import { useCounselling } from '@/lib/state/counselling-provider';

/**
 * CounsellingCategoriesPage — port of
 * `ui/counselling/pages/counselling_categories_page.dart`.
 *
 * Step 0 of the counselling flow: pick NEET, JEE or CUET. Reached from the home
 * feed's "Need Exam Counselling?" card.
 *
 * ── A RAW Flutter AppBar, not `AppTopBar` ───────────────────────────────────
 *
 * This screen builds its own `AppBar` — `Icon(Icons.arrow_back)` in
 * `icon.primary` and a `titleMedium` title in `text.heading` — where every other
 * screen in the app uses the design system's `AppTopBar`. So the bar is 56 tall
 * (`kToolbarHeight`) rather than 64, the title is LEFT-aligned immediately after
 * the back button rather than centred, and there are no actions. Hand-rolled
 * here rather than snapped to `AppTopBar`, because the difference is visible
 * side by side.
 *
 * ── Tapping a card RESETS the intake ────────────────────────────────────────
 *
 * `CounsellingIntakeData(examType: examType)` — a brand-new object per tap, so
 * a second run through the flow starts blank even if a previous one was
 * abandoned half-filled. In the app that is automatic (the old object is
 * garbage); here the provider is long-lived, so the reset is explicit.
 */
export function ExamPickerPage() {
  const router = useRouter();
  const { reset } = useCounselling();

  const pick = (exam: ExamTypeInfo) => {
    reset(exam.value);
    router.push('/counselling/intake');
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
      {/* The raw AppBar — see the header. 56, back + left-aligned title. */}
      <div
        style={{
          height: 56,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          background: 'var(--surface-page)',
        }}
      >
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Back"
          style={{
            border: 'none',
            background: 'transparent',
            padding: 12,
            marginLeft: 4,
            cursor: 'pointer',
            display: 'flex',
          }}
        >
          <AppIcon name="arrowBack" size="md" color="var(--icon-primary)" />
        </button>
        <div style={{ width: 4 }} />
        <span className="type-title-md" style={{ color: 'var(--text-heading)' }}>
          Exam Counselling
        </span>
      </div>

      <div
        className="no-scrollbar"
        style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '16px 16px' }}
      >
        <span className="type-body-md" style={{ color: 'var(--text-body-light)' }}>
          Which exam do you need guidance for?
        </span>

        <div style={{ height: 16 }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {EXAM_TYPES.map((exam) => (
            <ExamCard key={exam.value} exam={exam} onTap={() => pick(exam)} />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * `_ExamCard` — a 44px action-light circle holding the exam glyph at 22, the
 * title, the subtitle, and a chevron.
 *
 * The card's radius is 14, not the design system's 16 or 24 — one of several
 * one-off radii in this feature (`_CollegeOption` also uses 14).
 */
function ExamCard({ exam, onTap }: { exam: ExamTypeInfo; onTap: () => void }) {
  return (
    <div
      onClick={onTap}
      style={{
        width: '100%',
        padding: 14,
        background: 'var(--surface-primary)',
        borderRadius: 14,
        border: '1px solid var(--border-primary-light)',
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          flex: '0 0 auto',
          borderRadius: '50%',
          background: 'var(--surface-action-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <AppIcon name={exam.icon} px={22} color="var(--surface-action)" />
      </div>

      <div style={{ width: 12 }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          className="type-body-md type-emphasis-semibold"
          style={{ color: 'var(--text-heading)' }}
        >
          {`Get ${exam.label} Counselling`}
        </div>
        <div style={{ height: 2 }} />
        <div className="type-body-sm" style={{ color: 'var(--text-body-light)' }}>
          {exam.subtitle}
        </div>
      </div>

      <AppIcon name="chevronRight" size="md" color="var(--icon-secondary)" />
    </div>
  );
}
