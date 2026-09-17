import { AppIcon } from '@/design-system';
import { copy } from '@/lib/copy';

/**
 * HomeSearchBar — port of `ui/home/widgets/home_search_bar.dart`.
 *
 * Not an input. It is a 44px `Container` styled to look like one, wrapped in a
 * `GestureDetector` that pushes the search page — the field itself never takes
 * focus, so the placeholder is plain text rather than a `hintText`.
 *
 * Reading it as a real input is the obvious way to get this wrong: it would
 * then need focus states, a keyboard, and a cleared/typed distinction that
 * production does not have.
 */
export function HomeSearchBar({ onTap }: { onTap?: () => void }) {
  return (
    <div style={{ padding: '0 20px' }}>
      <div
        onClick={onTap}
        style={{
          height: 44,
          padding: '0 14px',
          display: 'flex',
          alignItems: 'center',
          background: 'var(--surface-primary)',
          borderRadius: 'var(--ds-radius-lg)',
          cursor: onTap ? 'pointer' : 'default',
        }}
      >
        <AppIcon name="search" size="sm" color="var(--text-body-light)" />
        <div style={{ width: 8 }} />
        <span className="type-body-md" style={{ color: 'var(--text-body-light)' }}>
          {copy.searchPlaceholder}
        </span>
      </div>
    </div>
  );
}
