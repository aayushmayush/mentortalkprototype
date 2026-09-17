'use client';

import { Suspense } from 'react';
import { ChatPage } from '@/features/chat/chat-page';

/**
 * The chat thread, given a URL.
 *
 * `?mentor=<id>` names the thread; `?start=1` asks for a session to be
 * requested on open, which is how the mentor profile's Chat button deep-links
 * into a live session. Production pushes a `MaterialPageRoute` with the id as a
 * constructor argument instead — there is no URL — but the screen itself is
 * unchanged.
 *
 * The `Suspense` boundary is not decorative: `useSearchParams` opts the subtree
 * into client-side rendering, and Next fails the production build with
 * "useSearchParams() should be wrapped in a suspense boundary" if it is
 * missing. `next dev` tolerates it, so this only bites at build time.
 */
export default function ChatRoute() {
  return (
    <Suspense fallback={null}>
      <ChatPage />
    </Suspense>
  );
}
