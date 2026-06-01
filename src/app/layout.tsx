import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { siteUrl } from '@/lib/site';
import 'maplibre-gl/dist/maplibre-gl.css';
import './globals.css';
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Deploid | ヒューマノイド導入判断ポータル',
    template: '%s | Deploid',
  },
  description:
    '日本のtoB事業者向けに、ヒューマノイドロボットの機種、メーカー、用途、導入ガイド、記事を整理する導入判断ポータル。',
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
    <html lang="ja" className={cn("font-sans", inter.variable)}>
      <body>
        <div className="min-h-screen bg-neutral-50 flex flex-col">
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
