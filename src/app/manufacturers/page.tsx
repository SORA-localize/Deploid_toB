import { Suspense } from 'react';
import { ManufacturersBrowser } from '@/components/ManufacturersBrowser';
import { getManufacturers, getRobots } from '@/lib/data';

export const metadata = {
  title: 'メーカー',
  description:
    'ヒューマノイド開発企業のディレクトリ。地域と相談ルートから、日本で検討しやすい企業を確認できます。',
  alternates: {
    canonical: '/manufacturers',
  },
};

export default function ManufacturersPage() {
  return (
    <Suspense fallback={null}>
      <ManufacturersBrowser manufacturers={getManufacturers()} robots={getRobots()} />
    </Suspense>
  );
}
