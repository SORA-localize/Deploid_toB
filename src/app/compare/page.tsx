import { CompareClient } from '@/components/CompareClient';
import { getManufacturers, getRobots } from '@/lib/data';

export const metadata = {
  title: '比較',
  description: '候補のヒューマノイド機種を、導入判断変数で横並びに比較できます。',
};

export default function ComparePage() {
  return <CompareClient robots={getRobots()} manufacturers={getManufacturers()} />;
}
