'use client';

import { SupportChatPage } from '@/features/support/support-chat-page';

/**
 * Support chat — route wrapper.
 *
 * Port of core/lib/support/ui/support_chat_screen.dart — shared between the two
 * apps, so it lives outside both feature sets upstream.
 *
 * Adds nothing but the address: the screen takes no arguments, and in production
 * it is a `Navigator.push` rather than a named route.
 */
export default function SupportChatPageRoute() {
  return <SupportChatPage />;
}
