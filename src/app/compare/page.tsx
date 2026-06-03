import { Suspense } from 'react';
import { CompareClient } from '@/components/CompareClient';
import { PageSuspenseFallback } from '@/components/PageSuspenseFallback';
import { getManufacturers, getRobots } from '@/lib/data';

export const metadata = {
  title: '比較',
  description: '候補のヒューマノイド機種を、導入判断変数で横並びに比較できます。',
};

export default function ComparePage() {
  return (
    <Suspense fallback={<PageSuspenseFallback />}>
      <CompareClient robots={getRobots()} manufacturers={getManufacturers()} />
    </Suspense>
  );
}
