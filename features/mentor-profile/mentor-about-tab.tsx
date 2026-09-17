'use client';

import { AppIconCircle } from '@/design-system';
import { ExpandableText } from '@/components/expandable-text';
import { PhotosStrip } from './photos-strip';
import { copy, fill } from '@/lib/copy';
import type { MentorEducation, MentorProfile } from '@/lib/fake/mentors';

/**
 * MentorAboutTab — port of
 * `ui/mentor_profile/widgets/mentor_about_tab.dart`.
 *
 * Order: bio → photos strip → info card (languages, experience) → education.
 *
 * ── Three different colours for one component ───────────────────────────────
 *
 * Both info rows are `AppIconCircle.sm`, but the languages row paints from two
 * hardcoded hex values (`#8B5CF6` on `#EDE9FE`) with the source's own comment
 * "no purple token in design system yet", while the experience row uses the
 * real tokens (`icon.info` on `surface.info`). So the two circles in the same
 * card are styled by different rules — reproduced as-is.
 *
 * ── What is NOT rendered ────────────────────────────────────────────────────
 *
 * `MentorProfile.experience` (a whole list of work history) is carried on the
 * model and never read by this tab — there is no experience section, only the
 * summed `totalExperienceYears` row. The fake data has the field for the same
 * reason: so this absence is visible rather than assumed.
 */

export function MentorAboutTab({ profile }: { profile: MentorProfile }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: 'var(--spacing-md)' }} />

      {/* ── Bio ── */}
      <div style={{ padding: '0 var(--page-padding-horizontal)' }}>
        {profile.bio !== null && profile.bio !== '' ? (
          <ExpandableText
            text={profile.bio}
            // `_ExpandableBio._collapsedLines` — 4, despite the widget's own
            // doc comment claiming 2.
            collapsedLines={4}
            className="type-body-md"
            style={{ color: 'var(--text-body)', lineHeight: 1.5 }}
          />
        ) : (
          <span className="type-body-md" style={{ color: 'var(--text-body-light)' }}>
            {copy.noBioAvailable}
          </span>
        )}
      </div>

      {/* ── Photos ── */}
      {profile.photos.length > 0 ? (
        <>
          <div style={{ height: 'var(--spacing-md)' }} />
          <PhotosStrip photos={profile.photos} />
        </>
      ) : null}

      <div style={{ height: 'var(--spacing-md)' }} />

      {/* ── Info card ── */}
      <div style={{ padding: '0 var(--page-padding-horizontal)' }}>
        <div
          style={{
            width: '100%',
            padding: 'var(--spacing-md)',
            background: 'var(--surface-primary)',
            borderRadius: 'var(--ds-radius-md)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <InfoRow
            icon="translate"
            // Hardcoded purple — see the note above.
            iconColor="#8B5CF6"
            iconBackground="#EDE9FE"
            label={profile.languages.length > 0 ? profile.languages.join(', ') : null}
          />

          {profile.totalExperienceYears !== null && profile.totalExperienceYears > 0 ? (
            <>
              <div style={{ height: 'var(--spacing-lg)' }} />
              <InfoRow
                icon="workOutline"
                iconColor="var(--icon-info)"
                iconBackground="var(--surface-info)"
                label={formatExperience(profile.totalExperienceYears)}
              />
            </>
          ) : null}
        </div>
      </div>

      {/* ── Education ── */}
      {profile.education.length > 0 ? (
        <>
          <div style={{ height: 'var(--spacing-lg)' }} />
          <div style={{ padding: '0 var(--page-padding-horizontal)' }}>
            <div
              className="type-title-md type-emphasis-bold"
              style={{ color: 'var(--text-heading)' }}
            >
              {copy.education}
            </div>

            <div style={{ height: 'var(--spacing-sm)' }} />

            {profile.education.map((entry, i) => (
              <div key={`${entry.institutionName}-${i}`} style={{ paddingBottom: 'var(--spacing-md)' }}>
                <EducationEntry education={entry} />
              </div>
            ))}
          </div>
        </>
      ) : null}

      <div style={{ height: 'var(--spacing-lg)' }} />
    </div>
  );
}

