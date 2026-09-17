'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AppAutocompleteField,
  AppButton,
  AppTextField,
  AppTopBar,
  PagePadding,
} from '@/design-system';
import { copy } from '@/lib/copy';
import { DEGREES, suggestFieldsOfStudy, suggestInstitutions } from '@/lib/autosuggestion';
import { useEditProfile } from '@/lib/state/edit-profile-provider';
import { useSnackbar } from '@/lib/state/snackbar-provider';

/**
 * AddEducationPage — port of
 * `ui/edit_profile/pages/add_education_page.dart`.
 *
 * ── One page, two jobs ─────────────────────────────────────────────────────
 *
 * `existingEntry` decides everything: the title (`Add Education` /
 * `Edit Education`), which bloc event fires, and whether the fields start
 * populated. So `/edit-profile/add-education` is the add form and
 * `/edit-profile/add-education?id=<entryId>` is the edit form — the query param
 * is what `existingEntry` becomes.
 *
 * ── Fields are seeded from the entry ONCE, at construction ─────────────────
 *
 * `initState` copies the entry into the controllers and never again. The entry
 * is looked up from the bloc's loaded profile on the first render and then held
 * — if the bloc's list changed underneath (a delete from elsewhere), this form
 * would keep editing the snapshot it was opened with. Edge case, but it is the
 * source's behaviour and it is why the lookup is deliberately not reactive.
 *
 * ── Save pops IMMEDIATELY, and never waits ─────────────────────────────────
 *
 * `_onSave` dispatches and then calls `Navigator.pop` on the very next line —
 * no await, no spinner, no error branch. The write's outcome is reported by the
 * bloc to the screen UNDERNEATH: a failure raises the "Failed to add education"
 * / "Failed to update education" snackbar after you are already back on
 * `/edit-profile`. Reproduced by firing the promise and popping without
 * awaiting, then reporting on the still-mounted global snackbar.
 *
 * ── The Save button's stale-rebuild quirk, reproduced as the user sees it ──
 *
 * In the source, `_selectedDegree` is updated by the degree field's `onChanged`
 * WITHOUT `setState` — so typing a degree does not rebuild this page, and
 * `_canSave` is not re-evaluated until something else triggers a rebuild (the
 * institution controller's listener, or picking a suggestion, which does call
 * `setState`). Type an institution and then type "B.Tech" without selecting it
 * and the button stays visibly disabled.
 *
 * The prototype makes the degree a plain piece of state, so typing enables Save
 * immediately. That is a deliberate divergence from the source's rebuild lag,
 * not from its intent — `_selectedDegree` is assigned on every keystroke, so the
 * button's being stale is an accident of Flutter's widget boundaries. Making a
 * button appear broken on purpose would be reproducing a bug, not a behaviour.
 */

type EducationDraft = {
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startYear: string;
  endYear: string;
};

const EMPTY_DRAFT: EducationDraft = {
  institution: '',
  degree: '',
  fieldOfStudy: '',
  startYear: '',
  endYear: '',
};

