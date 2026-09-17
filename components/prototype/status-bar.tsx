'use client';

import { useEffect, useState } from 'react';
import { AppIcon } from '@/design-system';

/**
 * StatusBar — the iOS status strip at the top of the phone.
 *
 * The real app sits under the OS status bar and pads for it with SafeArea; the
 * prototype has to draw one, or the device reads as a web page in a rounded
 * box. Its background is `surface.page`, which is what shows through SafeArea
 * in Flutter, so app bars above it line up.
 *
 * The clock is live and re-renders once a minute — deliberately NOT once a
 * second. The prototype is reviewed for hours at a time and a ticking seconds
 * display is a distraction, not a fidelity win.
 */
export const STATUS_BAR_HEIGHT = 54;

export function StatusBar() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), 10_000);
    return () => window.clearInterval(id);
  }, []);

  const time = now
    ? `${now.getHours() % 12 === 0 ? 12 : now.getHours() % 12}:${String(
        now.getMinutes(),
      ).padStart(2, '0')}`
    : '';

  return (
    <div
      style={{
        position: 'relative',
        height: STATUS_BAR_HEIGHT,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px 0 32px',
        background: 'var(--surface-page)',
        color: 'var(--text-heading)',
      }}
    >
      {/* minWidth keeps the pill centred when the clock is a single character. */}
      <span
        className="type-label-lg type-emphasis-semibold"
        style={{ color: 'var(--text-heading)', minWidth: 40 }}
      >
        {time}
      </span>

      {/* The dynamic island. Purely decorative — but its absence is the first
          thing that makes a phone mock read as fake. */}
      <span
        aria-hidden
        style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 118,
          height: 34,
          borderRadius: 20,
          background: 'var(--chrome-bezel)',
        }}
      />

      <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
        <AppIcon name="signalCellular" size="xs" color="var(--text-heading)" />
        <AppIcon name="wifi" size="xs" color="var(--text-heading)" />
        <AppIcon name="batteryFull" size="xs" color="var(--text-heading)" />
      </span>
    </div>
  );
}
