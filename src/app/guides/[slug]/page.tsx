import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { ArrowRight, Calendar, Clock, User } from 'lucide-react';
import { ArticleToc } from '@/components/ArticleToc';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Markdown } from '@/components/Markdown';
import { RelatedLinkList } from '@/components/RelatedLinkList';
import { SourceList } from '@/components/SourceList';
import { TagChip } from '@/components/TagChip';
import {
  getGuides,
  getRelatedRobots,
  getRelatedUseCases,
  resolveGuideDetailBySlug,
} from '@/lib/data';
import { guideStageLabels } from '@/lib/labels';
import { getRobotRelatedTitle } from '@/lib/robotDisplay';
import { getTagLabel } from '@/lib/tags';
import { uiText } from '@/lib/uiText';
import { getGuideStageTone } from '@/lib/visualSemantics';

export function generateStaticParams() {
  return getGuides().map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { record: guide } = resolveGuideDetailBySlug(slug);
  const seo = guide?.seo;
  return {
    title: seo?.metaTitle ?? (guide ? (guide.titleJa ?? guide.title) : 'Guide'),
    description: seo?.metaDescription ?? guide?.summary,
    alternates: guide ? { canonical: `/guides/${guide.slug}` } : undefined,
    robots: seo?.noindex ? { index: false, follow: false } : undefined,
  };
}

