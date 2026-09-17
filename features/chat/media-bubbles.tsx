'use client';

import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { AppIcon, type IconName } from '@/design-system';
import {
  type ChatMessage,
  type MessageStatus,
  formatClock,
} from '@/lib/session/chat-message';
import { UnavailableBubble, mediaWidth } from './bubbles';

/**
 * The three media bubbles — audio, image, file — ported from
 * `widgets/audio_message_bubble.dart`, `image_message_bubble.dart` and
 * `file_message_bubble.dart`.
 *
 * ── The one layout fact that surprises everyone ─────────────────────────────
 *
 * All three are **always exactly their maximum width**, never shrink-to-fit. The
 * audio and file bubbles contain an `Expanded`, which forces the row to fill the
 * bounded `maxWidth`; the image bubble uses `AspectRatio`, which expands under a
 * maxWidth-only constraint. So a two-second voice note and a 1 KB text file both
 * render at 70% and 75% of the screen. Only the text bubble and the three
 * "unavailable" variants shrink-wrap, because they are a `Column` of `Text` and a
 * `Row` with `mainAxisSize.min` respectively.
 *
 * That is why the bubbles below set `width` rather than `maxWidth`.
 *
 * ── Three honest stand-ins ──────────────────────────────────────────────────
 *
 * There is no media storage here, so three things are simulated rather than
 * performed. Each is a state the app genuinely passes through:
 *
 * 1. **Audio playback.** There is no file to play, so `_position` is advanced by
 *    a timer. The waveform, the duration label, the play/pause swap and the
 *    one-bubble-at-a-time lock are the app's.
 * 2. **File download.** Tapping runs the spinner the app shows while it
 *    downloads, then settles into the "already local" state. `OpenFilex.open`
 *    has no counterpart on the web, so nothing opens.
 * 3. **Image.** The seeded URL is an inline SVG standing in for an on-device
 *    file, so the image renders directly instead of through the download →
 *    placeholder path.
 */

// ─── Shared chrome ──────────────────────────────────────────────────────────

const TICK_ICONS: Record<MessageStatus, IconName> = {
  sending: 'accessTime',
  sent: 'check',
  delivered: 'doneAll',
  read: 'doneAll',
};

const BUBBLE_SHADOW = '0 1px 3px rgba(0, 0, 0, 0.04)';

function tailRadius(mine: boolean): string {
  return mine ? '16px 16px 4px 16px' : '16px 16px 16px 4px';
}

function alpha(token: string, percent: number): string {
  return `color-mix(in srgb, ${token} ${percent}%, transparent)`;
}

type BubbleColors = {
  bubble: string;
  text: string;
  muted: string;
};

/**
 * The per-side colour triple every media bubble derives at the top of its
 * `build`. Note the muted alpha differs by bubble — 0.5 for audio, 0.7 for file
 * — which is why this takes the alpha rather than fixing it.
 */
function colorsFor(mine: boolean, mutedAlpha: number): BubbleColors {
  return {
    bubble: mine ? 'var(--surface-action)' : 'var(--surface-primary)',
    text: mine ? 'var(--text-on-action)' : 'var(--text-heading)',
    muted: mine ? alpha('var(--text-on-action)', mutedAlpha) : 'var(--text-body-light)',
  };
}

/** The tick colour, which the source repeats per bubble with a different fallback. */
function tickColor(mine: boolean, status: MessageStatus, muted: string, readAlpha: number): string {
  if (status !== 'read') return muted;
  return mine ? alpha('var(--text-on-action)', readAlpha) : 'var(--icon-action)';
}

// ─── Audio ──────────────────────────────────────────────────────────────────

/**
 * The one-at-a-time playback lock.
 *
 * A module-level notifier, exactly as in the source (`final ValueNotifier<String?>
 * _playingBubbleId` at file scope). Two bubbles can never play at once: whichever
 * bubble holds the slot is the only one rendering pause, and taking the slot is
 * what stops the previous one.
 *
 * `useSyncExternalStore` rather than context, because the store is genuinely
 * outside React — it has to be, or it would reset whenever the list remounts.
 */
let playingId: string | null = null;
const playingListeners = new Set<() => void>();

function setPlayingId(id: string | null) {
  if (playingId === id) return;
  playingId = id;
  for (const listener of playingListeners) listener();
}

function subscribePlaying(listener: () => void): () => void {
  playingListeners.add(listener);
  return () => {
    playingListeners.delete(listener);
  };
}

function usePlayingId(): string | null {
  return useSyncExternalStore(
    subscribePlaying,
    () => playingId,
    () => null,
  );
}

