/**
 * A seeded chat thread.
 *
 * The app's messages arrive over a WebSocket and are paged 50 at a time from
 * history. Neither exists here, so this builds a short thread by hand — but it
 * is built to exercise every render path the chat screen has, because a thread
 * of six text messages would leave most of the screen unreviewed.
 *
 * What is deliberately present, and why:
 *
 * - **A date boundary.** The thread straddles yesterday and today so the
 *   `_DateHeader` renders at all — it only appears on the oldest message of
 *   each calendar day, so a single-day thread never shows one.
 * - **Both kinds of system row.** `_SystemMessage` (the grey pill with a time
 *   and a tap target) and `_SessionBoundaryBubble` (the green centred pill) are
 *   different widgets fed by different message shapes. `session_boundary` is a
 *   wire string that is NOT a `MessageType`, so it is the one parse in
 *   `chat-message.ts` worth seeing rendered.
 * - **All three media kinds, and all three unavailable variants.** The
 *   unavailable bubble is what the backend sends for privacy-restricted
 *   past-session media: `mediaUrl == null` on a message that is not still
 *   sending. It is a state a mentee hits by scrolling back far enough, and it
 *   looks nothing like a load failure, so it is seeded rather than described.
 * - **A reply.** The quoted strip and the swipe gesture only exist on a message
 *   that carries a `replySnapshot`.
 *
 * ── Two honest stand-ins ────────────────────────────────────────────────────
 *
 * There is no media storage in the prototype, so:
 *
 * 1. The image message's `mediaUrl` points at an inline SVG data URI standing in
 *    for the on-device file. The app would have downloaded it to
 *    `<appDocuments>/chat_media/` and rendered `Image.file`. Everything that
 *    matters for review — the aspect-ratio box, the clamp, the timestamp pill
 *    over the image — is identical; only the pixel source differs.
 * 2. Audio has no playable file, so the bubble's progress is advanced by a timer
 *    while `isPlaying`, rather than by a real player. The waveform, the
 *    duration label and the play/pause swap are the app's.
 */

import {
  type ChatMessage,
  type ReplySnapshot,
  optimisticMedia,
  systemMessage,
} from '@/lib/session/chat-message';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

export const CURRENT_USER_ID = 'me';

/** The mentee's own name, read by the promo banner's greeting. */
export const CURRENT_USER_FIRST_NAME = 'Ayush';

/**
 * A 4:3 gradient standing in for a downloaded photo. Data-URI rather than a
 * file so the prototype stays a single self-contained app.
 */
