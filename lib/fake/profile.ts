import { DEMO_NAME, DEMO_PHONE, DEMO_USERNAME } from '@/lib/state/demo-provider';

/**
 * The fallback `MenteeProfile` — what the account tab shows when you land on
 * `/home` by deep link, without having walked the wizard.
 *
 * Production has no such fallback: `HomeBloc` fetches this from the server and
 * the app bar renders a 48px placeholder until it arrives. A prototype that
 * deep-links into `/home?tab=account` from the screen index has no onboarding
 * state behind it, so without a fallback the Account tab would be blank — and
 * a blank screen is indistinguishable from a bug while reviewing.
 *
 * `educationDetail` needs a word of explanation. The Flutter side never
 * composes it: `MenteeProfileDto` reads `education_detail` straight off the
 * JSON, so the string's shape is the **server's** choice, not the app's. This
 * fallback invents one — `"{institution} · {degree}"` — and
 * `ProfileProvider` uses the same format when composing it from a wizard
 * entry. Treat the separator as a fabrication, not a transcription.
 */
import { MY_PORTRAIT } from '@/lib/fake/portraits';

export const FALLBACK_PROFILE = {
  username: DEMO_USERNAME,
  displayName: DEMO_NAME,
  phoneNumber: DEMO_PHONE,
  educationDetail: 'Delhi Public School · Class 12',
  profilePhotoUrl: MY_PORTRAIT as string | null,
  /** Fail-open default — mirrors the DTO's `?? true`. */
  freeChatAvailable: true,
};

/** The same composition `FALLBACK_PROFILE.educationDetail` uses. */
export function composeEducationDetail(
  institution: string,
  degree: string,
): string {
  return `${institution} · ${degree}`;
}
