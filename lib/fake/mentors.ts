/**
 * Fake mentors.
 *
 * `MentorSummary` below is a field-for-field transcription of the app's own
 * model (`mentee_app/lib/domain/models/mentor_summary.dart`). That matters
 * because the rate display has three genuinely different modes decided by
 * these fields, not by a single "price":
 *
 *   1. `introPromoEligible`          → struck-through base + promo rate
 *   2. `chatDiscountPercent != null` → struck-through base + discounted rate
 *   3. neither                       → the plain rate
 *
 * Modelling it as a `billingType` enum (as this file first did) would have
 * flattened exactly the distinction the UI is built around, so the fields are
 * the source's own and `components/mentor-card.tsx` branches on them directly.
 *
 * `categories` holds DISPLAY names, not ids — that is what the API returns and
 * what `_formatCategories` renders ("JEE +1").
 *
 * Profile-only fields live apart, in `MENTOR_DETAILS`: the app has a separate,
 * larger model for the profile screen, so folding them into the summary would
 * invent fields the list and card code never sees.
 */

/** Exactly `MentorSummary`. */
export type MentorSummary = {
  id: string;
  displayName: string;
  profilePhotoUrl: string | null;
  /** Display names — see the note above. */
  categories: string[];
  institutionName: string | null;
  rating: number;
  totalSessions: number;
  ratePerMinute: number;
  isAvailable: boolean;
  isOnline: boolean;
  chatDiscountPercent: number | null;
  discountedRatePerMinute: number | null;
  introPromoEligible: boolean;
  introPromoRatePerMinute: number | null;
};

/** Exactly `MentorEducation`. */
export type MentorEducation = {
  institutionName: string;
  degree: string;
  fieldOfStudy: string | null;
  startYear: number | null;
  endYear: number | null;
  isVerified: boolean;
};

/** Exactly `MentorExperience`. Unused by the profile page — see `MentorProfile`. */
export type MentorExperience = {
  title: string;
  organization: string;
  isCurrent: boolean;
  startMonth: number;
  startYear: number;
  endMonth: number | null;
  endYear: number | null;
  isVerified: boolean;
};

/** Exactly `MentorPhoto`. */
export type MentorPhoto = { id: string; url: string };

/**
 * Exactly `MentorProfile` — the profile screen's model.
 *
 * It is a *different shape* from `MentorSummary`, not a superset: it renames
 * `rating` to `avgRating`, `reviewCount` to `totalReviews`, and adds a dozen
 * fields the list never sees. That mirrors production, where the profile screen
 * makes its own request (`MentorProfileEvent.started`) against its own endpoint
 * and gets this object back. Building it by spreading a summary would erase the
 * rename — which is exactly the kind of drift that makes a port stop matching.
 */
export type MentorProfile = {
  id: string;
  displayName: string;
  profilePhotoUrl: string | null;
  gender: string | null;
  bio: string | null;
  ratePerMinute: number;
  /** Base video rate. The app derives it as `ratePerMinute * 1.5`. */
  videoRatePerMinute: number | null;
  isAvailable: boolean;
  prefAudio: boolean;
  prefVideo: boolean;
  avgRating: number;
  totalReviews: number;
  totalSessions: number;
  isVerified: boolean;
  categories: string[];
  languages: string[];
  education: MentorEducation[];
  experience: MentorExperience[];
  photos: MentorPhoto[];
  totalExperienceYears: number | null;
  isFollowing: boolean;
  isOnline: boolean;
  chatDiscountPercent: number | null;
  discountedRatePerMinute: number | null;
  introPromoEligible: boolean;
  introPromoRatePerMinute: number | null;
};

/** What only the profile screen reads. A separate model in the app too. */
export type MentorDetail = {
  bio: string;
  languages: string[];
  experienceYears: number;
  reviewCount: number;
  acceptsVideo: boolean;
  /** Category ids, used by the discovery filters. */
  categoryIds: string[];
};

import { MENTOR_PORTRAITS } from '@/lib/fake/portraits';

type Mentor = MentorSummary & { detail: MentorDetail };

