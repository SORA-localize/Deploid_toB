import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SourceList } from '@/components/Cards';
import {
  getManufacturerForRobot,
  getReportsForRobot,
  getRobotBySlug,
  getRobots,
  getUseCasesForRobot,
} from '@/lib/data';
import {
  buyerReadinessLabels,
  deploymentStageLabels,
  japanAvailabilityLabels,
  procurementLabels,
} from '@/lib/labels';

export function generateStaticParams() {
  return getRobots().map((robot) => ({ slug: robot.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const robot = getRobotBySlug(slug);
  return {
    title: robot ? robot.nameJa ?? robot.name : 'Robot',
  };
}

export default async function RobotDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const robot = getRobotBySlug(slug);

  if (!robot) {
    notFound();
  }

  const manufacturer = getManufacturerForRobot(robot.manufacturerSlug);
  const useCases = getUseCasesForRobot(robot.slug);
  const reports = getReportsForRobot(robot.slug);

  return (
    <section className="hero">
      <div className="container">
        <span className="eyebrow">{manufacturer?.name ?? robot.manufacturerSlug}</span>
        <h1 className="page-title">{robot.nameJa ?? robot.name}</h1>
        <p className="lead">{robot.description}</p>
        <div className="detail-grid section">
          <article className="panel">
            <h2>導入判断</h2>
            <table className="table">
              <tbody>
                <tr>
                  <th>導入段階</th>
                  <td>{deploymentStageLabels[robot.deploymentStage]}</td>
                </tr>
                <tr>
                  <th>実務ラベル</th>
                  <td>{buyerReadinessLabels[robot.buyerReadiness]}</td>
                </tr>
                <tr>
                  <th>日本での入手性</th>
                  <td>{japanAvailabilityLabels[robot.japanAvailability]}</td>
                </tr>
                <tr>
                  <th>調達形態</th>
                  <td>{robot.procurementModels.map((model) => procurementLabels[model]).join(' / ')}</td>
                </tr>
                <tr>
                  <th>価格メモ</th>
                  <td>{robot.priceNote ?? '要確認'}</td>
                </tr>
              </tbody>
            </table>

            <h2>向く用途</h2>
            <ul>
              {robot.comparison.bestFit.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <h2>制約</h2>
            <ul>
              {robot.comparison.constraints.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            <h2>出典</h2>
            <SourceList sources={robot.sources} />
          </article>

          <aside className="panel">
            <h2>関連</h2>
            <div className="meta">
              {useCases.map((useCase) => (
                <Link className="pill" href={`/use-cases/${useCase.slug}`} key={useCase.slug}>
                  {useCase.titleJa ?? useCase.title}
                </Link>
              ))}
              {reports.map((report) => (
                <Link className="pill" href={`/reports/${report.slug}`} key={report.slug}>
                  {report.titleJa ?? report.title}
                </Link>
              ))}
              {manufacturer ? (
                <Link className="pill" href={`/manufacturers/${manufacturer.slug}`}>
                  {manufacturer.nameJa ?? manufacturer.name}
                </Link>
              ) : null}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
