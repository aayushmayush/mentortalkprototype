'use client';

import { AppIcon, AppIconButton } from '@/design-system';
import type { ChatMessage, ReplySnapshot } from '@/lib/session/chat-message';

/**
 * The two reply surfaces — the quoted strip that rides above a bubble, and the
 * preview that rides above the text field.
 *
 * ── They disagree with each other, and that is the source's behaviour ───────
 *
 * The same replied-to message produces two different previews depending on which
 * widget is asking:
 *
 * - **A file** shows the literal `'File'` in the strip, and the actual
 *   `file_name` in the composer.
 * - **A hidden message** shows a lock and "Original message hidden" in the
 *   strip; the composer has no hidden branch at all.
 * - **A text message** shows `snapshot.preview` in the strip, which may be null,
 *   and `replyingTo.content` in the composer.
 *
 * Both are reproduced rather than unified. A reviewer comparing the two against
 * the app would otherwise find a difference that is not there.
 */

/** 0.75 of the screen, matching the bubbles the strip sits above. */
const STRIP_MAX_WIDTH = 'calc(var(--phone-width) * 0.75)';

/** `_preview` in `quoted_reply_strip.dart` — string discriminators, not an enum. */
function stripPreview(snapshot: ReplySnapshot): string {
  if (snapshot.type === 'image') return snapshot.preview ?? 'Photo';
  if (snapshot.type === 'audio') return snapshot.preview ?? 'Voice message';
  if (snapshot.type === 'file') return snapshot.preview ?? 'File';
  // The fallthrough is the empty string, not the content — the snapshot has no
  // content field to fall back to.
  return snapshot.preview ?? '';
}

/**
 * `reply_composer_preview.dart` switches on the real `MessageType` instead, and
 * its file branch reaches into the metadata for a filename the strip never shows.
 */
function composerPreview(message: ChatMessage): string {
  switch (message.messageType) {
    case 'image':
      return 'Photo';
    case 'audio':
      return 'Voice message';
    case 'file':
      return String(message.mediaMetadata?.file_name ?? 'File');
    case 'text':
    case 'system':
      return message.content;
  }
}

// ─── Quoted strip ───────────────────────────────────────────────────────────

export function QuotedReplyStrip({
  snapshot,
  currentUserId,
  otherUserName,
  onTap,
}: {
  snapshot: ReplySnapshot;
  currentUserId: string;
  otherUserName: string;
  onTap: () => void;
}) {
  /*
    The accent keys off the SNAPSHOT's sender, not the side of the bubble it is
    attached to — so a green bar means "you wrote the quoted message", even when
    it appears under the mentor's reply.

    A hidden snapshot has `senderId === null` (the parser drops it), so a hidden
    parent can never be green. That is the source's behaviour, not a gap here.
  */
  const parentFromMe = snapshot.senderId === currentUserId;
  const accent = parentFromMe ? 'var(--border-success)' : 'var(--border-action)';

  return (
    <div
      role={snapshot.hidden ? undefined : 'button'}
      tabIndex={snapshot.hidden ? undefined : 0}
      onClick={snapshot.hidden ? undefined : onTap}
      onKeyDown={(event) => {
        if (snapshot.hidden) return;
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onTap();
        }
      }}
      style={{
        maxWidth: STRIP_MAX_WIDTH,
        marginBottom: 6,
        padding: '6px 10px',
        background: 'var(--surface-disabled)',
        borderRadius: 8,
        borderLeft: `3px solid ${accent}`,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        cursor: snapshot.hidden ? 'default' : 'pointer',
      }}
    >
      {!snapshot.hidden && snapshot.mediaThumb !== null && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={snapshot.mediaThumb}
          alt=""
          width={36}
          height={36}
          style={{ width: 36, height: 36, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }}
        />
      )}
      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {snapshot.hidden ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
            <AppIcon name="lockedOutline" px={16} color="var(--text-body-light)" />
            <span
              style={{
                fontSize: 13,
                fontStyle: 'italic',
                color: 'var(--text-body-light)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              Original message hidden
            </span>
          </div>
        ) : (
          <>
            <span
              style={{ fontSize: 12, fontWeight: 600, color: accent }}
            >
              {parentFromMe ? 'You' : otherUserName}
            </span>
            <div style={{ height: 2 }} />
            <span
              style={{
                fontSize: 13,
                color: 'var(--text-body-light)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {stripPreview(snapshot)}
            </span>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Composer preview ───────────────────────────────────────────────────────

export function ReplyComposerPreview({
  replyingTo,
  currentUserId,
  otherUserName,
  onCancel,
}: {
  replyingTo: ChatMessage;
  currentUserId: string;
  otherUserName: string;
  onCancel: () => void;
}) {
  const label = replyingTo.senderId === currentUserId ? 'You' : otherUserName;

  return (
    <div
      style={{
        background: 'var(--surface-primary)',
        padding: '8px 8px 8px 12px',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {/*
        The composer's bar is ALWAYS the brand blue — it does not distinguish who
        wrote the quoted message the way the strip does.
      */}
      <span
        style={{
          width: 3,
          height: 36,
          flexShrink: 0,
          background: 'var(--surface-action)',
          borderRadius: 2,
        }}
      />
      <div style={{ width: 10, flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-action)' }}>
          Replying to {label}
        </span>
        <div style={{ height: 2 }} />
        <span
          style={{
            fontSize: 13,
            color: 'var(--text-body-light)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {composerPreview(replyingTo)}
        </span>
      </div>
      <AppIconButton
        name="close"
        size="sm"
        label="Cancel reply"
        onClick={onCancel}
        iconColor="var(--text-body-light)"
      />
    </div>
  );
}
