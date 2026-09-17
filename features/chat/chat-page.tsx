'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AppAvatar, AppIconButton, AppModal } from '@/design-system';
import { PhoneOverlay } from '@/components/prototype/phone-frame';
import { copy } from '@/lib/copy';
import { formatRate } from '@/lib/rates';
import { useSession, useSessionClock } from '@/lib/state/session-provider';
import { useProfile } from '@/lib/state/profile-provider';
import { useSnackbar } from '@/lib/state/snackbar-provider';
import { getSessionDetail, type SessionDetail } from '@/lib/session/session-detail';
import { SessionDetailSheet } from '@/components/session/session-detail-sheet';
import { buildChats, type MentorInboxItem } from '@/lib/fake/chats';
import {
  buildChatThread,
  CURRENT_USER_FIRST_NAME,
  CURRENT_USER_ID,
} from '@/lib/fake/chat-thread';
import {
  optimisticMedia,
  optimisticMessage,
  type ChatMessage,
} from '@/lib/session/chat-message';
import { MessageList } from './message-list';
import { ChatInputBar } from './chat-input-bar';
import {
  ChatUnavailableBar,
  ContinueChatBar,
  RequestingBar,
} from './chat-bottom-bars';
import { JumpToLatestPill } from './jump-to-latest-pill';
import { MediaViewer } from './media-viewer';

/**
 * ChatPage — the port of `ChatScreen`, and the one screen where the whole
 * prototype has to feel alive.
 *
 * ── What is real here and what is not ───────────────────────────────────────
 *
 * Real: the bubble geometry, the four-phase bottom bar, the countdown in the
 * app bar, the wallet debit, the reply-swipe, the jump-to-latest pill, the
 * typing indicator, the end-confirmation modal.
 *
 * Not real, and honestly so: `loadHistory`. The source streams history from the
 * backend with cursor pagination; here the first page is a seeded thread and
 * the second page is an empty array, so the load-more spinner appears once and
 * then the list stops growing. Sending a message appends locally — there is no
 * echo, no delivery tick progression, and no mentor reply.
 *
 * ── Four phases, and the one that shows nothing ─────────────────────────────
 *
 * `requesting` → the RequestingBar. `active` → the input bar (or the
 * locked-padlock bar while a call is up). `idle` → the ContinueChatBar. Read
 * from the session provider's status, which is the union the real
 * `SessionBloc` also exposes.
 *
 * `waitingForMentor` and `queued` deliberately fall through to NOTHING, exactly
 * as the Dart switch does — the ringing UI lives in the session overlay above
 * the chat screen, which is `SessionChrome` here.
 */

const PAGE_PADDING = 16;

/** The mentor this thread belongs to, resolved from the URL then from fixtures. */
function resolveMentor(mentorId: string | null): MentorInboxItem {
  const chats = buildChats();
  return chats.find((chat) => chat.mentorId === mentorId) ?? chats[0];
}

