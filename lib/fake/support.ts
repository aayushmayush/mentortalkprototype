/**
 * The support chat thread fixture — `SupportChatCubit`'s backing store.
 *
 * ── The message ordering bug in the source, and what is done about it ───────
 *
 * `support_chat_screen.dart` renders `ListView(reverse: true)` over
 * `state.messages.reversed`. `SupportChatCubit.load()` already reversed the
 * API's newest-first payload into chronological order, so the screen reverses
 * it *back* to newest-first before feeding a reversed list view — which
 * un-reverses it again. The screen's own `_onScroll` comment agrees with this
 * reading ("With reverse: true, reaching the 'end' (oldest messages) is
 * maxScrollExtent"), so the two reversals cancel and the list renders
 * oldest-first in a bottom-anchored scroller.
 *
 * The prototype reproduces the *rendered* result, not the double reversal: a
 * plain column in chronological order inside a `flex-direction: column-reverse`
 * scroller. Reproducing the bug faithfully would mean reversing twice in the
 * same way for no visible difference, and the visible result is what the
 * spec's "no loopholes" instruction is actually about.
 *
 * ── The fixture is a resolved ticket, so all three bubble kinds are present ─
 *
 * `_MessageItem` branches three ways — system, admin, user — and a fresh thread
 * only ever shows the first two. The fixture is therefore an *already-closed*
 * ticket from three weeks ago: a system "Ticket created", an admin reply, the
 * user's reply, a system "Ticket resolved" (which takes the success-green
 * styling, the only place `surface.success` at 60% alpha appears), and then a
 * second, still-open ticket this week so the newest bubble is a user one and
 * the send path has somewhere to append.
 */

export type SupportSenderType = 'user' | 'admin' | 'system';

export type SupportMessage = {
  id: string;
  senderId: string;
  senderType: SupportSenderType;
  content: string;
  /** `text` for everything the fixture carries; the DTO allows more. */
  type: string;
  createdAt: string;
};

export const SUPPORT_PAGE_SIZE = 20;

function ago(days: number, hours = 0): string {
  return new Date(Date.now() - days * 86_400_000 - hours * 3_600_000).toISOString();
}

/** Newest first, exactly as `SupportRepository.getMessages()` returns it. */
const ALL_MESSAGES: SupportMessage[] = [
  // ── Ticket 2 — this week, still open. ──
  {
    id: 'sm-2-2',
    senderId: 'me',
    senderType: 'user',
    content: 'Also, can I get a GST invoice for the top-up I made last week?',
    type: 'text',
    createdAt: ago(1, 3),
  },
  {
    id: 'sm-2-1',
    senderId: 'admin',
    senderType: 'admin',
    content: "Sure — I've raised ticket #48213 for the refund.",
    type: 'text',
    createdAt: ago(1, 9),
  },
  {
    id: 'sm-2-0',
    senderId: 'me',
    senderType: 'user',
    content: 'Hi, my audio session dropped after 4 minutes but I was billed for 8.',
    type: 'text',
    createdAt: ago(1, 11),
  },
  {
    id: 'sm-2-sys',
    senderId: 'system',
    senderType: 'system',
    content: 'Ticket created',
    type: 'system',
    createdAt: ago(1, 11),
  },

  // ── Ticket 1 — three weeks ago, resolved. ──
  {
    id: 'sm-1-3',
    senderId: 'system',
    senderType: 'system',
    content: 'Ticket resolved',
    type: 'system',
    createdAt: ago(21, 2),
  },
  {
    id: 'sm-1-2',
    senderId: 'admin',
    senderType: 'admin',
    content: 'Happy to help! Marking this one resolved.',
    type: 'text',
    createdAt: ago(21, 3),
  },
  {
    id: 'sm-1-1',
    senderId: 'me',
    senderType: 'user',
    content: 'That worked, thank you!',
    type: 'text',
    createdAt: ago(21, 4),
  },
  {
    id: 'sm-1-0',
    senderId: 'admin',
    senderType: 'admin',
    content:
      'You can change your exam preferences from Settings → Categories. Let me know if that helps.',
    type: 'text',
    createdAt: ago(21, 5),
  },
  {
    id: 'sm-1-sys',
    senderId: 'system',
    senderType: 'system',
    content: 'Ticket created',
    type: 'system',
    createdAt: ago(21, 5),
  },
];

/**
 * One page of history, newest-first, plus whether older messages remain.
 *
 * `before` is the real endpoint's cursor. There is one page here, so `before`
 * is never actually exercised — `hasMore` is `false` on the first call, and the
 * scroll handler's `loadMore()` is a no-op. That branch is deliberately left
 * cold rather than faked with a second page, because the source's `loadMore`
 * **silently swallows errors** (`case Error(): break; // Silent fail on
 * pagination`) and a fixture that always succeeds would make that look like a
 * handled path when it is a swallowed one.
 */
export function fetchSupportMessages(before?: string | null): {
  messages: SupportMessage[];
  hasMore: boolean;
  nextCursor: string | null;
} {
  if (before !== undefined && before !== null) {
    return { messages: [], hasMore: false, nextCursor: null };
  }
  return { messages: ALL_MESSAGES, hasMore: false, nextCursor: null };
}

/**
 * `sendMessage` returns **all** new messages, not just the user's — the source
 * is explicit about it: *"The API returns all new messages (system + welcome +
 * user message). Add them, deduplicating against any that arrived via
 * WebSocket."*
 *
 * So the first message of an empty thread yields three bubbles at once: the
 * system "Ticket created", an admin welcome, and the reply. That is why this
 * returns an array rather than one message, and why opening an empty support
 * thread and typing one line makes three bubbles appear.
 */
export function buildSentMessages(
  content: string,
  isFirstInThread: boolean,
): SupportMessage[] {
  const now = Date.now();
  const out: SupportMessage[] = [];

  if (isFirstInThread) {
    out.push({
      id: `sm-${now}-sys`,
      senderId: 'system',
      senderType: 'system',
      content: 'Ticket created',
      type: 'system',
      createdAt: new Date(now).toISOString(),
    });
    out.push({
      id: `sm-${now}-welcome`,
      senderId: 'admin',
      senderType: 'admin',
      content:
        "Thanks for reaching out! Our team will get back to you within 24 hours.",
      type: 'text',
      createdAt: new Date(now + 1).toISOString(),
    });
  }

  out.push({
    id: `sm-${now}-me`,
    senderId: 'me',
    senderType: 'user',
    content,
    type: 'text',
    createdAt: new Date(now + 2).toISOString(),
  });

  return out;
}

/**
 * The admin's canned reply, arriving one beat after a send.
 *
 * Production gets this over the WebSocket (`_listenToWebSocket`, filtering
 * `type == 'support_message'`). A prototype has no socket, so the reply is
 * scheduled instead — and it is delivered through the same dedupe-by-id path
 * the socket uses, so the code under it is the real code.
 */
export const SUPPORT_AUTO_REPLY = {
  content: "Got it — I've passed this to the team and we'll follow up shortly.",
  delayMs: 2500,
};
