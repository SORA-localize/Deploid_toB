import { Suspense } from 'react';
import { ManufacturersBrowser } from '@/components/ManufacturersBrowser';
import { getManufacturers, getRobots } from '@/lib/data';

export const metadata = {
  title: 'メーカー',
  description:
    'ヒューマノイド開発企業・代理店のディレクトリ。国・区分・ステータスで絞り込み、日本での供給体制を確認できます。',
};

export default function ManufacturersPage() {
  return (
    <Suspense fallback={null}>
      <ManufacturersBrowser manufacturers={getManufacturers()} robots={getRobots()} />
    </Suspense>
  );
}
