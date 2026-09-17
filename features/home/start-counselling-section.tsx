import { AppIcon } from '@/design-system';

/**
 * StartCounsellingSection — port of
 * `ui/counselling/widgets/start_counselling_section.dart`.
 *
 * Note what is NOT used here: the source builds this block with raw
 * `TextStyle`s rather than theme slots — `fontSize: 15, fontWeight: w600` and
 * `fontSize: 12` — and hardcodes `Colors.white` for every child instead of
 * `text.onAction`. That is a one-off in an otherwise consistently themed app,
 * so the numbers are transcribed as-is rather than snapped to the type scale.
 *
 * It sits in `features/counselling/` in the Flutter tree but is rendered by the
 * home feed; it lives under `features/home/` here for the same reason it is
 * imported from there — the home feed is its only caller.
 */
export function StartCounsellingSection({ onTap }: { onTap?: () => void }) {
  return (
    <div style={{ padding: '0 var(--spacing-md)' }}>
      <div
        onClick={onTap}
        style={{
          width: '100%',
          padding: 16,
          background: 'var(--surface-action)',
          borderRadius: 16,
          display: 'flex',
          alignItems: 'center',
          cursor: onTap ? 'pointer' : 'default',
        }}
      >
        <AppIcon name="school" size="md" color="#FFFFFF" style={{ fontSize: 26, width: 26, height: 26 }} />

        <div style={{ width: 12 }} />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: '#FFFFFF', fontWeight: 600, fontSize: 15 }}>
            Need Exam Counselling?
          </div>
          <div style={{ height: 2 }} />
          <div style={{ color: '#FFFFFF', fontSize: 12 }}>
            Get expert NEET, JEE &amp; CUET guidance
          </div>
        </div>

        <AppIcon name="chevronRight" size="md" color="#FFFFFF" />
      </div>
    </div>
  );
}
