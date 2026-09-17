'use client';

import { useEffect, useState } from 'react';
import {
  AppBottomSheet,
  AppBottomSheetHeader,
  AppButton,
  AppLoadingSpinner,
} from '@/design-system';
import { mentorIdByName, type WalletTransaction } from '@/lib/fake/transactions';
import { formatDateTimeShort } from '@/lib/format';
import { formatInr } from '@/lib/rates';
import {
  getSessionDetail,
  type SessionDetail,
  type SessionParticipant,
} from '@/lib/session/session-detail';
import {
  isCredit,
  typeLabel,
  type Transaction,
  type TransactionType,
} from '@/lib/transaction/transaction';
import { SessionDetailsBlock } from '@/components/session/session-details-block';
import { toCoreTransaction } from '@/components/wallet/transaction-tile';

/**
 * TransactionDetailSheet — port of
 * `core/lib/transaction/ui/widgets/transaction_detail_sheet.dart`.
 *
 * GPay-style receipt. It has three bodies, and which one you get depends on
 * whether the transaction is session-linked and whether the session fetch
 * resolves:
 *
 *   1. session-linked + detail arrived → `SessionDetailsBlock` (the SAME block
 *      the `SessionDetailSheet` renders), plus a "Talk to Mentor" CTA below it
 *   2. session-linked + still loading   → a centred spinner, 64px of padding
 *   3. session-linked + fetch FAILED, or not session-linked at all → a bare
 *      amount over a status pill, then a small info card
 *
 * Cases 1 and 3 are the interesting pair: a failed session fetch does not
 * produce an error state, it silently downgrades to the non-session layout with
 * a `_NonSessionBlock.fallback` that reads "Couldn't load session details". The
 * user still sees their money and the date, which is the right call — the
 * receipt is the point, the counterparty is a bonus.
 *
 * ── The sheet takes a `Transaction`, but the wallet speaks `WalletTransaction` ─
 *
 * The conversion happens at the call site (`toCoreTransaction`) because the
 * core model is shared with the mentor app, which has no `sessionType` or
 * `mentorName`. See that function's header for what is lost.
 */

