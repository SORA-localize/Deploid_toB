import { Suspense } from 'react';
import { GuidesBrowser } from '@/components/GuidesBrowser';
import { getGuides } from '@/lib/data';

export const metadata = {
  title: 'ガイド',
  description:
    'ヒューマノイド導入を知る・判断する・動くで理解する常設ガイド。調達・TCO・安全・PoC・ベンダー評価を体系化。',
};

export default function GuidesPage() {
  return (
    <Suspense fallback={null}>
      <GuidesBrowser guides={getGuides()} />
    </Suspense>
  );
}
