import { RobotsBrowser } from '@/components/RobotsBrowser';
import { getManufacturers, getRobots } from '@/lib/data';

export const metadata = {
  title: 'ロボット',
  description:
    'ヒューマノイド機種のカタログ。メーカー、国内入手性、提供段階で絞り込み、導入判断に必要な変数で比較できます。',
};

export default function RobotsPage() {
  return <RobotsBrowser robots={getRobots()} manufacturers={getManufacturers()} />;
}
