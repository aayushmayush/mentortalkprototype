/**
 * Date formatting.
 *
 * There is exactly one pattern in the app's money and session surfaces —
 * `DateFormat('d MMM y, h:mm a')`, "4 Sep 2026, 3:20 pm" — and it appears in
 * three unrelated files: the wallet's transaction tile, the transaction detail
 * sheet, and the session receipt's `_DetailsCard`. They are the same string,
 * so they share one implementation here.
 *
 * `intl`'s `h` is a 12-hour clock with no leading zero and `a` is the locale's
 * meridiem, so `en-US` yields "PM" where a device set to `en_IN` would yield
 * "pm". The source does NOT lowercase it — unlike the chat screen's
 * `_SystemMessage` timestamp, which does, and which therefore keeps its own
 * formatter.
 */
export function formatDateTimeShort(iso: string): string {
  const date = new Date(iso);
  const day = date.getDate();
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const year = date.getFullYear();
  const time = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `${day} ${month} ${year}, ${time}`;
}
