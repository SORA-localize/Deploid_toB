import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import { Header } from '@/components/Header';
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
          <div className="min-h-screen bg-background text-foreground flex flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
