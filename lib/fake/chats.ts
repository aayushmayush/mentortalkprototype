/**
 * Fake chat inbox.
 *
 * Shaped after `MentorInboxItem` (`domain/models/mentor_inbox.dart`), including
 * the rate fields — the inbox card does not show them, but the chat screen it
 * opens does, so they ride along here rather than being looked up again.
 *
 * `lastSessionAt` is built relative to "now" so the timestamp formatter's four
 * branches (time / Yesterday / weekday / date) are all reachable without
 * editing data by hand. That formatter is the interesting part of the card and
 * a fixed date would only ever exercise one branch.
 */

export type PresenceStatus = 'online' | 'inSession' | 'offline';

export type MentorLastActivity = {
  /** `text` | `audio_call` | `video_call` | `system` */
  type: string;
  content: string;
};

export type MentorInboxItem = {
  mentorId: string;
  name: string;
  avatar: string | null;
  sessionCount: number;
  lastSessionAt: Date;
  lastActivity: MentorLastActivity;
  prefAudio: boolean;
  prefVideo: boolean;
  chatDiscountPercent: number | null;
  discountedRatePerMinute: number | null;
  introPromoEligible: boolean;
  introPromoRatePerMinute: number | null;
  ratePerMinute: number;
  presence: PresenceStatus;
  lastSeen: Date | null;
};

import { mentorPortrait } from '@/lib/fake/portraits';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function ago(ms: number): Date {
  return new Date(Date.now() - ms);
}

/** Built lazily: the offsets must be relative to when the page actually opens. */
export function buildChats(): MentorInboxItem[] {
  return [
    {
      mentorId: 'm1',
      name: 'Ananya Iyer',
      avatar: mentorPortrait('m1'),
      sessionCount: 12,
      lastSessionAt: ago(25 * MINUTE),
      lastActivity: { type: 'text', content: 'Send me the questions you got stuck on.' },
      prefAudio: true,
      prefVideo: true,
      chatDiscountPercent: null,
      discountedRatePerMinute: null,
      introPromoEligible: true,
      introPromoRatePerMinute: 12,
      ratePerMinute: 20,
      presence: 'online',
      lastSeen: null,
    },
    {
      mentorId: 'm2',
      name: 'Rohan Deshpande',
      avatar: mentorPortrait('m2'),
      sessionCount: 5,
      lastSessionAt: ago(6 * HOUR),
      lastActivity: { type: 'audio_call', content: 'Audio call · 14 min' },
      prefAudio: true,
      prefVideo: false,
      chatDiscountPercent: 20,
      discountedRatePerMinute: 12,
      introPromoEligible: false,
      introPromoRatePerMinute: null,
      ratePerMinute: 15,
      presence: 'inSession',
      lastSeen: null,
    },
    {
      mentorId: 'm5',
      name: 'Sneha Kulkarni',
      avatar: mentorPortrait('m5'),
      sessionCount: 3,
      lastSessionAt: ago(1 * DAY + 2 * HOUR),
      lastActivity: { type: 'video_call', content: 'Video call · 22 min' },
      prefAudio: true,
      prefVideo: true,
      chatDiscountPercent: 25,
      discountedRatePerMinute: 13.5,
      introPromoEligible: false,
      introPromoRatePerMinute: null,
      ratePerMinute: 18,
      presence: 'offline',
      lastSeen: ago(3 * HOUR),
    },
    {
      mentorId: 'm8',
      name: 'Vikram Singh',
      avatar: mentorPortrait('m8'),
      sessionCount: 8,
      lastSessionAt: ago(3 * DAY),
      lastActivity: { type: 'system', content: 'Session ended · ₹264 billed' },
      prefAudio: true,
      prefVideo: true,
      chatDiscountPercent: null,
      discountedRatePerMinute: null,
      introPromoEligible: false,
      introPromoRatePerMinute: null,
      ratePerMinute: 22,
      presence: 'offline',
      lastSeen: ago(2 * DAY),
    },
    {
      mentorId: 'm6',
      name: 'Arjun Mehta',
      avatar: mentorPortrait('m6'),
      sessionCount: 1,
      lastSessionAt: ago(20 * DAY),
      lastActivity: { type: 'text', content: 'Good luck with the revision!' },
      prefAudio: true,
      prefVideo: true,
      chatDiscountPercent: null,
      discountedRatePerMinute: null,
      introPromoEligible: false,
      introPromoRatePerMinute: null,
      ratePerMinute: 11,
      presence: 'offline',
      lastSeen: ago(20 * DAY),
    },
  ];
}

/**
 * `MentorInboxCard.buildActivityPreview` — the emoji prefix is the source's,
 * and it is the only place in the inbox list that distinguishes a call from a
 * message.
 */
export function buildActivityPreview(activity: MentorLastActivity): string {
  if (activity.type === 'audio_call') return `📞 ${activity.content}`;
  if (activity.type === 'video_call') return `🎥 ${activity.content}`;
  return activity.content;
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/**
 * `MentorInboxCard.formatTimestamp` — four branches, in the source's order.
 *
 * It reimplements `DateFormat('h:mm a')` and `DateFormat('EEE')` rather than
 * pulling in a date library: the app formats through `intl`, but these are
 * fixed English patterns and a dependency would buy nothing.
 */
export function formatTimestamp(date: Date, yesterdayLabel: string): string {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday.getTime() - DAY);
  const messageDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (messageDay.getTime() === startOfToday.getTime()) {
    return formatHourMinute(date);
  }
  if (messageDay.getTime() === startOfYesterday.getTime()) {
    return yesterdayLabel;
  }
  if (now.getTime() - date.getTime() < 7 * DAY) {
    return WEEKDAYS[date.getDay()];
  }
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

function formatHourMinute(date: Date): string {
  const hours24 = date.getHours();
  const suffix = hours24 < 12 ? 'AM' : 'PM';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${String(date.getMinutes()).padStart(2, '0')} ${suffix}`;
}