export function ChatPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mentor = useMemo(
    () => resolveMentor(searchParams.get('mentor')),
    [searchParams],
  );

  const { state, request, cancel, end, isBusy } = useSession();
  const { display: timerDisplay, isWarning: timerWarning } = useSessionClock();
  const { profile } = useProfile();
  const { show } = useSnackbar();

  const otherUserId = mentor.mentorId;
  const otherUserName = mentor.name;

  // ─── Message state ────────────────────────────────────────────────────────
  const [messages, setMessages] = useState<ChatMessage[]>(() =>
    buildChatThread(otherUserName),
  );
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [pagesLoaded, setPagesLoaded] = useState(1);
  const [isOtherTyping, setIsOtherTyping] = useState(false);

  // ─── Reply / highlight / viewer state ─────────────────────────────────────
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [viewerSrc, setViewerSrc] = useState<string | null>(null);
  const [detailLoadingId, setDetailLoadingId] = useState<string | null>(null);
  const [sessionDetail, setSessionDetail] = useState<SessionDetail | null>(null);

  // ─── Mentor presence, held here because the prototype has no presence socket
  const [mentorIsAvailable, setMentorIsAvailable] = useState(
    mentor.presence !== 'offline',
  );
  const [peerDisconnected] = useState(false);

  // ─── End-confirmation modal ───────────────────────────────────────────────
  const [endConfirmOpen, setEndConfirmOpen] = useState(false);

  const listRef = useRef<HTMLDivElement | null>(null);

  const sessionLive = state.status === 'active' || state.status === 'inCall';
  const inCall = state.status === 'inCall';
  const activeSessionId = 'sessionId' in state ? state.sessionId : null;

  /*
    The clock only exists while a session does. `useSessionClock` re-renders
    once a second, which is why the timer lives in its own context — this page
    subscribing to it costs one text node per second, not the whole thread.
  */
  const showTimer = sessionLive;

  // ─── Scroll to bottom on send ─────────────────────────────────────────────
  const scrollToBottom = useCallback(() => {
    const node = listRef.current;
    if (!node) return;
    // The list is column-reverse, so "bottom" is scrollTop 0.
    node.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // ─── Typing indicator ─────────────────────────────────────────────────────
  /*
    The source toggles `isOtherTyping` from a WS event. There is no mentor here,
    so the indicator is driven off wall-clock: the mentor starts "typing" a
    moment after the last message you send and stops a few seconds later. This
    exists purely so the indicator is reachable in the prototype — without it,
    one render path would never be visible.
  */
  const typingTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const triggerTyping = useCallback(() => {
    for (const timer of typingTimers.current) clearTimeout(timer);
    typingTimers.current = [
      setTimeout(() => setIsOtherTyping(true), 900),
      setTimeout(() => setIsOtherTyping(false), 4200),
    ];
  }, []);
  useEffect(
    () => () => {
      for (const timer of typingTimers.current) clearTimeout(timer);
    },
    [],
  );

  // ─── Send ─────────────────────────────────────────────────────────────────
  const handleSend = useCallback(
    (text: string): boolean => {
      if (!sessionLive) return false;
      const message = optimisticMessage({
        content: text,
        senderId: CURRENT_USER_ID,
        replySnapshot: replyingTo?.replySnapshot ?? null,
      });
      setMessages((current) => [...current, message]);
      setReplyingTo(null);
      scrollToBottom();
      triggerTyping();
      return true;
    },
    [sessionLive, replyingTo, scrollToBottom, triggerTyping],
  );

  const handleSendVoice = useCallback(
    (durationSeconds: number) => {
      const message = optimisticMedia({
        messageType: 'audio',
        mediaUrl: 'data:audio/mock',
        senderId: CURRENT_USER_ID,
        mediaMetadata: { duration_seconds: durationSeconds, waveform: [] },
      });
      setMessages((current) => [...current, message]);
      scrollToBottom();
    },
    [scrollToBottom],
  );

  const handlePickImage = useCallback(() => {
    const message = optimisticMedia({
      messageType: 'image',
      /*
        The stand-in photo is the same data URI the seeded thread uses, so a
        sent image and a seeded one are visually identical — the point is the
        bubble, not the picture.
      */
      mediaUrl: buildChatThread(otherUserName).find(
        (m) => m.messageType === 'image' && m.mediaUrl,
      )?.mediaUrl ?? null,
      senderId: CURRENT_USER_ID,
      mediaMetadata: { width: 1200, height: 1600, file_name: 'photo.jpg' },
    });
    setMessages((current) => [...current, message]);
    scrollToBottom();
  }, [otherUserName, scrollToBottom]);

  // ─── Load more history ────────────────────────────────────────────────────
  const handleLoadMore = useCallback(() => {
    if (isLoadingMore || pagesLoaded >= 2) return;
    setIsLoadingMore(true);
    // One more page exists and it is empty — see the header.
    setTimeout(() => {
      setPagesLoaded((n) => n + 1);
      setIsLoadingMore(false);
    }, 900);
  }, [isLoadingMore, pagesLoaded]);

  // ─── System-message tap → session detail ──────────────────────────────────
  /**
   * `_SystemMessageState._onTap` — the guard, the fetch, the two failure paths.
   *
   * The source is explicit about all three: a second tap while the first is in
   * flight is dropped (`if (_isLoading) return`), a null detail is NOT an
   * exception but still shows the error, and a thrown one does too. Both land
   * on the same message, so a single branch covers them.
   */
  const handleOpenSessionDetail = useCallback(
    async (sessionId: string) => {
      if (detailLoadingId !== null) return;
      setDetailLoadingId(sessionId);
      try {
        // A repository round-trip with no backend behind it. The delay is the
        // only part that is simulated; the null case below is real.
        await new Promise((resolve) => setTimeout(resolve, 600));
        const detail = getSessionDetail(sessionId, {
          isMentor: false,
          peerName: otherUserName,
          peerAvatar: mentor.avatar,
        });
        if (detail === null) {
          show("Couldn't load session details");
          return;
        }
        setSessionDetail(detail);
      } catch {
        show("Couldn't load session details");
      } finally {
        setDetailLoadingId(null);
      }
    },
    [detailLoadingId, otherUserName, mentor.avatar, show],
  );

  // ─── Jump to parent ───────────────────────────────────────────────────────
  const handleJumpToParent = useCallback((message: ChatMessage) => {
    const parentId = message.replyToMessageId;
    if (!parentId) return;
    setHighlightId(parentId);
  }, []);

  useEffect(() => {
    if (highlightId === null) return;
    const node = listRef.current?.querySelector(`[data-message-id="${highlightId}"]`);
    node?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }, [highlightId]);

  // ─── Request / continue ───────────────────────────────────────────────────
  const startSession = useCallback(
    (sessionType: 'chat' | 'audio' | 'video') => {
      request({
        mentorId: otherUserId,
        mentorName: otherUserName,
        mentorAvatar: mentor.avatar,
        sessionType,
        ratePerMinute: mentor.discountedRatePerMinute ?? mentor.ratePerMinute,
        prefAudio: mentor.prefAudio,
        prefVideo: mentor.prefVideo,
      });
    },
    [request, otherUserId, otherUserName, mentor],
  );

  /*
    Auto-request on open. `ChatScreen(requestSessionOnOpen: true,
    requestSessionType: 'audio')` is the source's mechanism; a query param is
    the same intent expressed in a URL, which is what lets the mentor profile's
    three buttons deep-link into the right request.

    `requestedOnOpen` is a ref rather than state because the guard must survive
    the re-render the request itself causes — with state, the effect would fire,
    set the flag, and the request's own re-render would re-run the effect before
    the flag committed on a fast path.
  */
  const requestedOnOpen = useRef(false);
  useEffect(() => {
    if (requestedOnOpen.current) return;
    const start = searchParams.get('start');
    if (start !== 'chat' && start !== 'audio' && start !== 'video') return;
    requestedOnOpen.current = true;
    startSession(start);
  }, [searchParams, startSession]);

  // ─── Session-end cleanup ──────────────────────────────────────────────────
  /*
    When the session ends the thread shows the ContinueChatBar, and any reply
    target and highlight are dropped — a reply draft that outlives its session
    would be sent into the next one.
  */
  useEffect(() => {
    if (state.status === 'ended' || state.status === 'idle') {
      setReplyingTo(null);
      setHighlightId(null);
    }
  }, [state.status]);

  // ─── Unread buffer (the pill's badge) ─────────────────────────────────────
  /*
    `anchoredToLive` is false after a jump-to-parent; while it is false, live
    arrivals count toward the badge. Sent messages are the only arrivals here,
    so the count is normally zero — the pill renders without a badge, which is
    the state most readers will see.
  */
  const liveBufferCount = 0;

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--surface-page)',
      }}
    >
      {/* ─── App bar ─────────────────────────────────────────────────────── */}
      <div
        style={{
          flexShrink: 0,
          background: 'var(--surface-primary)',
          boxShadow: '0 0.5px 0 var(--border-secondary)',
          display: 'flex',
          alignItems: 'center',
          paddingRight: 8,
          minHeight: 56,
        }}
      >
        <AppIconButton
          name="arrowBack"
          size="sm"
          label="Back"
          onClick={() => router.back()}
        />
        <button
          type="button"
          onClick={() => router.push(`/mentors/${otherUserId}`)}
          style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            border: 'none',
            background: 'transparent',
            padding: '4px 0',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <AppAvatar
            name={otherUserName}
            imageUrl={mentor.avatar}
            size="sm"
            /* The app bar's avatar is a 36px circle — smaller than any AppCircle
               size, so it is drawn at the sm diameter and scaled down. */
          />
          <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            <span
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: 'var(--text-heading)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {otherUserName}
            </span>
            <AppBarSubtitle
              sessionLive={sessionLive}
              peerDisconnected={peerDisconnected}
              requesting={state.status === 'requesting'}
              timerDisplay={timerDisplay}
              timerWarning={timerWarning}
              presence={mentor.presence}
              isAvailable={mentorIsAvailable}
            />
          </div>
        </button>

        {/* Audio — idle only. */}
        {!inCall && state.status !== 'active' && state.status !== 'requesting' && mentor.prefAudio && (
          <AppIconButton
            name="call"
            size="md"
            label={copy.audioCallLabel}
            disabled={isBusy}
            onClick={() => startSession('audio')}
          />
        )}
        {/* Video — mentee only, idle only. */}
        {!inCall && state.status !== 'active' && state.status !== 'requesting' && mentor.prefVideo && (
          <AppIconButton
            name="videoCam"
            size="md"
            label={copy.videoLabel}
            disabled={isBusy}
            onClick={() => startSession('video')}
          />
        )}
        {/* End — live session only, in red text rather than an icon. */}
        {sessionLive && (
          <button
            type="button"
            onClick={() => setEndConfirmOpen(true)}
            style={{
              border: 'none',
              background: 'transparent',
              padding: '8px 12px',
              cursor: 'pointer',
              fontSize: 15,
              fontWeight: 600,
              color: 'var(--text-error)',
            }}
          >
            {copy.endButtonLabel}
          </button>
        )}
      </div>

      {/* ─── Messages + floating pill ────────────────────────────────────── */}
      <div style={{ flex: 1, minHeight: 0, position: 'relative', display: 'flex' }}>
        <MessageList
          messages={messages}
          currentUserId={CURRENT_USER_ID}
          otherUserName={otherUserName}
          isOtherTyping={isOtherTyping}
          isLoadingMoreHistory={isLoadingMore}
          highlightMessageId={highlightId}
          onClearHighlight={() => setHighlightId(null)}
          onStartReply={(message) => setReplyTarget(setReplyingTo, message)}
          onJumpToParent={handleJumpToParent}
          onSwipePastTop={handleLoadMore}
          listRef={listRef}
          activeSessionId={activeSessionId}
          loadingSessionId={detailLoadingId}
          onOpenSessionDetail={handleOpenSessionDetail}
          onOpenImage={setViewerSrc}
        />

        {/* Mirrors the source's `if (!anchoredToLive)` overlay. */}
        {highlightId !== null && (
          <div style={{ position: 'absolute', right: 12, bottom: 12 }}>
            <JumpToLatestPill
              unreadCount={liveBufferCount}
              onTap={() => {
                setHighlightId(null);
                scrollToBottom();
              }}
            />
          </div>
        )}
      </div>

      {/* ─── Bottom bar — four phases ────────────────────────────────────── */}
      {state.status === 'requesting' ? (
        <RequestingBar onCancel={cancel} />
      ) : inCall ? (
        <ChatUnavailableBar />
      ) : state.status === 'active' ? (
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <div
            style={{
              opacity: peerDisconnected ? 0.5 : 1,
              pointerEvents: peerDisconnected ? 'none' : 'auto',
            }}
          >
            <ChatInputBar
              replyingTo={replyingTo}
              currentUserId={CURRENT_USER_ID}
              otherUserName={otherUserName}
              onCancelReply={() => setReplyingTo(null)}
              onSend={handleSend}
              onSendVoice={handleSendVoice}
              onPickImage={handlePickImage}
              disabled={peerDisconnected}
            />
          </div>
        </div>
      ) : (
        <ContinueChatBar
          onTap={() => startSession('chat')}
          introPromoEligible={mentor.introPromoEligible}
          mentorRatePerMinute={mentor.ratePerMinute}
          introPromoRatePerMinute={mentor.introPromoRatePerMinute}
          mentorIsAvailable={mentorIsAvailable}
          menteeFirstName={
            profile?.displayName.split(' ')[0] || CURRENT_USER_FIRST_NAME
          }
          disabled={isBusy}
        />
      )}

      {/* ─── Overlays ────────────────────────────────────────────────────── */}
      <PhoneOverlay>
        <MediaViewer src={viewerSrc} onClose={() => setViewerSrc(null)} />
      </PhoneOverlay>

      <PhoneOverlay>
        <SessionDetailSheet
          open={sessionDetail !== null}
          detail={sessionDetail}
          // The mentee app. The block reads `mentor` and `total_amount` — the
          // other half of the model, which this payload does not carry.
          isMentor={false}
          onClose={() => setSessionDetail(null)}
        />
      </PhoneOverlay>

      <PhoneOverlay>
        <AppModal
          open={endConfirmOpen}
          onClose={() => setEndConfirmOpen(false)}
          title={copy.endSessionTitle}
          message={copy.endSessionConfirmMentee}
          actions={[
            { label: copy.cancel, onPress: () => setEndConfirmOpen(false) },
            {
              label: copy.endSessionButton,
              destructive: true,
              onPress: () => {
                setEndConfirmOpen(false);
                end('self');
              },
            },
          ]}
        />
      </PhoneOverlay>
    </div>
  );
}

