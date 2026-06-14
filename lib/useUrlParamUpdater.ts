'use client';

import { useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';

type UrlParamValue = string | null | undefined;
type UrlUpdateMode = 'push' | 'replace';

export function useUrlParamUpdater() {
  const pathname = usePathname();
  const router = useRouter();

  const updateParams = useCallback(
    (updates: Record<string, UrlParamValue>, mode: UrlUpdateMode = 'push') => {
      const nextParams = new URLSearchParams(
        typeof window === 'undefined' ? '' : window.location.search,
      );

      Object.entries(updates).forEach(([key, value]) => {
        const nextValue = value?.trim();
        if (!nextValue) {
          nextParams.delete(key);
          return;
        }
        nextParams.set(key, nextValue);
      });

      const query = nextParams.toString();
      const href = query ? `${pathname}?${query}` : pathname;
      if (mode === 'replace') {
        router.replace(href, { scroll: false });
        return;
      }
      router.push(href, { scroll: false });
    },
    [pathname, router],
  );

  return { updateParams };
}
