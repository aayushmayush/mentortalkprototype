'use client';

import { AppIcon, type IconName } from '@/design-system';
import {
  type ChatMessage,
  type MessageStatus,
  dateHeaderLabel,
  formatClock,
  isTappableSessionEvent,
  isMine as isMineOf,
} from '@/lib/session/chat-message';
import { copy } from '@/lib/copy';

/**
 * The chat's non-media bubbles, ported from `chat_screen.dart`.
 *
 * ── The two geometry rules that are easy to get subtly wrong ────────────────
 *
 * **1. `maxWidth` is a fraction of the SCREEN, not of the list.** Every call
 * site in the Dart is `MediaQuery.of(context).size.width * 0.75` — the window,
 * not the ListView's content box, which is 32px narrower because the list has
 * 16px horizontal padding. In the prototype the phone IS the window, so
 * `--phone-width` is the right analogue. Using `100%` here would silently
 * shrink every bubble by 32px and take the timestamp rows with it.
 *
 * **2. The 4px corner is bottom-RIGHT for your own messages.** The Dart is
 * `bottomLeft: isMine ? 16 : 4, bottomRight: isMine ? 4 : 16` — the tail points
 * at the sender, and the sender of a blue bubble is on the right. Written the
 * other way round it looks plausible in isolation and wrong next to a real
 * screenshot.
 *
 * ── Tick colours are not one rule ───────────────────────────────────────────
 *
 * There is no single "status icon colour" in the source. The text bubble falls
 * back to `onAction@0.6`, the file bubble to `onAction@0.7`, the audio bubble to
 * `onAction@0.5`, and the image bubble ignores the side entirely and uses white
 * or white70. Each is reproduced per-kind below rather than unified, because
 * they are visibly different at 14px against a blue fill.
 */

/** `MediaQuery.size.width`. The phone is the window in this prototype. */
const SCREEN_WIDTH = 'var(--phone-width)';
/** 0.75 — text, file, and the quoted strip. */
const BUBBLE_W = `calc(${SCREEN_WIDTH} * 0.75)`;
/** 0.70 — audio, image, and the file bubble's unavailable variant. */
const MEDIA_W = `calc(${SCREEN_WIDTH} * 0.70)`;

const BUBBLE_SHADOW = '0 1px 3px rgba(0, 0, 0, 0.04)';

/** `BorderRadius.only(16, 16, isMine ? 16 : 4, isMine ? 4 : 16)`. */
function tailRadius(mine: boolean): string {
  return mine ? '16px 16px 4px 16px' : '16px 16px 16px 4px';
}

const TICK_ICONS: Record<MessageStatus, IconName> = {
  sending: 'accessTime',
  sent: 'check',
  delivered: 'doneAll',
  read: 'doneAll',
};

/**
 * The status glyph. Only drawn on the reader's own messages — the Dart passes
 * `status: isMine ? message.status : null`, so an incoming bubble has no tick at
 * all rather than a greyed one.
 */
function StatusTick({ status, color }: { status: MessageStatus | null; color: string }) {
  if (!status) return null;
  return (
    <AppIcon name={TICK_ICONS[status]} px={14} color={color} />
  );
}

// ─── Text ───────────────────────────────────────────────────────────────────

export function TextBubble({
  message,
  mine,
}: {
  message: ChatMessage;
  mine: boolean;
}) {
  const timeColor = mine
    ? 'color-mix(in srgb, var(--text-on-action) 70%, transparent)'
    : 'var(--text-body-light)';
  const tickColor =
    mine && message.status === 'read'
      ? 'color-mix(in srgb, var(--text-on-action) 90%, transparent)'
      : mine
        ? 'color-mix(in srgb, var(--text-on-action) 60%, transparent)'
        : 'var(--text-body-light)';

  return (
    <div style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
      <div
        style={{
          maxWidth: BUBBLE_W,
          marginBottom: 6,
          padding: '10px 14px',
          background: mine ? 'var(--surface-action)' : 'var(--surface-primary)',
          color: mine ? 'var(--text-on-action)' : 'var(--text-heading)',
          borderRadius: tailRadius(mine),
          boxShadow: BUBBLE_SHADOW,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
        }}
      >
        <span
          style={{
            fontSize: 15,
            lineHeight: 1.4,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            alignSelf: 'flex-start',
          }}
        >
          {message.content}
        </span>
        <div style={{ height: 4 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <span style={{ fontSize: 11, color: timeColor }}>{formatClock(message.timestamp)}</span>
          {mine && <StatusTick status={message.status} color={tickColor} />}
        </div>
      </div>
    </div>
  );
}

// ─── System message ─────────────────────────────────────────────────────────

/**
 * The grey pill. Two things about it are deliberate:
 *
 * - The timestamp renders through the same lowercasing formatter as the bubbles,
 *   so it reads `3:07 pm`.
 * - When the message carries a session-START event it becomes a tap target with
 *   an info glyph, and opens the session detail sheet. `chat_ended` and its
 *   siblings are system messages too, but they are not tappable — which is why
 *   the predicate is `isTappableSessionEvent`, not "has a systemEvent".
 */
export function SystemMessage({
  message,
  tappable,
  loading,
  onTap,
}: {
  message: ChatMessage;
  tappable: boolean;
  loading: boolean;
  onTap: () => void;
}) {
  const body = (
    <div
      style={{
        background: 'var(--surface-disabled)',
        borderRadius: 16,
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        maxWidth: BUBBLE_W,
      }}
    >
      <span
        style={{
          fontSize: 13,
          fontWeight: 500,
          color: 'var(--text-body-light)',
          minWidth: 0,
          wordBreak: 'break-word',
        }}
      >
        {message.content}
      </span>
      <span style={{ fontSize: 11, color: 'var(--text-body-light)', whiteSpace: 'nowrap' }}>
        {formatClock(message.timestamp)}
      </span>
      {tappable && (
        <>
          <span style={{ width: 6 }} />
          {loading ? (
            /*
              The source's spinner is 12x12 with a 1.5 stroke — smaller and
              thinner than any AppLoadingSpinner size, so it is drawn here
              rather than approximated with one.
            */
            <span
              aria-label="Loading session details"
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                border: '1.5px solid color-mix(in srgb, var(--text-body-light) 30%, transparent)',
                borderTopColor: 'var(--text-body-light)',
                animation: 'spin 0.7s linear infinite',
                display: 'inline-block',
              }}
            />
          ) : (
            <AppIcon name="info" px={14} color="var(--text-body-light)" />
          )}
        </>
      )}
    </div>
  );

  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0' }}>
      {tappable ? (
        <button
          type="button"
          onClick={onTap}
          style={{
            border: 'none',
            background: 'transparent',
            padding: 0,
            borderRadius: 16,
            cursor: 'pointer',
            display: 'flex',
          }}
        >
          {body}
        </button>
      ) : (
        body
      )}
    </div>
  );
}

