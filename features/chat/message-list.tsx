'use client';

import { useEffect, useRef, useState } from 'react';
import { AppLoadingSpinner } from '@/design-system';
import {
  isSameDay,
  isTappableSessionEvent,
  type ChatMessage,
} from '@/lib/session/chat-message';
import {
  DateHeader,
  SessionBoundaryBubble,
  SystemMessage,
  TextBubble,
  TypingIndicator,
} from './bubbles';
import { AudioBubble, FileBubble, ImageBubble } from './media-bubbles';
import { QuotedReplyStrip } from './reply-widgets';
import { SwipeToReply } from './swipe-to-reply';
import { copy } from '@/lib/copy';

/**
 * MessageList — port of `_MessageList` in `chat_screen.dart`.
 *
 * ── Reverse, and why it matters ─────────────────────────────────────────────
 *
 * The list is `reverse: true`, so index 0 is the NEWEST message and sits at the
 * BOTTOM of the screen; the highest index is the oldest, at the top. Every
 * index-based decision below — where the typing indicator goes, where the
 * history spinner goes, which neighbour decides the date header — follows from
 * that inversion, and getting it wrong is invisible until you scroll.
 *
 * The date header is emitted for a message when the message rendered *above* it
 * belongs to a different day, or when it is the oldest in the list. Because the
 * list is reversed, "above" is the NEXT index, which is why the neighbour check
 * reads `msgIndex + 1`.
 *
 * ── A stale comment in the source, left as-is ───────────────────────────────
 *
 * The Dart carries a comment saying system and boundary messages are skipped
 * when deciding date boundaries, "to avoid duplicate Today separators". The code
 * below that comment does not do it — every message is compared, system rows
 * included. The comment describes an intention, not the behaviour, and the
 * behaviour is what is ported. Two system rows a second apart across midnight
 * would therefore produce two headers.
 */

/** Mirror of `isSessionBoundary` — the boundary flag wins over the message type. */
function isBoundary(message: ChatMessage): boolean {
  return message.isSessionBoundary;
}

export function MessageList({
  messages,
  currentUserId,
  otherUserName,
  isOtherTyping,
  isLoadingMoreHistory,
  highlightMessageId,
  onClearHighlight,
  onStartReply,
  onJumpToParent,
  onSwipePastTop,
  listRef,
  activeSessionId,
  loadingSessionId,
  onOpenSessionDetail,
  onOpenImage,
}: {
  messages: ChatMessage[];
  currentUserId: string;
  otherUserName: string;
  isOtherTyping: boolean;
  isLoadingMoreHistory: boolean;
  highlightMessageId: string | null;
  onClearHighlight: () => void;
  onStartReply: (message: ChatMessage) => void;
  onJumpToParent: (message: ChatMessage) => void;
  /** Fires when the reader drags past the oldest message — the load-more trigger. */
  onSwipePastTop: () => void;
  listRef: React.RefObject<HTMLDivElement | null>;
  /** The in-flight session, so its own start row is not tappable. */
  activeSessionId: string | null;
  /** Which detail fetch is in flight, for the 12px spinner swap. */
  loadingSessionId: string | null;
  onOpenSessionDetail: (sessionId: string) => void;
  onOpenImage: (src: string | null) => void;
}) {
  const topSentinelRef = useRef<HTMLDivElement>(null);

  /*
    Load-more is an IntersectionObserver rather than a scroll listener: the
    sentinel only exists while the oldest page is rendered, and observing it
    fires exactly once per arrival at the top without a rAF-throttled handler.
  */
  useEffect(() => {
    const sentinel = topSentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) onSwipePastTop();
      },
      { root: listRef.current, rootMargin: '120px 0px 0px 0px' },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [onSwipePastTop, listRef, messages.length]);

  if (messages.length === 0 && !isOtherTyping) {
    return (
      <div
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 15,
          color: 'var(--text-body-light)',
        }}
      >
        {copy.noMessagesYet}
      </div>
    );
  }

  // Reverse: index 0 is newest (bottom), last is oldest (top).
  const reversed = [...messages].reverse();
  const typingOffset = isOtherTyping ? 1 : 0;

  const rows: React.ReactNode[] = [];

  for (let index = 0; index < reversed.length + typingOffset; index += 1) {
    // Typing indicator at index 0 — the bottom of the screen.
    if (isOtherTyping && index === 0) {
      rows.push(<TypingIndicator key="typing" name={otherUserName} />);
      continue;
    }

    const msgIndex = index - typingOffset;
    const message = reversed[msgIndex];
    const mine = message.senderId === currentUserId;

    // "Above" is the next index in this reversed list.
    let showDateHeader = false;
    const nextIndex = msgIndex + 1;
    if (nextIndex >= reversed.length) {
      showDateHeader = true;
    } else if (!isSameDay(reversed[nextIndex].timestamp, message.timestamp)) {
      showDateHeader = true;
    }

    let bubble: React.ReactNode;
    if (isBoundary(message)) {
      bubble = <SessionBoundaryBubble content={message.content} />;
    } else if (message.messageType === 'system') {
      /*
        Tappable only when the row is a session-start event carrying a session
        id that is not the one currently running — one info icon per session in
        history, and no redundant sheet for the in-flight session.
      */
      const sessionId = message.sessionId;
      const tappable =
        isTappableSessionEvent(message) &&
        sessionId !== null &&
        sessionId !== activeSessionId;
      bubble = (
        <SystemMessage
          message={message}
          tappable={tappable}
          loading={loadingSessionId === sessionId}
          onTap={() => sessionId && onOpenSessionDetail(sessionId)}
        />
      );
    } else {
      const inner =
        message.messageType === 'audio' ? (
          <AudioBubble message={message} mine={mine} />
        ) : message.messageType === 'image' ? (
          <ImageBubble
            message={message}
            mine={mine}
            onOpen={() => onOpenImage(message.mediaUrl)}
          />
        ) : message.messageType === 'file' ? (
          <FileBubble message={message} mine={mine} />
        ) : (
          <TextBubble message={message} mine={mine} />
        );

      bubble = (
        <ReplyableBubble
          message={message}
          mine={mine}
          currentUserId={currentUserId}
          otherUserName={otherUserName}
          isHighlighted={highlightMessageId === message.id}
          onClearHighlight={onClearHighlight}
          onStartReply={() => onStartReply(message)}
          onJumpToParent={() => onJumpToParent(message)}
        >
          {inner}
        </ReplyableBubble>
      );
      // The three media bubbles are always exactly max width; only the text
      // bubble shrink-wraps, so only it should be pulled to its own side.
    }

    rows.push(
      <div
        key={message.id}
        /*
          The scroll target for a jump-to-parent. The source reaches the parent
          through a GlobalKey held by the list; a DOM id is the same idea.
        */
        data-message-id={message.id}
        style={{
          display: 'flex',
          flexDirection: 'column',
          // The date header renders ABOVE its message, which in a reversed list
          // means it must come first in DOM order inside this row.
        }}
      >
        {showDateHeader && <DateHeader timestamp={message.timestamp} />}
        {bubble}
      </div>,
    );
  }

  return (
    <div
      ref={listRef}
      style={{
        flex: 1,
        minHeight: 0,
        overflowY: 'auto',
        // `flexDirection: column-reverse` is what makes the scroller open at the
        // bottom without a scroll-to-end effect on mount.
        display: 'flex',
        flexDirection: 'column-reverse',
        padding: '12px 16px',
        // The browser's scroll anchoring fights the reversed list when history
        // is prepended; the source pins the offset itself.
        overflowAnchor: 'none',
      }}
    >
      {rows}
      {isLoadingMoreHistory && (
        <div style={{ padding: '16px 0', display: 'flex', justifyContent: 'center' }}>
          <AppLoadingSpinner size="sm" />
        </div>
      )}
      {/* Highest index in the reversed list — visually the top edge. */}
      <div ref={topSentinelRef} style={{ height: 1, flexShrink: 0 }} />
    </div>
  );
}

