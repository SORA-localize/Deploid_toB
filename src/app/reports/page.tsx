import { Suspense } from 'react';
import { PageSuspenseFallback } from '@/components/PageSuspenseFallback';
import { ReportsBrowser } from '@/components/ReportsBrowser';
import { getArticles } from '@/lib/data';
import { createPageMetadata } from '@/lib/metadata';

export const metadata = createPageMetadata({
  title: 'ニュース・解説',
  description:
    'ヒューマノイドロボットのニュース、メーカー解説、ロボット解説を、導入判断に必要な観点で整理した情報ハブ。',
  path: '/reports',
});

// 棚・検索語・ページ番号は ReportsBrowser 内で useSearchParams() を使いクライアントで読む。
export default function ReportsPage() {
  const reports = getArticles();

  return (
    <Suspense fallback={<PageSuspenseFallback />}>
      <ReportsBrowser reports={reports} />
    </Suspense>
  );
}