export function TransactionDetailSheet({
  open,
  transaction,
  isMentor,
  onClose,
  onMentorTap,
  onTalkToMentor,
}: {
  open: boolean;
  transaction: WalletTransaction | null;
  isMentor: boolean;
  onClose: () => void;
  /** Receives the whole participant — the caller wants `id` to push a profile. */
  onMentorTap?: (mentor: SessionParticipant) => void;
  onTalkToMentor?: (detail: SessionDetail) => void;
}) {
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const core: Transaction | null = transaction ? toCoreTransaction(transaction) : null;
  const sessionId = transaction?.sessionId ?? null;

  /**
   * `_loadSessionDetail`, in `initState` in the source — so it runs on MOUNT,
   * once, and the sheet is built fresh per open there. Here the component stays
   * mounted and `open` toggles, so the fetch is keyed on the id instead.
   *
   * Note what is missing: a `catch` that does anything. A failure leaves
   * `detail` null and `_isLoading` false, which is exactly the fallback branch.
   */
  useEffect(() => {
    if (!open || sessionId === null) {
      setDetail(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setDetail(null);

    const timer = window.setTimeout(() => {
      if (cancelled) return;
      setDetail(
        getSessionDetail(sessionId, {
          isMentor,
          peerName: transaction?.mentorName ?? '',
          peerAvatar: transaction?.mentorPhotoUrl ?? null,
          // The wallet row has no mentor id — only the session response does.
          // See `mentorIdByName`. Resolving it here is what makes the
          // avatar-tap and "Talk to Mentor" affordances do anything.
          peerId: mentorIdByName(transaction?.mentorName ?? null),
        }),
      );
      setIsLoading(false);
    }, 600);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [open, sessionId, isMentor, transaction?.mentorName, transaction?.mentorPhotoUrl]);

  if (!open || core === null) return null;

  const mentor =
    isMentor || detail === null ? null : (detail.mentor ?? detail.otherUser);

  return (
    <AppBottomSheet open={open} onClose={onClose}>
      {/*
        `surface.page`, not the sheet default — the info card and the session
        block's two cards are all `surface.primary`, so they would vanish
        against a primary ground. Same override as `SessionDetailSheet`.
      */}
      <div
        style={{
          background: 'var(--surface-page)',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          maxHeight: '90%',
        }}
      >
        <AppBottomSheetHeader title="Transaction details" />

        <div
          className="no-scrollbar"
          style={{ overflowY: 'auto', minHeight: 0, paddingBottom: 24 }}
        >
          {sessionId !== null ? (
            isLoading ? (
              <div
                style={{
                  padding: '64px 0',
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <AppLoadingSpinner size="md" />
              </div>
            ) : detail !== null ? (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <SessionDetailsBlock
                  detail={detail}
                  isMentor={isMentor}
                  onAvatarTap={
                    mentor !== null && onMentorTap !== undefined
                      ? () => onMentorTap(mentor)
                      : undefined
                  }
                />

                {mentor !== null && onTalkToMentor !== undefined && (
                  <>
                    <div style={{ height: 24 }} />
                    <div style={{ padding: '0 16px' }}>
                      <AppButton
                        label="Talk to Mentor"
                        fullWidth
                        onClick={() => {
                          onClose();
                          onTalkToMentor(detail);
                        }}
                      />
                    </div>
                  </>
                )}
              </div>
            ) : (
              // `_failed` — the session fetch came back empty. Money and date
              // stay; only the counterparty is lost.
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <AmountBlock transaction={core} />
                <div style={{ height: 24 }} />
                <NonSessionBlock transaction={core} fallback />
              </div>
            )
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <AmountBlock transaction={core} />
              <div style={{ height: 24 }} />
              <NonSessionBlock transaction={core} />
            </div>
          )}
        </div>
      </div>
    </AppBottomSheet>
  );
}

/**
 * `_AmountBlock` — headline amount over the status pill.
 *
 * Credits render signed and in a hardcoded `0xFF2E7D32` — a third green, after
 * the tile's `#4CAF50` and the session block's `#2E7D32` pair. Debits are bare
 * and in `text.heading`. Same asymmetry as the tile.
 */
function AmountBlock({ transaction }: { transaction: Transaction }) {
  const credit = isCredit(transaction);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <span
        className="type-headline-md type-emphasis-bold"
        style={{ color: credit ? '#2E7D32' : 'var(--text-heading)' }}
      >
        {credit ? `+ ${formatInr(transaction.amount)}` : formatInr(transaction.amount)}
      </span>

      <div style={{ height: 8 }} />

      <StatusPill status={transaction.status} />
    </div>
  );
}

/**
 * `_StatusPill`. Its two success words and two failure words are DIFFERENT from
 * the session block's pill three files away — this one accepts `success` as
 * well as `completed`, and `failed` as well as `cancelled`, and it has six
 * named states to the session pill's four. Two pills, same shape, different
 * vocabularies, because the money ledgers and the session ledger use different
 * status values.
 */
function StatusPill({ status }: { status: string }) {
  const isSuccess = status === 'completed' || status === 'success';
  const isFailed = status === 'failed' || status === 'cancelled';

  const background = isSuccess ? '#E8F5E9' : isFailed ? '#FFEBEE' : 'var(--surface-disabled)';
  const foreground = isSuccess
    ? '#2E7D32'
    : isFailed
      ? '#E53935' // Colors.red.shade600
      : 'var(--text-body-light)';

  return (
    <span
      style={{
        padding: '4px 10px',
        background,
        borderRadius: 999,
        display: 'inline-flex',
      }}
    >
      <span className="type-label-sm type-emphasis-semibold" style={{ color: foreground }}>
        {statusLabel(status)}
      </span>
    </span>
  );
}

function statusLabel(status: string): string {
  switch (status) {
    case 'completed':
      return 'Completed';
    case 'success':
      return 'Success';
    case 'pending':
      return 'Pending';
    case 'processing':
      return 'Processing';
    case 'failed':
      return 'Failed';
    case 'cancelled':
      return 'Cancelled';
    case 'refunded':
      return 'Refunded';
    default:
      return status.replaceAll('_', ' ');
  }
}

/**
 * `_NonSessionBlock` — a w600 title, an optional supporting line, an optional
 * "Couldn't load session details" line, and the date.
 *
 * `_content` is where the transaction type turns into human words, and it is a
 * DIFFERENT mapping from the tile's `_label`: a top-up is "Added to wallet"
 * here and "Wallet Top-up" on the row behind the sheet. The description is the
 * `referenceId` for a top-up ("Payment ID: pay_…") and `notes` for everything
 * that carries them.
 */
function NonSessionBlock({
  transaction,
  fallback = false,
}: {
  transaction: Transaction;
  fallback?: boolean;
}) {
  const [title, description] = content(transaction, fallback);
  const dateStr = formatDateTimeShort(transaction.createdAt);

  return (
    <div style={{ padding: '0 16px' }}>
      <div
        style={{
          width: '100%',
          padding: 16,
          background: 'var(--surface-primary)',
          borderRadius: 'var(--ds-radius-md)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
        }}
      >
        <span className="type-title-sm type-emphasis-semibold" style={{ color: 'var(--text-heading)' }}>
          {title}
        </span>

        {description !== null && (
          <>
            <div style={{ height: 4 }} />
            <span className="type-body-sm" style={{ color: 'var(--text-body)' }}>
              {description}
            </span>
          </>
        )}

        {fallback && (
          <>
            <div style={{ height: 4 }} />
            <span className="type-body-sm" style={{ color: 'var(--text-body-light)' }}>
              {"Couldn't load session details"}
            </span>
          </>
        )}

        <div style={{ height: 8 }} />
        <span className="type-body-sm" style={{ color: 'var(--text-body-light)' }}>
          {dateStr}
        </span>
      </div>
    </div>
  );
}

/** `_content` — `[title, description]`, with `null` for an absent second line. */
function content(t: Transaction, fallback: boolean): [string, string | null] {
  if (fallback) return [t.otherUserName ?? 'Session', null];

  switch (t.type as TransactionType) {
    case 'wallet_topup':
    case 'wallet_credit':
      return [
        'Added to wallet',
        t.referenceId !== null && t.referenceId !== '' ? `Payment ID: ${t.referenceId}` : null,
      ];
    case 'refund':
      return ['Refund', t.notes];
    case 'payout':
      return ['Payout to bank', null];
    case 'clawback':
      return ['Adjustment', t.notes];
    case 'balance_correction':
    case 'adjustment':
      return ['Wallet adjustment', t.notes];
    case 'cashback':
      return ['Cashback', t.notes];
    default:
      return [typeLabel(t), t.notes];
  }
}
