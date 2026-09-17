/**
 * Transactions — the fixture behind the wallet's two log tabs and the
 * transaction detail sheet.
 *
 * Port of `mentee_app/lib/domain/models/wallet_transaction.dart` (the
 * mentee-side shape) plus `WalletRepository().getTransactions(page:)`, which
 * pages 20 at a time off one unfiltered feed.
 *
 * ── The feed is UNFILTERED, and that is the whole story of this fixture ─────
 *
 * The backend has no per-tab filter. `WalletPage` asks for "Session Logs" or
 * "Payment Logs" and gets the same 20 rows either way, then drops the ones that
 * do not match the active tab — and when that leaves nothing it pages again,
 * from inside a post-frame callback, until something matches or `hasMore` goes
 * false. So the page ORDER is load-bearing, not decoration: the fixture below
 * puts every session row on page 2 and every top-up on page 1, which is what
 * makes that loop visible when you open Session Logs and watch two pages of
 * shimmer resolve into a list.
 *
 * ── Amounts are the mentee's own, and `direction` decides the sign ──────────
 *
 * `amount` is always positive; `direction` is `credit` or `debit` and the tile
 * prepends the sign. A debit renders bare (`₹48`) while a credit renders signed
 * (`+ ₹100`) — an asymmetry in `transaction_tile.dart`, reproduced here.
 */

import { MENTORS } from '@/lib/fake/mentors';
import { mentorPortrait } from '@/lib/fake/portraits';

export type TransactionDirection = 'credit' | 'debit';

/**
 * The string `type` on the wire. The mentee app maps it to core's
 * `TransactionType` enum before the detail sheet sees it (`_mapType`), and
 * anything unrecognised becomes `unknown` rather than throwing — so this is a
 * plain string, not a union, exactly as the source treats it.
 */
export type WalletTransaction = {
  id: string;
  type: string;
  direction: TransactionDirection;
  amount: number;
  referenceId: string;
  status: string;
  createdAt: string;
  sessionId: string | null;
  mentorName: string | null;
  mentorPhotoUrl: string | null;
  sessionType: string | null;
  /** `'paid' | 'intro_rate' | 'free_intro'` — the tile only branches on free. */
  billingType: string | null;
  notes: string | null;
};

export const TRANSACTIONS_PAGE_SIZE = 20;

/* ── The rows ──────────────────────────────────────────────────────────────
 *
 * Timestamps are RELATIVE to now, not fixed, so the list always reads as recent
 * history rather than as a snapshot from whenever these constants were typed.
 * `page 3` is short on purpose — it is what flips `hasMore` to false and lets
 * the Session Logs loop terminate.
 */

/** Hours ago → ISO. Ordered so lower index is older. */
function ago(hours: number): string {
  return new Date(Date.now() - hours * 3_600_000).toISOString();
}

function mentor(i: number) {
  const m = MENTORS[i % MENTORS.length];
  return { name: m.displayName, photo: mentorPortrait(m.id), id: m.id };
}