const RAW: Mentor[] = [
  {
    id: 'm1',
    displayName: 'Ananya Iyer',
    profilePhotoUrl: MENTOR_PORTRAITS.m1,
    categories: ['JEE', 'Physics'],
    institutionName: 'IIT Bombay',
    rating: 4.9,
    totalSessions: 1340,
    ratePerMinute: 20,
    isAvailable: true,
    isOnline: true,
    chatDiscountPercent: null,
    discountedRatePerMinute: null,
    introPromoEligible: true,
    introPromoRatePerMinute: 12,
    detail: {
      bio: "I cleared JEE Advanced with an AIR of 412 and have been mentoring aspirants for six years. My approach is built around problem-solving discipline rather than rote practice — we'll work through why a method fails, not just that it does.",
      languages: ['English', 'हिन्दी'],
      experienceYears: 6,
      reviewCount: 218,
      acceptsVideo: true,
      categoryIds: ['jee', 'physics'],
    },
  },
  {
    id: 'm2',
    displayName: 'Rohan Deshpande',
    profilePhotoUrl: MENTOR_PORTRAITS.m2,
    categories: ['NEET', 'Biology'],
    institutionName: 'AIIMS Delhi',
    rating: 4.8,
    totalSessions: 890,
    ratePerMinute: 15,
    isAvailable: true,
    isOnline: true,
    // The mentor's own universal chat discount — the middle display mode.
    chatDiscountPercent: 20,
    discountedRatePerMinute: 12,
    introPromoEligible: false,
    introPromoRatePerMinute: null,
    detail: {
      bio: 'Biology is memory plus structure. I teach a spaced-revision system that got me through AIIMS, and we will rebuild your NCERT notes into something you can actually recall under pressure.',
      languages: ['English', 'मराठी'],
      experienceYears: 4,
      reviewCount: 164,
      acceptsVideo: true,
      categoryIds: ['neet', 'biology'],
    },
  },
  {
    id: 'm3',
    displayName: 'Priya Nair',
    profilePhotoUrl: MENTOR_PORTRAITS.m3,
    categories: ['CUET', 'Aptitude'],
    institutionName: 'IIM Ahmedabad',
    rating: 4.7,
    totalSessions: 520,
    ratePerMinute: 18,
    isAvailable: false,
    isOnline: false,
    chatDiscountPercent: null,
    discountedRatePerMinute: null,
    introPromoEligible: false,
    introPromoRatePerMinute: null,
    detail: {
      bio: 'I work on speed and accuracy for aptitude sections. Most students lose marks to timing rather than knowledge, so we drill with a stopwatch from day one.',
      languages: ['English', 'தமிழ்'],
      experienceYears: 5,
      reviewCount: 96,
      acceptsVideo: true,
      categoryIds: ['cuet', 'aptitude'],
    },
  },
  {
    id: 'm4',
    displayName: 'Karthik Reddy',
    profilePhotoUrl: MENTOR_PORTRAITS.m4,
    categories: ['JEE', 'Maths'],
    institutionName: 'NIT Warangal',
    rating: 4.6,
    totalSessions: 38,
    ratePerMinute: 10,
    isAvailable: true,
    isOnline: true,
    chatDiscountPercent: null,
    discountedRatePerMinute: null,
    introPromoEligible: false,
    introPromoRatePerMinute: null,
    detail: {
      bio: 'New here, so the first five minutes are on me. I focus on calculus and coordinate geometry — the two areas where most JEE aspirants plateau.',
      languages: ['English', 'తెలుగు'],
      experienceYears: 2,
      reviewCount: 12,
      acceptsVideo: false,
      categoryIds: ['jee', 'maths'],
    },
  },
  {
    id: 'm5',
    displayName: 'Sneha Kulkarni',
    profilePhotoUrl: MENTOR_PORTRAITS.m5,
    categories: ['CUET', 'English'],
    institutionName: "St. Stephen's College",
    rating: 4.9,
    totalSessions: 760,
    ratePerMinute: 18,
    isAvailable: true,
    isOnline: true,
    chatDiscountPercent: 25,
    discountedRatePerMinute: 13.5,
    introPromoEligible: true,
    introPromoRatePerMinute: 14,
    detail: {
      bio: 'Reading comprehension and vocabulary for CUET. I have a bank of 2,000 question patterns and we will work through them by type until they stop surprising you.',
      languages: ['English', 'हिन्दी'],
      experienceYears: 5,
      reviewCount: 141,
      acceptsVideo: true,
      categoryIds: ['cuet', 'english'],
    },
  },
  {
    id: 'm6',
    displayName: 'Arjun Mehta',
    profilePhotoUrl: MENTOR_PORTRAITS.m6,
    categories: ['JEE', 'Chemistry'],
    institutionName: 'BITS Pilani',
    rating: 4.5,
    totalSessions: 410,
    ratePerMinute: 11,
    isAvailable: true,
    isOnline: false,
    chatDiscountPercent: null,
    discountedRatePerMinute: null,
    introPromoEligible: false,
    introPromoRatePerMinute: null,
    detail: {
      bio: 'Organic chemistry is pattern recognition. I teach mechanisms as a small set of recurring moves so you stop memorising reactions one by one.',
      languages: ['English'],
      experienceYears: 3,
      reviewCount: 73,
      acceptsVideo: true,
      categoryIds: ['jee', 'chemistry'],
    },
  },
  {
    id: 'm7',
    displayName: 'Fatima Sheikh',
    profilePhotoUrl: MENTOR_PORTRAITS.m7,
    categories: ['NEET', 'Physics'],
    institutionName: 'Jamia Millia Islamia',
    rating: 4.8,
    totalSessions: 640,
    ratePerMinute: 13,
    isAvailable: false,
    isOnline: true,
    chatDiscountPercent: null,
    discountedRatePerMinute: null,
    introPromoEligible: false,
    introPromoRatePerMinute: null,
    detail: {
      bio: 'Physics rewards drawing the problem before solving it. We will spend the first minutes of every session sketching, and it changes how the questions read.',
      languages: ['English', 'हिन्दी', 'اردو'],
      experienceYears: 4,
      reviewCount: 118,
      acceptsVideo: true,
      categoryIds: ['neet', 'physics'],
    },
  },
  {
    id: 'm8',
    displayName: 'Vikram Singh',
    profilePhotoUrl: MENTOR_PORTRAITS.m8,
    categories: ['GATE', 'Aptitude'],
    institutionName: 'IIT Kanpur',
    rating: 5.0,
    totalSessions: 210,
    ratePerMinute: 22,
    isAvailable: true,
    isOnline: true,
    chatDiscountPercent: null,
    discountedRatePerMinute: null,
    introPromoEligible: false,
    introPromoRatePerMinute: null,
    detail: {
      bio: 'I mentor for GATE and core engineering subjects. Sixteen years in the field means I can tell you which parts of the syllabus actually matter on the job.',
      languages: ['English', 'हिन्दी'],
      experienceYears: 16,
      reviewCount: 54,
      acceptsVideo: true,
      categoryIds: ['gate', 'aptitude'],
    },
  },
];

