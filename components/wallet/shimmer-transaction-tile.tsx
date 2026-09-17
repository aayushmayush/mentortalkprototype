/**
 * ShimmerTransactionTile / ShimmerTransactionList — port of
 * `ui/wallet/widgets/shimmer_transaction_tile.dart`.
 *
 * The bone layout mirrors `TransactionTile`'s footprint so the list does not
 * jump when the rows arrive: a 40×40 radius-10 icon bone, a 140-wide title bone
 * over a 60-wide date bone, and a 56-wide amount bone on the right.
 *
 * ── A deliberate divergence in the bone SHAPE, not the layout ───────────────
 *
 * The source wraps each tile in `ShimmerLoading`, which masks the whole
 * container with ONE gradient shared across the scope — so the light band
 * sweeps across all five rows in phase, as a single band. That needs a
 * measurement pass (each child reports its offset into the scope's coordinate
 * space) that has no cheap CSS equivalent. Here each bone carries
 * `.shimmer-bone` independently, so the sweep is per-bone and in phase across
 * all of them because they share one animation — the same visual, arrived at
 * from the other end. The tile's four bones therefore read as one band only
 * while they are the same width; they are not, so the effect is slightly
 * softer than the app's. This is the one place in the wallet where the
 * prototype's shimmer is an approximation rather than a transcription.
 *
 * ── Fixed 5 rows, and why it matters beyond looks ───────────────────────────
 *
 * `ShimmerTransactionList` renders exactly 5. The wallet page shows it in three
 * different situations — the initial load, a page that matched no rows in the
 * active tab while `hasMore` is true, and each fetch of the Session Logs
 * paging loop. In all three the count is the same 5, so the list never changes
 * height while it is paging.
 */

const BONES = 5;

export function ShimmerTransactionTile() {
  return (
    <div
      style={{
        marginBottom: 10,
        padding: '12px 14px',
        background: 'var(--surface-primary)',
        borderRadius: 14,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <div
        className="shimmer-bone"
        style={{ width: 40, height: 40, borderRadius: 10, flex: '0 0 auto' }}
      />

      <div style={{ width: 12 }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="shimmer-bone" style={{ width: 140, height: 13, borderRadius: 6 }} />
        <div style={{ height: 6 }} />
        <div className="shimmer-bone" style={{ width: 60, height: 10, borderRadius: 5 }} />
      </div>

      <div style={{ width: 8 }} />

      <div
        className="shimmer-bone"
        style={{ width: 56, height: 14, borderRadius: 6, flex: '0 0 auto' }}
      />
    </div>
  );
}

/** `ShimmerTransactionList` — a 20px-gutter column of five tiles. */
export function ShimmerTransactionList({ count = BONES }: { count?: number }) {
  return (
    <div style={{ padding: '0 20px' }}>
      {Array.from({ length: count }, (_, i) => (
        <ShimmerTransactionTile key={i} />
      ))}
    </div>
  );
}
