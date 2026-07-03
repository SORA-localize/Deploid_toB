'use client';

import { useCallback, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';

type UrlParamValue = string | null | undefined;
type UrlUpdateMode = 'push' | 'replace';

/**
 * フィルタ用URL更新の共通フック。Next.js App Router のクライアント内遷移は、
 * 新しいRSCペイロードが届くまで前の画面をそのまま表示し続ける（Suspense fallback は
 * 初回ロード時のみ）。isPending をUIが使えるようにして、クリックから反映までの
 * 無反応な待ち時間に視覚フィードバックを出せるようにする。
 */
export function useUrlParamUpdater() {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

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
      startTransition(() => {
        if (mode === 'replace') {
          router.replace(href, { scroll: false });
          return;
        }
        router.push(href, { scroll: false });
      });
    },
    [pathname, router],
  );

  return { updateParams, isPending };
}
