'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { AppIcon, AppIconButton, AppBottomSheet, AppBottomSheetHeader } from '@/design-system';
import type { ChatMessage } from '@/lib/session/chat-message';
import { copy } from '@/lib/copy';
import { ReplyComposerPreview } from './reply-widgets';

/**
 * ChatInputBar — port of `widgets/chat_input_bar.dart`.
 *
 * ── Enter does NOT send ─────────────────────────────────────────────────────
 *
 * The source sets `maxLines: 4` and no `textInputAction`, no `onSubmitted` and
 * no `onEditingComplete`. With a multi-line field the platform default is
 * "newline", so Enter inserts a line break. Adding send-on-enter here would be
 * the single easiest way to make this port feel nicer than the app and stop
 * being a port.
 *
 * ── Two states, one row ─────────────────────────────────────────────────────
 *
 * Recording REPLACES the entire column — capsule, reply preview and all — with a
 * timer row. The typed draft survives in the field underneath and comes back
 * when recording ends, because the controller is never cleared.
 *
 * ── One thing that cannot be ported ─────────────────────────────────────────
 *
 * The source's in-recording waveform is decoration: the widget takes a
 * `recordingWaveform` prop, threads it three layers, and never reads it, drawing
 * a synthetic `0.3 + 0.3 * ((i * 7 + 3) % 5) / 5` pattern instead. That pattern
 * is reproduced exactly — it is deterministic, and it is what the app shows.
 */

/** The source's synthetic bar pattern: `0.3 + 0.3 * ((i*7+3) % 5) / 5`. */
function syntheticAmplitude(index: number): number {
  return 0.3 + (0.3 * ((index * 7 + 3) % 5)) / 5;
}

