'use client';

import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

type UrlFilterValue = string | null | undefined;
type UrlUpdateMode = 'push' | 'replace';

export function useUrlFilters() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const getParam = useCallback((key: string) => searchParams.get(key), [searchParams]);

  const updateParams = useCallback(
    (updates: Record<string, UrlFilterValue>, mode: UrlUpdateMode = 'push') => {
      const nextParams = new URLSearchParams(searchParams.toString());

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
    [pathname, router, searchParams],
  );

  return { getParam, updateParams };
}
