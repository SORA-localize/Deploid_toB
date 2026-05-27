import { Breadcrumbs } from '@/components/Breadcrumbs';
import { UseCaseCard } from '@/components/Cards';
import { getUseCases } from '@/lib/data';

export const metadata = {
  title: '用途から探す',
};

export default function UseCasesPage() {
  return (
    <section className="hero">
      <div className="container">
        <Breadcrumbs items={[{ label: '用途から探す' }]} />
        <span className="eyebrow">Use Cases</span>
        <h1 className="page-title">用途から探す</h1>
        <p className="lead">業界紹介ではなく、作業・タスク起点で成立条件と候補ロボットを探します。</p>
        <div className="grid two section">
          {getUseCases().map((useCase) => (
            <UseCaseCard key={useCase.slug} useCase={useCase} />
          ))}
        </div>
      </div>
    </section>
  );
}