const STAND_IN_PHOTO =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="360" viewBox="0 0 480 360">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#4374ba"/>
          <stop offset="55%" stop-color="#6f9bd6"/>
          <stop offset="100%" stop-color="#cdd9ef"/>
        </linearGradient>
      </defs>
      <rect width="480" height="360" fill="url(#g)"/>
      <circle cx="360" cy="96" r="44" fill="#ffffff" opacity="0.35"/>
      <path d="M0 300 L120 208 L214 282 L318 176 L480 300 L480 360 L0 360 Z" fill="#1e2b3d" opacity="0.22"/>
    </svg>`,
  );

/** 40 samples, the same shape `AudioRecorderService` writes (amplitudes 0–1). */
const VOICE_WAVEFORM = Array.from({ length: 40 }, (_, i) => {
  const base = Math.sin(i / 3.1) * 0.28 + Math.sin(i / 1.3) * 0.14;
  return Math.min(1, Math.max(0.12, 0.52 + base));
});

function minutesAgo(now: number, minutes: number): number {
  return now - minutes * MINUTE;
}

function replySnapshotOf(
  partial: Partial<ReplySnapshot> & { senderId: string | null },
): ReplySnapshot {
  return {
    senderId: partial.senderId,
    type: partial.type ?? null,
    preview: partial.preview ?? null,
    mediaThumb: partial.mediaThumb ?? null,
    hidden: partial.hidden ?? false,
  };
}

/**
 * Build the thread for one mentor.
 *
 * Times are relative to "now" so the date header lands on today/yesterday
 * regardless of when the prototype is opened — a fixed date would silently
 * collapse the header branch it is there to show.
 */
export function buildChatThread(mentorName: string): ChatMessage[] {
  const now = Date.now();
  const yesterday = now - 26 * HOUR;

  const messages: ChatMessage[] = [
    {
      id: 'm_1',
      clientMessageId: null,
      senderId: 'm1',
      content: "Hi! Send across the questions you got stuck on and we'll go through them.",
      timestamp: yesterday,
      status: 'read',
      isSystemMessage: false,
      isSessionBoundary: false,
      messageType: 'text',
      mediaUrl: null,
      mediaMetadata: null,
      sessionId: null,
      systemEvent: null,
      metadata: null,
      replyToMessageId: null,
      replySnapshot: null,
    },
    {
      id: 'm_2',
      clientMessageId: null,
      senderId: CURRENT_USER_ID,
      content: 'Sure — the rotational motion ones, especially the pulley problems.',
      timestamp: yesterday + 4 * MINUTE,
      status: 'read',
      isSystemMessage: false,
      isSessionBoundary: false,
      messageType: 'text',
      mediaUrl: null,
      mediaMetadata: null,
      sessionId: null,
      systemEvent: null,
      metadata: null,
      replyToMessageId: null,
      replySnapshot: null,
    },
    {
      id: 'm_3',
      clientMessageId: null,
      senderId: 'm1',
      content: '',
      timestamp: yesterday + 6 * MINUTE,
      status: 'read',
      isSystemMessage: false,
      isSessionBoundary: false,
      messageType: 'audio',
      mediaUrl: 'local://voice_note_1.m4a',
      mediaMetadata: { duration_seconds: 47, waveform: VOICE_WAVEFORM },
      sessionId: null,
      systemEvent: null,
      metadata: null,
      replyToMessageId: null,
      replySnapshot: null,
    },
    {
      id: 'm_4',
      clientMessageId: null,
      senderId: 'm1',
      content: '',
      timestamp: yesterday + 8 * MINUTE,
      status: 'read',
      isSystemMessage: false,
      isSessionBoundary: false,
      messageType: 'image',
      mediaUrl: STAND_IN_PHOTO,
      mediaMetadata: { width: 480, height: 360, file_name: 'pulley_diagram.png' },
      sessionId: null,
      systemEvent: null,
      metadata: null,
      replyToMessageId: null,
      replySnapshot: null,
    },
    {
      id: 'm_5',
      clientMessageId: null,
      senderId: 'm1',
      content: '',
      timestamp: yesterday + 9 * MINUTE,
      status: 'read',
      isSystemMessage: false,
      isSessionBoundary: false,
      messageType: 'file',
      mediaUrl: 'local://rotational_motion_notes.pdf',
      mediaMetadata: {
        file_name: 'rotational_motion_notes.pdf',
        file_size: 2483102,
        mime_type: 'application/pdf',
      },
      sessionId: null,
      systemEvent: null,
      metadata: null,
      replyToMessageId: null,
      replySnapshot: null,
    },
    {
      // Privacy-restricted past-session media: no URL, and not still sending.
      id: 'm_6',
      clientMessageId: null,
      senderId: CURRENT_USER_ID,
      content: '',
      timestamp: yesterday + 12 * MINUTE,
      status: 'read',
      isSystemMessage: false,
      isSessionBoundary: false,
      messageType: 'file',
      mediaUrl: null,
      mediaMetadata: { file_name: 'my_attempt.jpg', file_size: 512400 },
      sessionId: null,
      systemEvent: null,
      metadata: null,
      replyToMessageId: null,
      replySnapshot: null,
    },
    {
      // Privacy-restricted voice note, from the mentor's side.
      id: 'm_7',
      clientMessageId: null,
      senderId: 'm1',
      content: '',
      timestamp: yesterday + 14 * MINUTE,
      status: 'read',
      isSystemMessage: false,
      isSessionBoundary: false,
      messageType: 'audio',
      mediaUrl: null,
      mediaMetadata: { duration_seconds: 22 },
      sessionId: null,
      systemEvent: null,
      metadata: null,
      replyToMessageId: null,
      replySnapshot: null,
    },
    // ── Today ──────────────────────────────────────────────────────────────
    {
      id: 'm_8',
      clientMessageId: null,
      senderId: 'system',
      content: 'Chat session started',
      timestamp: minutesAgo(now, 42),
      status: 'read',
      isSystemMessage: true,
      isSessionBoundary: true,
      messageType: 'system',
      mediaUrl: null,
      mediaMetadata: null,
      sessionId: 's_seed_1',
      systemEvent: 'chat_started',
      metadata: null,
      replyToMessageId: null,
      replySnapshot: null,
    },
    {
      // The tappable system pill. `chat_started` is one of the three start
      // events, so this one opens the session detail sheet; `chat_ended` would
      // not.
      id: 'm_9',
      clientMessageId: null,
      senderId: '',
      content: 'Chat session started',
      timestamp: minutesAgo(now, 42),
      status: 'read',
      isSystemMessage: true,
      isSessionBoundary: false,
      messageType: 'system',
      mediaUrl: null,
      mediaMetadata: null,
      sessionId: 's_seed_1',
      systemEvent: 'chat_started',
      metadata: null,
      replyToMessageId: null,
      replySnapshot: null,
    },
    {
      id: 'm_10',
      clientMessageId: null,
      senderId: 'm1',
      content: 'That last one was the trickiest — the tension changes direction halfway.',
      timestamp: minutesAgo(now, 30),
      status: 'read',
      isSystemMessage: false,
      isSessionBoundary: false,
      messageType: 'text',
      mediaUrl: null,
      mediaMetadata: null,
      sessionId: null,
      systemEvent: null,
      metadata: null,
      replyToMessageId: null,
      replySnapshot: null,
    },
    {
      id: 'm_11',
      clientMessageId: null,
      senderId: CURRENT_USER_ID,
      content: 'Got it — so I should resolve along the string both times?',
      timestamp: minutesAgo(now, 28),
      status: 'read',
      isSystemMessage: false,
      isSessionBoundary: false,
      messageType: 'text',
      mediaUrl: null,
      mediaMetadata: null,
      sessionId: null,
      systemEvent: null,
      metadata: null,
      replyToMessageId: 'm_10',
      replySnapshot: replySnapshotOf({
        senderId: 'm1',
        type: 'text',
        preview: 'That last one was the trickiest — the tension changes direction halfway.',
      }),
    },
    {
      id: 'm_12',
      clientMessageId: null,
      senderId: 'm1',
      content: 'Exactly. Try the next set and send me your working.',
      timestamp: minutesAgo(now, 25),
      status: 'read',
      isSystemMessage: false,
      isSessionBoundary: false,
      messageType: 'text',
      mediaUrl: null,
      mediaMetadata: null,
      sessionId: null,
      systemEvent: null,
      metadata: null,
      replyToMessageId: null,
      // A hidden parent — the shape the backend sends once the original has
      // been deleted. Note `senderId` is null, so the strip cannot colour
      // itself green. See `replySnapshotFromJson`.
      replySnapshot: replySnapshotOf({ senderId: null, hidden: true }),
    },
  ];

  // `mentorName` is unused today — every row above is already attributed — but
  // the signature keeps the call site honest about the thread being per-mentor,
  // which is what the real one is.
  void mentorName;

  return messages;
}

/** The optimistic-image factory, re-exported so the send path has one import. */
export { optimisticMedia, systemMessage };
