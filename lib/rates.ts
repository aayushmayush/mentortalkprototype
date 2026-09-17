/**
 * `core/lib/utils/rate_formatter.dart`, transcribed.
 *
 * Whole numbers lose their decimals (`10` → `"10"`); fractional values keep
 * two (`12.5` → `"12.50"`). Note the asymmetry — it is the source's, and it is
 * visible on the mentor cards, where a discounted `13.5` reads `13.50` next to
 * a struck-through `18`.
 */
export function formatRate(rate: number): string {
  return Number.isInteger(rate) ? rate.toFixed(0) : rate.toFixed(2);
}

/**
 * `currency_format.dart` — `double.inr`, and NOT `inrGrouped`.
 *
 * The extension has three members and they are not interchangeable:
 *
 *   inr        → '₹' + formatAmount   → `₹1000`   ← this one
 *   inrGrouped → NumberFormat(en_IN)  → `₹1,000`
 *   formatAmount → toStringAsFixed    → `1000`
 *
 * The money the app shows a student — the balance, a receipt total, a package
 * price, a top-up chip — all go through `inr`, which is UNGROUPED: Dart's
 * `toStringAsFixed` has no thousands separator. `inrGrouped` exists and is used
 * almost nowhere.
 *
 * This helper originally grouped, which was wrong. Caught while porting the
 * wallet, where the ₹1000 preset chip sits next to the balance card and both
 * read `₹1000` in the app. Corrected here so every existing caller — the
 * session receipt's `totalAmount`/`totalEarning`, and the T4 screens — is
 * right at once.
 */
export function formatInr(amount: number): string {
  return `₹${Number.isInteger(amount) ? amount.toFixed(0) : amount.toFixed(2)}`;
}
