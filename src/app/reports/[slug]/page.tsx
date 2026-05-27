import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SourceList } from '@/components/Cards';
import {
  getRelatedManufacturers,
  getRelatedRobots,
  getRelatedUseCases,
  getReportBySlug,
  getReports,
} from '@/lib/data';
import { reportTypeLabels } from '@/lib/labels';

export function generateStaticParams() {
  return getReports().map((report) => ({ slug: report.slug }));
}

export default async function ReportDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const report = getReportBySlug(slug);

  if (!report) {
    notFound();
  }

  const robots = getRelatedRobots(report.relatedRobotSlugs);
  const manufacturers = getRelatedManufacturers(report.relatedManufacturerSlugs);
  const useCases = getRelatedUseCases(report.relatedUseCaseSlugs);

  return (
    <section className="hero">
      <div className="container">
        <span className="eyebrow">{reportTypeLabels[report.type]}</span>
        <h1 className="page-title">{report.titleJa ?? report.title}</h1>
        <p className="lead">{report.summary}</p>
        <div className="detail-grid section">
          <article className="panel">
            <h2>Why it matters</h2>
            <p>{report.whyItMatters}</p>
            <h2>Key takeaways</h2>
            <ul>
              {(report.keyTakeaways ?? []).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <h2>出典</h2>
            <SourceList sources={report.sources} />
          </article>
          <aside className="panel">
            <h2>関連</h2>
            <div className="meta">
              {robots.map((robot) => (
                <Link className="pill" href={`/robots/${robot.slug}`} key={robot.slug}>
                  {robot.nameJa ?? robot.name}
                </Link>
              ))}
              {manufacturers.map((manufacturer) => (
                <Link className="pill" href={`/manufacturers/${manufacturer.slug}`} key={manufacturer.slug}>
                  {manufacturer.nameJa ?? manufacturer.name}
                </Link>
              ))}
              {useCases.map((useCase) => (
                <Link className="pill" href={`/use-cases/${useCase.slug}`} key={useCase.slug}>
                  {useCase.titleJa ?? useCase.title}
                </Link>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