/** The summaries, exactly as the list/card code receives them. */
export const MENTORS: MentorSummary[] = RAW.map(
  ({ detail: _detail, ...summary }) => summary,
);

const DETAILS: Record<string, MentorDetail> = Object.fromEntries(
  RAW.map((m) => [m.id, m.detail]),
);

export function findMentor(id: string): MentorSummary | undefined {
  return MENTORS.find((m) => m.id === id);
}

/** The profile screen's extra fields. */
export function findMentorDetail(id: string): MentorDetail | undefined {
  return DETAILS[id];
}

export const ONLINE_MENTORS = MENTORS.filter((m) => m.isOnline);

// ────────────────────────────────────────────────────────────────
// Profile extras — the fields only `MentorProfile` carries
// ────────────────────────────────────────────────────────────────

/**
 * Two of these fields are load-bearing rather than decorative, because they
 * decide which buttons on the profile are *disabled*:
 *
 *   isAvailable  → both Chat and Call grey out, and "Mentor is currently
 *                  unavailable" appears above them
 *   prefAudio    → Call greys out (Chat stays live)
 *   prefVideo    → the 3-dot menu's Video Call entry shows "Not available"
 *
 * Between them the eight mentors cover every combination, so each disabled
 * branch is reachable by opening a different profile — m3 and m7 are the
 * unavailable pair, m5 declines audio calls, m4 declines video.
 *
 * `photos` is populated for m1 alone. The app's mentor photos are user-uploaded
 * images and the prototype ships no portrait art, so these reuse the home
 * banner illustrations as stand-ins — enough to exercise the strip and the
 * full-screen viewer, which are otherwise unreachable. The URLs are
 * root-relative rather than absolute, which is why the "does this mentor have a
 * photo?" guard is `hasDisplayablePhoto` below and not Flutter's raw
 * `startsWith('http')` test.
 */
const PROFILE_EXTRAS: Record<
  string,
  Pick<
    MentorProfile,
    | 'gender'
    | 'isVerified'
    | 'prefAudio'
    | 'prefVideo'
    | 'education'
    | 'experience'
    | 'photos'
  >
