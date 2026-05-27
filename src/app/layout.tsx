import type { Metadata } from 'next';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Deploid | ヒューマノイド導入判断ポータル',
    template: '%s | Deploid',
  },
  description:
    '日本のtoB事業者向けに、ヒューマノイドロボットの機種、メーカー、用途、導入ガイド、記事を整理する導入判断ポータル。',
};

// Figma Layout.tsx を逐語移植（Outlet → children）。
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
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
