'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

interface GoogleAnalyticsPageViewProps {
  measurementId: string;
}

export function GoogleAnalyticsPageView({ measurementId }: GoogleAnalyticsPageViewProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!window.gtag) return;

    const query = searchParams.toString();
    const pagePath = query ? `${pathname}?${query}` : pathname;

    window.gtag('config', measurementId, {
      page_path: pagePath,
    });
  }, [measurementId, pathname, searchParams]);

  return null;
}
