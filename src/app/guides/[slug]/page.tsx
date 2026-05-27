import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SourceList } from '@/components/Cards';
import { getGuideBySlug, getGuides, getRelatedRobots, getRelatedUseCases } from '@/lib/data';
import { guideStageLabels } from '@/lib/labels';

export function generateStaticParams() {
  return getGuides().map((guide) => ({ slug: guide.slug }));
}

export default async function GuideDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);

  if (!guide) {
    notFound();
  }

  const robots = getRelatedRobots(guide.relatedRobotSlugs);
  const useCases = getRelatedUseCases(guide.relatedUseCaseSlugs);

  return (
    <section className="hero">
      <div className="container">
        <span className="eyebrow">{guideStageLabels[guide.stage]}</span>
        <h1 className="page-title">{guide.titleJa ?? guide.title}</h1>
        <p className="lead">{guide.description}</p>
        <div className="detail-grid section">
          <article className="panel">
            <h2>このガイドで見ること</h2>
            <p>{guide.summary}</p>
            <h2>チェックリスト</h2>
            <ul>
              {(guide.checklistItems ?? []).map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
            <h2>出典</h2>
            <SourceList sources={guide.sources} />
          </article>
          <aside className="panel">
            <h2>関連</h2>
            <div className="meta">
              {robots.map((robot) => (
                <Link className="pill" href={`/robots/${robot.slug}`} key={robot.slug}>
                  {robot.nameJa ?? robot.name}
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
