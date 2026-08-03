'use client';

import { useCallback, useSyncExternalStore } from 'react';

/**
 * media query の一致状態を購読する。motion package の `useReducedMotion` を
 * 置き換えるための最小実装で、SSR時は false を返す（hydration mismatch を避ける）。
 * `components/ui/AnimatedTooltip.tsx` の `useHoverDevice` と同じ方式。
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const mediaQuery = window.matchMedia(query);
      mediaQuery.addEventListener('change', onStoreChange);
      return () => mediaQuery.removeEventListener('change', onStoreChange);
    },
    [query],
  );
  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);
  const getServerSnapshot = useCallback(() => false, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