function RecordingWaveform({ height }: { height: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const measure = () => setWidth(element.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const BAR_WIDTH = 2.5;
  const GAP = 2.0;
  const barCount = width > 0 ? Math.floor(width / (BAR_WIDTH + GAP)) : 0;

  return (
    <div ref={ref} style={{ height, width: '100%', display: 'flex', alignItems: 'center' }}>
      {Array.from({ length: barCount }, (_, i) => (
        <span
          key={i}
          style={{
            width: BAR_WIDTH,
            height: syntheticAmplitude(i) * height,
            marginRight: i === barCount - 1 ? 0 : GAP,
            borderRadius: 1.5,
            background:
              'color-mix(in srgb, var(--text-heading) 50%, transparent)',
          }}
        />
      ))}
    </div>
  );
}

export function ChatInputBar({
  replyingTo,
  currentUserId,
  otherUserName,
  onCancelReply,
  onSend,
  onSendVoice,
  onPickImage,
  disabled,
}: {
  replyingTo: ChatMessage | null;
  currentUserId: string;
  otherUserName: string;
  onCancelReply: () => void;
  onSend: (text: string) => boolean;
  onSendVoice: (durationSeconds: number) => void;
  onPickImage: () => void;
  disabled: boolean;
}) {
  const [text, setText] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const fieldRef = useRef<HTMLTextAreaElement>(null);

  /* `_hasText` is UNtrimmed in the source, so a single space counts as text and
     hides the attach shift + swaps the mic for send. */
  const hasText = text.length > 0;

  /*
    Reply focus. When a reply target appears, the field takes focus — the
    WhatsApp behaviour. Dismissing the reply does not unfocus.
  */
  useEffect(() => {
    if (replyingTo) fieldRef.current?.focus();
  }, [replyingTo?.id, replyingTo]);

  /*
    The recording clock. The widget holds no time state of its own — it renders
    the cubit's `recordingDuration`, which ticks once a second off wall-clock.
    Auto-stop at 120s matches `AudioRecorderService.maxDurationSeconds`, and it
    auto-SENDS rather than discarding.
  */
  useEffect(() => {
    if (!recording) return;
    const startedAt = Date.now();
    setElapsed(0);
    const interval = setInterval(() => {
      const seconds = Math.floor((Date.now() - startedAt) / 1000);
      if (seconds >= 120) {
        setRecording(false);
        onSendVoice(120);
        return;
      }
      setElapsed(seconds);
    }, 250);
    return () => clearInterval(interval);
  }, [recording, onSendVoice]);

  function submit() {
    if (text.trim() === '') return;
    if (onSend(text)) setText('');
  }

  function stopAndSend() {
    setRecording(false);
    onSendVoice(Math.max(1, elapsed));
  }

  return (
    <div
      style={{
        background: 'var(--surface-primary)',
        padding: '8px 8px 12px',
        paddingBottom: 'calc(12px + env(safe-area-inset-bottom, 0px))',
      }}
    >
      {recording ? (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <AppIconButton
            name="close"
            size="sm"
            label="Cancel recording"
            iconColor="var(--text-body-light)"
            onClick={() => setRecording(false)}
          />
          <div style={{ width: 8, flexShrink: 0 }} />
          {/* Colors.red — a raw Material colour, not a design token. It is the
              source's, and the prototype has no token for it either. */}
          <AppIcon name="fiberManualRecord" px={12} color="#f44336" />
          <div style={{ width: 6, flexShrink: 0 }} />
          <span
            style={{
              fontSize: 15,
              fontWeight: 500,
              color: 'var(--text-heading)',
              fontVariantNumeric: 'tabular-nums',
              whiteSpace: 'nowrap',
            }}
          >
            {/* Minutes are NOT zero-padded: `0:05`, never `00:05`. */}
            {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}
          </span>
          <div style={{ width: 12, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <RecordingWaveform height={28} />
          </div>
          <div style={{ width: 12, flexShrink: 0 }} />
          <AppIconButton
            name="send"
            size="md"
            type="filled"
            backgroundColor="#f44336"
            label="Send voice note"
            onClick={stopAndSend}
          />
        </div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
            {replyingTo && (
              <ReplyComposerPreview
                replyingTo={replyingTo}
                currentUserId={currentUserId}
                otherUserName={otherUserName}
                onCancel={onCancelReply}
              />
            )}
            <div
              style={{
                background: 'var(--surface-page)',
                borderRadius: 24,
                display: 'flex',
                alignItems: 'flex-end',
              }}
            >
              <textarea
                ref={fieldRef}
                rows={1}
                value={text}
                onChange={(event) => setText(event.target.value)}
                placeholder={copy.typeAMessage}
                aria-label={copy.typeAMessage}
                style={{
                  flex: 1,
                  minWidth: 0,
                  resize: 'none',
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  fontSize: 15,
                  lineHeight: 1.35,
                  color: 'var(--text-heading)',
                  padding: '10px 16px',
                  maxHeight: 4 * 15 * 1.35 + 20,
                  fontFamily: 'inherit',
                }}
              />
              {/*
                The attach button slides 8px left when the quick-reply bolt is
                showing. In the mentee app the bolt is never shown — it is gated
                on `isMentor` AND reads a mentor-only endpoint — so the shift is
                unreachable here and the transform is fixed at 0. The prop is
                kept in the layout so the geometry matches if a mentor view is
                ever added.
              */}
              <div style={{ paddingBottom: 2, flexShrink: 0 }}>
                <AppIconButton
                  name="attachFile"
                  size="sm"
                  label="Attach"
                  iconColor="var(--icon-primary)"
                  onClick={() => setSheetOpen(true)}
                />
              </div>
            </div>
          </div>
          <div style={{ width: 4, flexShrink: 0 }} />
          <div style={{ paddingBottom: 2, flexShrink: 0 }}>
            {hasText ? (
              <AppIconButton
                name="send"
                size="md"
                type="filled"
                label="Send"
                onClick={submit}
              />
            ) : (
              <AppIconButton
                name="mic"
                size="md"
                type="filled"
                label="Record a voice note"
                onClick={() => setRecording(true)}
              />
            )}
          </div>
        </div>
      )}

      {/*
        The bar is absorbed, not hidden, while the peer is disconnected: it stays
        on screen at half opacity and refuses taps. That is the source's
        `AbsorbPointer` + `Opacity(0.5)`, and it is why the field does not
        disappear mid-session.
      */}
      {disabled && (
        <div
          aria-hidden
          style={{ position: 'absolute', inset: 0, background: 'var(--surface-primary)', opacity: 0.5 }}
        />
      )}

      <AttachmentSheet open={sheetOpen} onClose={() => setSheetOpen(false)} onPick={onPickImage} />
    </div>
  );
}

/**
 * `AttachmentBottomSheet` — two options, and a doc comment that promises a third
 * ("file") that the enum has never contained and no code path can produce.
 *
 * Both options land on the same image path here: there is no camera or gallery
 * in a browser, so the prototype sends the stand-in photo. Everything the sheet
 * itself does — its geometry, its dismissal, the value it hands back — is the
 * app's.
 */
function AttachmentSheet({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: () => void;
}) {
  function pick() {
    onClose();
    onPick();
  }

  return (
    <AppBottomSheet open={open} onClose={onClose}>
      <AppBottomSheetHeader title={copy.attachments} onClose={onClose} />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-evenly',
          padding: '24px 20px',
        }}
      >
        <AttachmentOption icon="camera" label={copy.camera} onClick={pick} />
        <AttachmentOption icon="gallery" label={copy.gallery} onClick={pick} />
      </div>
    </AppBottomSheet>
  );
}

function AttachmentOption({
  icon,
  label,
  onClick,
}: {
  icon: 'camera' | 'gallery';
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        border: 'none',
        background: 'transparent',
        padding: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        cursor: 'pointer',
      }}
    >
      <span
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: 'color-mix(in srgb, var(--icon-action) 10%, transparent)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <AppIcon name={icon} px={26} color="var(--icon-action)" />
      </span>
      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-heading)' }}>
        {label}
      </span>
    </button>
  );
}