/** Page 1 — 20 rows, NONE session-linked. Payment Logs fills; Session Logs pages. */
function page1(): WalletTransaction[] {
  const rows: WalletTransaction[] = [];

  // Six month's worth of top-ups, newest first. The first is the one the
  // prototype's own "Add balance" flow would produce.
  const topups: Array<[number, number, string]> = [
    [6, 500, 'pay_QK7f2mNpXa41Bd'],
    [54, 500, 'pay_QJ1c9rTvLm08Kz'],
    [151, 200, 'pay_QH4b2wYsPn77Rt'],
    [298, 1000, 'pay_QF8a5eDgKm33Vx'],
    [455, 100, 'pay_QD2f7hJkRn91Wq'],
    [712, 200, 'pay_QA9d4sLpVb65Nc'],
  ];
  topups.forEach(([hours, amount, ref], i) => {
    rows.push({
      id: `wt_topup_${i}`,
      type: 'wallet_topup',
      direction: 'credit',
      amount,
      referenceId: ref,
      status: 'completed',
      createdAt: ago(hours),
      sessionId: null,
      mentorName: null,
      mentorPhotoUrl: null,
      sessionType: null,
      billingType: null,
      notes: null,
    });
  });

  // Referral bonuses — the row the referral screen's "Earned" stat counts.
  rows.push(
    {
      id: 'wt_ref_1',
      type: 'referral_bonus',
      direction: 'credit',
      amount: 80,
      referenceId: '',
      status: 'completed',
      createdAt: ago(28),
      sessionId: null,
      mentorName: null,
      mentorPhotoUrl: null,
      sessionType: null,
      billingType: null,
      notes: 'Referral bonus — ADITYA21 joined',
    },
    {
      id: 'wt_ref_2',
      type: 'referral_bonus',
      direction: 'credit',
      amount: 80,
      referenceId: '',
      status: 'completed',
      createdAt: ago(496),
      sessionId: null,
      mentorName: null,
      mentorPhotoUrl: null,
      sessionType: null,
      billingType: null,
      notes: 'Referral bonus — SNEEHA07 joined',
    },
  );

  // Cashback on a top-up, a refund for a session that failed to connect, and
  // an admin adjustment. Three different `_content` branches in the detail
  // sheet, so all three are worth having.
  rows.push(
    {
      id: 'wt_cash_1',
      type: 'cashback',
      direction: 'credit',
      amount: 25,
      referenceId: 'pay_QK7f2mNpXa41Bd',
      status: 'completed',
      createdAt: ago(6),
      sessionId: null,
      mentorName: null,
      mentorPhotoUrl: null,
      sessionType: null,
      billingType: null,
      notes: '5% cashback on your ₹500 top-up',
    },
    {
      id: 'wt_refund_1',
      type: 'refund',
      direction: 'credit',
      amount: 84,
      referenceId: 'pay_mock_refund_8812',
      status: 'completed',
      createdAt: ago(73),
      sessionId: null,
      mentorName: null,
      mentorPhotoUrl: null,
      sessionType: null,
      billingType: null,
      notes: 'Session could not be started — mentor did not join',
    },
    {
      id: 'wt_adj_1',
      type: 'adjustment',
      direction: 'debit',
      amount: 15,
      referenceId: '',
      status: 'completed',
      createdAt: ago(310),
      sessionId: null,
      mentorName: null,
      mentorPhotoUrl: null,
      sessionType: null,
      billingType: null,
      notes: 'Duplicate cashback reversed by support',
    },
    {
      id: 'wt_failed_1',
      type: 'wallet_topup',
      direction: 'credit',
      amount: 500,
      referenceId: 'pay_QG3h6kLmTb12Yz',
      status: 'failed',
      createdAt: ago(155),
      sessionId: null,
      mentorName: null,
      mentorPhotoUrl: null,
      sessionType: null,
      billingType: null,
      notes: null,
    },
  );

  // Eight more top-ups, so page 1 alone is a full 20 and the Payment Logs tab
  // has real depth before it ever pages.
  for (let i = 0; i < 8; i += 1) {
    rows.push({
      id: `wt_topup_b_${i}`,
      type: 'wallet_topup',
      direction: 'credit',
      amount: [50, 100, 100, 200, 500, 50, 1000, 200][i],
      referenceId: `pay_QB${i}4x8nRwDf${20 + i}Lp`,
      status: i === 5 ? 'processing' : 'completed',
      createdAt: ago(820 + i * 96),
      sessionId: null,
      mentorName: null,
      mentorPhotoUrl: null,
      sessionType: null,
      billingType: null,
      notes: null,
    });
  }

  return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 20);
}