> = {
  m1: {
    gender: 'female',
    isVerified: true,
    prefAudio: true,
    prefVideo: true,
    education: [
      {
        institutionName: 'IIT Bombay',
        degree: 'B.Tech',
        fieldOfStudy: 'Engineering Physics',
        startYear: 2016,
        endYear: 2020,
        isVerified: true,
      },
    ],
    experience: [
      {
        title: 'Physics Mentor',
        organization: 'MentorTalk',
        isCurrent: true,
        startMonth: 3,
        startYear: 2020,
        endMonth: null,
        endYear: null,
        isVerified: true,
      },
    ],
    photos: [
      { id: 'p1', url: '/assets/images/home_banners/banner_1.png' },
      { id: 'p2', url: '/assets/images/home_banners/banner_2.png' },
      { id: 'p3', url: '/assets/images/home_banners/banner_3.png' },
    ],
  },
  m2: {
    gender: 'male',
    isVerified: true,
    prefAudio: true,
    prefVideo: true,
    education: [
      {
        institutionName: 'AIIMS Delhi',
        degree: 'MBBS',
        fieldOfStudy: 'Medicine',
        startYear: 2017,
        endYear: 2022,
        isVerified: true,
      },
    ],
    experience: [],
    photos: [],
  },
  m3: {
    gender: 'female',
    isVerified: false,
    prefAudio: true,
    prefVideo: true,
    education: [
      {
        institutionName: 'IIM Ahmedabad',
        degree: 'MBA',
        fieldOfStudy: 'General Management',
        startYear: 2019,
        endYear: 2021,
        isVerified: false,
      },
      {
        institutionName: 'Lady Shri Ram College',
        degree: 'B.Com',
        fieldOfStudy: null,
        startYear: 2016,
        endYear: 2019,
        isVerified: false,
      },
    ],
    experience: [],
    photos: [],
  },
  m4: {
    gender: 'male',
    isVerified: false,
    prefAudio: true,
    prefVideo: false,
    education: [],
    experience: [],
    photos: [],
  },
  m5: {
    gender: 'female',
    isVerified: true,
    prefAudio: false,
    prefVideo: true,
    education: [
      {
        institutionName: "St. Stephen's College",
        degree: 'BA',
        fieldOfStudy: 'English Literature',
        startYear: 2015,
        endYear: 2018,
        isVerified: true,
      },
    ],
    experience: [],
    photos: [],
  },
  m6: {
    gender: 'male',
    isVerified: false,
    prefAudio: true,
    prefVideo: true,
    education: [],
    experience: [],
    photos: [],
  },
  m7: {
    gender: 'female',
    isVerified: true,
    prefAudio: true,
    prefVideo: true,
    education: [],
    experience: [],
    photos: [],
  },
  m8: {
    gender: 'male',
    isVerified: true,
    prefAudio: true,
    prefVideo: true,
    education: [
      {
        institutionName: 'IIT Kanpur',
        degree: 'M.Tech',
        fieldOfStudy: 'Mechanical Engineering',
        startYear: 2004,
        endYear: 2006,
        isVerified: true,
      },
    ],
    experience: [],
    photos: [],
  },
};

/**
 * Flutter's guard is `url != null && url.isNotEmpty && url.startsWith('http')`.
 * Every URL the app stores is absolute, so that test is exact there. Here the
 * stand-in photos are served from `/assets/...`, which is a valid URL a browser
 * can load but does not begin with `http` — so the guard accepts either form
 * and still rejects the empty and whitespace strings the original is guarding
 * against. The fallback branch (grey panel + person icon) is unchanged.
 */
export function hasDisplayablePhoto(url: string | null | undefined): boolean {
  if (!url || url.trim() === '') return false;
  return url.startsWith('http') || url.startsWith('/');
}

/**
 * Builds the profile the way the second endpoint would return it: the summary's
 * fields under their *profile* names, plus the extras above.
 *
 * `isFollowing` is the one field with no source in either table — in production
 * it comes back on the response for the signed-in mentee. It is threaded in as
 * an argument so the screen can own it as state (following is a real toggle),
 * rather than being baked into the data.
 */
export function buildMentorProfile(
  id: string,
  isFollowing = false,
): MentorProfile | undefined {
  const summary = findMentor(id);
  const detail = findMentorDetail(id);
  const extras = PROFILE_EXTRAS[id];
  if (!summary || !detail || !extras) return undefined;

  return {
    id: summary.id,
    displayName: summary.displayName,
    profilePhotoUrl: summary.profilePhotoUrl,
    gender: extras.gender,
    bio: detail.bio,
    ratePerMinute: summary.ratePerMinute,
    // Derived client-side in the app too — the comment on
    // `MentorProfileVideoRateX` says the backend never sends a pre-discounted
    // video figure, so the base is `rate * 1.5` and the chat discount is
    // applied on top by the extension.
    videoRatePerMinute: summary.ratePerMinute * 1.5,
    isAvailable: summary.isAvailable,
    prefAudio: extras.prefAudio,
    prefVideo: extras.prefVideo,
    avgRating: summary.rating,
    totalReviews: detail.reviewCount,
    totalSessions: summary.totalSessions,
    isVerified: extras.isVerified,
    categories: summary.categories,
    languages: detail.languages,
    education: extras.education,
    experience: extras.experience,
    photos: extras.photos,
    totalExperienceYears: detail.experienceYears,
    isFollowing,
    isOnline: summary.isOnline,
    chatDiscountPercent: summary.chatDiscountPercent,
    discountedRatePerMinute: summary.discountedRatePerMinute,
    introPromoEligible: summary.introPromoEligible,
    introPromoRatePerMinute: summary.introPromoRatePerMinute,
  };
}

