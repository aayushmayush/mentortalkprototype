'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AppButton,
  AppIcon,
  AppIconButton,
  AppLoadingSpinner,
  AppTopBar,
} from '@/design-system';
import { copy } from '@/lib/copy';
import {
  buildSentMessages,
  fetchSupportMessages,
  SUPPORT_AUTO_REPLY,
  type SupportMessage,
} from '@/lib/fake/support';

/**
 * SupportChatPage — port of `core/lib/support/ui/support_chat_screen.dart`.
 *
 * A deliberately stripped `ChatScreen`: no call buttons, no session timer, no
 * typing indicator, no delivery ticks. Bubbles and an input bar, nothing else.
 *
 * ── The body is a four-way branch, and two of them need `messages.isEmpty` ──
 *
 *   1. `isLoading && messages.isEmpty`  → centred `AppLoadingSpinner.md()`
 *   2. `hasError && messages.isEmpty`   → inline text + a Retry BUTTON
 *   3. `messages.isEmpty`               → `_EmptyState`
 *   4. otherwise                        → the list
 *
 * Branch 2 is NOT `AppErrorView`, which every other screen in this app uses.
 * It is a hand-built centred column: `somethingWentWrong` at **fontSize 14**
 * in `text.bodyLight` (not a type class, and not `AppErrorView`'s styling),
 * a 16px gap, then a plain `AppButton(label: retry)`. Reproduced literally —
 * normalising it to `AppErrorView` would silently change both the type and the
 * affordance.
 *
 * ── Bottom-anchored, and the source gets there by reversing twice ──────────
 *
 * The cubit reverses the API's newest-first payload into chronological order;
 * the screen then does `state.messages.reversed` and hands that to
 * `ListView(reverse: true)`. Two reversals cancel. The prototype reproduces the
 * RENDERED result — a `column-reverse` scroller over the reversed array — which
 * is bottom-anchored with the newest bubble at the bottom and needs no scroll
 * management when a message is appended. See `lib/fake/support.ts` for the
 * fuller note.
 *
 * ── What the prototype adds, and why it is not invention ───────────────────
 *
 * Production receives the admin's reply over a WebSocket
 * (`_listenToWebSocket`, filtering `type == 'support_message'`). A browser
 * prototype has no socket, so `SUPPORT_AUTO_REPLY` is scheduled instead — and it
 * is appended through the SAME dedupe-by-id path the socket uses. The behaviour
 * a reviewer sees (type a line, get a canned reply 2.5s later) is what the real
 * app does on a live support backend; the mechanism is the only thing swapped.
 *
 * ── Three things a browser does differently, all cosmetic ──────────────────
 *
 * - `MediaQuery.padding.bottom` is the iOS home-indicator inset. The browser has
 *   no equivalent inside the phone frame, so the input bar's bottom padding is
 *   a flat 8. Inside `PhoneFrame` there is no home indicator to clear.
 * - `keyboardAppearance: Theme.of(context).brightness` has no CSS equivalent;
 *   the browser paints its own keyboard chrome.
 * - `TextCapitalization.sentences` IS reproducible (`autoCapitalize`), and is.
 *
 * ── `SupportChatScreen.isActive` is dropped ────────────────────────────────
 *
 * The source sets a static `ValueNotifier<bool>` true in `initState` and false
 * in `dispose`, which the FCM handler reads to suppress a push for the thread
 * you are already looking at. The prototype has no push notifications at all,
 * so there is nothing for it to suppress.
 */

type Status = 'loading' | 'loaded' | 'error';

