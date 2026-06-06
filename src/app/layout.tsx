import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import { Header } from '@/components/Header';
import { HeaderChromeProvider } from '@/components/HeaderChrome';
import { Footer } from '@/components/Footer';
import { ThemeProvider } from '@/components/ThemeProvider';
import { siteUrl } from '@/lib/site';
import './globals.css';
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Deploid | ヒューマノイド導入判断ポータル',
    template: '%s | Deploid',
  },
  description:
    '日本のtoB事業者向けに、ヒューマノイドロボット、メーカー、用途、導入ガイド、記事を整理する導入判断ポータル。',
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
    title: 'Deploid | ヒューマノイド導入判断ポータル',
    description:
      '日本のtoB事業者向けに、ヒューマノイドロボットの導入判断に必要な変数を整理する情報基盤。',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Deploid | ヒューマノイド導入判断ポータル',
    description:
      '日本のtoB事業者向けに、ヒューマノイドロボットの導入判断に必要な変数を整理する情報基盤。',
  },
};

// Figma Layout.tsx を逐語移植（Outlet → children）。
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
          </HeaderChromeProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
