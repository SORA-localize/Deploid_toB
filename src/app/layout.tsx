import type { Metadata } from 'next';
import { Footer } from '@/components/Footer';
import { Header } from '@/components/Header';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Deploid | ヒューマノイド導入判断ポータル',
    template: '%s | Deploid',
  },
  description:
    '日本のtoB事業者向けに、ヒューマノイドロボットの機種、メーカー、用途、導入ガイド、記事を整理する導入判断ポータル。',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <div className="site-shell">
          <Header />
          <main className="main">{children}</main>
          <Footer />
        </div>
      </body>
    </html>
  );
}
