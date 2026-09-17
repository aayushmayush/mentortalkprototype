'use client';

import { useEffect, useRef, useState } from 'react';
import { AppAvatar, AppIcon, type IconName } from '@/design-system';
import { copy, fill } from '@/lib/copy';
import { formatClock } from '@/lib/session/machine';
import { useSessionClock } from '@/lib/state/session-provider';

/**
 * AudioCallOverlay + VideoCallOverlay — ports of
 * `core/lib/session/ui/call/{audio,video}_call_overlay.dart`.
 *
 * ── There is no WebRTC here, so the two feeds are stand-ins ─────────────────
 *
 * The real overlays render `AgoraVideoView`s. A browser prototype has no Agora
 * engine, so the remote feed is the same `_WaitingView` the real overlay shows
 * before the remote user joins, and the local PiP is a plain black tile with the
 * camera icon. Everything around those two rectangles — geometry, controls,
 * colours, the auto-hide, the drag, the strings — is transcribed.
 *
 * ── Both overlays contain a real bug, and both are reproduced ───────────────
 *
 * 1. **The video countdown never turns red.** Both overlays compute
 *    `_isTimerWarning => _remainingSeconds <= 120`, and the audio overlay uses
 *    it in the status colour. The video overlay's top bar does not — it only
 *    ever checks for `reconnecting`:
 *
 *        color: status == reconnecting ? #FBBF24 : Colors.white70
 *
 *    So in video the timer stays grey through the last two minutes. Kept.
 *
 * 2. **The audio speaker button highlights when the speaker is OFF.**
 *    `isActive: !_callState.isSpeakerOn` — inverted against every other control
 *    on the same row, which all pass their own `true` state. Kept.
 *
 * ── A third thing that is NOT a bug, though it looks like one ───────────────
 *
 * The video overlay's `_VideoControl` gives the end button
 * `isDestructive: true` and therefore a red circle — but it is 52×52 like the
 * others, whereas the audio overlay's end button is a 72×72 red circle with a
 * glow, standing alone below the control row. Two different end-call designs in
 * two files that otherwise share everything.
 *
 * ── Mute / camera / speaker state lives HERE ────────────────────────────────
 *
 * In production it lives in `CallService`, a singleton the overlay subscribes
 * to. A prototype has one call at a time, so it lives in the overlay's own
 * state — the observable behaviour is identical.
 */

export type CallOverlayProps = {
  onMinimize: () => void;
  onEndCall: () => void;
  onSwitchToVideo?: () => void;
  onSwitchToAudio?: () => void;
};

// ─── Audio ──────────────────────────────────────────────────────────────────

