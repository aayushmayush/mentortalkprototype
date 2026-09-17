/**
 * `ChatMessage` — the twin of `core/lib/session/data/models/chat_message.dart`.
 *
 * ── Three things about this model that will bite anyone who "cleans it up" ──
 *
 * 1. **`MessageType` is ordered `text, system, audio, image, file`** — `system`
 *    is SECOND. The order only matters if something ever serialises ordinals;
 *    nothing here does, because `fromString` matches on `name` and falls back
 *    to `text` for anything unrecognised rather than throwing. A message type
 *    this build has never heard of renders as plain text, which is the right
 *    failure and is exactly what the app does.
 *
 * 2. **`status` is not on the wire for history.** `fromJson` hardcodes
 *    `read` for every server-sourced message, so a mentee's own history rows
 *    always draw the blue double-tick regardless of whether the mentor ever
 *    opened them. That is a real bug in the source, and it is reproduced here
 *    deliberately: the tick colours are part of what is being reviewed, and a
 *    "fixed" version would show a different screen from the app.
 *
 * 3. **`media_metadata`, `metadata` and `reply_to_snapshot` may arrive as
 *    JSON-encoded STRINGS**, not objects. The Dart's `_parseJsonMap` decodes a
 *    String and returns null if that throws. A port that assumed an object
 *    would silently drop every waveform and filename the moment a backend
 *    serialiser changed its mind.
 *
 * `copyWith` follows the Dart's sentinel: `undefined` leaves a field alone,
 * `null` clears it. In Dart this is `Object _unset = Object()`; in TS
 * `undefined`-vs-`null` gives the same distinction for free, but only if every
 * call site is disciplined about which one it passes.
 */

export type MessageStatus = 'sending' | 'sent' | 'delivered' | 'read';

export type MessageType = 'text' | 'system' | 'audio' | 'image' | 'file';

/** The Dart's `MessageType.fromString` — unknown becomes `text`, never throws. */
const MESSAGE_TYPES: MessageType[] = ['text', 'system', 'audio', 'image', 'file'];

export function messageTypeFromString(value: unknown): MessageType {
  return MESSAGE_TYPES.includes(value as MessageType) ? (value as MessageType) : 'text';
}

/**
 * `kSessionBoundarySystemEvents` — the three that OPEN a session.
 *
 * A system message carrying one of these is tappable and opens the session
 * detail sheet. The `*_ended` events are boundary messages too, but tapping
 * them does nothing — which is why there are two sets and not one.
 */
export const SESSION_START_EVENTS = ['chat_started', 'audio_started', 'video_started'] as const;

export const SESSION_BOUNDARY_SYSTEM_EVENTS = [
  'chat_started',
  'audio_started',
  'chat_ended',
  'audio_ended',
  'video_started',
  'video_ended',
] as const;

export type ReplySnapshot = {
  senderId: string | null;
  /** `'text' | 'audio' | 'image' | 'file'` — a raw string, NOT a `MessageType`. */
  type: string | null;
  preview: string | null;
  /** Presigned URL. Image replies only. */
  mediaThumb: string | null;
  hidden: boolean;
};

export type ChatMessage = {
  id: string;
  clientMessageId: string | null;
  senderId: string;
  content: string;
  /** Epoch ms. The Dart uses `DateTime`. */
  timestamp: number;
  status: MessageStatus;
  isSystemMessage: boolean;
  isSessionBoundary: boolean;
  messageType: MessageType;
  mediaUrl: string | null;
  mediaMetadata: Record<string, unknown> | null;
  sessionId: string | null;
  systemEvent: string | null;
  metadata: Record<string, unknown> | null;
  replyToMessageId: string | null;
  replySnapshot: ReplySnapshot | null;
};

/**
 * `_parseJsonMap` — decode a value that may be an object, a JSON string, or
 * nothing at all. The String branch is not defensive padding: it is the branch
 * the backend actually exercises.
 */
