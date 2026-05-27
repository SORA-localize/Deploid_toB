import { GuideCard } from '@/components/Cards';
import { getGuides } from '@/lib/data';

export const metadata = {
  title: 'ガイド',
};

export default function GuidesPage() {
  return (
    <section className="hero">
      <div className="container">
        <span className="eyebrow">Guides</span>
        <h1 className="page-title">ガイド</h1>
        <p className="lead">知る、判断する、動く。導入検討を前に進めるための常設ガイドです。</p>
        <div className="grid two section">
          {getGuides().map((guide) => (
            <GuideCard key={guide.slug} guide={guide} />
          ))}
        </div>
      </div>
    </section>
  );
}
