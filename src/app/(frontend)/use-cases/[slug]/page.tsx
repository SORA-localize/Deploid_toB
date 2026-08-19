import { cacheLife, cacheTag } from 'next/cache';
import { notFound, permanentRedirect } from 'next/navigation';
import { AlertCircle, Building2, CheckCircle2, MapPin } from 'lucide-react';
import { BudouXText } from '@/components/BudouXText';
import { segmentJapaneseLines } from '@/lib/typography';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { CandidateRobotList } from '@/components/CandidateRobotList';
import { ConsultationCta } from '@/components/ConsultationCta';
import { DefinitionList } from '@/components/DefinitionList';
import { JsonLd } from '@/components/JsonLd';
import { ManufacturerDetailStickyHeader } from '@/components/ManufacturerDetailStickyHeader';
import type { ManufacturerDetailSectionLink } from '@/components/ManufacturerDetailSectionNav';
import { RelatedLinkList } from '@/components/RelatedLinkList';
import { SidebarBlock, SidebarDivider, SidebarSection } from '@/components/SidebarSection';
import { SourceList } from '@/components/SourceList';
import { contentTags } from '@/lib/content/cacheTags';
import { getContentRepository } from '@/lib/content/getContentRepository';
import {
  deploymentStatusLabels,
  useCaseCapabilityNoteLabels,
} from '@/lib/labels';
import { breadcrumbJsonLd, buildUseCaseJsonLd } from '@/lib/jsonLd';
import { shouldIndexPublishedRecord } from '@/lib/indexing';
import { createPageMetadata } from '@/lib/metadata';
import { uiText } from '@/lib/uiText';
import { getUseCaseCandidateEvidenceByRobotId } from '@/lib/useCaseEvidence';

