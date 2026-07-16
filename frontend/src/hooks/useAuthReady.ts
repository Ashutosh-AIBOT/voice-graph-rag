'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/auth';

/**
 * True once the persisted auth store has actually rehydrated from localStorage —
 * not after a guessed timeout. Avoids incorrectly treating an authenticated user
 * as logged out on a slow device, and avoids an unnecessary blank-screen delay
 * on a fast one.
 */
export function useAuthReady(): boolean {
  const [ready, setReady] = useState(() => useAuthStore.persist.hasHydrated());

  useEffect(() => {
    if (ready) return;
    const unsub = useAuthStore.persist.onFinishHydration(() => setReady(true));
    // In case hydration finished between the initial state read and this effect running.
    if (useAuthStore.persist.hasHydrated()) setReady(true);
    return unsub;
  }, [ready]);

  return ready;
}