// ─── Session boundary ───────────────────────────────────────────────────────

/**
 * The green centred pill. Its content is server-authored and rendered verbatim —
 * the widget takes a `String`, not a message, in the source too.
 */
export function SessionBoundaryBubble({ content }: { content: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', margin: '12px 0' }}>
      <div
        style={{
          background: 'color-mix(in srgb, var(--surface-success) 60%, transparent)',
          border: '0.5px solid var(--border-success)',
          borderRadius: 12,
          padding: '6px 14px',
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-success)' }}>
          {content}
        </span>
      </div>
    </div>
  );
}

// ─── Date separator ─────────────────────────────────────────────────────────

export function DateHeader({ timestamp }: { timestamp: number }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <div
        style={{
          margin: '12px 0',
          padding: '6px 14px',
          background: 'var(--surface-disabled)',
          borderRadius: 12,
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-body-light)' }}>
          {dateHeaderLabel(timestamp, copy.today, copy.yesterday)}
        </span>
      </div>
    </div>
  );
}

// ─── Typing ─────────────────────────────────────────────────────────────────

/**
 * The literal `'typing...'` is not a placeholder for something better — it is
 * what the source renders. `_TypingIndicator` takes a `name` parameter that is
 * threaded through three widgets and never read, while an unused l10n template
 * (`"{name} is typing..."`) sits in the ARB. Reproduced as-is, so a reviewer
 * sees the app's actual string.
 */
export function TypingIndicator({ name }: { name: string }) {
  void name;
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
      <div
        style={{
          marginBottom: 8,
          padding: '10px 14px',
          background: 'var(--surface-primary)',
          borderRadius: 16,
        }}
      >
        <span style={{ fontSize: 13, fontStyle: 'italic', color: 'var(--text-body-light)' }}>
          typing...
        </span>
      </div>
    </div>
  );
}

// ─── Unavailable media ──────────────────────────────────────────────────────

/**
 * The shared body behind all three "unavailable" variants.
 *
 * The predicate for reaching it is identical in all three bubbles:
 * `mediaUrl == null && status != sending`. The `sending` half is not incidental
 * — an optimistic message has no URL yet either, so without it every image you
 * send would flash "Media unavailable" until the server acked.
 *
 * Two deliberate differences between the three, both from the source: the file
 * and image variants render a timestamp and the audio one does not; and the file
 * variant is 0.75 wide where the other two are 0.70.
 */
export function UnavailableBubble({
  text,
  timestamp,
  width,
  withTime,
  mine,
}: {
  text: string;
  timestamp: number;
  width: string;
  withTime: boolean;
  mine: boolean;
}) {
  return (
    <div style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
      <div
        style={{
          maxWidth: width,
          marginBottom: 6,
          padding: '12px 14px',
          background: 'var(--surface-disabled)',
          borderRadius: tailRadius(mine),
          // No shadow — the three unavailable variants are the only bubbles in
          // the source whose BoxDecoration omits it.
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <AppIcon name="lockedOutline" px={20} color="var(--text-body-light)" />
        <span
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--text-body-light)',
            minWidth: 0,
          }}
        >
          {text}
        </span>
        {withTime && (
          <>
            <span style={{ width: 8 }} />
            <span style={{ fontSize: 11, color: 'var(--text-body-light)', whiteSpace: 'nowrap' }}>
              {formatClock(timestamp)}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

/** Exported for the media bubbles, which share the screen-fraction constants. */
export const bubbleWidth = BUBBLE_W;
export const mediaWidth = MEDIA_W;

/** Re-exported so call sites do not need two imports to render a bubble row. */
export { isMineOf, isTappableSessionEvent };
