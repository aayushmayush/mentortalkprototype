'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppIcon, AppIconButton, AppLoadingSpinner, AppTabBar, AppTopBar } from '@/design-system';
import { ShimmerTransactionList } from '@/components/wallet/shimmer-transaction-tile';
import { TransactionTile } from '@/components/wallet/transaction-tile';
import { TransactionDetailSheet } from '@/components/transaction/transaction-detail-sheet';
import { PhoneOverlay } from '@/components/prototype/phone-frame';
import { copy } from '@/lib/copy';
import { useWallet } from '@/lib/state/wallet-provider';
import { fetchTransactionsPage, type WalletTransaction } from '@/lib/fake/transactions';
import { isRouteBuilt } from '@/lib/routes';
import { formatInr } from '@/lib/rates';

/**
 * WalletPage — port of `mentee_app/lib/ui/wallet/pages/wallet_page.dart`.
 *
 * The balance card, a one-row "Counselling" entry point, the Session/Payment
 * log tabs, and the transaction feed behind them.
 *
 * ── The tab filter runs on the CLIENT, over an UNFILTERED feed ──────────────
 *
 * There is no per-tab endpoint. Both tabs read the same page of transactions
 * and drop the rows that do not match — Session Logs keeps `sessionId != null`,
 * Payment Logs keeps `sessionId == null`. And because a page of 20 can contain
 * nothing for the active tab, the source pages again from inside a post-frame
 * callback until it finds a match or `hasMore` goes false.
 *
 * That is reproduced here as an effect rather than a build-phase side effect
 * (see `useEffect` below the filter). The fixture is arranged so the behaviour
 * is VISIBLE: page 1 is entirely top-ups and page 2 is entirely sessions, so
 * opening Session Logs on a cold load shows a page of shimmer resolving out of
 * a fetch you never asked for. Without that arrangement the loop would be
 * correct and invisible.
 *
 * ── Refresh is a button, and it is the only divergence ─────────────────────
 *
 * The source wraps the whole scroll view in a `RefreshIndicator` — a swipe-down
 * gesture with no browser equivalent. Following the precedent set on the chats
 * list, refresh becomes an action in the top bar. The source's `_onRefresh`
 * also fires `HomeEvent.refreshRequested` to re-pull the wallet balance; here
 * the balance is live in `useWallet()` and shared with the app-bar badge, so
 * there is nothing to re-pull and the reload is the whole of it.
 *
 * The add-balance route returns a boolean in the source (`pop(true)` on a
 * verified payment) and the caller reloads on true. In the prototype that is a
 * route change, so the reload happens on unmount-independent focus instead —
 * see the `useEffect` that watches the balance.
 */

const PAGE_PADDING = 20;
const SPACING_XS = 4;
const SPACING_MD = 16;
const SPACING_LG = 24;
const SPACING_XL = 32;

type LoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'loaded' };