function parseJsonMap(value: unknown): Record<string, unknown> | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'object') return value as Record<string, unknown>;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return typeof parsed === 'object' && parsed !== null
        ? (parsed as Record<string, unknown>)
        : null;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * `ReplySnapshot.fromJson`.
 *
 * The early return on `hidden` is the source's, and it DISCARDS the rest of the
 * payload: a hidden snapshot has `senderId == null`, which means the quoted
 * strip can never colour itself green even when the hidden parent was the
 * mentee's own message. Reproduced, because it is visible.
 */
export function replySnapshotFromJson(json: Record<string, unknown>): ReplySnapshot {
  if (json.hidden === true) {
    return { senderId: null, type: null, preview: null, mediaThumb: null, hidden: true };
  }
  return {
    senderId: (json.sender_id as string) ?? null,
    type: (json.type as string) ?? null,
    preview: (json.preview as string) ?? null,
    mediaThumb: (json.media_thumb as string) ?? null,
    hidden: false,
  };
}

/**
 * `ChatMessage.fromJson` — the wire shape, key for key.
 *
 * The four parsing rules worth reading twice are the `session_boundary` ones:
 * the string `'session_boundary'` is NOT a `MessageType`. It collapses to
 * `messageType: 'system'` **plus** `isSessionBoundary: true`, and a `senderId`
 * of literally `'system'` forces `isSystemMessage` on its own. Getting these
 * wrong sends boundary pills down the ordinary-text path.
 */
export function chatMessageFromJson(json: Record<string, unknown>): ChatMessage {
  const typeStr = (json.message_type as string) ?? 'text';
  const isBoundary =
    typeStr === 'session_boundary' || (json.is_session_boundary as boolean) === true;
  const messageType: MessageType = typeStr === 'session_boundary' ? 'system' : messageTypeFromString(typeStr);
  const senderId = (json.sender_id as string) ?? '';
  const isSystem = messageType === 'system' || senderId === 'system' || isBoundary;

  const createdAt = json.created_at as string | undefined;
  let timestamp = Date.now();
  if (createdAt) {
    const parsed = Date.parse(createdAt);
    if (!Number.isNaN(parsed)) timestamp = parsed;
  }

  const snapshotJson = parseJsonMap(json.reply_to_snapshot);

  return {
    id: (json.message_id as string) ?? '',
    clientMessageId: (json.client_message_id as string) ?? null,
    senderId,
    content: (json.content as string) ?? '',
    timestamp,
    // See the header: hardcoded for every server-sourced message.
    status: 'read',
    isSystemMessage: isSystem,
    isSessionBoundary: isBoundary,
    messageType,
    mediaUrl: (json.media_url as string) ?? null,
    mediaMetadata: parseJsonMap(json.media_metadata),
    sessionId: (json.session_id as string) ?? null,
    systemEvent: (json.system_event as string) ?? null,
    metadata: parseJsonMap(json.metadata),
    replyToMessageId: (json.reply_to_message_id as string) ?? null,
    replySnapshot: snapshotJson ? replySnapshotFromJson(snapshotJson) : null,
  };
}

let clientSeq = 0;

/** `ChatMessage.optimistic` — id is the client id until the ack replaces it. */
export function optimisticMessage(args: {
  senderId: string;
  content: string;
  clientMessageId?: string;
  replyToMessageId?: string | null;
  replySnapshot?: ReplySnapshot | null;
}): ChatMessage {
  const clientMessageId = args.clientMessageId ?? `c_${Date.now()}_${clientSeq++}`;
  return {
    id: clientMessageId,
    clientMessageId,
    senderId: args.senderId,
    content: args.content,
    timestamp: Date.now(),
    status: 'sending',
    isSystemMessage: false,
    isSessionBoundary: false,
    messageType: 'text',
    mediaUrl: null,
    mediaMetadata: null,
    sessionId: null,
    systemEvent: null,
    metadata: null,
    replyToMessageId: args.replyToMessageId ?? null,
    replySnapshot: args.replySnapshot ?? null,
  };
}