/** Shared between the reply-swipe and the quoted-strip tap. */
function setReplyTarget(
  setter: (message: ChatMessage) => void,
  message: ChatMessage,
): void {
  setter(message);
}

/**
 * The app bar's second line. Five mutually exclusive sources, in the source's
 * priority order: peer-disconnected grace countdown, live timer, "Connecting…",
 * then the static presence line.
 *
 * The timer is the one that matters — it turns `text.error` below
 * `TIMER_WARNING_SECONDS` and is the visible proof the meter is running.
 */
function AppBarSubtitle({
  sessionLive,
  peerDisconnected,
  requesting,
  timerDisplay,
  timerWarning,
  presence,
  isAvailable,
}: {
  sessionLive: boolean;
  peerDisconnected: boolean;
  requesting: boolean;
  timerDisplay: string;
  timerWarning: boolean;
  presence: MentorInboxItem['presence'];
  isAvailable: boolean;
}) {
  let text: string | null = null;
  let color = 'var(--text-body-light)';

  if (sessionLive && peerDisconnected) {
    // `waitingForUserWithTimer` — the grace countdown for a dropped peer.
    text = copy.waitingForUser.replace('{userName}', 'the mentor');
    color = 'var(--text-warning)';
  } else if (sessionLive) {
    text = timerDisplay;
    color = timerWarning ? 'var(--text-error)' : 'var(--text-body-light)';
  } else if (requesting) {
    text = copy.connecting;
  } else {
    text = presenceLabel(presence, isAvailable);
  }

  if (text === null) return null;

  return (
    <span
      style={{
        fontSize: 12,
        fontWeight: 500,
        color,
        fontVariantNumeric: sessionLive && !peerDisconnected ? 'tabular-nums' : undefined,
      }}
    >
      {text}
    </span>
  );
}

/**
 * `PresenceText` — reduced to the mentee app's reachable set. `inSession`
 * reads as busy rather than offline, which is the distinction that matters: a
 * mentor mid-session is reachable, just not now.
 */
function presenceLabel(
  presence: MentorInboxItem['presence'],
  isAvailable: boolean,
): string {
  if (!isAvailable) return copy.mentorUnavailable;
  switch (presence) {
    case 'online':
      return copy.onlineNow;
    case 'inSession':
      return 'In a session';
    case 'offline':
      return 'Offline';
  }
}

/** Rupee rate for the promo banner's struck-through line. */
export function promoRateLabel(rate: number): string {
  return `₹${formatRate(rate)}/min`;
}
