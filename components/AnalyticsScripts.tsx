import { Suspense } from 'react';
import Script from 'next/script';
import { GoogleAnalyticsPageView } from '@/components/GoogleAnalyticsPageView';

interface AnalyticsScriptsProps {
  gaMeasurementId: string | null;
  clarityProjectId: string | null;
  enabled: boolean;
}

export function AnalyticsScripts({ gaMeasurementId, clarityProjectId, enabled }: AnalyticsScriptsProps) {
  if (!enabled) return null;

  return (
    <>
      {gaMeasurementId && (
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
      )}
      {clarityProjectId && (
        <Script id="microsoft-clarity" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window,document,"clarity","script","${clarityProjectId}");
          `}
        </Script>
      )}
    </>
  );
}