/** 40 bars at 0.3 when the metadata carries no waveform — the source's default. */
const DEFAULT_WAVEFORM = Array.from({ length: 40 }, () => 0.3);

function waveformOf(message: ChatMessage): number[] {
  const raw = message.mediaMetadata?.waveform;
  if (!Array.isArray(raw) || raw.length === 0) return DEFAULT_WAVEFORM;
  return raw.map((value) => (typeof value === 'number' ? value : 0.3));
}

/** `'$minutes:${seconds.padLeft(2, "0")}'` — minutes are TOTAL, never `% 60`. */
function formatClipDuration(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

/**
 * The waveform, drawn from the source's own sampling maths:
 * `barCount = floor(width / (2.5 + 1.5))`, clamped to the sample count;
 * `sampleIndex = floor(i * (samples / barCount))`; amplitude clamped to
 * 0.1–1.0; each bar vertically centred.
 *
 * Width is measured rather than assumed, because it is whatever the `Expanded`
 * resolved to — the arithmetic depends on it and a hardcoded guess would drift.
 */
function Waveform({
  samples,
  progress,
  activeColor,
  inactiveColor,
  height,
}: {
  samples: number[];
  progress: number;
  activeColor: string;
  inactiveColor: string;
  height: number;
}) {
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
  const GAP = 1.5;
  const STEP = BAR_WIDTH + GAP;

  const barCount =
    width > 0 ? Math.min(Math.max(Math.floor(width / STEP), 1), samples.length) : 0;
  const sampleStep = barCount > 0 ? samples.length / barCount : 1;
  const progressBarIndex = Math.floor(progress * barCount);

  return (
    <div ref={ref} style={{ height, width: '100%', display: 'flex', alignItems: 'center' }}>
      {Array.from({ length: barCount }, (_, i) => {
        const sampleIndex = Math.min(
          Math.max(Math.floor(i * sampleStep), 0),
          samples.length - 1,
        );
        const amplitude = Math.min(Math.max(samples[sampleIndex], 0.1), 1.0);
        const barHeight = amplitude * height;
        return (
          <span
            key={i}
            style={{
              width: BAR_WIDTH,
              height: barHeight,
              marginRight: i === barCount - 1 ? 0 : GAP,
              borderRadius: 1.5,
              background: i <= progressBarIndex ? activeColor : inactiveColor,
            }}
          />
        );
      })}
    </div>
  );
}

export function AudioBubble({ message, mine }: { message: ChatMessage; mine: boolean }) {
  const colors = colorsFor(mine, 50);

  // The unavailable variant is reached by the URL check, and the status check
  // is what stops a message still being sent from flashing "unavailable".
  if (message.mediaUrl === null && message.status !== 'sending') {
    return (
      <UnavailableBubble
        text="Voice note unavailable"
        timestamp={message.timestamp}
        width={mediaWidth}
        withTime={false}
        mine={mine}
      />
    );
  }

  const durationSeconds = Number(message.mediaMetadata?.duration_seconds ?? 0);
  const waveform = waveformOf(message);
  const playing = usePlayingId() === message.id;
  const [position, setPosition] = useState(0);

  /*
    Advance `_position` while this bubble holds the lock. There is no player
    here, so the clock is a timer — see the file header. Reaching the end
    releases the lock, which is what the source does when the player leaves
    `playing`.
  */
  useEffect(() => {
    if (!playing) return;
    const interval = setInterval(() => {
      setPosition((current) => {
        const next = current + 0.25;
        if (next >= durationSeconds) {
          setPlayingId(null);
          return 0;
        }
        return next;
      });
    }, 250);
    return () => clearInterval(interval);
  }, [playing, durationSeconds]);

  /* Losing the lock resets the playhead, so a paused bubble reads its full
     duration rather than freezing part-way. */
  useEffect(() => {
    if (!playing) setPosition(0);
  }, [playing]);

  function toggle() {
    if (playing) {
      setPlayingId(null);
      return;
    }
    // Restart from the top; the source never resumes mid-clip either.
    setPosition(0);
    setPlayingId(message.id);
  }

  const progress = durationSeconds > 0 ? position / durationSeconds : 0;
  const displayed = playing ? position : durationSeconds;

  return (
    <div style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
      <div
        style={{
          width: mediaWidth,
          marginBottom: 6,
          padding: '8px 10px',
          background: colors.bubble,
          borderRadius: tailRadius(mine),
          boxShadow: BUBBLE_SHADOW,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button
            type="button"
            onClick={toggle}
            aria-label={playing ? 'Pause voice note' : 'Play voice note'}
            style={{
              width: 36,
              height: 36,
              flexShrink: 0,
              borderRadius: '50%',
              border: 'none',
              background: alpha(colors.text === 'var(--text-on-action)' ? 'var(--text-on-action)' : 'var(--text-heading)', 15),
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <AppIcon name={playing ? 'pause' : 'playArrow'} px={20} color={colors.text} />
          </button>
          <div style={{ width: 8, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <Waveform
              samples={waveform}
              progress={progress}
              activeColor={colors.text}
              inactiveColor={colors.muted}
              height={28}
            />
          </div>
        </div>
        <div style={{ height: 4 }} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
          <span style={{ fontSize: 11, color: colors.muted }}>
            {formatClipDuration(displayed)}
          </span>
          {mine && (
            <AppIcon
              name={TICK_ICONS[message.status]}
              px={14}
              color={tickColor(mine, message.status, colors.muted, 90)}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Image ──────────────────────────────────────────────────────────────────

/**
 * `aspectRatio = width / height`, defaulting to 1.0 when either is missing **or
 * the height is not positive**, then clamped to 0.5–2.0. The image is drawn with
 * `BoxFit.cover`, so the clamp CROPS extreme images rather than letterboxing
 * them — a 5:1 panorama is shown at 2:1 and loses its edges.
 */
function aspectOf(message: ChatMessage): number {
  const width = Number(message.mediaMetadata?.width ?? 0);
  const height = Number(message.mediaMetadata?.height ?? 0);
  if (!width || !height || height <= 0) return 1.0;
  return Math.min(Math.max(width / height, 0.5), 2.0);
}

export function ImageBubble({
  message,
  mine,
  onOpen,
}: {
  message: ChatMessage;
  mine: boolean;
  onOpen: () => void;
}) {
  const colors = colorsFor(mine, 100);
  const [downloading, setDownloading] = useState(false);
  const [local, setLocal] = useState<string | null>(
    message.mediaUrl && message.mediaUrl.startsWith('data:') ? message.mediaUrl : null,
  );
  const [failed, setFailed] = useState(false);

  if (message.mediaUrl === null && message.status !== 'sending') {
    return (
      <UnavailableBubble
        text="Media unavailable"
        timestamp={message.timestamp}
        width={mediaWidth}
        withTime
        mine={mine}
      />
    );
  }

  function download() {
    if (local || downloading) return;
    setDownloading(true);
    setFailed(false);
    // No storage layer to talk to — see the file header.
    setTimeout(() => {
      setDownloading(false);
      setFailed(true);
    }, 700);
  }

  return (
    <div style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
      <div
        style={{
          width: mediaWidth,
          marginBottom: 6,
          borderRadius: tailRadius(mine),
          boxShadow: BUBBLE_SHADOW,
          overflow: 'hidden',
        }}
      >
        <div
          role="button"
          tabIndex={0}
          onClick={local ? onOpen : download}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              if (local) onOpen();
              else download();
            }
          }}
          style={{
            position: 'relative',
            width: '100%',
            aspectRatio: String(aspectOf(message)),
            background: 'var(--surface-disabled)',
            cursor: local ? 'zoom-in' : 'pointer',
          }}
        >
          {local ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={local}
              alt={String(message.mediaMetadata?.file_name ?? 'Photo')}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          ) : downloading ? (
            <div style={centreStyle}>
              <span
                aria-label="Downloading"
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  border: '3px solid color-mix(in srgb, var(--text-body-light) 30%, transparent)',
                  borderTopColor: 'var(--text-body-light)',
                  animation: 'spin 800ms linear infinite',
                }}
              />
            </div>
          ) : failed ? (
            <div style={centreStyle}>
              <AppIcon name="refresh" px={28} color="var(--text-body-light)" />
              <span style={{ fontSize: 11, color: 'var(--text-body-light)', marginTop: 4 }}>
                Tap to retry
              </span>
            </div>
          ) : (
            <div style={centreStyle}>
              <AppIcon name="download" px={32} color="var(--text-body-light)" />
            </div>
          )}

          <div
            style={{
              position: 'absolute',
              bottom: 6,
              right: 8,
              padding: '2px 6px',
              background: 'rgba(0, 0, 0, 0.5)',
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <span style={{ fontSize: 11, color: '#ffffff' }}>
              {formatClock(message.timestamp)}
            </span>
            {mine && (
              <AppIcon
                name={TICK_ICONS[message.status]}
                px={14}
                /*
                  The image bubble is the one place the tick ignores `isMine`
                  entirely — the pill behind it is always black, so both
                  branches are white.
                */
                color={message.status === 'read' ? '#ffffff' : 'rgba(255,255,255,0.7)'}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const centreStyle: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
};

// ─── File ───────────────────────────────────────────────────────────────────

/**
 * `_formatSize` — note the three different rounding rules, which are the
 * source's: bytes are truncated with `toInt()` and carry no decimal, KB round to
 * a whole number, MB keeps one decimal. A size that is missing entirely renders
 * as an empty string, which then drops out of the `·` join.
 */
function formatSize(bytes: unknown): string {
  if (typeof bytes !== 'number' || !Number.isFinite(bytes)) return '';
  if (bytes < 1024) return `${Math.trunc(bytes)} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

/**
 * `_fileExtension` — a naive `split('.')` on the last segment, uppercased.
 * `archive.tar.gz` gives `GZ`, `.env` gives `ENV`, `v1.2` gives `2`, and a name
 * with no dot gives nothing at all. Kept because it is what renders.
 */
function extensionOf(fileName: string): string {
  const parts = fileName.split('.');
  if (parts.length < 2) return '';
  return parts[parts.length - 1].toUpperCase();
}

export function FileBubble({ message, mine }: { message: ChatMessage; mine: boolean }) {
  const colors = colorsFor(mine, 70);
  const [opening, setOpening] = useState(false);
  const [hasLocal, setHasLocal] = useState(false);

  if (message.mediaUrl === null && message.status !== 'sending') {
    return (
      <UnavailableBubble
        text="File unavailable"
        timestamp={message.timestamp}
        // The file variant is 0.75 where audio and image are 0.70.
        width="calc(var(--phone-width) * 0.75)"
        withTime
        mine={mine}
      />
    );
  }

  const fileName = String(message.mediaMetadata?.file_name ?? 'File');
  const size = formatSize(message.mediaMetadata?.file_size);
  const extension = extensionOf(fileName);
  const subtitle = [size, extension].filter((part) => part !== '').join(' · ');

  function open() {
    if (opening || hasLocal) return;
    setOpening(true);
    // `OpenFilex.open` has no web counterpart; the download state transition is
    // the part that is worth reviewing. See the file header.
    setTimeout(() => {
      setOpening(false);
      setHasLocal(true);
    }, 700);
  }

  return (
    <div style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
      <div
        role="button"
        tabIndex={0}
        onClick={open}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            open();
          }
        }}
        style={{
          width: 'calc(var(--phone-width) * 0.75)',
          marginBottom: 6,
          padding: '10px 14px',
          background: colors.bubble,
          borderRadius: tailRadius(mine),
          boxShadow: BUBBLE_SHADOW,
          display: 'flex',
          alignItems: 'center',
          cursor: hasLocal ? 'default' : 'pointer',
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            flexShrink: 0,
            borderRadius: 8,
            background: alpha(
              colors.text === 'var(--text-on-action)' ? 'var(--text-on-action)' : 'var(--text-heading)',
              12,
            ),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AppIcon name="insertDriveFile" px={22} color={colors.text} />
        </div>
        <div style={{ width: 10, flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          <span
            style={{
              color: colors.text,
              fontSize: 14,
              fontWeight: 500,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {fileName}
          </span>
          {subtitle !== '' && (
            <span style={{ color: colors.muted, fontSize: 12 }}>{subtitle}</span>
          )}
        </div>
        <div style={{ width: 8, flexShrink: 0 }} />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            flexShrink: 0,
          }}
        >
          {/*
            The trailing slot, in the source's precedence order: uploading →
            opening → failed → already local → download. Every branch reserves
            the same 22px so the row never reflows.
          */}
          <div style={{ width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {opening ? (
              <span
                aria-label="Opening"
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  border: `2px solid ${colors.text}`,
                  borderTopColor: 'transparent',
                  animation: 'spin 800ms linear infinite',
                }}
              />
            ) : hasLocal ? (
              // A deliberate blank spacer, not an oversight: the source leaves
              // the slot empty once the file is on device.
              <span />
            ) : (
              <AppIcon name="download" px={22} color={colors.text} />
            )}
          </div>
          <div style={{ height: 4 }} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ color: colors.muted, fontSize: 11 }}>
              {formatClock(message.timestamp)}
            </span>
            {mine && (
              <AppIcon
                name={TICK_ICONS[message.status]}
                px={14}
                color={tickColor(mine, message.status, colors.muted, 90)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
