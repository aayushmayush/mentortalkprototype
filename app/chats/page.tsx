'use client';

import { ChatsPage } from '@/features/chats/chats-page';

/**
 * The mentor inbox. The app bar calls it "Order History" — see the page's own
 * header for why that is reproduced rather than corrected.
 *
 * In production this is a `Navigator.push` from the home feed's "Recent
 * Sessions" header and from the chat tab; there is no route. The page takes no
 * arguments, so this file adds nothing but the address.
 */
export default function ChatsRoute() {
  return <ChatsPage />;
}
