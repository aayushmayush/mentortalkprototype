'use client';

import type { ReactNode } from 'react';
import { PhoneFrame } from './phone-frame';
import { ScreenIndex } from './screen-index';
import { ChromeControls } from './chrome-controls';

/**
 * PrototypeShell — the browser page: chrome controls, screen index, phone.
 *
 * This lives in the ROOT LAYOUT, which matters for a reason worth stating: the
 * App Router does not remount a layout on client-side navigation, so the phone,
 * its theme and (from T3) a running session all survive route changes exactly
 * as they do in the Flutter app. Putting the frame in the layout rather than in
 * each page is what makes real URLs viable here.
 */
export function PrototypeShell({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'stretch',
        background: 'var(--chrome-bg)',
      }}
    >
      <ScreenIndex />

      <main
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 32,
          position: 'relative',
        }}
      >
        <ChromeControls />
        <PhoneFrame>{children}</PhoneFrame>
      </main>
    </div>
  );
}