export function optimisticMedia(args: {
  senderId: string;
  messageType: MessageType;
  mediaMetadata?: Record<string, unknown> | null;
  mediaUrl?: string | null;
  content?: string;
  clientMessageId?: string;
  replyToMessageId?: string | null;
  replySnapshot?: ReplySnapshot | null;
}): ChatMessage {
  const clientMessageId = args.clientMessageId ?? `c_${Date.now()}_${clientSeq++}`;
  return {
    id: clientMessageId,
    clientMessageId,
    senderId: args.senderId,
    content: args.content ?? '',
    timestamp: Date.now(),
    status: 'sending',
    isSystemMessage: false,
    isSessionBoundary: false,
    messageType: args.messageType,
    mediaUrl: args.mediaUrl ?? null,
    mediaMetadata: args.mediaMetadata ?? null,
    sessionId: null,
    systemEvent: null,
    metadata: null,
    replyToMessageId: args.replyToMessageId ?? null,
    replySnapshot: args.replySnapshot ?? null,
  };
}

/**
 * `ChatMessage.system`. Note `senderId` is the EMPTY string, not `'system'` —
 * the sentinel only exists on the parsing side.
 */
export function systemMessage(
  content: string,
  args: { systemEvent?: string | null; metadata?: Record<string, unknown> | null } = {},
): ChatMessage {
  return {
    id: `sys_${Date.now()}_${clientSeq++}`,
    clientMessageId: null,
    senderId: '',
    content,
    timestamp: Date.now(),
    status: 'read',
    isSystemMessage: true,
    isSessionBoundary: false,
    messageType: 'system',
    mediaUrl: null,
    mediaMetadata: null,
    sessionId: null,
    systemEvent: args.systemEvent ?? null,
    metadata: args.metadata ?? null,
    replyToMessageId: null,
    replySnapshot: null,
  };
}

/**
 * `copyWith` with the Dart's `_unset` sentinel.
 *
 * `patch.replySnapshot === undefined` keeps the current value; `null` clears it.
 * When a field is present in the patch it WINS, even if it is null.
 */
export function copyMessage(message: ChatMessage, patch: Partial<ChatMessage>): ChatMessage {
  const next: ChatMessage = { ...message };
  for (const key of Object.keys(patch) as (keyof ChatMessage)[]) {
    const value = patch[key];
    if (value !== undefined) {
      (next as Record<string, unknown>)[key] = value;
    }
  }
  return next;
}

/** `message.isMine(currentUserId)` — a function of an external id, never stored. */
export function isMine(message: ChatMessage, currentUserId: string): boolean {
  return message.senderId === currentUserId;
}

/** `ChatMessage.isTappableSessionEvent`. */
export function isTappableSessionEvent(message: ChatMessage): boolean {
  return (
    message.isSystemMessage &&
    message.systemEvent !== null &&
    (SESSION_START_EVENTS as readonly string[]).includes(message.systemEvent)
  );
}

// ─── Formatting helpers the widgets share ───────────────────────────────────

const MONTHS_LONG = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * `DateFormat('h:mm a').format(...).toLowerCase()` — every bubble in the source
 * lowercases the whole formatted string, so it renders `3:45 pm`, not `3:45 PM`.
 * That is not a typo in the port; it is what the app shows.
 */
export function formatClock(ms: number): string {
  const d = new Date(ms);
  const suffix = d.getHours() < 12 ? 'am' : 'pm';
  const hours12 = d.getHours() % 12 === 0 ? 12 : d.getHours() % 12;
  return `${hours12}:${String(d.getMinutes()).padStart(2, '0')} ${suffix}`;
}

/** `DateFormat('d MMMM yyyy')` — the date-separator label. */
export function formatLongDate(ms: number): string {
  const d = new Date(ms);
  return `${d.getDate()} ${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`;
}

/** `_isSameDay(a.toLocal(), b.toLocal())`. */
export function isSameDay(a: number, b: number): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

/**
 * The date header's own three-way branch: Today / Yesterday / a long date.
 * `todayLabel` and `yesterdayLabel` come from the string table so the helper
 * stays free of presentation.
 */
export function dateHeaderLabel(
  ms: number,
  todayLabel: string,
  yesterdayLabel: string,
): string {
  const now = Date.now();
  if (isSameDay(ms, now)) return todayLabel;
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameDay(ms, yesterday.getTime())) return yesterdayLabel;
  return formatLongDate(ms);
}
