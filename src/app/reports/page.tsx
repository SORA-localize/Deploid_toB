import { Breadcrumbs } from '@/components/Breadcrumbs';
import { ReportCard } from '@/components/Cards';
import { getReports } from '@/lib/data';

export const metadata = {
  title: '記事',
};

export default function ReportsPage() {
  return (
    <section className="hero">
      <div className="container">
        <Breadcrumbs items={[{ label: '記事' }]} />
        <span className="eyebrow">Reports</span>
        <h1 className="page-title">記事</h1>
        <p className="lead">ニュース一覧ではなく、買い手にとって何が重要かを整理する判断材料です。</p>
        <div className="grid two section">
          {getReports().map((report) => (
            <ReportCard key={report.slug} report={report} />
          ))}
        </div>
      </div>
    </section>
  );
}
