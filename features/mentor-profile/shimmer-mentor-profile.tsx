'use client';

/**
 * ShimmerMentorProfile — port of
 * `ui/mentor_profile/widgets/shimmer_mentor_profile.dart`.
 *
 * ── It does NOT match the layout it replaces ────────────────────────────────
 *
 * This is worth stating plainly because it is a real jerk in the production app,
 * not an oversight in the port. The loaded screen opens with a 370px hero whose
 * info card overlaps the photo's bottom 70px; this skeleton opens with a flat
 * 300px grey block, then 16px, then the card as a separate box below it. So when
 * the fetch resolves, the card jumps 70px up and the whole page above the tab
 * bar shifts. Reproduced exactly, because smoothing it over here would hide a
 * layout bug that the team may want to fix in the app itself.
 *
 * ── The hero's hardcoded colour is dead code ────────────────────────────────
 *
 * The hero placeholder is written as `Container(color: Color(0xFFEBEBF4))`, and
 * it never shows. `ShimmerLoading` wraps its child in
 * `ShaderMask(blendMode: BlendMode.srcATop)`, which replaces the child's paint
 * wherever the child is opaque — so the gradient (surface.shimmerBase →
 * shimmerHighlight) is what actually appears, and the literal is only the
 * pre-shader fallback for a box that has not laid out yet. It is NOT reproduced
 * here: painting #EBEBF4 would be a faithful transcription of a line with no
 * effect, which is worse than omitting it. Recorded instead.
 *
 * The one real token in the file is the card behind the bones, `surface.primary`.
 */

export function ShimmerMentorProfile() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* Hero photo placeholder — a flat 300, see the layout note above. */}
      <div className="shimmer-bone" style={{ width: '100%', height: 300 }} />

      <div style={{ height: 16 }} />

      {/* Info card */}
      <div style={{ padding: '0 var(--page-padding-horizontal)' }}>
        <div
          style={{
            width: '100%',
            padding: 'var(--spacing-md)',
            background: 'var(--surface-primary)',
            borderRadius: 'var(--ds-radius-md)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
          }}
        >
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
            <Bone width={160} height={20} />
            <Bone width={50} height={20} />
          </div>
          <div style={{ height: 8 }} />
          <Bone width={80} height={12} />
          <div style={{ height: 4 }} />
          <Bone width={100} height={12} />
          <div style={{ height: 12 }} />
          <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between' }}>
            <Bone width={70} height={16} />
            <Bone width={72} height={28} />
          </div>
        </div>
      </div>

      <div style={{ height: 20 }} />

      {/* Tab bar placeholder */}
      <div style={{ padding: '0 var(--page-padding-horizontal)', width: '100%', boxSizing: 'border-box' }}>
        <Bone width="100%" height={44} />
      </div>

      <div style={{ height: 16 }} />

      {/* Bio placeholder */}
      <div
        style={{
          padding: '0 var(--page-padding-horizontal)',
          width: '100%',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
        }}
      >
        <Bone width="100%" height={12} />
        <div style={{ height: 6 }} />
        <Bone width="100%" height={12} />
        <div style={{ height: 6 }} />
        <Bone width={200} height={12} />
      </div>

      <div style={{ height: 20 }} />

      {/* Info rows card placeholder — three rows of circle + line. */}
      <div style={{ padding: '0 var(--page-padding-horizontal)' }}>
        <div
          style={{
            width: '100%',
            padding: 'var(--spacing-md)',
            background: 'var(--surface-primary)',
            borderRadius: 'var(--ds-radius-md)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
          }}
        >
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ width: '100%' }}>
              {i > 0 ? <div style={{ height: 24 }} /> : null}
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <CircleBone diameter={48} />
                <div style={{ width: 12 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Bone width={140} height={14} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * `ShimmerBone` / `ShimmerCircleBone` — the source's two placeholder shapes.
 *
 * `ShimmerBone` defaults to `borderRadius: 6`, so a 12px bar is a pill; the
 * circle bone is the avatar case. A `width` of `'100%'` is the `double.infinity`
 * case.
 */
function Bone({
  width,
  height,
}: {
  width: number | string;
  height: number;
}) {
  return (
    <div className="shimmer-bone" style={{ width, height, borderRadius: 6 }} />
  );
}

function CircleBone({ diameter }: { diameter: number }) {
  return (
    <div
      className="shimmer-bone"
      style={{
        width: diameter,
        height: diameter,
        borderRadius: '50%',
        flexShrink: 0,
      }}
    />
  );
}
