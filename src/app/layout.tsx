import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: 'Deploid | ヒューマノイド導入判断ポータル',
    template: '%s | Deploid',
  },
  description:
    '日本のtoB事業者向けに、ヒューマノイドロボットの機種、メーカー、用途、導入ガイド、記事を整理する導入判断ポータル。',
};

// Phase 1（クリーンスレート）：共通Shellは Phase 2 で Figma の Layout/Header/Footer を
// 逐語コピーして復元する。ここでは children を素のまま描画する。
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