export function AddEducationPage() {
  const router = useRouter();
  const params = useSearchParams();
  const edit = useEditProfile();
  const snackbar = useSnackbar();

  const entryId = params.get('id');
  const isEditing = entryId !== null;

  /**
   * Read once, at first render — `initState`'s copy. `useState`'s initialiser
   * gives exactly one evaluation per mount, and the route is unmounted on pop,
   * so re-entering rebuilds from the (possibly updated) list.
   */
  const [draft, setDraft] = useState<EducationDraft>(() => {
    if (entryId === null) return EMPTY_DRAFT;
    const entry = edit.profile?.education.find((e) => e.id === entryId);
    if (entry === undefined) return EMPTY_DRAFT;
    return {
      institution: entry.institution,
      degree: entry.degree,
      fieldOfStudy: entry.fieldOfStudy ?? '',
      startYear: entry.startYear?.toString() ?? '',
      endYear: entry.endYear?.toString() ?? '',
    };
  });

  const set = <K extends keyof EducationDraft>(key: K, value: EducationDraft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  // `_canSave` — institution non-empty, degree non-empty. Years are optional and
  // are NOT validated against each other (end before start is accepted).
  const canSave =
    draft.institution.trim() !== '' && draft.degree.trim() !== '';

  const onSave = () => {
    if (!canSave) return;

    const payload = {
      institution: draft.institution.trim(),
      degree: draft.degree.trim(),
      // Empty string becomes null, NOT '' — the field is nullable server-side
      // and the source passes `null` explicitly.
      fieldOfStudy: draft.fieldOfStudy.trim() !== '' ? draft.fieldOfStudy.trim() : null,
      startYear: parseYear(draft.startYear),
      endYear: parseYear(draft.endYear),
    };

    // Fire and pop, in that order and with no await — see the header note.
    const write = isEditing
      ? edit.updateEducation(entryId!, payload)
      : edit.addEducation(payload);

    void write.then((ok) => {
      if (!ok) {
        snackbar.show(
          isEditing ? copy.failedToUpdateEducation : copy.failedToAddEducation,
        );
      }
    });

    router.back();
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
      <AppTopBar
        title={isEditing ? copy.editEducation : copy.addEducation}
        onBack={() => router.back()}
      />

      {/* `GestureDetector(onTap: unfocus)` — tapping the background dismisses the
          keyboard. Expressed as a plain onMouseDown here; a browser has no soft
          keyboard, but the tap target is the whole body either way. */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <div className="no-scrollbar" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
          <PagePadding>
            <div style={{ height: 16 }} />

            <AppAutocompleteField
              label={copy.institutionNameRequired}
              value={draft.institution}
              onChange={(value) => set('institution', value)}
              // `externalController` + `onSelected` writing the same controller:
              // the suggestion IS the value, so both paths land in one place.
              onSelected={(value) => set('institution', value)}
              options={(query) => suggestInstitutions(query)}
            />
            <Hint text="e.g. IIT Delhi, AIIMS Delhi, NIT Trichy, KGMU Lucknow" />

            <div style={{ height: 16 }} />

            <AppAutocompleteField
              label={copy.degreeRequired}
              value={draft.degree}
              onChange={(value) => set('degree', value)}
              onSelected={(value) => set('degree', value)}
              /**
               * An EMPTY query returns every degree rather than nothing — the
               * source short-circuits `if (value.text.isEmpty) return degrees`,
               * so focusing the field is itself the suggestion list. The filter
               * is a case-insensitive `contains`, not a prefix match.
               */
              options={(query) =>
                query === ''
                  ? [...DEGREES]
                  : DEGREES.filter((d) =>
                      d.toLowerCase().includes(query.toLowerCase()),
                    )
              }
            />
            <Hint text="e.g. 10th, 12th, Diploma, B.Tech, B.Sc, MBBS" />

            <div style={{ height: 16 }} />

            <AppAutocompleteField
              label={copy.fieldOfStudy}
              value={draft.fieldOfStudy}
              onChange={(value) => set('fieldOfStudy', value)}
              onSelected={(value) => set('fieldOfStudy', value)}
              // The degree currently in the field narrows the list — and it
              // tracks typed text, not only a picked suggestion, which is why
              // this reads from the same state the field is bound to.
              options={(query) => suggestFieldsOfStudy(query, draft.degree || null)}
            />
            <Hint text="e.g. Computer Science, Mechanical, Commerce, General Medicine" />

            {/* spacingSm, not spacingMd — the source tightens the gap before the
                year row. */}
            <div style={{ height: 12 }} />

            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <AppTextField
                  label={copy.startYear}
                  value={draft.startYear}
                  onChange={(value) => set('startYear', value)}
                  maxLength={4}
                  inputMode="numeric"
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <AppTextField
                  label={copy.endYear}
                  value={draft.endYear}
                  onChange={(value) => set('endYear', value)}
                  maxLength={4}
                  inputMode="numeric"
                />
              </div>
            </div>

            <div style={{ height: 24 }} />
          </PagePadding>
        </div>

        {/* The button sits OUTSIDE the scroller, pinned — `Column` with an
            `Expanded` scroller above it. `crossAxisAlignment: stretch` is what
            makes it full width in the source; `fullWidth` says the same here. */}
        <PagePadding>
          <div style={{ paddingBottom: 16 }}>
            <AppButton
              label={copy.save}
              fullWidth
              onClick={canSave ? onSave : undefined}
            />
          </div>
        </PagePadding>
      </div>
    </div>
  );
}

/**
 * `Padding(top: spacingXs, left: 16)` under each field — `spacingXs` is 8, and
 * the 16 is PagePadding's own inset offset by nothing, i.e. the hint lines up
 * with the field's label rather than its box.
 */
function Hint({ text }: { text: string }) {
  return (
    <div
      className="type-body-sm"
      style={{ paddingTop: 8, paddingLeft: 16, color: 'var(--text-body-light)' }}
    >
      {text}
    </div>
  );
}

/** `int.tryParse` — null for anything that is not a whole number. */
function parseYear(text: string): number | null {
  const trimmed = text.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  return Number.parseInt(trimmed, 10);
}
