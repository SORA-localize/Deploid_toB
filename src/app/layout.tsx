import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import { Header } from '@/components/Header';
import { HeaderChromeProvider } from '@/components/HeaderChrome';
import { Footer } from '@/components/Footer';
import { ThemeProvider } from '@/components/ThemeProvider';
import { Toaster } from '@/components/ui/sonner';
import { AnalyticsScripts } from '@/components/AnalyticsScripts';
import { env } from '@/lib/env';
import {
  defaultSiteDescription,
  defaultSiteTitle,
  defaultSocialDescription,
} from '@/lib/metadata';
import { siteUrl } from '@/lib/site';
import './globals.css';
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: defaultSiteTitle,
    template: '%s | Deploid',
  },
  description: defaultSiteDescription,
  icons: {
    icon: [
      { url: '/brand/deploid-symbol-square.png', type: 'image/png', sizes: '512x512' },
    ],
    shortcut: ['/brand/deploid-symbol-square.png'],
    apple: [
      { url: '/brand/deploid-symbol-square.png', type: 'image/png', sizes: '512x512' },
    ],
  },
  openGraph: {
    type: 'website',
    locale: 'ja_JP',
    siteName: 'Deploid',
    title: defaultSiteTitle,
    description: defaultSocialDescription,
  },
  twitter: {
    card: 'summary_large_image',
    title: defaultSiteTitle,
    description: defaultSocialDescription,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" suppressHydrationWarning className={cn("font-sans", geist.variable)}>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <HeaderChromeProvider>
            <div className="min-h-screen bg-background text-foreground flex flex-col">
              <a
                href="#main-content"
                className="absolute left-4 top-4 z-50 -translate-y-20 rounded bg-background px-4 py-2 text-sm font-medium text-foreground ring-1 ring-border transition-transform focus:translate-y-0"
              >
                コンテンツへスキップ
              </a>
              <Header />
              <main id="main-content" tabIndex={-1} className="flex-1 outline-none">{children}</main>
              <Footer />
            </div>
            <Toaster />
          </HeaderChromeProvider>
        </ThemeProvider>
        <AnalyticsScripts
          gaMeasurementId={env.gaMeasurementId}
          clarityProjectId={env.clarityProjectId}
          enabled={env.isVercelProduction || (env.isProd && !process.env.VERCEL_ENV)}
        />
        <Analytics />
      </body>
    </html>
  );
}
