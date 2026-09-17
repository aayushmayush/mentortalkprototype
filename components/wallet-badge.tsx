import { AppIcon } from '@/design-system';

/**
 * WalletBadge — port of `ui/home/widgets/wallet_badge.dart`.
 *
 * A pill in the app bar showing the live balance. Two details from the source:
 *
 * - The rupee glyph is `Icons.currency_rupee` at 16px — a raw Material icon,
 *   not an `AppIcons` constant, which is why it is named directly here.
 * - The amount is rendered **bare** (`'$balance'`), with no grouping and no
 *   decimals. A balance of 1250.5 reads `1250.5`, not `₹1,250.50` — the app's
 *   own `formatInr` helper is deliberately not used on this badge.
 */
export function WalletBadge({ balance, onTap }: { balance: number; onTap?: () => void }) {
  return (
    <div
      onClick={onTap}
      style={{
        padding: '6px 10px',
        background: 'var(--surface-primary)',
        borderRadius: 20,
        display: 'inline-flex',
        alignItems: 'center',
        cursor: onTap ? 'pointer' : 'default',
      }}
    >
      <AppIcon name="currencyRupee" size="sm" color="var(--text-heading)" />
      <div style={{ width: 2 }} />
      <span className="type-title-sm type-emphasis-bold" style={{ color: 'var(--text-heading)' }}>
        {balance}
      </span>
    </div>
  );
}
