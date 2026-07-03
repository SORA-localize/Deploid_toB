import { Suspense } from 'react';
import { PageSuspenseFallback } from '@/components/PageSuspenseFallback';
import { ManufacturersBrowser } from '@/components/ManufacturersBrowser';
import { getManufacturers, getRobots } from '@/lib/data';
import { createPageMetadata } from '@/lib/metadata';

export const metadata = createPageMetadata({
  title: 'メーカー',
  description:
    'ヒューマノイド開発企業のディレクトリ。地域と相談ルートから、日本で検討しやすい企業を確認できます。',
  path: '/manufacturers',
});

// フィルタ状態は ManufacturersBrowser 内で useSearchParams() を使いクライアントで読む。
export default function ManufacturersPage() {
  const manufacturers = getManufacturers();
  const robots = getRobots();

  return (
    <Suspense fallback={<PageSuspenseFallback />}>
      <ManufacturersBrowser manufacturers={manufacturers} robots={robots} />
    </Suspense>
  );
}
