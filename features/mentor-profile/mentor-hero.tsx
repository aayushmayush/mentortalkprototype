'use client';

import { AppButton, AppIcon } from '@/design-system';
import { copy, fill } from '@/lib/copy';
import {
  hasDisplayablePhoto,
  type MentorProfile,
} from '@/lib/fake/mentors';
import { formatRate } from '@/lib/rates';

/**
 * MentorHeroSection — port of
 * `ui/mentor_profile/widgets/mentor_hero_section.dart`.
 *
 * ── The geometry is fixed, not intrinsic ────────────────────────────────────
 *
 * The whole thing is a 370px box holding a 300px photo with a card overlapping
 * its bottom 70px (`Positioned(bottom: 0)` inside the 370px `SizedBox`). The
 * card is `left/right: pagePaddingHorizontal` — 16px in from each edge — so it
 * is *narrower* than the photo behind it, and the photo's corners peek out
 * above it. Reproducing the 370 rather than letting the card size the stack is
 * what keeps that overlap at exactly 70.
 *
 * ── The three rate displays, again ──────────────────────────────────────────
 *
 * `_buildRate` is the same three-mode ladder as the mentor card, but this copy
 * has its own subtlety: the intro-promo mode falls back to
 * `introPromoRatePerMinute ?? ratePerMinute.toDouble()` and the discount mode
 * to `discountedRatePerMinute ?? ratePerMinute.toDouble()` — both double. So an
 * eligible mentor with a missing promo figure renders the strike-through *and*
 * the plain rate side by side, rather than silently falling back to the plain
 * mode. Both null-coalescings are reproduced.
 *
 * The suffix `'first 5 min'` is a hardcoded literal in the source, not an l10n
 * key.
 */

const HERO_HEIGHT = 370;
const PHOTO_HEIGHT = 300;

export function MentorHero({
  profile,
  isFollowing,
  onToggleFollow,
}: {
  profile: MentorProfile;
  isFollowing: boolean;
  onToggleFollow: () => void;
}) {
  const hasPhoto = hasDisplayablePhoto(profile.profilePhotoUrl);

  return (
    <div style={{ height: HERO_HEIGHT, position: 'relative' }}>
      {/* ── Hero photo ── */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: PHOTO_HEIGHT,
          background: 'var(--surface-disabled)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        {hasPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={profile.profilePhotoUrl!}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          // The source's `else` branch: a person glyph for a mentor with no
          // photo. No fake mentor has one — see `hasDisplayablePhoto`.
          <AppIcon name="person" size="lg" color="var(--icon-primary)" />
        )}
      </div>

      {/* ── Overlapping info card ── */}
      <div
        style={{
          position: 'absolute',
          left: 'var(--page-padding-horizontal)',
          right: 'var(--page-padding-horizontal)',
          bottom: 0,
          padding: 'var(--spacing-sm) var(--spacing-md)',
          background: 'var(--surface-primary)',
          borderRadius: 'var(--ds-radius-md)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Row 1: name + verified | rating badge */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center' }}>
            <span
              className="type-title-md type-emphasis-bold"
              style={{
                color: 'var(--text-heading)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                minWidth: 0,
              }}
            >
              {profile.displayName}
            </span>
            {profile.isVerified ? (
              <>
                <div style={{ width: 4 }} />
                {/* `icon.action` here — the search tile uses `text.action`. */}
                <AppIcon name="verified" size="xs" color="var(--icon-action)" />
              </>
            ) : null}
          </div>

          {profile.avgRating > 0 ? <RatingBadge rating={profile.avgRating} /> : null}
        </div>

        <div style={{ height: 2 }} />

        {/* Row 2: categories, deduped and joined with a middle dot */}
        {profile.categories.length > 0 ? (
          <span
            className="type-body-sm"
            style={{
              color: 'var(--text-body-light)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {Array.from(new Set(profile.categories)).join(' · ')}
          </span>
        ) : null}

        <div style={{ height: 'var(--spacing-xs)' }} />

        {/* Row 3: sessions */}
        <span className="type-body-sm" style={{ color: 'var(--text-body-light)' }}>
          {fill(copy.sessionCount, { count: formatSessions(profile.totalSessions) })}
        </span>

        <div style={{ height: 'var(--spacing-xs)' }} />

        {/* Row 4: rate | follow */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Rate profile={profile} />
          <AppButton
            label={isFollowing ? copy.following : copy.follow}
            size="compact"
            type={isFollowing ? 'outlined' : 'solid'}
            intent="primary"
            onClick={onToggleFollow}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * `_buildRate` — platform promo beats universal chat discount beats base rate.
 */
function Rate({ profile }: { profile: MentorProfile }) {
  if (profile.introPromoEligible) {
    return (
      <DiscountedRate
        base={profile.ratePerMinute}
        // `?? profile.ratePerMinute.toDouble()` — see the note above.
        discounted={profile.introPromoRatePerMinute ?? profile.ratePerMinute}
        suffix="first 5 min"
      />
    );
  }

  if (profile.chatDiscountPercent !== null) {
    return (
      <DiscountedRate
        base={profile.ratePerMinute}
        discounted={profile.discountedRatePerMinute ?? profile.ratePerMinute}
        suffix={null}
      />
    );
  }

  return (
    <span
      className="type-title-sm type-emphasis-bold"
      style={{ color: 'var(--text-heading)' }}
    >
      {fill(copy.ratePerMinute, { rate: profile.ratePerMinute })}
    </span>
  );
}

function DiscountedRate({
  base,
  discounted,
  suffix,
}: {
  base: number;
  discounted: number;
  suffix: string | null;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <span
        className="type-body-md"
        style={{ color: 'var(--text-body-light)', textDecoration: 'line-through' }}
      >
        {fill(copy.ratePerMinute, { rate: base })}
      </span>

      <div style={{ width: 6 }} />

      <span
        className="type-title-md type-emphasis-bold"
        style={{ color: 'var(--text-action)' }}
      >
        {fill(copy.ratePerMinute, { rate: formatRate(discounted) })}
      </span>

      {suffix !== null ? (
        <>
          <div style={{ width: 6 }} />
          <span className="type-body-sm" style={{ color: 'var(--text-body-light)' }}>
            · {suffix}
          </span>
        </>
      ) : null}
    </div>
  );
}

/**
 * `_RatingBadge` — ⭐ 4.7 in a small pill.
 *
 * The star is `#FFCA28`, one of the handful of hardcoded colours outside
 * `AppColorScheme` — the same value `kReviewStar` uses in the reviews header is
 * a *different* one (`#FBBF24`), so the two stars on this screen do not match.
 */
function RatingBadge({ rating }: { rating: number }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '3px 8px',
        background: 'var(--surface-primary)',
        borderRadius: 'var(--ds-radius-sm)',
        flexShrink: 0,
      }}
    >
      <AppIcon name="star" size="xs" color="#FFCA28" />
      <div style={{ width: 2 }} />
      <span
        className="type-label-sm type-emphasis-bold"
        style={{ color: 'var(--text-heading)' }}
      >
        {rating.toFixed(1)}
      </span>
    </div>
  );
}

/** `_formatSessions` — 1.3K above a thousand, dropping a trailing ".0". */
function formatSessions(count: number): string {
  if (count >= 1000) {
    const k = count / 1000;
    return `${Number.isInteger(k) ? k.toFixed(0) : k.toFixed(1)}K`;
  }
  return String(count);
}