export function SupportChatPage() {
  const router = useRouter();

  const [status, setStatus] = useState<Status>('loading');
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [isSending, setIsSending] = useState(false);
  const [draft, setDraft] = useState('');

  /** Ids already on screen — the dedupe set the WebSocket path also uses. */
  const seenIds = useRef<Set<string>>(new Set());
  const pendingReply = useRef<number | null>(null);

  const append = useCallback((incoming: SupportMessage[]) => {
    const fresh = incoming.filter((m) => !seenIds.current.has(m.id));
    if (fresh.length === 0) return;
    for (const m of fresh) seenIds.current.add(m.id);
    setMessages((current) => [...current, ...fresh]);
  }, []);

  /** `SupportChatCubit.load()`. */
  const load = useCallback(() => {
    setStatus('loading');
    window.setTimeout(() => {
      const { messages: fetched } = fetchSupportMessages();
      // `messages.reversed.toList()` in the cubit — the API is newest-first.
      const chronological = [...fetched].reverse();
      seenIds.current = new Set(chronological.map((m) => m.id));
      setMessages(chronological);
      setStatus('loaded');
    }, 600);
  }, []);

  useEffect(load, [load]);

  // A scheduled reply must not fire into an unmounted screen.
  useEffect(
    () => () => {
      if (pendingReply.current !== null) window.clearTimeout(pendingReply.current);
    },
    [],
  );

  /**
   * `_onScroll` → `loadMore()`. The cubit's `hasMore` is false on the fixture's
   * single page, so this is a genuine no-op — kept because the handler exists
   * and its removal would hide that pagination is unfaked.
   */
  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    // Column-reverse: the oldest end is `maxScrollExtent`.
    if (el.scrollTop >= el.scrollHeight - el.clientHeight - 50) {
      // loadMore() — see above.
    }
  };

  const onSend = () => {
    const text = draft.trim();
    if (text === '' || isSending) return;
    setDraft('');
    setIsSending(true);

    window.setTimeout(() => {
      // "The API returns all new messages (system + welcome + user message)."
      append(buildSentMessages(text, messages.length === 0));
      setIsSending(false);

      // Stands in for the socket. Shared with `_listenToWebSocket`'s dedupe.
      pendingReply.current = window.setTimeout(() => {
        append([
          {
            id: `sm-reply-${Date.now()}`,
            senderId: 'admin',
            senderType: 'admin',
            content: SUPPORT_AUTO_REPLY.content,
            type: 'text',
            createdAt: new Date().toISOString(),
          },
        ]);
      }, SUPPORT_AUTO_REPLY.delayMs);
    }, 350);
  };

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--surface-page)',
      }}
    >
      <AppTopBar title={copy.supportTitle} onBack={() => router.back()} />

      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {/* 1 — first load only. */}
        {status === 'loading' && messages.length === 0 && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <AppLoadingSpinner size="md" />
          </div>
        )}

        {/* 2 — a failed first load. Hand-built, NOT `AppErrorView`. */}
        {status === 'error' && messages.length === 0 && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ color: 'var(--text-body-light)', fontSize: 14 }}>
              {copy.somethingWentWrongBare}
            </span>
            <div style={{ height: 'var(--spacing-md)' }} />
            <AppButton label={copy.retry} onClick={load} />
          </div>
        )}

        {/* 3 — genuinely no history. */}
        {status === 'loaded' && messages.length === 0 && <EmptyState />}

        {/* 4 — the thread. */}
        {messages.length > 0 && (
          <div
            className="no-scrollbar"
            onScroll={onScroll}
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              // Bottom-anchored without JS. See the header.
              display: 'flex',
              flexDirection: 'column-reverse',
              padding: 'var(--spacing-md) 12px',
            }}
          >
            {/* Reversed so that, inside a column-reverse scroller, the oldest
                message renders at the TOP and the newest at the bottom. */}
            {[...messages].reverse().map((message, i) => {
              // Index `i` is into the REVERSED array, so the chronologically
              // previous message is the next one along — the source's
              // `reversed[index + 1]`.
              const previous =
                i < messages.length - 1 ? messages[messages.length - 2 - i] : null;
              return (
                <MessageItem key={message.id} message={message} previousMessage={previous} />
              );
            })}
          </div>
        )}

        <InputBar
          value={draft}
          onChange={setDraft}
          onSend={onSend}
          isSending={isSending}
        />
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// Message item
// ═════════════════════════════════════════════════════════════

/**
 * `_MessageItem` — three bubble kinds behind one widget: system, admin, user.
 *
 * The date header is driven by the PREVIOUS message, not by the index: it shows
 * when there is no previous message or the previous one is a different day. So
 * a header appears exactly once per calendar day, anchored to the first message
 * of that day, whatever kind it is.
 */
