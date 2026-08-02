'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { URL_CHANGE_EVENT } from '@/lib/catalog/urlState';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

interface GoogleAnalyticsPageViewProps {
  measurementId: string;
}

function reportPageView(measurementId: string, pagePath: string) {
  if (!window.gtag) return;
  window.gtag('config', measurementId, { page_path: pagePath });
}

export function GoogleAnalyticsPageView({ measurementId }: GoogleAnalyticsPageViewProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 通常のNext.js遷移（router.push/replaceや実popstate）は usePathname/useSearchParams
  // が再評価するのでここで捕捉できる。
  useEffect(() => {
    const query = searchParams.toString();
    reportPageView(measurementId, query ? `${pathname}?${query}` : pathname);
  }, [measurementId, pathname, searchParams]);

  // カタログフィルタ（lib/catalog/urlState.ts の updateCatalogUrl）は
  // window.history.pushState/replaceState を直接呼ぶため、next/navigationの
  // usePathname/useSearchParams はこれを検知しない（popstateではないため）。
  // urlState.ts が同じ操作で dispatch する deploid:urlchange を購読して補う。
  useEffect(() => {
    const handleUrlChange = () => {
      reportPageView(measurementId, `${window.location.pathname}${window.location.search}`);
    };
    window.addEventListener(URL_CHANGE_EVENT, handleUrlChange);
    return () => window.removeEventListener(URL_CHANGE_EVENT, handleUrlChange);
  }, [measurementId]);

  return null;
}
