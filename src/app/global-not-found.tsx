import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { Header } from '@/components/Header';
import { HeaderChromeProvider } from '@/components/HeaderChrome';
import { Footer } from '@/components/Footer';
import { ThemeProvider } from '@/components/ThemeProvider';
import { AnalyticsScripts } from '@/components/AnalyticsScripts';
import { NotFoundContent } from '@/components/NotFoundContent';
import { env } from '@/lib/env';
import { defaultSiteTitle } from '@/lib/metadata';
import { siteUrl } from '@/lib/site';
import { cn } from '@/lib/utils';
import './(frontend)/globals.css';

/**
 * `global-not-found.tsx`（Next.js 16、`experimental.globalNotFound`）は、どのrouteにも
 * 一致しないURL（typo・古い外部リンク・crawlerなど）専用。`(frontend)`と`(payload)`という
 * 独立した2つのroot layoutへ分割した結果（Task 2）、この2つのどちらのlayoutにも属さない
 * URLに対してNext.jsが選べるroot layoutが無くなり、素のfallback（無地の404）を返すように
 * なっていた（reviewer指摘）。このfileはlayoutを一切経由しないため、必要なglobal CSS・font・
 * themeをここで自前で読み込む（Next公式docsの注意書き通り）。
 *
 * 中身は `(frontend)/layout.tsx` + `(frontend)/not-found.tsx` とほぼ同じ構成
 * （Header/Footer/ThemeProviderを含む）にして、ブランドの無い404にならないようにする。
 * `route segment`内で`notFound()`を呼んだ場合（例: `/robots/nope`）は従来通り
 * `(frontend)/not-found.tsx`（`NotFoundContent`を共有）が使われ、ここは通らない。
 */
const geist = Geist({ subsets: ['latin'], variable: '--font-sans' });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: `404 | ${defaultSiteTitle}`,
  description: 'URLが変更されたか、ページが削除された可能性があります。',
};

export default function GlobalNotFound() {
  return (
    <html lang="ja" suppressHydrationWarning className={cn('font-sans', geist.variable)}>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <HeaderChromeProvider>
            <div className="min-h-screen bg-background text-foreground flex flex-col">
              <Header />
              <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
                <NotFoundContent />
              </main>
              <Footer />
            </div>
          </HeaderChromeProvider>
        </ThemeProvider>
        <AnalyticsScripts
          gaMeasurementId={env.gaMeasurementId}
          clarityProjectId={env.clarityProjectId}
          enabled={env.analyticsEnabled}
        />
        {env.vercelAnalyticsEnabled ? <Analytics /> : null}
      </body>
    </html>
  );
}
