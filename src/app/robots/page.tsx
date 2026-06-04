import { Suspense } from 'react';
import { PageSuspenseFallback } from '@/components/PageSuspenseFallback';
import { RobotsBrowser } from '@/components/RobotsBrowser';
import { getManufacturers, getRobots } from '@/lib/data';

export const metadata = {
  title: 'ロボット',
  description:
    'ヒューマノイドロボットのカタログ。業種・タスク・メーカー・国内入手性で絞り込み、導入判断に必要な変数で比較できます。',
  alternates: {
    canonical: '/robots',
  },
};

export default function RobotsPage() {
  return (
    <Suspense fallback={<PageSuspenseFallback />}>
      <RobotsBrowser robots={getRobots()} manufacturers={getManufacturers()} />
    </Suspense>
  );
}
