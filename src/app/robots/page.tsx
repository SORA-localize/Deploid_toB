import { Suspense } from 'react';
import { PageSuspenseFallback } from '@/components/PageSuspenseFallback';
import { RobotsBrowser } from '@/components/RobotsBrowser';
import { getManufacturers, getRobots } from '@/lib/data';
import { createPageMetadata } from '@/lib/metadata';

export const metadata = createPageMetadata({
  title: 'ロボット',
  description:
    'ヒューマノイドロボットのカタログ。業種・タスク・メーカー・国内入手性で絞り込み、導入判断に必要な変数で比較できます。',
  path: '/robots',
});

// フィルタ状態は RobotsBrowser 内で useSearchParams() を使いクライアントで読む。
// この Client Component が Suspense 境界内にあることで、静的prerender時の
// 挙動が保たれる（初回ロードは PageSuspenseFallback、以降のフィルタ操作は
// サーバー往復なしでクライアント側のみで再描画される）。
export default function RobotsPage() {
  const robots = getRobots();
  const manufacturers = getManufacturers();

  return (
    <Suspense fallback={<PageSuspenseFallback />}>
      <RobotsBrowser robots={robots} manufacturers={manufacturers} />
    </Suspense>
  );
}