/**
 * `_ReplyableBubble` — three concerns stacked on top of a normal bubble:
 *
 *  1. the horizontal swipe that begins a reply,
 *  2. the quoted strip drawn above the bubble when the message is itself a reply,
 *  3. a background flash when a jump-to-parent lands here, auto-cleared after
 *     1400 ms.
 *
 * The highlight fade is 220 ms, and the flash colour is `surface.actionLight` at
 * 40% alpha — a translucent tint rather than an opaque one, so it works over
 * both the page background and a bubble.
 */
function ReplyableBubble({
  message,
  mine,
  currentUserId,
  otherUserName,
  isHighlighted,
  onClearHighlight,
  onStartReply,
  onJumpToParent,
  children,
}: {
  message: ChatMessage;
  mine: boolean;
  currentUserId: string;
  otherUserName: string;
  isHighlighted: boolean;
  onClearHighlight: () => void;
  onStartReply: () => void;
  onJumpToParent: () => void;
  children: React.ReactNode;
}) {
  /*
    The clear timer is re-armed only on a false→true edge, as in the source's
    `didUpdateWidget` — so a re-render while already highlighted does not push
    the deadline out, and the flash always lasts its full 1400 ms.
  */
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [wasHighlighted, setWasHighlighted] = useState(isHighlighted);

  useEffect(() => {
    if (isHighlighted && !wasHighlighted) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(onClearHighlight, 1400);
    }
    setWasHighlighted(isHighlighted);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isHighlighted, wasHighlighted, onClearHighlight]);

  const snapshot = message.replySnapshot;

  return (
    <div
      style={{
        background: isHighlighted
          ? 'color-mix(in srgb, var(--surface-action-light) 40%, transparent)'
          : 'transparent',
        transition: 'background-color 220ms ease',
      }}
    >
      <SwipeToReply mine={mine} onReply={onStartReply}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: mine ? 'flex-end' : 'flex-start',
          }}
        >
          {snapshot && (
            <QuotedReplyStrip
              snapshot={snapshot}
              currentUserId={currentUserId}
              otherUserName={otherUserName}
              onTap={onJumpToParent}
            />
          )}
          {children}
        </div>
      </SwipeToReply>
    </div>
  );
}
