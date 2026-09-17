'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AppBottomBar,
  AppBrandBar,
  AppIconButton,
  AppPrimaryBar,
  type AppBottomBarItem,
} from '@/design-system';
import { WalletBadge } from '@/components/wallet-badge';
import { PhoneOverlay } from '@/components/prototype/phone-frame';
import { HomeFeed } from '@/features/home/home-feed';
import { SessionMentorsPage } from '@/features/mentors/session-mentors-page';
import type { MentorSummary } from '@/lib/fake/mentors';
import { SortFilterSheet } from '@/features/mentors/sort-filter-sheet';
import { AccountPage } from '@/features/account/account-page';
import { copy } from '@/lib/copy';
import { DEFAULT_FILTERS, type FilterState } from '@/lib/filters';
import { isRouteBuilt } from '@/lib/routes';
import { useWallet } from '@/lib/state/wallet-provider';
import { useProfile } from '@/lib/state/profile-provider';

/**
 * The home shell — port of `ui/home/home_shell.dart`.
 *
 * ── Why this is ONE route with `?tab=`, not four routes ─────────────────────
 *
 * The Flutter shell holds an `IndexedStack` of four children. An `IndexedStack`
 * *keeps every child mounted* and preserves each one's scroll position, its
 * list state and its in-flight requests. Nested Next routes would unmount three
 * of the four on every switch, so the home feed would jump back to the top each
 * time you glanced at the Chat tab. That is the single biggest fidelity trap in
 * this port, and `?tab=` is what avoids it: all four panels are always in the
 * tree, and the inactive three are hidden with `visibility: hidden`.
 *
 * That choice of hide matters. `display: none` would discard the panel's layout
 * — and with it, historically, the scroll offset of the scroller inside it.
 * `visibility: hidden` keeps the box laid out and only skips painting and
 * hit-testing, so the scroll offset survives by construction rather than by
 * browser goodwill.
 *
 * ── The app bar swaps per tab ───────────────────────────────────────────────
 *
 * Three different bars, and they are not variants of one another — their title
 * scales differ (`headlineSmall` w700 vs the brand lockup). `_buildAppBar`
 * switches on the index; so does this.
 *
 *   tab 0  AppBrandBar   — logo, then wallet · gift (refer & earn) · support
 *   tab 1  AppPrimaryBar — "Chat", then wallet · sort · search · messenger
 *   tab 2  AppPrimaryBar — "Call", same actions
 *   tab 3  AppPrimaryBar — "Account", no actions at all
 *
 * The wallet badge is FIRST in the action row on both bars that have one, ahead
 * of sort and search. Note the gift glyph: the source uses the raw
 * `Icons.card_giftcard_outlined`, not an `AppIcons` constant — the same kind of
 * escape hatch as `currency_rupee` in the wallet badge.
 *
 * ── What is missing, and why ────────────────────────────────────────────────
 *
 * `AppUpdateBanner` sits between the panels and the bottom bar, and the 8px
 * spacer under it is therefore unconditional. The banner only renders when
 * remote config says the installed build is too old, and there is no remote
 * config here — so it is always absent, and the spacer is the part that shows.
 * The widget itself arrives with T5's force-update screen.
 *
 * ── The sort button, and why there are two filter states ────────────────────
 *
 * `_openSortFilter` picks a bloc by tab: `_currentIndex == 2 ? _callTabBloc :
 * context.read<MentorsListBloc>()`. Chat and Call therefore hold *independent*
 * filters, and nothing ever syncs them. Two `useState`s reproduce that.
 *
 * The button is never disabled in the source — it is enabled on both tabs and
 * simply returns early when the list is not in its loaded state. So the sheet
 * is opened only when `index` is 1 or 2, which is exactly when the source can
 * reach a loaded bloc.
 *
 * `?sim=loading|error` is a prototype affordance, and the only one on this
 * route. It forces the account tab's spinner and the feed's error view, both of
 * which need a backend to reach otherwise. It is applied to each bloc
 * separately, mirroring the fact that they are separate blocs in production.
 */

const TABS = ['home', 'chat', 'call', 'account'] as const;
type Tab = (typeof TABS)[number];

const TAB_INDEX: Record<Tab, number> = { home: 0, chat: 1, call: 2, account: 3 };

const BOTTOM_ITEMS: AppBottomBarItem[] = [
  { label: copy.home, icon: 'home', activeIcon: 'homeFilled' },
  { label: copy.chat, icon: 'chat', activeIcon: 'chatFilled' },
  { label: copy.call, icon: 'call', activeIcon: 'callFilled' },
  { label: copy.account, icon: 'person', activeIcon: 'personFilled' },
];

/**
 * `useSearchParams()` opts a page out of static prerendering unless it sits
 * under a `Suspense` boundary — `next dev` never notices, `next build` fails
 * outright. Hence the wrapper: `HomeShellContent` reads `?tab=` and `?sim=`,
 * and this boundary is what lets the route still prerender.
 */
export default function HomePage() {
  return (
    <Suspense fallback={null}>
      <HomeShellContent />
    </Suspense>
  );
}

function HomeShellContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { balance } = useWallet();
  const { simulate } = useProfile();

  const tabParam = searchParams.get('tab');
  const tab: Tab = TABS.includes(tabParam as Tab) ? (tabParam as Tab) : 'home';
  const index = TAB_INDEX[tab];

  const simParam = searchParams.get('sim');
  const simulate_ =
    simParam === 'loading' || simParam === 'error' ? simParam : null;

  // One per tab, never shared — see the note above.
  const [chatFilters, setChatFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [callFilters, setCallFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [sheetTab, setSheetTab] = useState<1 | 2 | null>(null);

  // The account tab reads its state from the provider, so the param has to be
  // pushed into it rather than passed down.
  useEffect(() => {
    if (simulate_ === null) return;
    simulate(simulate_);
  }, [simulate_, simulate]);

  /**
   * Navigation that respects the tiering switch. A tap on something that is not
   * built yet is inert instead of 404ing — see `isRouteBuilt`.
   */
  const navigate = (path: string) => {
    if (!isRouteBuilt(path)) return;
    router.push(path);
  };

  const switchTab = (next: number) => {
    router.replace(`/home?tab=${TABS[next]}`, { scroll: false });
  };

  /**
   * A "Chat"/"Call" tap on a mentor card. The app pushes the ChatScreen with
   * `requestSessionOnOpen` and lets it raise the request — the thread has to be
   * visibly the thing that is asking, so the RequestingBar appears where the
   * session will run rather than on the list the user is leaving.
   *
   * `sessionType` is `'chat'` or `'audio'`, chosen by the tab that raised it.
   */
  const openChat = (mentor: MentorSummary, sessionType: string) => {
    if (!isRouteBuilt('/chat')) return;
    router.push(`/chat?mentor=${mentor.id}&start=${sessionType}`);
  };

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--surface-page)',
      }}
    >
      {index === 0 ? (
        <AppBrandBar
          actions={
            <>
              <WalletBadge balance={balance} onTap={() => navigate('/wallet/add')} />
              <AppIconButton
                name="gift"
                onClick={() => navigate('/referral')}
                label={copy.referAndEarn}
              />
              <AppIconButton
                name="support"
                onClick={() => navigate('/settings/help')}
                label={copy.helpAndSupport}
              />
              <div style={{ width: 16 }} />
            </>
          }
        />
      ) : null}

      {index === 1 || index === 2 ? (
        <AppPrimaryBar
          title={index === 1 ? copy.chat : copy.call}
          actions={
            <>
              <WalletBadge balance={balance} onTap={() => navigate('/wallet/add')} />
              <AppIconButton
                name="sort"
                onClick={() => setSheetTab(index as 1 | 2)}
                label={copy.sortBy}
              />
              <AppIconButton name="search" onClick={() => navigate('/search')} label={copy.searchMentors} />
              <AppIconButton
                name="messenger"
                onClick={() => navigate('/chats')}
                label={copy.orderHistory}
              />
              <div style={{ width: 16 }} />
            </>
          }
        />
      ) : null}

      {index === 3 ? <AppPrimaryBar title={copy.account} /> : null}

      <div style={{ flex: 1, minHeight: 0, position: 'relative' }}>
        <Panel active={index === 0}>
          <HomeFeed
            simulate={simulate_}
            onOpenSearch={() => navigate('/search')}
            onViewAllMentors={() => switchTab(1)}
            onMentorTap={(id) => navigate(`/mentors/${id}`)}
            onOpenThread={() => navigate('/chat?mentor=m1')}
            onOpenOrderHistory={() => navigate('/chats')}
            onStartCounselling={() => navigate('/counselling')}
            onNavigate={navigate}
          />
        </Panel>

        <Panel active={index === 1}>
          <SessionMentorsPage
            type="chat"
            buttonLabel={copy.chat}
            filters={chatFilters}
            onSessionRequested={openChat}
            onMentorTap={(id) => navigate(`/mentors/${id}`)}
          />
        </Panel>

        <Panel active={index === 2}>
          <SessionMentorsPage
            type="audio_call"
            buttonLabel={copy.call}
            filters={callFilters}
            onSessionRequested={openChat}
            onMentorTap={(id) => navigate(`/mentors/${id}`)}
          />
        </Panel>

        <Panel active={index === 3}>
          <AccountPage onNavigate={navigate} />
        </Panel>
      </div>

      {/* `AppUpdateBanner` — always absent without remote config. See above. */}
      <div style={{ height: 8 }} />

      <AppBottomBar items={BOTTOM_ITEMS} currentIndex={index} onTap={switchTab} />

      {/*
        The sheet lives in the phone's overlay layer, not in the page — a sheet
        rendered inside the scroller would be clipped and would scroll away with
        the feed behind it. See the note in phone-frame.tsx.
      */}
      <PhoneOverlay>
        <SortFilterSheet
          open={sheetTab !== null}
          currentFilters={sheetTab === 2 ? callFilters : chatFilters}
          onClose={() => setSheetTab(null)}
          onApply={(next) => {
            if (sheetTab === 2) setCallFilters(next);
            else setChatFilters(next);
            setSheetTab(null);
          }}
        />
      </PhoneOverlay>
    </div>
  );
}

/**
 * One `IndexedStack` child.
 *
 * `visibility` rather than `display`, so layout and scroll offset survive being
 * hidden; `pointerEvents` off so a hidden panel cannot swallow a tap aimed at
 * the visible one — `visibility: hidden` already removes it from hit-testing,
 * and this makes that explicit rather than incidental.
 */
function Panel({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <div
      aria-hidden={active ? undefined : true}
      style={{
        position: 'absolute',
        inset: 0,
        visibility: active ? 'visible' : 'hidden',
        pointerEvents: active ? 'auto' : 'none',
      }}
    >
      {children}
    </div>
  );
}