export function AudioCallOverlay({
  mentorName,
  mentorAvatar,
  remoteJoined,
  onMinimize,
  onEndCall,
  onSwitchToVideo,
}: {
  mentorName: string;
  mentorAvatar: string | null;
  remoteJoined: boolean;
} & CallOverlayProps) {
  const { remainingSeconds } = useSessionClock();
  const [muted, setMuted] = useState(false);
  const [speakerOn, setSpeakerOn] = useState(false);

  const isTimerWarning = remainingSeconds <= 120;

  const statusText = !remoteJoined
    ? fill(copy.waitingForUser, { userName: mentorName })
    : formatClock(remainingSeconds);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 70,
        pointerEvents: 'auto',
        background: 'var(--surface-action)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* ── Top bar with minimize — the only place it appears in audio ── */}
      <div
        style={{
          padding: '4px',
          paddingTop: 54 + 4,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        <button
          type="button"
          aria-label="Minimize"
          onClick={onMinimize}
          style={{
            background: 'none',
            border: 'none',
            padding: 8,
            cursor: 'pointer',
            display: 'flex',
          }}
        >
          <AppIcon name="expandMore" px={32} color="rgba(255,255,255,0.7)" />
        </button>
      </div>

      <div style={{ flex: 2 }} />

      <div style={{ textAlign: 'center' }}>
        <span
          style={{
            color: 'rgba(255,255,255,0.6)',
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          {copy.audioCallLabel}
        </span>
      </div>

      <div style={{ height: 40 }} />

      {/* ── Avatar ── */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: '50%',
            background: 'var(--surface-action-hover)',
            border: `3px solid ${
              remoteJoined ? 'rgba(34,197,94,0.6)' : 'rgba(255,255,255,0.2)'
            }`,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {mentorAvatar ? (
            <AppAvatar imageUrl={mentorAvatar} name={mentorName} size="lg" />
          ) : (
            <span
              style={{ color: '#fff', fontSize: 40, fontWeight: 600 }}
            >
              {initialsOf(mentorName)}
            </span>
          )}
        </div>
      </div>

      <div style={{ height: 24 }} />

      <div style={{ textAlign: 'center' }}>
        <span
          style={{
            color: '#fff',
            fontSize: 28,
            fontWeight: 700,
            letterSpacing: '-0.5px',
          }}
        >
          {mentorName}
        </span>
      </div>

      <div style={{ height: 8 }} />

      <div style={{ textAlign: 'center' }}>
        <span
          style={{
            fontSize: 16,
            // The audio overlay's colour branch — `reconnecting` first, then
            // the warning, then the default. There is no reconnecting state in
            // this prototype's fake Agora, so the branch is two-valued here.
            color:
              isTimerWarning && remoteJoined
                ? '#EF4444'
                : 'rgba(255,255,255,0.6)',
          }}
        >
          {statusText}
        </span>
      </div>

      <div style={{ flex: 3 }} />

      {/* ── Controls ── */}
      <div
        style={{
          padding: '0 40px',
          display: 'flex',
          justifyContent: 'space-evenly',
          alignItems: 'flex-start',
        }}
      >
        <CallControl
          size={56}
          iconSize={26}
          labelSize={12}
          icon={muted ? 'micOff' : 'mic'}
          label={muted ? copy.unmute : copy.mute}
          isActive={muted}
          onTap={() => setMuted((v) => !v)}
        />

        {/*
          `isActive: !_callState.isSpeakerOn` — the source's own inversion, and
          the reason this button lights up exactly when the speaker is off.
        */}
        <CallControl
          size={56}
          iconSize={26}
          labelSize={12}
          icon={speakerOn ? 'speaker' : 'speakerOff'}
          label={speakerOn ? copy.speaker : copy.earpiece}
          isActive={!speakerOn}
          onTap={() => setSpeakerOn((v) => !v)}
        />

        {onSwitchToVideo ? (
          <CallControl
            size={56}
            iconSize={26}
            labelSize={12}
            icon="videoCam"
            label={copy.videoLabel}
            onTap={onSwitchToVideo}
          />
        ) : null}
      </div>

      <div style={{ height: 48 }} />

      {/* ── End call — 72×72 with a glow, alone below the row ── */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button
          type="button"
          aria-label={copy.endCall}
          onClick={onEndCall}
          style={{
            width: 72,
            height: 72,
            borderRadius: '50%',
            background: '#EF4444',
            border: 'none',
            boxShadow: '0 0 20px 2px rgba(239,68,68,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <AppIcon name="call" px={32} color="#fff" />
        </button>
      </div>

      <div style={{ height: 12 }} />

      <div style={{ textAlign: 'center' }}>
        <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: 500 }}>
          {copy.endCall}
        </span>
      </div>

      <div style={{ flex: 2 }} />
    </div>
  );
}

// ─── Video ──────────────────────────────────────────────────────────────────

export function VideoCallOverlay({
  mentorName,
  mentorAvatar,
  remoteJoined,
  onMinimize,
  onEndCall,
  onSwitchToAudio,
}: {
  mentorName: string;
  mentorAvatar: string | null;
  remoteJoined: boolean;
} & CallOverlayProps) {
  const { remainingSeconds } = useSessionClock();
  const [muted, setMuted] = useState(false);
  const [cameraOff, setCameraOff] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);

  /** `_pipTop = 60`, `_pipRight = 16` — the source's own starting corner. */
  const [pip, setPip] = useState({ top: 60, right: 16 });
  const dragRef = useRef<{ x: number; y: number; top: number; right: number } | null>(
    null,
  );
  const containerRef = useRef<HTMLDivElement | null>(null);

  /**
   * `_startHideControlsTimer` — five seconds, and only once the remote user has
   * joined. Before that the controls stay up, because there is nothing to look
   * at behind them.
   */
  useEffect(() => {
    if (!controlsVisible || !remoteJoined) return;
    const t = setTimeout(() => setControlsVisible(false), 5000);
    return () => clearTimeout(t);
  }, [controlsVisible, remoteJoined]);

  const statusText = !remoteJoined
    ? fill(copy.waitingForUser, { userName: mentorName })
    : formatClock(remainingSeconds);

  return (
    <div
      ref={containerRef}
      onClick={() => setControlsVisible((v) => !v)}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 70,
        pointerEvents: 'auto',
        background: '#000',
        overflow: 'hidden',
      }}
    >
      {/* ── Remote feed — full screen, or the waiting view ── */}
      {remoteJoined ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: '#0a0a0a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Stand-in for `AgoraVideoView.remote`. */}
          <AppIcon name="videoCam" px={48} color="rgba(255,255,255,0.15)" />
        </div>
      ) : (
        <WaitingView name={mentorName} avatar={mentorAvatar} status={statusText} />
      )}

      {/* ── Local PiP — draggable, 120×160, radius 12 ── */}
      {!cameraOff ? (
        <div
          onPointerDown={(e) => {
            e.stopPropagation();
            dragRef.current = {
              x: e.clientX,
              y: e.clientY,
              top: pip.top,
              right: pip.right,
            };
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            const start = dragRef.current;
            const host = containerRef.current;
            if (!start || !host) return;
            e.stopPropagation();
            const rect = host.getBoundingClientRect();

            // `_pipTop += delta.dy; _pipRight -= delta.dx` — the horizontal
            // delta is inverted because the anchor is `right`, not `left`.
            const top = clamp(
              start.top + (e.clientY - start.y),
              // `padding.top + 8` in the source; the prototype's status bar is
              // 54, and the shell adds no extra inset.
              54 + 8,
              rect.height - 200,
            );
            const right = clamp(
              start.right - (e.clientX - start.x),
              8,
              rect.width - 128,
            );
            setPip({ top, right });
          }}
          onPointerUp={() => {
            dragRef.current = null;
          }}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: pip.top,
            right: pip.right,
            width: 120,
            height: 160,
            borderRadius: 12,
            border: '1.5px solid rgba(255,255,255,0.3)',
            background: '#111',
            overflow: 'hidden',
            cursor: 'grab',
            touchAction: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Stand-in for the local `AgoraVideoView`. */}
          <AppIcon name="person" px={32} color="rgba(255,255,255,0.2)" />
        </div>
      ) : null}

      {/* ── Top bar — name + status over a top-down black gradient ── */}
      {controlsVisible ? (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            background:
              'linear-gradient(to bottom, rgba(0,0,0,0.7), rgba(0,0,0,0))',
            paddingTop: 54 + 12,
            paddingBottom: 12,
            paddingLeft: 20,
            paddingRight: 20,
          }}
        >
          <span
            style={{
              display: 'block',
              color: '#fff',
              fontSize: 18,
              fontWeight: 600,
            }}
          >
            {mentorName}
          </span>
          <div style={{ height: 2 }} />
          <span
            style={{
              display: 'block',
              // THE VIDEO BUG: `_isTimerWarning` exists but is never consulted
              // here — only `reconnecting`. The countdown stays grey.
              color: 'rgba(255,255,255,0.7)',
              fontSize: 14,
            }}
          >
            {statusText}
          </span>
        </div>
      ) : null}

      {/* ── Bottom controls — 52×52, over a bottom-up gradient ── */}
      {controlsVisible ? (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            background:
              'linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0))',
            paddingTop: 40,
            paddingBottom: 24,
            paddingLeft: 24,
            paddingRight: 24,
            display: 'flex',
            justifyContent: 'space-evenly',
            alignItems: 'flex-start',
          }}
        >
          <CallControl
            size={52}
            iconSize={24}
            labelSize={11}
            icon={muted ? 'micOff' : 'mic'}
            label={muted ? copy.unmute : copy.mute}
            isActive={muted}
            onTap={() => setMuted((v) => !v)}
          />

          <CallControl
            size={52}
            iconSize={24}
            labelSize={11}
            icon={cameraOff ? 'videoCamOff' : 'videoCam'}
            label={cameraOff ? copy.cameraOn : copy.cameraOff}
            isActive={cameraOff}
            onTap={() => setCameraOff((v) => !v)}
          />

          <CallControl
            size={52}
            iconSize={24}
            labelSize={11}
            icon="refresh"
            label={copy.flipCamera}
            // `switchCamera()` flips between front and back. The prototype's
            // stand-in has no camera, so the tap is a no-op with the same
            // haptic-only feedback the real one gives when there is one camera.
            onTap={() => undefined}
          />

          <CallControl
            size={52}
            iconSize={24}
            labelSize={11}
            icon="call"
            label={copy.endButtonLabel}
            destructive
            onTap={onEndCall}
          />

          {onSwitchToAudio ? null : null}
        </div>
      ) : null}

      {/* ── Minimize — always visible, never auto-hidden ── */}
      <button
        type="button"
        aria-label="Minimize"
        onClick={(e) => {
          e.stopPropagation();
          onMinimize();
        }}
        style={{
          position: 'absolute',
          top: 54 + 8,
          left: 8,
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: 'rgba(0,0,0,0.4)',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <AppIcon name="expandMore" px={28} color="#fff" />
      </button>
    </div>
  );
}