export async function generateStaticParams() {
  const repository = await getContentRepository();
  const useCases = await repository.listAllPublishedUseCases();
  return useCases.map((u) => ({ slug: u.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  // fix round 1: 別途uncachedなrepository呼び出しをここで行うと、本体page（'use cache'）と
  // generateMetadataでcache有無が食い違い、Cache Componentsが
  // "generateMetadata depends on uncached data when the rest of the route does not" として
  // build失敗させる（CONTENT_SOURCE=payload構成で実機確認済み）。同じcached関数を共有する。
  const data = await getCachedUseCaseDetailData(slug);
  const u = data.kind === 'found' ? data.useCase : undefined;
  const seo = u?.seo;
  return createPageMetadata({
    title: seo?.metaTitle ?? (u ? (u.titleJa ?? u.title) : 'Use Case'),
    description: seo?.metaDescription ?? u?.subtitle ?? u?.summary,
    path: u ? `/use-cases/${u.slug}` : undefined,
    noindex: u ? !shouldIndexPublishedRecord(u) : seo?.noindex,
  });
}

/**
 * データ取得だけを`'use cache'`にする（Task 7 Step 3、`/manufacturers/[slug]`と同じパターン）。
 *
 * UseCase詳細の依存表（`lib/content/cacheDependencies.ts`）: useCases, robots, articles,
 * deployments, manufacturers。briefの依存表は`robotSeries`/`media`も挙げるが、このpageは
 * どちらも実際には読まない（`KNOWN_GAPS`参照）ため含めない。
 */
async function getCachedUseCaseDetailData(slug: string) {
  'use cache';
  cacheLife('hours');
  cacheTag(contentTags.useCases);
  cacheTag(contentTags.robots);
  cacheTag(contentTags.articles);
  cacheTag(contentTags.deployments);
  cacheTag(contentTags.manufacturers);

  const repository = await getContentRepository();
  const { record: useCase, redirectTo } = await repository.resolveUseCaseDetailBySlug(slug);
  if (redirectTo) return { kind: 'redirect' as const, redirectTo };
  if (!useCase) return { kind: 'not-found' as const };

  // seriesId候補（DEC-S08）はrobotId単位のこのpageではまだ描画対象外。robotId持ちだけ解決する。
  const candidateRobotIds = useCase.candidateRobots
    .map((c) => c.robotId)
    .filter((id): id is string => id !== undefined);
  const [candidateRobots, reports, deployments] = await Promise.all([
    repository.listRelatedRobots(candidateRobotIds),
    repository.listArticlesForUseCaseId(useCase.id),
    repository.listDeploymentsForUseCaseId(useCase.id),
  ]);
  const candidateRobotById = new Map(candidateRobots.map((robot) => [robot.id, robot]));
  const manufacturersById = new Map(
    (await repository.listRelatedManufacturers(candidateRobots.map((robot) => robot.manufacturerId))).map(
      (manufacturer) => [manufacturer.id, manufacturer],
    ),
  );
  const deploymentsById = new Map((await Promise.all(
    (useCase.candidateRobots.flatMap((c) => c.evidenceDeploymentIds ?? [])).map(
      async (id) => [id, await repository.getDeploymentById(id)] as const,
    ),
  )));
  const candidateAnnotations = getUseCaseCandidateEvidenceByRobotId(
    useCase,
    (deploymentId) => deploymentsById.get(deploymentId) ?? undefined,
    (robotId) => {
      const robot = candidateRobotById.get(robotId);
      if (!robot) return undefined;
      const manufacturer = manufacturersById.get(robot.manufacturerId);
      return manufacturer?.nameJa ?? manufacturer?.name ?? robot.manufacturerId;
    },
  );

  const sections: ManufacturerDetailSectionLink[] = [
    { label: uiText.useCases.atAGlance, href: '#at-a-glance' },
    ...(deployments.length > 0
      ? [{ label: uiText.useCases.deployments, href: '#deployments', count: deployments.length }]
      : []),
    { label: uiText.common.overview, href: '#overview' },
    { label: uiText.useCases.whyItMatters, href: '#why-it-matters' },
    { label: uiText.useCases.considerations, href: '#considerations' },
    { label: uiText.common.resources, href: '#sources', count: useCase.sources.length },
  ];

  return {
    kind: 'found' as const,
    useCase,
    deployments,
    sections,
    candidateRobots,
    candidateAnnotations,
    reports,
  };
}

export default async function UseCaseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getCachedUseCaseDetailData(slug);
  if (data.kind === 'redirect') permanentRedirect(`/use-cases/${data.redirectTo}`);
  if (data.kind === 'not-found') notFound();
  const { useCase, deployments, sections, candidateRobots, candidateAnnotations, reports } = data;

  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={buildUseCaseJsonLd(useCase)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: uiText.useCases.breadcrumb, path: '/use-cases' },
          { name: useCase.titleJa ?? useCase.title, path: `/use-cases/${useCase.slug}` },
        ])}
      />
      <ManufacturerDetailStickyHeader
        title={useCase.titleJa ?? useCase.title}
        sections={sections}
        ariaLabel={uiText.useCases.detailSectionAria}
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
            <BudouXText segments={segmentJapaneseLines(useCase.titleJa ?? useCase.title)} />
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
              <DefinitionList
                variant="detail-decision"
                rows={[
                  {
                    label: uiText.useCases.wherefits,
                    value: useCase.atAGlance.whereFits,
                    icon: CheckCircle2,
                  },
                  {
                    label: uiText.useCases.whereDoesNotFit,
                    value: useCase.atAGlance.whereDoesNotFit,
                    icon: AlertCircle,
                  },
                  {
                    label: uiText.useCases.mustBeTrue,
                    value: useCase.atAGlance.mustBeTrue,
                  },
                ]}
              />
            </div>

            {deployments.length > 0 && (
              <section id="deployments" className="pt-6 pb-8 border-b border-border scroll-mt-site-header">
                <h2 className="text-lg font-semibold text-foreground mb-4">{uiText.useCases.deploymentsSectionTitle}</h2>
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
                            {uiText.useCases.deploymentSource(source.publisher ?? source.title)}
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
              <h2 className="text-lg font-semibold text-foreground mb-4">{uiText.useCases.whyItMatters}</h2>
              <p className="text-sm text-foreground/80 leading-relaxed">{useCase.whyItMatters}</p>
            </section>

            {/* 補足セクション：詳しい判断はガイドに渡すため、ここは要点のみに圧縮する */}
            <section id="considerations" className="pt-6 pb-8 border-b border-border scroll-mt-site-header">
              <h2 className="text-sm font-semibold text-muted-foreground mb-5">
                {uiText.useCases.considerationsSectionTitle}
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
                  <h3 className="text-xs font-semibold text-muted-foreground mb-1">{uiText.useCases.environmentRequirements}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{useCase.environmentRequirements}</p>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground mb-1">{uiText.useCases.whyHardToday}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{useCase.whyHardToday}</p>
                </div>
                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground mb-1">{uiText.useCases.japanDeploymentConditions}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{useCase.japanDeploymentConditions}</p>
                </div>
              </div>
            </section>

            <SourceList
              id="sources"
              sources={useCase.sources}
              className="py-8 scroll-mt-site-header"
              titleClassName="text-sm font-semibold text-foreground mb-4"
            />
          </div>

          {/* ── RIGHT COLUMN（robots/[slug] の RobotStickyAside と同じ「枠なし・区切り線のみ」） ── */}
          <aside>
            <SidebarSection>
              <SidebarBlock kicker={uiText.useCases.candidateRobotsLabel}>
                <CandidateRobotList robots={candidateRobots} annotations={candidateAnnotations} />
              </SidebarBlock>

              {reports.length > 0 && (
                <>
                  <SidebarDivider />
                  <SidebarBlock kicker={uiText.useCases.related}>
                    <RelatedLinkList
                      id="related-sidebar"
                      ariaLabel={uiText.useCases.related}
                      variant="compact"
                      items={reports.map((r) => ({ href: `/reports/${r.slug}`, title: r.titleJa ?? r.title }))}
                    />
                  </SidebarBlock>
                </>
              )}

              <SidebarDivider />

              <ConsultationCta
                kicker={uiText.useCases.consultation}
                description={uiText.useCases.consultationDescription}
                cta={uiText.useCases.consultationCta}
              />
            </SidebarSection>
          </aside>
        </div>
      </div>
    </div>
  );
}
