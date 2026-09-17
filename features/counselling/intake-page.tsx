'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AppButton,
  AppDropdownField,
  AppIcon,
  AppTextField,
} from '@/design-system';
import { examInfo, type ExamExperience } from '@/lib/counselling/intake';
import { useCounselling } from '@/lib/state/counselling-provider';
import { CounsellingTopBar, ProgressBar } from './counselling-chrome';

/**
 * CounsellingIntakePage — port of
 * `ui/counselling/pages/counselling_intake_page.dart`.
 *
 * Step 1: "How was your {exam} exam?" — an emoji experience picker, three
 * numeric/text fields and three dropdowns, over a 33% progress bar.
 *
 * ── Skip does the same thing as Next, minus the write-back ──────────────────
 *
 * The app bar's "Skip" action pushes `CollegePreferencePage(data)` WITHOUT
 * assigning the three controllers into `data` first — so anything typed and not
 * carried forward by a Next tap is lost. That is the source's behaviour and it
 * is reproduced: Skip navigates, it does not save. It is the kind of asymmetry
 * that looks like an oversight and may well be one, so it is flagged rather
 * than quietly normalised.
 *
 * ── Three of the seven answers are DROPDOWNS, and one is not a dropdown ─────
 *
 * `Preferred Stream`, `Your State` and `Category` are `AppDropdownField`s over
 * hardcoded option lists; `Preferred Budget` is a plain numeric TEXT field, not
 * a range picker, despite reading like one. The lists are the source's own and
 * are short by design — 'Other' is the last state option and there are five
 * categories.
 *
 * ── The controllers are seeded from `data` ──────────────────────────────────
 *
 * Each `TextEditingController` is constructed with `text: widget.data.<field>`,
 * so re-entering the step shows what you already answered. The prototype seeds
 * its `useState` the same way, which matters because the provider outlives the
 * route.
 */

const STREAMS = ['B.Tech', 'B.Sc', 'BBA', 'B.Com', 'MBBS', 'BDS'];
const STATES = [
  'Uttar Pradesh',
  'Maharashtra',
  'Delhi',
  'Bihar',
  'Rajasthan',
  'Karnataka',
  'Other',
];
const CATEGORIES = ['General', 'OBC', 'SC', 'ST', 'EWS'];

const EXPERIENCE_OPTIONS: Array<{ value: ExamExperience; emoji: string; label: string }> = [
  { value: 'easy', emoji: '😊', label: 'Easy' },
  { value: 'moderate', emoji: '😐', label: 'Moderate' },
  { value: 'hard', emoji: '😓', label: 'Hard' },
];

