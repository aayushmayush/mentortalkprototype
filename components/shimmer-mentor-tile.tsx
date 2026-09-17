/**
 * ShimmerMentorTile — port of `ui/mentors/widgets/shimmer_mentor_tile.dart`.
 *
 * The horizontal counterpart to `ShimmerMentorCard`, and every element of the
 * real tile has a matching bone — avatar in a ring, name + verified dot,
 * category, rate, rating badge. The bone widths are the source's own, so the
 * skeleton has the same rhythm as the row it replaces.
 *
 * Note the tile's own chrome: a 16px radius, a **0.5px** `border.primaryLight`
 * border, 14px padding, and 16/5 margins. The hairline border is deliberate in
 * the source and is what separates the tile from the page background.
 */
export function ShimmerMentorTile() {
  return (
    <div
      style={{
        margin: '5px 16px',
        padding: 14,
        background: 'var(--surface-primary)',
        borderRadius: 16,
        border: '0.5px solid var(--border-primary-light)',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {/* Avatar in a 2px ring, with 2px inset padding. */}
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          border: '2px solid var(--surface-shimmer-base)',
          padding: 2,
          flex: '0 0 auto',
          boxSizing: 'border-box',
        }}
      >
        <div
          className="shimmer-bone"
          style={{ width: '100%', height: '100%', borderRadius: '50%' }}
        />
      </div>

      <div style={{ width: 14 }} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div className="shimmer-bone" style={{ width: 110, height: 14, borderRadius: 6 }} />
          <div className="shimmer-bone" style={{ width: 16, height: 16, borderRadius: '50%' }} />
        </div>
        <div style={{ height: 8 }} />
        <div className="shimmer-bone" style={{ width: 90, height: 10, borderRadius: 5 }} />
        <div style={{ height: 8 }} />
        <div className="shimmer-bone" style={{ width: 72, height: 12, borderRadius: 6 }} />
      </div>

      <div style={{ width: 8 }} />

      <div
        className="shimmer-bone"
        style={{ width: 52, height: 28, borderRadius: 8, flex: '0 0 auto' }}
      />
    </div>
  );
}

/** `ShimmerMentorTileList` — N tiles, no scroll. */
export function ShimmerMentorTileList({ count = 5 }: { count?: number }) {
  return (
    <div style={{ paddingBottom: 24 }}>
      {Array.from({ length: count }, (_, i) => (
        <ShimmerMentorTile key={i} />
      ))}
    </div>
  );
}
