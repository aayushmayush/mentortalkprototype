'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { AppIcon } from '@/design-system';
import { ROUTES, ROUTE_GROUPS, type AppRoute } from '@/lib/routes';

/**
 * ScreenIndex — the review tool beside the phone.
 *
 * This is prototype furniture, not app UI, so it uses the chrome tokens rather
 * than the design system's colours and does not theme with the phone.
 *
 * COLLAPSED BY DEFAULT, per the agreed design: the phone should be the thing
 * you see, and the index is a reference you pull out when you want to jump.
 *
 * Routes that are not built yet render as disabled rows rather than links, so
 * clicking through the index can never land on a 404 — which is what makes
 * "every index entry resolves" a check you can actually perform.
 *
 * `useSearchParams` forces this subtree to be client-rendered during a static
 * build, so the caller wraps it in Suspense. That is a Next requirement, not a
 * design choice.
 */
function IndexBody({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const current = query ? `${pathname}?${query}` : pathname;

  const builtCount = ROUTES.filter((r) => r.built).length;

  if (collapsed) {
    return (
      <div
        style={{
          width: 56,
          flexShrink: 0,
          borderRight: '1px solid var(--chrome-border)',
          background: 'var(--chrome-bg-raised)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: 16,
          gap: 12,
        }}
      >
        <button
          type="button"
          onClick={onToggle}
          aria-label="Show screen index"
          title="Show screen index"
          style={{
            width: 36,
            height: 36,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 10,
            color: 'var(--chrome-text)',
          }}
        >
          <AppIcon name="menu" size="sm" color="var(--chrome-text)" />
        </button>

        <span
          className="type-label-sm"
          style={{
            color: 'var(--chrome-text-faint)',
            writingMode: 'vertical-rl',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          {builtCount} {builtCount === 1 ? 'screen' : 'screens'}
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        width: 268,
        flexShrink: 0,
        borderRight: '1px solid var(--chrome-border)',
        background: 'var(--chrome-bg-raised)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '14px 12px 14px 16px',
          borderBottom: '1px solid var(--chrome-border)',
          flexShrink: 0,
        }}
      >
        <span
          className="type-label-lg type-emphasis-bold"
          style={{ flex: 1, color: 'var(--chrome-text)' }}
        >
          Screens
        </span>
        <span className="type-label-sm" style={{ color: 'var(--chrome-text-faint)' }}>
          {builtCount} / {ROUTES.length}
        </span>
        <button
          type="button"
          onClick={onToggle}
          aria-label="Hide screen index"
          title="Hide screen index"
          style={{
            width: 28,
            height: 28,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 8,
            color: 'var(--chrome-text-muted)',
          }}
        >
          <AppIcon name="chevronLeft" size="sm" color="var(--chrome-text-muted)" />
        </button>
      </div>

      <nav className="thin-scrollbar" style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: '8px 8px 24px' }}>
        {ROUTE_GROUPS.map((group) => {
          const routes = ROUTES.filter((r) => r.group === group);
          if (routes.length === 0) return null;

          return (
            <div key={group} style={{ marginTop: 12 }}>
              <div
                className="type-label-sm"
                style={{
                  padding: '4px 8px',
                  color: 'var(--chrome-text-faint)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                {group}
              </div>

              {routes.map((route) => (
                <IndexRow key={route.href} route={route} active={isActive(route, current, pathname)} />
              ))}
            </div>
          );
        })}
      </nav>
    </div>
  );
}

function isActive(route: AppRoute, current: string, pathname: string): boolean {
  if (route.href.includes('?')) return route.href === current;
  if (route.href === '/') return pathname === '/';
  // The mentor profile is one table row for every mentor id.
  if (route.href.includes('[')) {
    const prefix = route.href.slice(0, route.href.indexOf('['));
    return pathname.startsWith(prefix) && pathname.length > prefix.length;
  }
  return pathname === route.href;
}

function IndexRow({ route, active }: { route: AppRoute; active: boolean }) {
  const style: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '7px 8px',
    borderRadius: 8,
    marginBottom: 1,
    background: active ? 'var(--chrome-selected)' : undefined,
  };

  const label = (
    <>
      <span
        className="type-body-md"
        style={{
          flex: 1,
          minWidth: 0,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          color: active
            ? 'var(--chrome-accent)'
            : route.built
              ? 'var(--chrome-text)'
              : 'var(--chrome-text-faint)',
          fontWeight: active ? 600 : 500,
        }}
      >
        {route.label}
      </span>
      <span
        className="type-label-sm"
        style={{ color: 'var(--chrome-text-faint)', flexShrink: 0 }}
      >
        {route.built ? route.tier : '—'}
      </span>
    </>
  );

  if (!route.built) {
    return (
      <div style={style} title={`Not built yet (${route.tier})${route.note ? ` — ${route.note}` : ''}`}>
        {label}
      </div>
    );
  }

  return (
    <Link
      // A pattern route (`/mentors/[id]`) is not a real path, so the row links
      // to its `example` — see the field's note in routes.ts.
      href={route.example ?? route.href}
      style={{ ...style, textDecoration: 'none' }}
      title={route.note}
      className="hover:brightness-95"
    >
      {label}
    </Link>
  );
}

export function ScreenIndex() {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <Suspense
      fallback={
        <div
          style={{
            width: 56,
            flexShrink: 0,
            borderRight: '1px solid var(--chrome-border)',
            background: 'var(--chrome-bg-raised)',
          }}
        />
      }
    >
      <IndexBody collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
    </Suspense>
  );
}
