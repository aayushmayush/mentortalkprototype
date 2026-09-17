'use client';

import { AppAvatar, AppIcon } from '@/design-system';
import {
  ceiledDurationDisplay,
  counterparty,
  formatDetailTimestamp,
  isFreeChat,
  sessionTypeIcon,
  sessionTypeLabel,
  totalAmountDisplay,
  totalEarningDisplay,
  type SessionDetail,
  type SessionReview,
} from '@/lib/session/session-detail';

/**
 * SessionDetailsBlock — port of
 * `core/lib/session/ui/widgets/session_details_block.dart`.
 *
 * The full receipt: counterparty, bare amount, status pill, a compact
 * `{type} · {ceiled minutes}` card with the timestamp, and the mentee's review
 * if there is one. Two callers share it, which is why it is a block and not a
 * sheet — `SessionDetailSheet` wraps it, and the wallet's
 * `TransactionDetailSheet` inlines it when a transaction is session-linked.
 *
 * ── The two ambers ──────────────────────────────────────────────────────────
 *
 * The review card's stars are the literal `Colors.amber` (`#FFC107`), NOT
 * `colors.icon.warning`. The post-session `ReviewSheet` two files away uses
 * `icon.warning` for its stars. So the app has two different ambers for the
 * same five-pointed shape, one feature apart, and this reproduces both.
 *
 * ── The empty-note and the unstarted-session cases ──────────────────────────
 *
 * An absent counterparty renders `'—'`, an em dash, rather than a blank line.
 * And the timestamp falls back to `startedAt` when `endedAt` is null — a
 * session that never ended still has a time to show.
 *
 * ── `onAvatarTap` is what makes the block reusable ──────────────────────────
 *
 * Null hides the affordance entirely; the sheet passes nothing, and the wallet
 * passes a handler that pushes the counterparty's profile. The tap target is
 * the avatar AND the name, wrapped together.
 */

const PAGE_PADDING = 16;
const SPACING_SM = 8;
const SPACING_MD = 16;
const SPACING_LG = 24;

export function SessionDetailsBlock({
  detail,
  isMentor,
  onAvatarTap,
}: {
  detail: SessionDetail;
  isMentor: boolean;
  onAvatarTap?: () => void;
}) {
  const peer = counterparty(detail, isMentor);

  return (
    <div
      style={{
        padding: `0 ${PAGE_PADDING}px`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'stretch',
      }}
    >
      <Header participant={peer} onTap={onAvatarTap} />

      <div style={{ height: SPACING_LG }} />

      <Amount detail={detail} isMentor={isMentor} />

      <div style={{ height: SPACING_LG }} />

      <DetailsCard detail={detail} />

      {detail.review !== null && (
        <>
          <div style={{ height: SPACING_MD }} />
          <ReviewCard review={detail.review} />
        </>
      )}
    </div>
  );
}

/** `_Header` — an `AppAvatar.lg` (88) over a titleMedium name. */
function Header({
  participant,
  onTap,
}: {
  participant: { name: string; avatar: string | null } | null;
  onTap?: () => void;
}) {
  const name = participant?.name ?? '';

  return (
    <div
      onClick={onTap}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: onTap ? 'pointer' : 'default',
      }}
    >
      <AppAvatar name={name} imageUrl={participant?.avatar ?? null} size="lg" />
      <div style={{ height: SPACING_SM }} />
      <span
        className="type-title-md type-emphasis-semibold"
        style={{ color: 'var(--text-heading)' }}
      >
        {name === '' ? '—' : name}
      </span>
    </div>
  );
}

/**
 * `_Amount` — the number the user actually paid or earned, with no label above
 * it. A free session renders the word `Free` in the action colour instead, which
 * is the only place the amount is not a figure.
 */
function Amount({ detail, isMentor }: { detail: SessionDetail; isMentor: boolean }) {
  const free = isFreeChat(detail);
  const text = free
    ? 'Free'
    : isMentor
      ? totalEarningDisplay(detail)
      : totalAmountDisplay(detail);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <span
        className="type-headline-md type-emphasis-bold"
        style={{ color: free ? 'var(--text-action)' : 'var(--text-heading)' }}
      >
        {text}
      </span>

      <div style={{ height: SPACING_SM }} />

      <StatusPill status={detail.status} />
    </div>
  );
}

