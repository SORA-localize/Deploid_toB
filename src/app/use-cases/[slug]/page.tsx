import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getRelatedGuides, getRelatedRobots, getUseCaseBySlug, getUseCases } from '@/lib/data';
import { buyerReadinessLabels, maturityLabels } from '@/lib/labels';

export function generateStaticParams() {
  return getUseCases().map((useCase) => ({ slug: useCase.slug }));
}

export default async function UseCaseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const useCase = getUseCaseBySlug(slug);

  if (!useCase) {
    notFound();
  }

  const robots = getRelatedRobots(useCase.candidateRobotSlugs);
  const guides = getRelatedGuides(useCase.relatedGuideSlugs);

  return (
    <section className="hero">
      <div className="container">
        <span className="eyebrow">{maturityLabels[useCase.maturityLevel]}</span>
        <h1 className="page-title">{useCase.titleJa ?? useCase.title}</h1>
        <p className="lead">{useCase.subtitle ?? useCase.summary}</p>
        <div className="detail-grid section">
          <article className="panel">
            <h2>At a glance</h2>
            <table className="table">
              <tbody>
                <tr>
                  <th>向く条件</th>
                  <td>{useCase.atAGlance.whereFits}</td>
                </tr>
                <tr>
                  <th>向かない条件</th>
                  <td>{useCase.atAGlance.whereDoesNotFit}</td>
                </tr>
                <tr>
                  <th>成立条件</th>
                  <td>{useCase.atAGlance.mustBeTrue}</td>
                </tr>
                <tr>
                  <th>実務ラベル</th>
                  <td>{buyerReadinessLabels[useCase.buyerReadiness]}</td>
                </tr>
              </tbody>
            </table>
            <h2>なぜ重要か</h2>
            <p>{useCase.whyItMatters}</p>
            <h2>難しい理由</h2>
            <p>{useCase.whyHardToday}</p>
          </article>
          <aside className="panel">
            <h2>候補ロボット / 関連ガイド</h2>
            <div className="meta">
              {robots.map((robot) => (
                <Link className="pill" href={`/robots/${robot.slug}`} key={robot.slug}>
                  {robot.nameJa ?? robot.name}
                </Link>
              ))}
              {guides.map((guide) => (
                <Link className="pill" href={`/guides/${guide.slug}`} key={guide.slug}>
                  {guide.titleJa ?? guide.title}
                </Link>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}