/**
 * The two fields the filter sheet narrows on that `MentorSummary` does not
 * carry — and the reason this table has to exist at all.
 *
 * In production `MentorsListBloc._onStarted` passes `gender:` and `languages:`
 * to `getPopularMentors` as *query parameters*; the backend filters and returns
 * a shorter list. The client never sees a mentor's gender or language codes, so
 * there is nothing on the summary to filter by locally. With no server here,
 * the facets have to live somewhere — hence this table.
 *
 * It is keyed separately from `PROFILE_EXTRAS` on purpose: that table holds
 * what the *profile screen* returns, and gender is only reachable there because
 * the profile endpoint happens to include it. Conflating the two would suggest
 * the list screen has access to profile data, which it does not.
 *
 * `languageCodes` mirrors the filter chips' `value`s (`en`, `hi`, …) rather
 * than the display names in `MentorDetail.languages` — the same split the API
 * makes, and the reason m7 can speak اردو, which is not one of the eight chips.
 */
const FILTER_FACETS: Record<string, { gender: string; languageCodes: string[] }> = {
  m1: { gender: 'female', languageCodes: ['en', 'hi'] },
  m2: { gender: 'male', languageCodes: ['en', 'mr'] },
  m3: { gender: 'female', languageCodes: ['en', 'ta'] },
  m4: { gender: 'male', languageCodes: ['en', 'te'] },
  m5: { gender: 'female', languageCodes: ['en', 'hi'] },
  m6: { gender: 'male', languageCodes: ['en'] },
  m7: { gender: 'female', languageCodes: ['en', 'hi', 'ur'] },
  m8: { gender: 'male', languageCodes: ['en', 'hi'] },
};

/**
 * `getPopularMentors(sortBy:, gender:, languages:)`, applied locally.
 *
 * `'all'` and an empty language list both mean "no constraint", matching the
 * bloc's `selectedLanguages.isNotEmpty ? ... : null`.
 *
 * This is deliberately NOT the same as filtering the visible list: the real
 * call re-fetches page 0 from the server, so the result is a fresh page of 8
 * rather than a narrowed view of the 8 already on screen. With no paging here
 * the whole fake set is the corpus, which is the closest honest equivalent.
 */
export function applyMentorFilters(
  mentors: MentorSummary[],
  filters: { sortBy: string; gender: string; selectedLanguages: string[] },
): MentorSummary[] {
  const narrowed = mentors.filter((mentor) => {
    const facets = FILTER_FACETS[mentor.id];
    if (!facets) return true;

    if (filters.gender !== 'all' && facets.gender !== filters.gender) return false;

    if (filters.selectedLanguages.length > 0) {
      const matches = filters.selectedLanguages.some((code) =>
        facets.languageCodes.includes(code),
      );
      if (!matches) return false;
    }

    return true;
  });

  switch (filters.sortBy) {
    case 'sessions_desc':
      return [...narrowed].sort((a, b) => b.totalSessions - a.totalSessions);
    case 'price_asc':
      return [...narrowed].sort((a, b) => a.ratePerMinute - b.ratePerMinute);
    case 'price_desc':
      return [...narrowed].sort((a, b) => b.ratePerMinute - a.ratePerMinute);
    case 'rating_desc':
    default:
      return [...narrowed].sort((a, b) => b.rating - a.rating);
  }
}

/**
 * `MentorProfileVideoRateX.discountedVideoRatePerMinute` — `videoRate * (1 -
 * percent/100)`, null unless both halves are present.
 */
export function discountedVideoRate(profile: MentorProfile): number | null {
  const video = profile.videoRatePerMinute;
  const percent = profile.chatDiscountPercent;
  if (video === null || percent === null) return null;
  return video * (1 - percent / 100);
}

/** Matches the app's `_mentorSearch` — name and headline, case-insensitive. */
export function searchMentors(query: string): MentorSummary[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return MENTORS.filter(
    (m) =>
      m.displayName.toLowerCase().includes(q) ||
      m.categories.some((c) => c.toLowerCase().includes(q)),
  );
}