/**
 * `_StatusPill` — a fully-rounded chip whose two working states are hardcoded
 * Material colour pairs (`0xFFE8F5E9`/`0xFF2E7D32` for green,
 * `0xFFFFEBEE`/`Colors.red.shade600` for red) rather than theme tokens, exactly
 * like the account grid's four icons. Anything that is neither completed nor
 * failed falls back to `surface.disabled` with `text.bodyLight`.
 */
function StatusPill({ status }: { status: string }) {
  const isSuccess = status === 'completed';
  const isFailed =
    status === 'cancelled' || status === 'rejected' || status === 'timed_out';

  const background = isSuccess
    ? '#E8F5E9'
    : isFailed
      ? '#FFEBEE'
      : 'var(--surface-disabled)';
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
      <span
        className="type-label-sm type-emphasis-semibold"
        style={{ color: foreground }}
      >
        {statusLabel(status)}
      </span>
    </span>
  );
}

/** `_label` — four named states, then `_` → space for anything else. */
function statusLabel(status: string): string {
  switch (status) {
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    case 'rejected':
      return 'Rejected';
    case 'timed_out':
      return 'Timed out';
    default:
      return status.replaceAll('_', ' ');
  }
}

/**
 * `_DetailsCard` — an 18px type glyph, the type label in w600, a 4×4 bullet dot
 * and the ceiled duration, then the timestamp on its own line.
 *
 * The dot is a plain 4×4 circle in `text.bodyLight`; it is the only decorative
 * element in the block, and it is doing real work — separating the two facts
 * without a second icon.
 */
function DetailsCard({ detail }: { detail: SessionDetail }) {
  return (
    <div
      style={{
        width: '100%',
        padding: SPACING_MD,
        background: 'var(--surface-primary)',
        borderRadius: 'var(--ds-radius-md)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <AppIcon name={sessionTypeIcon(detail.sessionType)} px={18} color="var(--icon-primary)" />
        <div style={{ width: SPACING_SM }} />
        <span
          className="type-body-md type-emphasis-semibold"
          style={{ color: 'var(--text-body)' }}
        >
          {sessionTypeLabel(detail.sessionType)}
        </span>
        <div style={{ width: SPACING_SM }} />
        <div
          style={{
            width: 4,
            height: 4,
            borderRadius: '50%',
            background: 'var(--text-body-light)',
          }}
        />
        <div style={{ width: SPACING_SM }} />
        <span className="type-body-sm" style={{ color: 'var(--text-body-light)' }}>
          {ceiledDurationDisplay(detail)}
        </span>
      </div>

      <div style={{ height: 8 }} />

      <span className="type-body-sm" style={{ color: 'var(--text-body-light)' }}>
        {formatDetailTimestamp(detail.endedAt ?? detail.startedAt)}
      </span>
    </div>
  );
}

/**
 * `_ReviewCard` — a "Review" label with five 16px stars flush right, then the
 * comment if there is one.
 *
 * The stars are truncated by `i < rating`, so a 4.0 shows four filled and one
 * outline — no half-star, because the rating is a double and the glyph set has
 * no way to express 3.5. That is the source's behaviour, not a rounding choice
 * made here.
 */
function ReviewCard({ review }: { review: SessionReview }) {
  return (
    <div
      style={{
        width: '100%',
        padding: SPACING_MD,
        background: 'var(--surface-primary)',
        borderRadius: 'var(--ds-radius-md)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
        <span
          className="type-label-lg type-emphasis-semibold"
          style={{ color: 'var(--text-body-light)' }}
        >
          Review
        </span>

        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', alignItems: 'center' }}>
          {Array.from({ length: 5 }, (_, i) => (
            <AppIcon
              key={i}
              name={i < review.rating ? 'starRounded' : 'starOutlined'}
              px={16}
              // `Colors.amber`, not `icon.warning`. See the file header.
              color={i < review.rating ? '#FFC107' : 'var(--icon-disabled)'}
            />
          ))}
        </div>
      </div>

      {review.comment !== null && review.comment !== '' && (
        <>
          <div style={{ height: SPACING_SM }} />
          <span className="type-body-sm" style={{ color: 'var(--text-body)' }}>
            {review.comment}
          </span>
        </>
      )}
    </div>
  );
}
