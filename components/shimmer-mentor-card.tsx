/**
 * ShimmerMentorCard — port of `ui/home/widgets/shimmer_mentor_card.dart`.
 *
 * Matches `MentorCard.compact`'s footprint exactly (164 wide, same paddings)
 * so the rail does not jump when the real cards replace the bones. The shimmer
 * itself is `.shimmer-bone` from the motion tokens, which reproduces the
 * source's five-stop `ShaderMask` sweep.
 */
export function ShimmerMentorCard() {
  return (
    <div
      style={{
        width: 164,
        padding: '12px 8px',
        background: 'var(--surface-primary)',
        borderRadius: 'var(--ds-radius-md)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        flex: '0 0 auto',
      }}
    >
      <div
        className="shimmer-bone"
        style={{ width: 88, height: 88, borderRadius: '50%' }}
      />

      <div style={{ height: 18 }} />

      <div className="shimmer-bone" style={{ width: 104, height: 14, borderRadius: 6 }} />
      <div style={{ height: 8 }} />
      <div className="shimmer-bone" style={{ width: 76, height: 10, borderRadius: 5 }} />
      <div style={{ height: 8 }} />
      <div className="shimmer-bone" style={{ width: 60, height: 10, borderRadius: 5 }} />
      <div style={{ height: 10 }} />
      <div className="shimmer-bone" style={{ width: 84, height: 14, borderRadius: 6 }} />
    </div>
  );
}
