'use client';

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '@/lib/state/theme-provider';
import { StatusBar } from './status-bar';
import { SnackbarHost } from './snackbar-host';

/**
 * PhoneFrame — the device the whole prototype lives inside.
 *
 * THE LOAD-BEARING PART IS THE OVERLAY LAYER. Sheets, modals, the call overlay
 * and the session banner are all `position: absolute` against the phone screen,
 * and they must not scroll with the page behind them. The tempting mistake is
 * to render them inside the page — but the page lives inside the scroll
 * container, and a scroll container clips and translates absolutely-positioned
 * descendants that sit inside it, even when their containing block is an
 * ancestor of the scroller. An overlay rendered inside a page would slide away
 * as you scrolled and be clipped at the edges.
 *
 * So the frame owns a dedicated layer as a SIBLING of the scroller, and pages
 * reach it through <PhoneOverlay>, which portals into it. The layer is
 * `pointer-events: none` so an empty layer never eats taps on the app; the
 * overlays themselves re-enable pointer events on their own roots.
 *
 * Two more deliberate choices:
 *
 * - The screen element is `position: relative` and `overflow: hidden`, so
 *   everything positioned against it is clipped to the rounded device corners.
 * - The interior gets `isolation: isolate`, giving the device its own stacking
 *   context. Without it, a z-indexed element inside the phone could rise above
 *   the prototype chrome outside it.
 */

const PhoneOverlayContext = createContext<HTMLElement | null>(null);

/** The layer overlays portal into. Null on the server and before mount. */
export function usePhoneOverlay(): HTMLElement | null {
  return useContext(PhoneOverlayContext);
}

/**
 * Renders its children into the frame's overlay layer. Renders nothing until
 * the layer exists — which is safe, because every overlay starts closed and
 * only opens in response to a tap.
 */
export function PhoneOverlay({ children }: { children: ReactNode }) {
  const layer = usePhoneOverlay();
  if (!layer) return null;
  return createPortal(children, layer);
}

const PHONE_WIDTH = 390;
const PHONE_HEIGHT = 844;
const BEZEL = 12;

export type PhoneFrameProps = {
  children: ReactNode;
  className?: string;
};

export function PhoneFrame({ children, className }: PhoneFrameProps) {
  const { resolved } = useTheme();
  const [overlayLayer, setOverlayLayer] = useState<HTMLDivElement | null>(null);

  return (
    <div
      className={className}
      style={{
        width: PHONE_WIDTH + BEZEL * 2,
        height: PHONE_HEIGHT + BEZEL * 2,
        flexShrink: 0,
        padding: BEZEL,
        borderRadius: 54,
        background: 'var(--chrome-bezel)',
        boxShadow: '0 0 0 1px var(--chrome-bezel-edge), 0 24px 60px rgba(0,0,0,0.35)',
      }}
    >
      <div
        data-theme={resolved}
        style={{
          position: 'relative',
          width: PHONE_WIDTH,
          height: PHONE_HEIGHT,
          borderRadius: 42,
          overflow: 'hidden',
          isolation: 'isolate',
          background: 'var(--surface-page)',
          color: 'var(--text-body)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* The provider wraps BOTH the scroll container and the overlay layer,
            so page content rendered inside the scroller can still reach the
            layer. Keeping them under one provider is what stops the two from
            drifting apart. */}
        <PhoneOverlayContext.Provider value={overlayLayer}>
          <StatusBar />

          <div
            className="no-scrollbar"
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              overflowX: 'hidden',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {children}
          </div>

          <div
            ref={setOverlayLayer}
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 50,
              pointerEvents: 'none',
            }}
          />

          {/* Deliberately BELOW the overlay layer, so a sheet or modal covers
              the message — which is what Flutter does. See snackbar-host.tsx. */}
          <SnackbarHost />
        </PhoneOverlayContext.Provider>
      </div>
    </div>
  );
}