/**
 * `_InfoRow` — icon circle, then the value or "Nothing to show here".
 *
 * Note the type scale flips with emptiness: a filled row is `titleSmall` in
 * `text.body`, an empty one is `bodySmall` in `text.bodyLight`. The row does
 * not disappear when there is nothing to show — it degrades in place.
 */
function InfoRow({
  icon,
  iconColor,
  iconBackground,
  label,
}: {
  icon: 'translate' | 'workOutline';
  iconColor: string;
  iconBackground: string;
  label: string | null;
}) {
  const isEmpty = label === null;

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <AppIconCircle
        size="sm"
        name={icon}
        iconColor={iconColor}
        backgroundColor={iconBackground}
      />
      <div style={{ width: 12 }} />
      <span
        className={isEmpty ? 'type-body-sm' : 'type-title-sm'}
        style={{ color: isEmpty ? 'var(--text-body-light)' : 'var(--text-body)' }}
      >
        {label ?? copy.nothingToShow}
      </span>
    </div>
  );
}

/**
 * One education entry: bullet, institution in bold, "degree, field", years.
 *
 * The years use an en dash (`'$start–$end'`), and either end can stand alone —
 * a current student has a start year and no end.
 */
function EducationEntry({ education }: { education: MentorEducation }) {
  const detailParts: string[] = [];
  if (education.degree !== '') detailParts.push(education.degree);
  if (education.fieldOfStudy !== null && education.fieldOfStudy !== '')
    detailParts.push(education.fieldOfStudy);
  const detail = detailParts.join(', ');

  const yearLine = formatYears(education.startYear, education.endYear);

  return (
    <div
      style={{
        width: '100%',
        padding: 'var(--spacing-md)',
        background: 'var(--surface-primary)',
        borderRadius: 'var(--ds-radius-md)',
        display: 'flex',
        alignItems: 'flex-start',
      }}
    >
      {/* The bullet: 4px, `text.body`, nudge 7px down and 8px across. */}
      <div style={{ padding: '7px 8px 0 0', flexShrink: 0 }}>
        <div
          style={{
            width: 4,
            height: 4,
            borderRadius: '50%',
            background: 'var(--text-body)',
          }}
        />
      </div>

      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {education.institutionName !== '' ? (
          <span
            className="type-title-sm type-emphasis-semibold"
            style={{ color: 'var(--text-heading)' }}
          >
            {education.institutionName}
          </span>
        ) : null}

        {detail !== '' ? (
          <>
            <div style={{ height: 2 }} />
            <span className="type-body-sm" style={{ color: 'var(--text-body-light)' }}>
              {detail}
            </span>
          </>
        ) : null}

        {yearLine !== null ? (
          <>
            <div style={{ height: 2 }} />
            <span className="type-body-sm" style={{ color: 'var(--text-body-light)' }}>
              {yearLine}
            </span>
          </>
        ) : null}
      </div>
    </div>
  );
}

/** `_formatYears` — "2016–2020", or whichever end exists on its own. */
function formatYears(start: number | null, end: number | null): string | null {
  if (start === null && end === null) return null;
  if (start !== null && end !== null) return `${start}–${end}`;
  if (start !== null) return String(start);
  return String(end);
}

/**
 * `_formatExperience` — "6 years".
 *
 * The Dart branches on `years == years.roundToDouble()` to pick between
 * `toInt().toString()` and `toString()`, but Dart's `double.toString()` already
 * prints `6.0` as "6.0" — hence the branch. JavaScript's `String(6.0)` is just
 * "6", so the branch has nothing left to do and is dropped. A fractional value
 * still prints in full ("6.5 years") in both.
 */
function formatExperience(years: number): string {
  return fill(copy.experienceYears, { count: String(years) });
}