export default async function GuideDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { record: guide, redirectTo } = resolveGuideDetailBySlug(slug);
  if (redirectTo) permanentRedirect(`/guides/${redirectTo}`);
  if (!guide) notFound();

  const robots = getRelatedRobots(guide.relatedRobotIds);
  const useCases = getRelatedUseCases(guide.relatedUseCaseIds);
  const hasChecklist = (guide.checklistItems ?? []).length > 0;
  const hasBody = (guide.body ?? '').trim().length > 0;

  const hasRelated = robots.length > 0 || useCases.length > 0;

  const toc = [
    { label: uiText.common.overview, href: '#overview' },
    ...(hasBody ? [{ label: uiText.guides.body, href: '#body' }] : []),
    ...(hasChecklist ? [{ label: uiText.guides.checklist, href: '#checklist' }] : []),
    ...(hasRelated ? [{ label: uiText.guides.relatedInfo, href: '#related' }] : []),
    { label: uiText.common.resources, href: '#sources' },
  ];
  const relatedRobotItems = robots.map((robot) => ({
    href: `/robots/${robot.slug}`,
    title: getRobotRelatedTitle(robot),
    description: robot.summary,
  }));
  const relatedUseCaseItems = useCases.map((useCase) => ({
    href: `/use-cases/${useCase.slug}`,
    title: useCase.titleJa ?? useCase.title,
  }));

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border bg-card">
        <div className="site-container py-6">
          <Breadcrumbs
            items={[
              { label: uiText.guides.breadcrumb, path: '/guides' },
              { label: guide.titleJa ?? guide.title },
            ]}
          />
          <div className="text-xs text-muted-foreground font-medium mb-3">
            {guide.topics[0] ? getTagLabel(guide.topics[0], 'guide-topic') : null}
          </div>
          <h1 className="text-2xl md:text-3xl font-semibold text-foreground mb-4 leading-tight max-w-4xl">
            {guide.titleJa ?? guide.title}
          </h1>
          <p className="text-sm text-foreground/80 leading-relaxed max-w-3xl mb-5">{guide.summary}</p>
          <div className="flex items-center gap-5 text-xs text-muted-foreground mb-4 pb-5 border-b border-border flex-wrap">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              {uiText.common.updated} {guide.updatedAt}
            </span>
            {guide.readingTimeMinutes && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {uiText.common.readingMinutes(guide.readingTimeMinutes)}
              </span>
            )}
            <TagChip tone={getGuideStageTone(guide.stage)} className="py-1 font-medium">
              {guideStageLabels[guide.stage]}
            </TagChip>
            {guide.targetReaders.length > 0 && (
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                {guide.targetReaders.join(' / ')}
              </span>
            )}
          </div>
          <div className="flex gap-2 flex-wrap">
            {guide.topics.map((topic) => (
              <TagChip key={topic} kind="guide-topic" value={topic} className="py-1" />
            ))}
          </div>
        </div>
      </div>

      <div className="site-container-content py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* TOC */}
          <div className="col-span-2 hidden lg:block">
            <ArticleToc items={toc} backHref="/guides" backLabel={uiText.guides.backToAll} />
          </div>

          {/* Content */}
          <div className="col-span-12 lg:col-span-7">
            <section id="overview" className="scroll-mt-site-header border-b border-border pt-6 pb-8">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                {uiText.common.overview}
              </h2>
              <p className="text-sm text-foreground/80 leading-relaxed">{guide.description}</p>
            </section>

            {hasBody && (
              <section id="body" className="scroll-mt-site-header border-b border-border pt-6 pb-8">
                <Markdown source={guide.body!} />
              </section>
            )}

            {hasChecklist && (
              <section id="checklist" className="scroll-mt-site-header border-b border-border pt-6 pb-8">
                <h3 className="text-sm font-semibold text-foreground mb-4">チェックリスト</h3>
                <ul className="space-y-2 text-sm text-foreground/80">
                  {(guide.checklistItems ?? []).map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <span className="text-muted-foreground">□</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {hasRelated && (
              <section id="related" className="scroll-mt-site-header mt-6 border-b border-border pb-8">
                <h2 className="mb-4 text-lg font-semibold text-foreground">
                  {uiText.guides.relatedInfo}
                </h2>
                <div className="space-y-4">
                  {robots.length > 0 && (
                    <RelatedLinkList
                      id="related-robots"
                      title={uiText.guides.relatedRobots}
                      titleLevel="h3"
                      items={relatedRobotItems}
                    />
                  )}
                  {useCases.length > 0 && (
                    <RelatedLinkList
                      id="related-use-cases"
                      title={uiText.guides.relatedUseCases}
                      titleLevel="h3"
                      items={relatedUseCaseItems}
                    />
                  )}
                </div>
              </section>
            )}

            <SourceList
              sources={guide.sources}
              className="mt-6 border border-border bg-card p-6 scroll-mt-site-header"
            />
          </div>

          {/* Decision Summary */}
          <div className="col-span-12 lg:col-span-3">
            <div className="lg:sticky lg:top-site-header-gap space-y-4">
              <div className="border border-border bg-card p-4">
                <h3 className="text-xs font-semibold text-foreground mb-3 pb-2 border-b border-border">
                  {uiText.guides.decisionSummary}
                </h3>
                {guide.targetReaders.length > 0 && (
                  <div className="mb-4 pb-4 border-b border-border">
                    <h4 className="text-xs font-semibold text-foreground mb-2">想定読者</h4>
                    <p className="text-xs text-foreground/80">{guide.targetReaders.join(' / ')}</p>
                  </div>
                )}
                <Link
                  href="/compare"
                  className="block w-full px-4 py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-medium text-center transition-colors"
                >
                  {uiText.guides.compareCandidateRobots}
                </Link>
              </div>

              <div className="border border-border bg-card p-4">
                <h3 className="text-xs font-semibold text-foreground mb-3 pb-2 border-b border-border">
                  {uiText.guides.relatedPaths}
                </h3>
                <nav className="space-y-2">
                  <Link
                    href="/use-cases"
                    className="flex items-center justify-between text-xs text-foreground/80 hover:text-foreground py-1.5 border-b border-border"
                  >
                    <span>用途から探す</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                  <Link
                    href="/reports"
                    className="flex items-center justify-between text-xs text-foreground/80 hover:text-foreground py-1.5 border-b border-border"
                  >
                    <span>関連記事</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                  <Link
                    href="/contact"
                    className="flex items-center justify-between text-xs text-foreground/80 hover:text-foreground py-1.5"
                  >
                    <span>相談する</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
