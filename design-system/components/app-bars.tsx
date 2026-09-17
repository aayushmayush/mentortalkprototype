'use client';

import type { ReactNode } from 'react';
import { AppIconButton } from './app-icon-button';

/**
 * The three app bars — ports of app_bar/app_top_bar.dart,
 * app_bar/app_primary_bar.dart, app_bar/app_brand_bar.dart, and app_brand.dart.
 *
 * All three are 64 tall with NO background of their own: they sit on whatever
 * surface the page paints, which is why `backgroundColor: transparent` is
 * spelled out in each of the Flutter versions.
 *
 *   AppTopBar     8px horizontal padding, back button (icon-button sized 48/24),
 *                 title in titleLarge w600 / text.heading
 *   AppPrimaryBar 16px title spacing (page padding), title in headlineSmall
 *                 w700 / text.heading, actions flush right with no padding
 *   AppBrandBar   same metrics, but the title is the logo lockup
 *
 * The home shell swaps between them per tab — that is why they are separate
 * components rather than one with a variant prop: their type scales differ.
 */

const BAR_HEIGHT = 64;

export function AppTopBar({
  title,
  onBack,
  actions,
  className,
}: {
  title?: string;
  onBack?: () => void;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{
        height: BAR_HEIGHT,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        padding: '0 8px',
        background: 'transparent',
      }}
    >
      {onBack ? <AppIconButton name="arrowBack" onClick={onBack} label="Back" /> : null}

      {title ? (
        <span
          className="type-title-lg type-emphasis-semibold"
          style={{
            marginLeft: 8,
            color: 'var(--text-heading)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {title}
        </span>
      ) : null}

      <span style={{ flex: 1 }} />
      {actions}
    </div>
  );
}

export function AppPrimaryBar({
  title,
  actions,
  className,
}: {
  title: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{
        height: BAR_HEIGHT,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        paddingLeft: 16,
        background: 'transparent',
      }}
    >
      <span
        className="type-headline-sm type-emphasis-bold"
        style={{
          flex: 1,
          minWidth: 0,
          color: 'var(--text-heading)',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {title}
      </span>
      {actions}
    </div>
  );
}

/**
 * AppBrand — the logo lockup: a 24px SVG mark plus the wordmark in
 * headlineSmall w600 / text.action with a hand-set -1px tracking (tighter than
 * the type scale's own -0.46, and set literally in the source).
 */
export function AppBrand({
  label = 'MentorTalk',
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/assets/logo/appbar_logo.svg" alt="" width={24} height={24} />
      <span
        className="type-headline-sm type-emphasis-semibold"
        style={{
          color: 'var(--text-action)',
          letterSpacing: '-1px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
      </span>
    </div>
  );
}

export function AppBrandBar({
  label = 'MentorTalk',
  actions,
  className,
}: {
  label?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{
        height: BAR_HEIGHT,
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        paddingLeft: 16,
        background: 'transparent',
      }}
    >
      <AppBrand label={label} />
      <span style={{ flex: 1 }} />
      {actions}
    </div>
  );
}