// ─── Shared pieces ──────────────────────────────────────────────────────────

/**
 * `_WaitingView` — the 100×100 avatar, name and status shown before the remote
 * user joins. It is also what stands in for the remote feed here, which is why
 * it is not hidden behind a flag.
 */
function WaitingView({
  name,
  avatar,
  status,
}: {
  name: string;
  avatar: string | null;
  status: string;
}) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: 'var(--surface-action)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div
          style={{
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: 'var(--surface-action-hover)',
            border: '2px solid rgba(255,255,255,0.2)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {avatar ? (
            <AppAvatar imageUrl={avatar} name={name} size="lg" />
          ) : (
            <span style={{ color: '#fff', fontSize: 36, fontWeight: 600 }}>
              {name.length > 0 ? name[0].toUpperCase() : '?'}
            </span>
          )}
        </div>

        <div style={{ height: 20 }} />

        <span style={{ color: '#fff', fontSize: 22, fontWeight: 600 }}>{name}</span>

        <div style={{ height: 8 }} />

        <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15 }}>{status}</span>
      </div>
    </div>
  );
}

/**
 * One control button. The audio overlay's are 56/26/12 and the video overlay's
 * are 52/24/11 — the only difference between the two `_CallControl` /
 * `_VideoControl` classes, so one component takes the numbers as props.
 *
 * The background is the source's three-way branch: destructive red, then
 * `isActive` at 25% white, then 10% white.
 */
function CallControl({
  icon,
  label,
  isActive = false,
  destructive = false,
  size,
  iconSize,
  labelSize,
  onTap,
}: {
  icon: IconName;
  label: string;
  isActive?: boolean;
  destructive?: boolean;
  size: number;
  iconSize: number;
  labelSize: number;
  onTap: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onTap}
      style={{
        background: 'none',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: destructive
            ? '#EF4444'
            : isActive
              ? 'rgba(255,255,255,0.25)'
              : 'rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <AppIcon name={icon} px={iconSize} color="#fff" />
      </div>
      <div style={{ height: 8 }} />
      <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: labelSize, fontWeight: 500 }}>
        {label}
      </span>
    </button>
  );
}

/** `_initials` — first letters of the first two words, else the first two. */
function initialsOf(name: string): string {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return (parts[0] ?? '').substring(0, 2).toUpperCase();
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