export function WalletPage() {
  const router = useRouter();
  const { balance } = useWallet();

  const [tab, setTab] = useState(0);
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [openTransaction, setOpenTransaction] = useState<WalletTransaction | null>(null);

  const scrollerRef = useRef<HTMLDivElement | null>(null);
  /** `currentPage` from the source's `TransactionsLoaded` state. A ref, not
   *  React state, because `loadMore` has to read it synchronously. */
  const pageRef = useRef(1);
  /** `isLoadingMore`, as a ref, for the same reason. */
  const loadingMoreRef = useRef(false);

  /**
   * `TransactionsCubit.load()` — always page 1, always back to `loading` first,
   * so a refresh empties the list and shows the shimmer again rather than
   * leaving stale rows on screen.
   */
  const load = useCallback(() => {
    setState({ status: 'loading' });
    setTransactions([]);
    pageRef.current = 1;
    loadingMoreRef.current = false;
    setIsLoadingMore(false);

    const timer = window.setTimeout(() => {
      const result = fetchTransactionsPage(1);
      setTransactions(result.transactions);
      setHasMore(result.hasMore);
      setState({ status: 'loaded' });
    }, 700);

    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => load(), [load]);

  /**
   * `loadMore()` — appends the next page, or leaves the list untouched when the
   * fetch fails. The source swallows the error entirely on this path (no
   * snackbar, no error state) and this matches it.
   *
   * The guard reads a REF, not `isLoadingMore`. `loadMore` is called from a
   * scroll handler and from an effect, and both can fire inside one commit —
   * the effect because the scroll that triggered it had not yet re-rendered.
   * A ref makes the check synchronous, the same reason `WalletProvider` keeps
   * the balance in one.
   */
  const loadMore = useCallback(() => {
    if (loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    setIsLoadingMore(true);

    const next = pageRef.current + 1;
    window.setTimeout(() => {
      const result = fetchTransactionsPage(next);
      pageRef.current = next;
      setTransactions((current) => [...current, ...result.transactions]);
      setHasMore(result.hasMore);
      loadingMoreRef.current = false;
      setIsLoadingMore(false);
    }, 800);
  }, []);

  const filtered = useMemo(
    () =>
      transactions.filter((t) => (tab === 0 ? t.sessionId !== null : t.sessionId === null)),
    [transactions, tab],
  );

  /**
   * The build-phase `_loadMore()` from the source, as an effect.
   *
   * A page that matched nothing in the active tab is not an error and not an
   * empty list — it means "ask for more". The four guards are the source's own
   * `if (hasMore) { if (!isLoadingMore) ... }` plus the status check that keeps
   * it from firing mid-load.
   */
  useEffect(() => {
    if (state.status !== 'loaded') return;
    if (filtered.length > 0) return;
    if (!hasMore) return;
    if (isLoadingMore) return;
    loadMore();
  }, [state.status, filtered.length, hasMore, isLoadingMore, loadMore]);

  /** `_onScroll` — fires loadMore within 200px of the bottom. */
  const onScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 200) loadMore();
  }, [loadMore]);

  const openPackages = () => {
    if (isRouteBuilt('/packages')) router.push('/packages');
  };

  const openAddBalance = () => {
    if (isRouteBuilt('/wallet/add')) router.push('/wallet/add');
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
      <AppTopBar
        title={copy.wallet}
        onBack={() => router.back()}
        actions={
          <button
            type="button"
            onClick={load}
            aria-label={copy.retry}
            style={{
              border: 'none',
              background: 'transparent',
              padding: 8,
              cursor: 'pointer',
              display: 'flex',
            }}
          >
            <AppIcon name="refresh" size="md" color="var(--icon-primary)" />
          </button>
        }
      />

      <div
        ref={scrollerRef}
        onScroll={onScroll}
        className="no-scrollbar"
        style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}
      >
        {/* ── Balance card ── */}
        <div style={{ padding: `12px ${PAGE_PADDING}px 0` }}>
          <div
            style={{
              padding: PAGE_PADDING,
              background: 'var(--surface-primary)',
              borderRadius: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
              <span className="type-body-sm" style={{ color: 'var(--text-body-light)' }}>
                {copy.availableBalance}
              </span>
              <div style={{ height: SPACING_XS }} />
              <span
                className="type-headline-md type-emphasis-bold"
                style={{ color: 'var(--text-heading)' }}
              >
                {formatInr(balance)}
              </span>
            </div>

            <AppIconButton
              name="plus"
              size="md"
              type="filled"
              backgroundColor="var(--text-action)"
              onClick={openAddBalance}
              label={copy.addBalance}
            />
          </div>
        </div>

        {/* ── Packages entry point ──
             Labelled "Counselling", not "Packages" — the source hardcodes it,
             and the page it opens is titled "Counselling" too. See the header
             of `features/packages/packages-page.tsx`. */}
        <div style={{ padding: `16px ${PAGE_PADDING}px 0` }}>
          <div
            onClick={openPackages}
            style={{
              width: '100%',
              padding: SPACING_MD,
              background: 'var(--surface-primary)',
              borderRadius: 16,
              border: '1px solid var(--border-primary-light)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: isRouteBuilt('/packages') ? 'pointer' : 'default',
            }}
          >
            <span
              className="type-body-md type-emphasis-semibold"
              style={{ color: 'var(--text-heading)' }}
            >
              Counselling
            </span>
            <AppIcon name="chevronRight" size="md" color="var(--icon-secondary)" />
          </div>
        </div>

        {/* ── Log tabs ── */}
        <div style={{ padding: `28px ${PAGE_PADDING}px 12px` }}>
          <AppTabBar tabs={[copy.sessionLogs, copy.paymentLogs]} index={tab} onChange={setTab} />
        </div>

        {state.status === 'loading' && <ShimmerTransactionList />}

        {state.status === 'error' && (
          <div
            style={{
              minHeight: 320,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
              }}
            >
              <span className="type-body-md" style={{ color: 'var(--text-body-light)' }}>
                {copy.failedToLoadTransactions}
              </span>
              <div style={{ height: 8 }} />
              {/* `tapToRetry` — a bare GestureDetector over a Text in the
                  source, not an AppButton. Kept as a text affordance. */}
              <button
                type="button"
                onClick={load}
                style={{
                  border: 'none',
                  background: 'transparent',
                  padding: 0,
                  cursor: 'pointer',
                }}
              >
                <span
                  className="type-body-sm type-emphasis-semibold"
                  style={{ color: 'var(--text-action)' }}
                >
                  {copy.tapToRetry}
                </span>
              </button>
            </div>
          </div>
        )}

        {state.status === 'loaded' &&
          (filtered.length === 0 ? (
            hasMore ? (
              // Nothing matched on this page — the effect above is already
              // fetching the next one. Keep the shimmer up rather than
              // flashing an empty state that is about to be replaced.
              <ShimmerTransactionList />
            ) : (
              <div
                style={{
                  minHeight: 320,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span className="type-body-md" style={{ color: 'var(--text-body-light)' }}>
                  {copy.noTransactionsYet}
                </span>
              </div>
            )
          ) : (
            <div style={{ padding: `0 ${PAGE_PADDING}px` }}>
              {filtered.map((t) => (
                <TransactionTile key={t.id} transaction={t} onOpen={setOpenTransaction} />
              ))}

              {/* The footer spinner — rendered whenever `hasMore`, even when a
                  load is not in flight, exactly as the source does. */}
              {hasMore && (
                <div
                  style={{
                    padding: '16px 0',
                    display: 'flex',
                    justifyContent: 'center',
                  }}
                >
                  <AppLoadingSpinner size="sm" />
                </div>
              )}
            </div>
          ))}
      </div>

      <PhoneOverlay>
        <TransactionDetailSheet
          open={openTransaction !== null}
          transaction={openTransaction}
          isMentor={false}
          onClose={() => setOpenTransaction(null)}
          onMentorTap={(mentor) => {
            if (mentor.id !== '' && isRouteBuilt(`/mentors/${mentor.id}`)) {
              router.push(`/mentors/${mentor.id}`);
            }
          }}
          onTalkToMentor={(detail) => {
            const mentor = detail.mentor ?? detail.otherUser;
            if (mentor !== null && mentor.id !== '' && isRouteBuilt('/chat')) {
              router.push(`/chat?mentor=${mentor.id}`);
            }
          }}
        />
      </PhoneOverlay>
    </div>
  );
}
