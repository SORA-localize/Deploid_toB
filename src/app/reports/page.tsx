import { Suspense } from 'react';
import { PageSuspenseFallback } from '@/components/PageSuspenseFallback';
import { ReportsBrowser } from '@/components/ReportsBrowser';
import { getReports } from '@/lib/data';

export const metadata = {
  title: '記事',
  description:
    '市場動向・導入レポート・政策・取材・分析を、買い手の意思決定に必要な観点で整理する一次情報ハブ。',
};

export default function ReportsPage() {
  return (
    <Suspense fallback={<PageSuspenseFallback />}>
      <ReportsBrowser reports={getReports()} />
    </Suspense>
  );
}
