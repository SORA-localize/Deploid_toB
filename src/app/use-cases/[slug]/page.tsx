import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import {
  getRelatedGuides,
  getRelatedRobots,
  getReportsForUseCase,
  getUseCaseBySlug,
  getUseCases,
} from '@/lib/data';
import {
  buyerReadinessLabels,
  capabilityLabels,
  maturityLabels,
  operatingEnvironmentLabels,
  useCaseCapabilityNoteLabels,
} from '@/lib/labels';
import { uiText } from '@/lib/uiText';

export function generateStaticParams() {
  return getUseCases().map((u) => ({ slug: u.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const u = getUseCaseBySlug(slug);
  const seo = u?.seo;
  return {
    title: seo?.metaTitle ?? (u ? (u.titleJa ?? u.title) : 'Use Case'),
    description: seo?.metaDescription ?? u?.subtitle ?? u?.summary,
    robots: seo?.noindex ? { index: false, follow: false } : undefined,
  };
}

export default async function UseCaseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const useCase = getUseCaseBySlug(slug);
  if (!useCase) notFound();

  const candidateRobots = getRelatedRobots(useCase.candidateRobotSlugs);
  const guides = getRelatedGuides(useCase.relatedGuideSlugs);
  const reports = getReportsForUseCase(useCase.slug);

  return (
    <div className="min-h-screen bg-neutral-100">
      <div className="border-b border-neutral-300 bg-white">
        <div className="mx-auto max-w-[1440px] px-4 md:px-8 py-6">
          <Breadcrumbs
            items={[
              { label: uiText.useCases.breadcrumb, path: '/use-cases' },
              { label: useCase.titleJa ?? useCase.title },
            ]}
          />
          <h1 className="text-3xl font-semibold text-neutral-900 mb-4 leading-tight">
            {useCase.titleJa ?? useCase.title}
          </h1>
          <p className="text-sm text-neutral-700 leading-relaxed max-w-3xl mb-5">
            {useCase.subtitle ?? useCase.summary}
          </p>
          <div className="flex items-center gap-5 text-xs text-neutral-600 mb-4 pb-5 border-b border-neutral-200 flex-wrap">
            <div>
              <span className="text-neutral-500">成熟度: </span>
              <span className="font-medium text-neutral-900">{maturityLabels[useCase.maturityLevel]}</span>
            </div>
            <div>
              <span className="text-neutral-500">実務ラベル: </span>
              <span className="font-medium text-neutral-900">{buyerReadinessLabels[useCase.buyerReadiness]}</span>
            </div>
            <div>
              <span className="text-neutral-500">環境: </span>
              <span className="font-medium text-neutral-900">{operatingEnvironmentLabels[useCase.environment]}</span>
            </div>
            <div>
              <span className="text-neutral-500">必要能力: </span>
              <span className="font-medium text-neutral-900">
                {useCase.requiredCapabilities.map((c) => capabilityLabels[c]).join(', ')}
              </span>
            </div>
          </div>

          <div className="border border-neutral-300 bg-neutral-50 p-5">
            <h2 className="text-sm font-semibold text-neutral-900 mb-4">
              {uiText.useCases.atAGlance}
            </h2>
            <div className="grid grid-cols-1 gap-4 text-xs md:grid-cols-3">
              <div>
                <h3 className="font-semibold text-neutral-900 mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-green-700" />
                  向く条件
                </h3>
                <p className="text-neutral-700 leading-relaxed">{useCase.atAGlance.whereFits}</p>
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900 mb-2 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-neutral-500" />
                  向かない条件
                </h3>
                <p className="text-neutral-700 leading-relaxed">{useCase.atAGlance.whereDoesNotFit}</p>
              </div>
              <div>
                <h3 className="font-semibold text-neutral-900 mb-2">成立条件</h3>
                <p className="text-neutral-700 leading-relaxed">{useCase.atAGlance.mustBeTrue}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] px-4 md:px-8 py-8">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8">
            <div className="space-y-6">
              <div className="border border-neutral-300 bg-white p-6">
                <h2 className="text-lg font-semibold text-neutral-900 mb-4">
                  {uiText.common.overview}
                </h2>
                <p className="text-sm text-neutral-700 leading-relaxed">{useCase.overview}</p>
              </div>
              <div className="border border-neutral-300 bg-white p-6">
                <h2 className="text-lg font-semibold text-neutral-900 mb-4">なぜ重要か</h2>
                <p className="text-sm text-neutral-700 leading-relaxed">{useCase.whyItMatters}</p>
              </div>
              <div className="border border-neutral-300 bg-white p-6">
                <h2 className="text-lg font-semibold text-neutral-900 mb-5">必要なロボット能力</h2>
                <div className="space-y-4">
                  {useCaseCapabilityNoteLabels.map(([key, label]) => {
                    const note = useCase.capabilityNotes[key];
                    if (!note) return null;
                    return (
                      <div key={key}>
                        <h3 className="text-sm font-semibold text-neutral-900 mb-2">{label}</h3>
                        <p className="text-sm text-neutral-700 leading-relaxed">{note}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="border border-neutral-300 bg-white p-6">
                <h2 className="text-lg font-semibold text-neutral-900 mb-4">環境要件</h2>
                <p className="text-sm text-neutral-700 leading-relaxed">{useCase.environmentRequirements}</p>
              </div>
              <div className="border border-neutral-300 bg-white p-6">
                <h2 className="text-lg font-semibold text-neutral-900 mb-4">なぜ今は難しいか</h2>
                <p className="text-sm text-neutral-700 leading-relaxed">{useCase.whyHardToday}</p>
              </div>
              <div className="border border-neutral-300 bg-white p-6">
                <h2 className="text-lg font-semibold text-neutral-900 mb-4">日本での導入条件</h2>
                <p className="text-sm text-neutral-700 leading-relaxed">{useCase.japanDeploymentConditions}</p>
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-4">
            <div className="sticky top-6 space-y-4">
              <div className="border border-neutral-300 bg-white p-4">
                <h3 className="text-xs font-semibold text-neutral-900 mb-3 pb-2 border-b border-neutral-200">
                  候補ロボット
                </h3>
                {candidateRobots.length === 0 ? (
                  <p className="text-xs text-neutral-500">候補は精査中です。</p>
                ) : (
                  <div className="space-y-3">
                    {candidateRobots.map((robot) => (
                      <div key={robot.slug} className="border border-neutral-300 p-3">
                        <Link href={`/robots/${robot.slug}`} className="block mb-2">
                          <h4 className="text-sm font-semibold text-neutral-900 hover:text-neutral-700">
                            {robot.nameJa ?? robot.name}
                          </h4>
                        </Link>
                        <p className="text-xs text-neutral-700 mb-3 leading-relaxed line-clamp-2">
                          {robot.summary}
                        </p>
                        <Link
                          href="/compare"
                          className="inline-block w-full px-3 py-2 border border-neutral-300 hover:border-neutral-500 text-xs text-center transition-colors"
                        >
                          {uiText.compare.compare}
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {(guides.length > 0 || reports.length > 0) && (
                <div className="border border-neutral-300 bg-white p-4">
                  <h3 className="text-xs font-semibold text-neutral-900 mb-3 pb-2 border-b border-neutral-200">
                    関連
                  </h3>
                  <nav className="space-y-2">
                    {guides.map((g) => (
                      <Link
                        key={g.slug}
                        href={`/guides/${g.slug}`}
                        className="block text-xs text-neutral-700 hover:text-neutral-900 py-1.5 border-b border-neutral-100"
                      >
                        {g.titleJa ?? g.title}
                      </Link>
                    ))}
                    {reports.map((r) => (
                      <Link
                        key={r.slug}
                        href={`/reports/${r.slug}`}
                        className="block text-xs text-neutral-700 hover:text-neutral-900 py-1.5 border-b border-neutral-100"
                      >
                        {r.titleJa ?? r.title}
                      </Link>
                    ))}
                  </nav>
                </div>
              )}

              <div className="border border-neutral-300 bg-neutral-50 p-4">
                <h3 className="text-xs font-semibold text-neutral-900 mb-2">選定の相談</h3>
                <p className="text-xs text-neutral-600 mb-3 leading-relaxed">
                  どの用途から検討すべきか整理したい場合はご相談ください。
                </p>
                <Link
                  href="/contact"
                  className="block w-full px-4 py-2 bg-neutral-900 text-white hover:bg-neutral-700 text-xs font-medium transition-colors text-center"
                >
                  相談する
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