export function IntakePage() {
  const router = useRouter();
  const { data, update } = useCounselling();

  const examLabel = data ? examInfo(data.examType).label : '';

  /**
   * `_onNext` — writes the three controllers into `data`, then pushes. The
   * only place the typed values are persisted.
   */
  const onNext = () => {
    if (data === null) {
      router.push('/counselling');
      return;
    }
    update({
      totalMarks: marks,
      allIndiaRank: air,
      budget,
    });
    router.push('/counselling/college');
  };

  /**
   * `_skip` — pushes WITHOUT the write-back. See the file header.
   */
  const onSkip = () => {
    router.push('/counselling/college');
  };

  /**
   * `late final _controller = TextEditingController(text: widget.data.field)` —
   * a field that starts from the carried value and is then owned locally until
   * Next writes it back. The lazy initialiser is what makes it seed once rather
   * than on every keystroke; the provider outliving the route is why seeding
   * matters at all.
   */
  const [marks, setMarks] = useState(() => data?.totalMarks ?? '');
  const [air, setAir] = useState(() => data?.allIndiaRank ?? '');
  const [budget, setBudget] = useState(() => data?.budget ?? '');

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--surface-page)',
      }}
    >
      <CounsellingTopBar
        onBack={() => router.back()}
        action={{ label: 'Skip', onPress: onSkip }}
      />

      <div
        className="no-scrollbar"
        style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '0 16px' }}
      >
        <ProgressBar value={0.33} />

        <div style={{ height: 24 }} />

        <div
          className="type-headline-sm type-emphasis-bold"
          style={{ color: 'var(--text-heading)' }}
        >
          {`How was your ${examLabel} exam?`}
        </div>

        <div style={{ height: 6 }} />

        <div className="type-body-md" style={{ color: 'var(--text-body-light)' }}>
          {"Let's tailor your counselling journey based on your performance."}
        </div>

        <div style={{ height: 24 }} />

        <div
          className="type-body-md type-emphasis-semibold"
          style={{ color: 'var(--text-heading)' }}
        >
          Overall Experience
        </div>

        <div style={{ height: 10 }} />

        <div style={{ display: 'flex', gap: 10 }}>
          {EXPERIENCE_OPTIONS.map((option) => (
            <ExperienceOption
              key={option.value}
              emoji={option.emoji}
              label={option.label}
              isSelected={data?.experience === option.value}
              onSelect={() => update({ experience: option.value })}
            />
          ))}
        </div>

        <div style={{ height: 24 }} />

        <div
          className="type-body-md type-emphasis-semibold"
          style={{ color: 'var(--text-heading)' }}
        >
          Performance Details
        </div>

        <div style={{ height: 10 }} />

        {/* `Icons.emoji_events_outlined` and `Icons.trending_up` — raw Material
            glyphs named directly, like the reference badge's rupee sign. */}
        <AppTextField
          label="Total Marks Obtained"
          value={marks}
          onChange={setMarks}
          inputMode="numeric"
          prefixIcon={<AppIcon name="trophy" size="md" color="var(--icon-primary)" />}
        />

        <div style={{ height: 16 }} />

        <AppTextField
          label="All India Rank (AIR)"
          value={air}
          onChange={setAir}
          inputMode="numeric"
          prefixIcon={<AppIcon name="trendingUp" size="md" color="var(--icon-primary)" />}
        />

        <div style={{ height: 16 }} />

        <AppDropdownField
          title="Preferred Stream"
          options={STREAMS.map((s) => ({ value: s, title: s }))}
          value={data?.preferredStream ?? null}
          onChange={(v) => update({ preferredStream: v })}
        />

        <div style={{ height: 16 }} />

        {/* A numeric text field, not a range slider. */}
        <AppTextField
          label="Preferred Budget"
          value={budget}
          onChange={setBudget}
          inputMode="numeric"
          prefixIcon={<AppIcon name="wallet" size="md" color="var(--icon-primary)" />}
        />

        <div style={{ height: 16 }} />

        <AppDropdownField
          title="Your State"
          options={STATES.map((s) => ({ value: s, title: s }))}
          value={data?.state ?? null}
          onChange={(v) => update({ state: v })}
        />

        <div style={{ height: 16 }} />

        <AppDropdownField
          title="Category"
          options={CATEGORIES.map((s) => ({ value: s, title: s }))}
          value={data?.category ?? null}
          onChange={(v) => update({ category: v })}
        />

        <div style={{ height: 28 }} />

        <AppButton label="Next: Choose College Preference" fullWidth onClick={onNext} />

        <div style={{ height: 24 }} />
      </div>
    </div>
  );
}

/**
 * `_ExperienceOption` — an expanded tile that is selected or not.
 *
 * Selected: `surface.actionLight` ground, a 1.5px `surface.action` border, and
 * the label in `surface.action`. Unselected: `surface.primary`, a 1px
 * `border.primaryLight` border, `text.bodyLight`. The border WIDTH changes with
 * selection, so the tile's inner size shifts by half a pixel — the source does
 * that, and it is why the row does not look perfectly still when you tap.
 *
 * The emoji is a 24px `Text`, not an icon.
 */
function ExperienceOption({
  emoji,
  label,
  isSelected,
  onSelect,
}: {
  emoji: string;
  label: string;
  isSelected: boolean;
  onSelect: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      style={{
        flex: 1,
        minWidth: 0,
        padding: '14px 0',
        background: isSelected ? 'var(--surface-action-light)' : 'var(--surface-primary)',
        borderRadius: 12,
        border: `${isSelected ? 1.5 : 1}px solid ${
          isSelected ? 'var(--surface-action)' : 'var(--border-primary-light)'
        }`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: 'pointer',
      }}
    >
      <span style={{ fontSize: 24, lineHeight: 1 }}>{emoji}</span>
      <div style={{ height: 4 }} />
      <span
        className="type-body-sm type-emphasis-semibold"
        style={{ color: isSelected ? 'var(--surface-action)' : 'var(--text-body-light)' }}
      >
        {label}
      </span>
    </div>
  );
}
