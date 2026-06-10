import { Suspense } from 'react';
import Script from 'next/script';
import { GoogleAnalyticsPageView } from '@/components/GoogleAnalyticsPageView';

interface AnalyticsScriptsProps {
  gaMeasurementId: string | null;
  enabled: boolean;
}

export function AnalyticsScripts({ gaMeasurementId, enabled }: AnalyticsScriptsProps) {
  if (!enabled || !gaMeasurementId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${gaMeasurementId}', { send_page_view: false });
        `}
      </Script>
      <Suspense fallback={null}>
        <GoogleAnalyticsPageView measurementId={gaMeasurementId} />
      </Suspense>
    </>
  );
}
