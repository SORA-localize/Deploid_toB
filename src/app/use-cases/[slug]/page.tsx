import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { AlertCircle, Building2, CheckCircle2, MapPin } from 'lucide-react';
import { BudouXText } from '@/components/BudouXText';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { JsonLd } from '@/components/JsonLd';
import {
  getDeploymentsForUseCase,
  getRelatedGuides,
  getRelatedRobots,
  getArticlesForUseCase,
  getUseCases,
  resolveUseCaseDetailBySlug,
} from '@/lib/data';
import {
  buyerReadinessLabels,
  capabilityLabels,
  deploymentStatusLabels,
  maturityLabels,
  operatingEnvironmentLabels,
  useCaseCapabilityNoteLabels,
} from '@/lib/labels';
import { breadcrumbJsonLd, useCaseJsonLd } from '@/lib/jsonLd';
import { shouldIndexPublishedRecord } from '@/lib/indexing';
import { createPageMetadata } from '@/lib/metadata';
import { getRobotRelatedTitle } from '@/lib/robotDisplay';
import { uiText } from '@/lib/uiText';

export function generateStaticParams() {
  return getUseCases().map((u) => ({ slug: u.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { record: u } = resolveUseCaseDetailBySlug(slug);
  const seo = u?.seo;
  return createPageMetadata({
    title: seo?.metaTitle ?? (u ? (u.titleJa ?? u.title) : 'Use Case'),
    description: seo?.metaDescription ?? u?.subtitle ?? u?.summary,
    path: u ? `/use-cases/${u.slug}` : undefined,
    noindex: u ? !shouldIndexPublishedRecord(u) : seo?.noindex,
  });
}

export default async function UseCaseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { record: useCase, redirectTo } = resolveUseCaseDetailBySlug(slug);
  if (redirectTo) permanentRedirect(`/use-cases/${redirectTo}`);
  if (!useCase) notFound();

  const candidateRobots = getRelatedRobots(useCase.candidateRobotIds);
  const guides = getRelatedGuides(useCase.relatedGuideIds);
  const reports = getArticlesForUseCase(useCase.id);
  const deployments = getDeploymentsForUseCase(useCase.id);
  const primaryGuide = guides[0];

  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={useCaseJsonLd(useCase)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: 'ホーム', path: '/' },
          { name: uiText.useCases.breadcrumb, path: '/use-cases' },
          { name: useCase.titleJa ?? useCase.title, path: `/use-cases/${useCase.slug}` },
        ])}
      />

      <div className="border-b border-border bg-card">
        <div className="site-container py-6">
          <Breadcrumbs
            items={[
              { label: uiText.useCases.breadcrumb, path: '/use-cases' },
              { label: useCase.titleJa ?? useCase.title },
            ]}
          />
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground mb-4 leading-tight">
            <BudouXText text={useCase.titleJa ?? useCase.title} />
          </h1>
          {useCase.sources.length === 0 && (
            <div className="mb-4 flex items-start gap-2 border border-border bg-muted/50 p-3 text-xs text-muted-foreground">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>この用途ページは情報確認中です。出典の裏取りが完了次第、更新します。</span>
            </div>
          )}
          <p className="text-sm text-foreground/80 leading-relaxed max-w-3xl mb-5">
            {useCase.subtitle ?? useCase.summary}
          </p>
          <div className="flex items-center gap-5 text-xs text-muted-foreground mb-4 pb-5 border-b border-border flex-wrap">
            <div>
              <span className="text-muted-foreground">成熟度: </span>
              <span className="font-medium text-foreground">{maturityLabels[useCase.maturityLevel]}</span>
            </div>
            <div>
              <span className="text-muted-foreground">実務ラベル: </span>
              <span className="font-medium text-foreground">{buyerReadinessLabels[useCase.buyerReadiness]}</span>
            </div>
            <div>
              <span className="text-muted-foreground">環境: </span>
              <span className="font-medium text-foreground">{operatingEnvironmentLabels[useCase.environment]}</span>
            </div>
            <div>
              <span className="text-muted-foreground">必要能力: </span>
              <span className="font-medium text-foreground">
                {useCase.requiredCapabilities.map((c) => capabilityLabels[c]).join(', ')}
              </span>
            </div>
          </div>

          <h2 className="text-base font-semibold text-foreground mb-1">
            {uiText.useCases.atAGlance}
          </h2>
          <dl className="divide-y divide-border text-xs">
            <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[8rem_1fr] sm:gap-4">
              <dt className="flex items-center gap-1.5 text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 opacity-60" />
                向く条件
              </dt>
              <dd className="text-foreground/80 leading-relaxed">{useCase.atAGlance.whereFits}</dd>
            </div>
            <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[8rem_1fr] sm:gap-4">
              <dt className="flex items-center gap-1.5 text-muted-foreground">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 opacity-60" />
                向かない条件
              </dt>
              <dd className="text-foreground/80 leading-relaxed">{useCase.atAGlance.whereDoesNotFit}</dd>
            </div>
            <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[8rem_1fr] sm:gap-4">
              <dt className="text-muted-foreground">成立条件</dt>
              <dd className="text-foreground/80 leading-relaxed">{useCase.atAGlance.mustBeTrue}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="site-container py-8">
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-12 lg:col-span-8">
            {deployments.length > 0 && (
              <section className="border-b border-border pb-8">
                <h2 className="text-lg font-semibold text-foreground mb-4">実際の導入事例</h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {deployments.map((d) => {
                    const source = d.sources[0];
                    return (
                      <div key={d.id} className="border border-border p-3">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
                            <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                            {d.customer}
                          </span>
                          <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                            {deploymentStatusLabels[d.status]}
                          </span>
                        </div>
                        {d.siteName && (
                          <p className="mb-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3 shrink-0" />
                            {d.siteName}（{d.country}）
                          </p>
                        )}
                        <p className="text-xs text-foreground/80 leading-relaxed line-clamp-2">{d.summary}</p>
                        {source && (
                          <a
                            href={source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 inline-block text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
                          >
                            出典：{source.publisher ?? source.title}
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
            <section className="border-b border-border pt-6 pb-8">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                {uiText.common.overview}
              </h2>
              <p className="text-sm text-foreground/80 leading-relaxed">{useCase.overview}</p>
            </section>
            <section className="border-b border-border pt-6 pb-8">
              <h2 className="text-lg font-semibold text-foreground mb-4">なぜ重要か</h2>
              <p className="text-sm text-foreground/80 leading-relaxed">{useCase.whyItMatters}</p>
            </section>

            {/* 補足セクション：詳しい判断はガイドに渡すため、ここは要点のみに圧縮する */}
            <section className="pt-6 pb-8">
              <h2 className="text-sm font-semibold text-muted-foreground mb-5">
                導入検討の論点（要点）
              </h2>
              <div className="space-y-3">
                {useCaseCapabilityNoteLabels.map(([key, label]) => {
                  const note = useCase.capabilityNotes[key];
                  if (!note) return null;
                  return (
                    <div key={key}>
                      <h3 className="text-xs font-semibold text-muted-foreground mb-1">{label}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">{note}</p>
                    </div>
                  );
                })}
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground mb-1">環境要件</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{useCase.environmentRequirements}</p>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground mb-1">なぜ今は難しいか</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{useCase.whyHardToday}</p>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground mb-1">日本での導入条件</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{useCase.japanDeploymentConditions}</p>
                </div>
              </div>
              {primaryGuide && (
                <Link
                  href={`/guides/${primaryGuide.slug}`}
                  className="mt-5 block border border-border p-3 text-xs text-foreground hover:border-foreground/40 transition-colors"
                >
                  詳しい判断基準は「{primaryGuide.titleJa ?? primaryGuide.title}」を参照 →
                </Link>
              )}
            </section>
          </div>

          <div className="col-span-12 lg:col-span-4">
            <div className="sticky top-site-header-gap space-y-4">
              <div className="border border-border bg-card p-4">
                <h3 className="text-xs font-semibold text-foreground mb-3 pb-2 border-b border-border">
                  候補ロボット
                </h3>
                {candidateRobots.length === 0 ? (
                  <p className="text-xs text-muted-foreground">候補は精査中です。</p>
                ) : (
                  <div className="space-y-3">
                    {candidateRobots.map((robot) => (
                      <div key={robot.id} className="border border-border p-3">
                        <Link href={`/robots/${robot.slug}`} className="block mb-2">
                          <h4 className="text-sm font-semibold text-foreground hover:text-foreground/80">
                            {getRobotRelatedTitle(robot)}
                          </h4>
                        </Link>
                        <p className="text-xs text-foreground/80 mb-3 leading-relaxed line-clamp-2">
                          {robot.summary}
                        </p>
                        <Link
                          href="/compare"
                          className="inline-block w-full px-3 py-2 border border-border hover:border-foreground/40 text-xs text-center transition-colors"
                        >
                          {uiText.compare.compare}
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {(guides.length > 0 || reports.length > 0) && (
                <div className="border border-border bg-card p-4">
                  <h3 className="text-xs font-semibold text-foreground mb-3 pb-2 border-b border-border">
                    関連
                  </h3>
                  <nav className="space-y-2">
                    {guides.map((g) => (
                      <Link
                        key={g.id}
                        href={`/guides/${g.slug}`}
                        className="block text-xs text-foreground/80 hover:text-foreground py-1.5 border-b border-border"
                      >
                        {g.titleJa ?? g.title}
                      </Link>
                    ))}
                    {reports.map((r) => (
                      <Link
                        key={r.id}
                        href={`/reports/${r.slug}`}
                        className="block text-xs text-foreground/80 hover:text-foreground py-1.5 border-b border-border"
                      >
                        {r.titleJa ?? r.title}
                      </Link>
                    ))}
                  </nav>
                </div>
              )}

              <div className="border border-border bg-muted p-4">
                <h3 className="text-xs font-semibold text-foreground mb-2">選定の相談</h3>
                <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                  どの用途から検討すべきか整理したい場合はご相談ください。
                </p>
                <Link
                  href="/contact"
                  className="block w-full px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium transition-colors text-center"
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
