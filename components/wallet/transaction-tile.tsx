'use client';

import { AppAvatar, AppIcon, AppListTile } from '@/design-system';
import { copy } from '@/lib/copy';
import type { WalletTransaction } from '@/lib/fake/transactions';
import { formatInr } from '@/lib/rates';
import { formatDateTimeShort } from '@/lib/format';
import { mapWalletType, type Transaction } from '@/lib/transaction/transaction';

/**
 * TransactionTile — port of `ui/wallet/widgets/transaction_tile.dart`.
 *
 * One row of the wallet's log, and it is doing more work than it looks: the
 * SAME row has to render a session you paid for, a free intro chat, a top-up,
 * a refund, and an admin adjustment, and each of those changes the leading
 * glyph, the label, the amount's colour AND whether the amount is signed.
 *
 * ── Three amount treatments, not two ────────────────────────────────────────
 *
 *   free intro   `FREE`      in `text.action`
 *   credit       `+ ₹500`    in a hardcoded `#4CAF50`
 *   debit        `₹48`       in `text.heading`, with NO minus sign
 *
 * The missing minus on a debit is the source's, and it is defensible — the
 * label already says what the transaction was, and the leading glyph is a red
 * up-arrow. It is called out here because it reads like a bug.
 *
 * ── The leading glyph has a precedence rule worth stating ───────────────────
 *
 * A session row shows the MENTOR'S AVATAR — but only if the row carries a photo
 * OR a name; a session-linked row with neither falls through to the coloured
 * arrow circle, which is otherwise the non-session treatment. So the avatar is
 * not "session rows" but "session rows that know who the mentor was".
 */

export function TransactionTile({
  transaction,
  onOpen,
}: {
  transaction: WalletTransaction;
  onOpen: (t: WalletTransaction) => void;
}) {
  const isCredit = transaction.direction === 'credit';
  const isSession = transaction.sessionId !== null;
  const isFree = transaction.billingType === 'free_intro';

  const amountColor = isFree
    ? 'var(--text-action)'
    : isCredit
      ? '#4CAF50'
      : 'var(--text-heading)';

  const label = isFree
    ? transaction.mentorName !== null
      ? `Free Intro Chat · ${transaction.mentorName}`
      : 'Free Intro Chat'
    : tileLabel(transaction);

  const amountText = isFree
    ? 'FREE'
    : isCredit
      ? `+ ${formatInr(transaction.amount)}`
      : formatInr(transaction.amount);

  return (
    <div style={{ paddingBottom: 4 }}>
      <AppListTile
        leading={<Leading transaction={transaction} isSession={isSession} isCredit={isCredit} />}
        title={label}
        subtitle={formatDateTimeShort(transaction.createdAt)}
        trailing={
          <span
            className="type-title-md type-emphasis-semibold"
            style={{ color: amountColor, whiteSpace: 'nowrap' }}
          >
            {amountText}
          </span>
        }
        onClick={() => onOpen(transaction)}
      />
    </div>
  );
}

/**
 * `_buildLeading` — the mentor's avatar for a session row that has one, and a
 * tinted arrow circle for everything else.
 */
function Leading({
  transaction,
  isSession,
  isCredit,
}: {
  transaction: WalletTransaction;
  isSession: boolean;
  isCredit: boolean;
}) {
  if (isSession && (transaction.mentorPhotoUrl !== null || transaction.mentorName !== null)) {
    return (
      <AppAvatar
        size="sm"
        imageUrl={transaction.mentorPhotoUrl}
        name={transaction.mentorName ?? ''}
      />
    );
  }

  // `0xFFE8F5E9`/`0xFF4CAF50` for a credit, `0xFFFFEBEE`/`Colors.red.shade400`
  // for a debit — two hardcoded Material pairs, like the status pills and the
  // account grid's four icons.
  const background = isCredit ? '#E8F5E9' : '#FFEBEE';
  const foreground = isCredit ? '#4CAF50' : '#EF5350';

  return (
    <div
      style={{
        width: 48,
        height: 48,
        flex: '0 0 auto',
        borderRadius: '50%',
        background,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <AppIcon name={isCredit ? 'arrowDown' : 'arrowUp'} size="sm" color={foreground} />
    </div>
  );
}

/**
 * `_label` — the session form first, then four named types, then the raw type
 * with its underscores spaced out.
 *
 * `copy.sessionWith` is `'{mode} with {name}'` and the mode names come from the
 * l10n bundle, so a session label reads "Audio Call with Dr. Meera Iyer".
 */
function tileLabel(t: WalletTransaction): string {
  if (t.sessionId !== null && t.mentorName !== null) {
    const mode =
      t.sessionType === 'audio'
        ? copy.audioCall
        : t.sessionType === 'video'
          ? copy.videoCall
          : copy.chat;
    return copy.sessionWith.replace('{mode}', mode).replace('{name}', t.mentorName);
  }

  switch (t.type) {
    case 'wallet_topup':
      return copy.walletTopup;
    case 'session_payment':
      return copy.sessionPayment;
    case 'refund':
      return copy.refund;
    case 'cashback':
      return copy.cashback;
    default:
      // `referral_bonus` lands here in the app too — there is no case for it in
      // `_label`, so it renders as "referral bonus".
      return t.type.replaceAll('_', ' ');
  }
}

/**
 * `_toCoreTransaction` — the mentee model becomes the shared core one.
 *
 * Lossy in one direction that matters: `sessionType` and `mentorName` collapse
 * into `otherUserName`/`otherUserAvatar`, because the shared sheet has no
 * concept of which app it is in. `sessionStartedAt` is passed as null — the
 * wallet row does not carry it, so the sheet's session block reads `startedAt`
 * off the detail it fetches instead.
 */
export function toCoreTransaction(t: WalletTransaction): Transaction {
  return {
    id: t.id,
    type: mapWalletType(t.type),
    direction: t.direction,
    amount: t.amount,
    sessionId: t.sessionId,
    referenceId: t.referenceId === '' ? null : t.referenceId,
    status: t.status,
    otherUserName: t.mentorName,
    otherUserAvatar: t.mentorPhotoUrl,
    sessionStartedAt: null,
    createdAt: t.createdAt,
    billingType: t.billingType,
    notes: t.notes,
  };
}
