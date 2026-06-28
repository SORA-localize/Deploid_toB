import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { AlertCircle, Building2, CheckCircle2, MapPin } from 'lucide-react';
import { BudouXText } from '@/components/BudouXText';
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
import {
  getDeploymentsForUseCase,
  getRelatedGuides,
  getRelatedRobots,
  getArticlesForUseCase,
  getUseCases,
  resolveUseCaseDetailBySlug,
} from '@/lib/data';
import {
  deploymentStatusLabels,
  useCaseCapabilityNoteLabels,
} from '@/lib/labels';
import { breadcrumbJsonLd, useCaseJsonLd } from '@/lib/jsonLd';
import { shouldIndexPublishedRecord } from '@/lib/indexing';
import { createPageMetadata } from '@/lib/metadata';
import { uiText } from '@/lib/uiText';
import { getUseCaseOverviewFacts } from '@/lib/useCaseDisplay';

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
    useCase.candidateRobots.map((c) => [c.robotId, { fit: c.fit, basis: c.basis, reason: c.reason }]),
  );
  const guides = getRelatedGuides(useCase.relatedGuideIds);
  const reports = getArticlesForUseCase(useCase.id);
  const deployments = getDeploymentsForUseCase(useCase.id);
  const primaryGuide = guides[0];

  const overviewRows = getUseCaseOverviewFacts(useCase);

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

  return (
    <div className="min-h-screen bg-background">
      <JsonLd data={useCaseJsonLd(useCase)} />
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
              {primaryGuide && (
                <Link
                  href={`/guides/${primaryGuide.slug}`}
                  className="mt-5 block border border-border p-3 text-xs text-foreground hover:border-foreground/40 transition-colors"
                >
                  {uiText.useCases.seeGuideForDetail(primaryGuide.titleJa ?? primaryGuide.title)}
                </Link>
              )}
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
              <SidebarBlock kicker={uiText.useCases.decisionFactors}>
                <table className="w-full text-xs">
                  <tbody className="divide-y divide-border">
                    {overviewRows.map((row) => (
                      <tr key={row.key}>
                        <td className="py-2 text-muted-foreground">{row.label}</td>
                        <td className="py-2 text-foreground font-medium text-right">{row.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </SidebarBlock>

              <SidebarDivider />

              <SidebarBlock kicker={uiText.useCases.candidateRobotsLabel}>
                <CandidateRobotList robots={candidateRobots} annotations={candidateAnnotations} />
              </SidebarBlock>

              {(guides.length > 0 || reports.length > 0) && (
                <>
                  <SidebarDivider />
                  <SidebarBlock kicker={uiText.useCases.related}>
                    <RelatedLinkList
                      id="related-sidebar"
                      title={uiText.useCases.related}
                      variant="compact"
                      items={[
                        ...guides.map((g) => ({ href: `/guides/${g.slug}`, title: g.titleJa ?? g.title })),
                        ...reports.map((r) => ({ href: `/reports/${r.slug}`, title: r.titleJa ?? r.title })),
                      ]}
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