function MessageItem({
  message,
  previousMessage,
}: {
  message: SupportMessage;
  previousMessage: SupportMessage | null;
}) {
  const showDateHeader =
    previousMessage === null ||
    !isSameDay(new Date(message.createdAt), new Date(previousMessage.createdAt));

  if (message.senderType === 'system') {
    // `startsWith` — not equality. A message like "Ticket resolved by Priya"
    // still takes the green treatment.
    const isResolved = message.content.startsWith('Ticket resolved');

    return (
      <div>
        {showDateHeader && <DateHeader date={message.createdAt} />}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div
            style={{
              margin: '12px 0',
              padding: '6px 14px',
              // `surface.success` at alpha 0.6 — the only place this wash
              // appears in the whole app.
              background: isResolved
                ? 'color-mix(in srgb, var(--surface-success) 60%, transparent)'
                : 'var(--surface-disabled)',
              borderRadius: 12,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                minWidth: 0,
                color: isResolved ? 'var(--text-success)' : 'var(--text-body-light)',
                fontSize: 12,
                fontWeight: isResolved ? 600 : 500,
              }}
            >
              {message.content}
            </span>
            <div style={{ width: 8 }} />
            <span
              style={{
                flexShrink: 0,
                color: isResolved
                  ? 'color-mix(in srgb, var(--text-success) 70%, transparent)'
                  : 'var(--text-body-light)',
                fontSize: 11,
              }}
            >
              {formatTime(message.createdAt)}
            </span>
          </div>
        </div>
      </div>
    );
  }

  const isUser = message.senderType === 'user';
  // The label is shown only on the FIRST admin message of a run — a second
  // consecutive admin message has no label, because the reader already knows.
  const showSenderLabel =
    message.senderType === 'admin' &&
    (previousMessage === null || previousMessage.senderType !== 'admin');

  return (
    <div>
      {showDateHeader && <DateHeader date={message.createdAt} />}
      <div
        style={{
          display: 'flex',
          justifyContent: isUser ? 'flex-end' : 'flex-start',
        }}
      >
        <div
          style={{
            // `MediaQuery.of(context).size.width * 0.78` — a fraction of the
            // PHONE, not of the frame, so this must not become a percentage of
            // a wider layout if the prototype is ever viewed outside the frame.
            maxWidth: '78%',
            marginTop: 3,
            marginBottom: 3,
            marginLeft: isUser ? 48 : 0,
            marginRight: isUser ? 0 : 48,
            display: 'flex',
            flexDirection: 'column',
            alignItems: isUser ? 'flex-end' : 'flex-start',
          }}
        >
          {showSenderLabel && (
            <div
              style={{
                paddingLeft: 4,
                paddingBottom: 2,
                color: 'var(--text-body-light)',
                fontSize: 10,
                fontWeight: 500,
              }}
            >
              {copy.supportSenderLabel}
            </div>
          )}
          <div style={{ height: 'var(--spacing-2xs)' }} />
          <div
            style={{
              padding: '10px 14px',
              background: isUser ? 'var(--surface-action)' : 'var(--surface-primary)',
              // Only the corner on the sender's side is tightened; the other
              // three stay at 16. That single 4px corner is what points the
              // bubble at its sender.
              borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
            }}
          >
            <span
              style={{
                color: isUser ? 'var(--text-on-action)' : 'var(--text-heading)',
                fontSize: 15,
                lineHeight: 1.4,
              }}
            >
              {message.content}
            </span>
          </div>
          <div
            style={{
              paddingTop: 2,
              paddingLeft: 4,
              paddingRight: 4,
              color: 'var(--text-body-light)',
              fontSize: 11,
            }}
          >
            {formatTime(message.createdAt)}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * `_DateHeader` — Today / Yesterday / `d/m/yyyy`, with no zero padding on
 * either the day or the month.
 *
 * The comparison is on LOCAL calendar dates, so a message sent at 23:59 and one
 * at 00:01 are a day apart even though they are two minutes apart.
 */
function DateHeader({ date }: { date: string }) {
  const local = new Date(date);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const msgDate = new Date(local.getFullYear(), local.getMonth(), local.getDate());

  let label: string;
  if (msgDate.getTime() === today.getTime()) label = 'Today';
  else if (msgDate.getTime() === yesterday.getTime()) label = 'Yesterday';
  else label = `${local.getDate()}/${local.getMonth() + 1}/${local.getFullYear()}`;

  return (
    <div style={{ display: 'flex', justifyContent: 'center' }}>
      <div
        style={{
          margin: '12px 0',
          padding: '6px 14px',
          background: 'var(--surface-disabled)',
          borderRadius: 12,
          color: 'var(--text-body-light)',
          fontSize: 12,
          fontWeight: 500,
        }}
      >
        {label}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// Input bar
// ═════════════════════════════════════════════════════════════

/**
 * `_InputBar` — "matches session ChatScreen._InputBar exactly", per its own
 * comment, and it does: a `surface.primary` strip at 12/12/8/bottom with a
 * `surface.page` rounded field inside and a filled send button beside it.
 *
 * The send button is REPLACED by a small spinner while `isSending` — not
 * disabled, not dimmed. It comes back when the send resolves.
 */
function InputBar({
  value,
  onChange,
  onSend,
  isSending,
}: {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  isSending: boolean;
}) {
  return (
    <div
      style={{
        flexShrink: 0,
        background: 'var(--surface-primary)',
        // `padding.bottom + 8`; the inset is 0 inside the phone frame.
        padding: '8px 12px',
        display: 'flex',
        alignItems: 'flex-end',
      }}
    >
      <div
        style={{
          flex: 1,
          minWidth: 0,
          background: 'var(--surface-page)',
          borderRadius: 24,
        }}
      >
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            // `onSubmitted` fires on Enter; maxLines: 4 means Shift+Enter is
            // the only way to add a line, so Enter must not insert one.
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              onSend();
            }
          }}
          rows={1}
          autoCapitalize="sentences"
          placeholder={copy.typeAMessage}
          className="no-scrollbar"
          style={{
            display: 'block',
            width: '100%',
            boxSizing: 'border-box',
            resize: 'none',
            border: 'none',
            outline: 'none',
            background: 'transparent',
            padding: '10px 16px',
            fontFamily: 'inherit',
            fontSize: 15,
            lineHeight: 1.4,
            color: 'var(--text-heading)',
            maxHeight: 96,
          }}
        />
      </div>

      <div style={{ width: 8 }} />

      {isSending ? (
        <div style={{ padding: 8, display: 'flex' }}>
          <AppLoadingSpinner size="sm" />
        </div>
      ) : (
        <AppIconButton
          name="send"
          size="md"
          type="filled"
          backgroundColor="var(--surface-action)"
          iconColor="var(--icon-on-action)"
          label="Send"
          onClick={onSend}
        />
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// Empty state
// ═════════════════════════════════════════════════════════════

/**
 * `_EmptyState` — `AppIcon.lg` (48) chat glyph in `icon.secondary`, 16, a
 * 16px w600 title in `text.heading`, 8, then a 13px centred subtitle in
 * `text.bodyLight`.
 *
 * Reached only when the fetch succeeds and returns nothing, which the fixture
 * never does — the fixture always has two tickets. To see it, clear
 * `ALL_MESSAGES` in `lib/fake/support.ts`.
 */
function EmptyState() {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <AppIcon name="chat" size="lg" color="var(--icon-secondary)" />
      <div style={{ height: 'var(--spacing-md)' }} />
      <span style={{ color: 'var(--text-heading)', fontSize: 16, fontWeight: 600 }}>
        {copy.supportEmptyTitle}
      </span>
      <div style={{ height: 'var(--spacing-xs)' }} />
      <span
        style={{ color: 'var(--text-body-light)', fontSize: 13, textAlign: 'center' }}
      >
        {copy.supportEmptySubtitle}
      </span>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// Helpers
// ═════════════════════════════════════════════════════════════

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * `_formatTime` — 12-hour with NO leading zero on the hour and a single space
 * before the meridiem: `'9:05 PM'`, not `'09:05 PM'`. Midnight and noon both
 * render as `12`, which is what the source's two ternaries produce.
 */
function formatTime(iso: string): string {
  const local = new Date(iso);
  const h = local.getHours();
  const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
  const period = h >= 12 ? 'PM' : 'AM';
  return `${hour}:${local.getMinutes().toString().padStart(2, '0')} ${period}`;
}
