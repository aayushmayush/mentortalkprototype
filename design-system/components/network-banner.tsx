'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * NetworkBanner — port of design_system/lib/core/components/network_banner.dart
 *
 * A strip pinned to the BOTTOM of whatever it wraps (not the top), shown in two
 * situations with different colours:
 *
 *   offline            `border.primary` (dark grey), "No internet connection"
 *   just came back     `border.success`  (green),      "Back online" — for 2s
 *
 * The "Back online" strip only appears on a genuine offline→online transition,
 * so a page that mounts already-connected shows nothing. That is what the
 * `wasConnected` ref tracks; without it, every mount after a reconnect would
 * flash the green strip.
 *
 * In the prototype the connection is a simulation — `SessionProvider` or the
 * screen index toggles it — so this component is driven purely by its prop.
 */
export type NetworkBannerProps = {
  isConnected: boolean;
  children: React.ReactNode;
  className?: string;
};

export function NetworkBanner({ isConnected, children, className }: NetworkBannerProps) {
  const [showBackOnline, setShowBackOnline] = useState(false);
  const wasConnected = useRef(isConnected);

  useEffect(() => {
    const was = wasConnected.current;
    wasConnected.current = isConnected;

    if (!was && isConnected) {
      setShowBackOnline(true);
      const timer = window.setTimeout(() => setShowBackOnline(false), 2000);
      return () => window.clearTimeout(timer);
    }

    if (was && !isConnected) setShowBackOnline(false);
  }, [isConnected]);

  const visible = !isConnected || showBackOnline;

  return (
    <div
      className={className}
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}
    >
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>

      {visible ? (
        <div
          className="type-body-md type-emphasis-semibold"
          style={{
            flexShrink: 0,
            width: '100%',
            padding: '6px 0',
            textAlign: 'center',
            color: 'var(--text-on-action)',
            background: isConnected ? 'var(--border-success)' : 'var(--border-primary)',
          }}
        >
          {isConnected ? 'Back online' : 'No internet connection'}
        </div>
      ) : null}
    </div>
  );
}