/** Page 2 — 20 rows, ALL session-linked. What the Session Logs loop lands on. */
function page2(): WalletTransaction[] {
  const rows: WalletTransaction[] = [];
  const modes = ['chat', 'audio', 'video'] as const;
  const rates = [12, 18, 25, 9, 30];

  for (let i = 0; i < 20; i += 1) {
    const m = mentor(i + 2);
    const mode = modes[i % 3];
    // Every seventh session was the free intro — the row that renders "FREE"
    // instead of an amount, in the action colour.
    const isFree = i === 4 || i === 11 || i === 17;
    const minutes = [8, 21, 5, 33, 14, 46, 12, 27][i % 8];
    const rate = rates[i % rates.length];

    rows.push({
      id: `wt_sess_${i}`,
      type: 'session_payment',
      direction: 'debit',
      amount: isFree ? 0 : Math.ceil(minutes) * rate,
      referenceId: `sess_pay_${9000 + i}`,
      status: 'completed',
      createdAt: ago(11 + i * 19),
      sessionId: `s_hist_${1000 + i}`,
      mentorName: m.name,
      mentorPhotoUrl: m.photo,
      sessionType: mode,
      billingType: isFree ? 'free_intro' : i % 4 === 0 ? 'intro_rate' : 'paid',
      notes: null,
    });
  }

  return rows;
}

/**
 * Page 3 — 10 rows, six of them sessions. `hasMore` goes false here, which is
 * what stops the Session Logs loop after three pages and what makes the
 * "No transactions yet" branch reachable for a tab whose rows run out.
 */
function page3(): WalletTransaction[] {
  const rows: WalletTransaction[] = [];

  for (let i = 0; i < 6; i += 1) {
    const m = mentor(i + 5);
    rows.push({
      id: `wt_sess_old_${i}`,
      type: 'session_payment',
      direction: 'debit',
      amount: [36, 108, 250, 72, 144, 90][i],
      referenceId: `sess_pay_${7000 + i}`,
      status: i === 3 ? 'refunded' : 'completed',
      createdAt: ago(1_100 + i * 140),
      sessionId: `s_hist_${800 + i}`,
      mentorName: m.name,
      mentorPhotoUrl: m.photo,
      sessionType: (['chat', 'audio', 'video'] as const)[i % 3],
      billingType: 'paid',
      notes: null,
    });
  }

  for (let i = 0; i < 4; i += 1) {
    rows.push({
      id: `wt_topup_c_${i}`,
      type: 'wallet_topup',
      direction: 'credit',
      amount: [100, 200, 500, 100][i],
      referenceId: `pay_QZ${i}1a5mKpTt${60 + i}Vb`,
      status: 'completed',
      createdAt: ago(2_400 + i * 260),
      sessionId: null,
      mentorName: null,
      mentorPhotoUrl: null,
      sessionType: null,
      billingType: null,
      notes: null,
    });
  }

  return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

const PAGES: WalletTransaction[][] = [page1(), page2(), page3()];

/** `WalletRepository().getTransactions(page:)` — 1-indexed, 20 per page. */
export function fetchTransactionsPage(page: number): {
  transactions: WalletTransaction[];
  hasMore: boolean;
} {
  const rows = PAGES[page - 1] ?? [];
  return { transactions: rows, hasMore: page < PAGES.length };
}

export const TRANSACTIONS_TOTAL = PAGES.reduce((n, p) => n + p.length, 0);

/**
 * Resolve a mentor id from the display name on a transaction row.
 *
 * Real payloads do not carry a mentor id on a wallet row — only `mentor_name`
 * and `mentor_photo_url`. The app gets an id from the SESSION DETAIL response
 * it fetches when the sheet opens, and pushes the profile with it. The fixture
 * has no server, so it resolves the id from its own mentor table instead; the
 * result is the same id the real response would return.
 */
export function mentorIdByName(name: string | null): string | undefined {
  if (name === null) return undefined;
  return MENTORS.find((m) => m.displayName === name)?.id;
}
