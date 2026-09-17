/**
 * `Transaction` — port of `core/lib/transaction/data/models/transaction.dart`
 * and its `TransactionX` extension, plus the mentee-side adapter that feeds it.
 *
 * ── Two transaction types, and this is the one that matters ─────────────────
 *
 * `mentee_app` has its own `WalletTransaction` (`lib/fake/transactions.ts`)
 * because the wallet list wants `mentorName`/`mentorPhotoUrl`/`sessionType` on
 * the row itself. `core` has this one because the DETAIL SHEET is shared with
 * the mentor app, which speaks `otherUserName`/`otherUserAvatar`. The mentee
 * tile converts between them in `_toCoreTransaction` before opening the sheet —
 * a lossy hop in both directions (see `toCoreTransaction` below), reproduced
 * rather than tidied away.
 *
 * ── `typeLabel` is not the same list as the tile's `_label` ─────────────────
 *
 * The tile renders "Wallet Top-up" / "Session Payment" / "Refund" / "Cashback"
 * from the l10n bundle, falling back to the raw type with underscores spaced.
 * This model renders "Added to wallet" / "Session" / "Payout" from a hardcoded
 * switch. Both are shown at different moments on the same transaction, and the
 * sheet uses THIS one, so the file keeps both.
 */

import { formatInr } from '@/lib/rates';

export type TransactionType =
  | 'session_payment'
  | 'session_earning'
  | 'payout'
  | 'refund'
  | 'wallet_credit'
  | 'wallet_topup'
  | 'clawback'
  | 'balance_correction'
  | 'adjustment'
  | 'cashback'
  | 'unknown';

export type TransactionDirection = 'credit' | 'debit';

export type Transaction = {
  id: string;
  type: TransactionType;
  direction: TransactionDirection;
  amount: number;
  sessionId: string | null;
  referenceId: string | null;
  status: string;
  /** The other party — mentor for a mentee, mentee for a mentor. */
  otherUserName: string | null;
  otherUserAvatar: string | null;
  sessionStartedAt: string | null;
  createdAt: string;
  billingType: string | null;
  /** Human-readable context — refund reason, adjustment note, and so on. */
  notes: string | null;
};

/** `amountDisplay` — a signed amount. Credits lead with `+`, debits with `-`. */
export function amountDisplay(t: Transaction): string {
  const prefix = t.direction === 'credit' ? '+' : '-';
  return `${prefix}${formatInr(t.amount)}`;
}

/**
 * `typeLabel`. Note that the label for a top-up is "Added to wallet" here and
 * "Wallet Top-up" on the list tile — see the file header.
 */
export function typeLabel(t: Transaction): string {
  switch (t.type) {
    case 'session_payment':
      return 'Session';
    case 'session_earning':
      return 'Session earning';
    case 'payout':
      return 'Payout';
    case 'refund':
      return 'Refund';
    case 'wallet_credit':
      return 'Recharge';
    case 'wallet_topup':
      return 'Added to wallet';
    case 'clawback':
      return 'Adjustment';
    case 'balance_correction':
    case 'adjustment':
      return 'Wallet adjustment';
    case 'cashback':
      return 'Cashback';
    default:
      return 'Transaction';
  }
}

export function isCredit(t: Transaction): boolean {
  return t.direction === 'credit';
}

export function isSessionLinked(t: Transaction): boolean {
  return t.sessionId !== null;
}

export function isFreeChat(t: Transaction): boolean {
  return t.billingType === 'free_intro';
}

/** `_mapType` — the wire string becomes a known enum member, else `unknown`. */
export function mapWalletType(type: string): TransactionType {
  switch (type) {
    case 'session_payment':
      return 'session_payment';
    case 'session_earning':
      return 'session_earning';
    case 'payout':
      return 'payout';
    case 'refund':
      return 'refund';
    case 'wallet_credit':
      return 'wallet_credit';
    case 'wallet_topup':
      return 'wallet_topup';
    case 'clawback':
      return 'clawback';
    case 'balance_correction':
      return 'balance_correction';
    case 'adjustment':
      return 'adjustment';
    case 'cashback':
      return 'cashback';
    default:
      return 'unknown';
  }
}
