import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { AlertCircle, Building2, CheckCircle2, MapPin } from 'lucide-react';
import { BudouXText } from '@/components/BudouXText';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { JsonLd } from '@/components/JsonLd';
import { ManufacturerDetailStickyHeader } from '@/components/ManufacturerDetailStickyHeader';
import type { ManufacturerDetailSectionLink } from '@/components/ManufacturerDetailSectionNav';
import { SourceList } from '@/components/SourceList';
import { CandidateRobotList } from '@/components/CandidateRobotList';
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

  const candidateRobots = getRelatedRobots(useCase.candidateRobots.map((c) => c.robotId));
  const candidateAnnotations = Object.fromEntries(
    useCase.candidateRobots.map((c) => [c.robotId, { fit: c.fit, reason: c.reason }]),
  );
  const guides = getRelatedGuides(useCase.relatedGuideIds);
  const reports = getArticlesForUseCase(useCase.id);
  const deployments = getDeploymentsForUseCase(useCase.id);
  const primaryGuide = guides[0];

  const overviewRows: Array<[string, string]> = [
    ['成熟度', maturityLabels[useCase.maturityLevel]],
    ['実務ラベル', buyerReadinessLabels[useCase.buyerReadiness]],
    ['環境', operatingEnvironmentLabels[useCase.environment]],
    ['必要能力', useCase.requiredCapabilities.map((c) => capabilityLabels[c]).join(', ')],
  ];

  const sections: ManufacturerDetailSectionLink[] = [
    { label: '要点', href: '#at-a-glance' },
    ...(deployments.length > 0
      ? [{ label: '導入事例', href: '#deployments', count: deployments.length }]
      : []),
    { label: uiText.common.overview, href: '#overview' },
    { label: 'なぜ重要か', href: '#why-it-matters' },
    { label: '論点', href: '#considerations' },
    { label: uiText.common.resources, href: '#sources', count: useCase.sources.length },
  ];

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
      <ManufacturerDetailStickyHeader
        title={useCase.titleJa ?? useCase.title}
        sections={sections}
        ariaLabel="用途詳細セクション"
      />

      <div className="site-container py-8">
        <Breadcrumbs
          items={[
            { label: uiText.useCases.breadcrumb, path: '/use-cases' },
            { label: useCase.titleJa ?? useCase.title },
          ]}
        />

        <div className="mt-6 mb-6">
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground mb-3 leading-tight">
            <BudouXText text={useCase.titleJa ?? useCase.title} />
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {useCase.subtitle ?? useCase.summary}
          </p>
        </div>

        {/* 2カラムグリッド — robots/[slug] と同じく、最初のセクションとサイドバーを同じ高さからスタートさせる */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8 lg:gap-12 items-start">
          {/* ── LEFT COLUMN ─────────────────────────────── */}
          <div className="min-w-0">
            <div id="at-a-glance" className="pb-8 border-b border-border scroll-mt-site-header">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                {uiText.useCases.atAGlance}
              </h2>
              <dl className="divide-y divide-border text-xs max-w-3xl">
                <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[8rem_1fr] sm:gap-4">
                  <dt className="flex items-center gap-1.5 text-muted-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 shrink-0 opacity-60" />
                    向く条件
                  </dt>
                  <dd className="text-foreground font-medium break-words">{useCase.atAGlance.whereFits}</dd>
                </div>
                <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[8rem_1fr] sm:gap-4">
                  <dt className="flex items-center gap-1.5 text-muted-foreground">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 opacity-60" />
                    向かない条件
                  </dt>
                  <dd className="text-foreground font-medium break-words">{useCase.atAGlance.whereDoesNotFit}</dd>
                </div>
                <div className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-[8rem_1fr] sm:gap-4">
                  <dt className="text-muted-foreground">成立条件</dt>
                  <dd className="text-foreground font-medium break-words">{useCase.atAGlance.mustBeTrue}</dd>
                </div>
              </dl>
            </div>

            {deployments.length > 0 && (
              <section id="deployments" className="pt-6 pb-8 border-b border-border scroll-mt-site-header">
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

            <section id="overview" className="pt-6 pb-8 border-b border-border scroll-mt-site-header">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                {uiText.common.overview}
              </h2>
              <p className="text-sm text-foreground/80 leading-relaxed">{useCase.overview}</p>
            </section>

            <section id="why-it-matters" className="pt-6 pb-8 border-b border-border scroll-mt-site-header">
              <h2 className="text-lg font-semibold text-foreground mb-4">なぜ重要か</h2>
              <p className="text-sm text-foreground/80 leading-relaxed">{useCase.whyItMatters}</p>
            </section>

            {/* 補足セクション：詳しい判断はガイドに渡すため、ここは要点のみに圧縮する */}
            <section id="considerations" className="pt-6 pb-8 scroll-mt-site-header">
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

            <SourceList
              id="sources"
              sources={useCase.sources}
              className="pt-8 border-t border-border scroll-mt-site-header"
              titleClassName="text-sm font-semibold text-foreground mb-4"
            />
          </div>

          {/* ── RIGHT COLUMN（robots/[slug] の RobotStickyAside と同じ「枠なし・区切り線のみ」） ── */}
          <aside>
            <div className="sticky top-site-header-gap space-y-5">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
                  判断軸
                </p>
                <table className="w-full text-xs">
                  <tbody className="divide-y divide-border">
                    {overviewRows.map(([label, value]) => (
                      <tr key={label}>
                        <td className="py-2 text-muted-foreground">{label}</td>
                        <td className="py-2 text-foreground font-medium text-right">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t border-border" />

              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
                  候補ロボット
                </p>
                <CandidateRobotList robots={candidateRobots} annotations={candidateAnnotations} />
              </div>

              {(guides.length > 0 || reports.length > 0) && (
                <>
                  <div className="border-t border-border" />
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-3">
                      関連
                    </p>
                    <nav>
                      {guides.map((g) => (
                        <Link
                          key={g.id}
                          href={`/guides/${g.slug}`}
                          className="block text-xs text-foreground/80 hover:text-foreground py-2 border-b border-border"
                        >
                          {g.titleJa ?? g.title}
                        </Link>
                      ))}
                      {reports.map((r) => (
                        <Link
                          key={r.id}
                          href={`/reports/${r.slug}`}
                          className="block text-xs text-foreground/80 hover:text-foreground py-2 border-b border-border last:border-b-0"
                        >
                          {r.titleJa ?? r.title}
                        </Link>
                      ))}
                    </nav>
                  </div>
                </>
              )}

              <div className="border-t border-border" />

              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
                  選定の相談
                </p>
                <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                  どの用途から検討すべきか整理したい場合はご相談ください。
                </p>
                <Link
                  href="/contact"
                  className="flex items-center justify-center w-full px-4 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium transition-colors"
                >
                  相談する
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
