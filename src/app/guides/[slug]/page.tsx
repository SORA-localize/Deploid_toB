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
            <section
              id="overview"
              className={`scroll-mt-site-header pt-6 pb-8 ${
                hasBody || hasChecklist ? 'border-b border-border' : ''
              }`}
            >
              <h2 className="text-lg font-semibold text-foreground mb-4">
                {uiText.common.overview}
              </h2>
              <p className="text-sm text-foreground/80 leading-relaxed">{guide.description}</p>
            </section>

            {hasBody && (
              <section
                id="body"
                className={`scroll-mt-site-header pt-6 pb-8 ${
                  hasChecklist ? 'border-b border-border' : ''
                }`}
              >
                <Markdown source={guide.body!} />
              </section>
            )}

            {hasChecklist && (
              <section id="checklist" className="scroll-mt-site-header pt-6 pb-8">
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

            <SourceList
              sources={guide.sources}
              className="mt-10 border-y border-border py-6 scroll-mt-site-header"
              titleClassName="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
            />

            {hasRelated && (
              <section id="related" className="scroll-mt-site-header mt-12 border-t-2 border-border pt-8 pb-8">
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
          </div>

          {/* Decision Summary */}
          <div className="col-span-12 lg:col-span-3">
            <div className="lg:sticky top-site-header-gap space-y-6">
              <section className="border-y border-border py-4">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {uiText.guides.decisionSummary}
                </h3>
                {guide.targetReaders.length > 0 && (
                  <div className="mb-4 border-y border-border py-4">
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
              </section>

              <section className="border-y border-border py-4">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {uiText.guides.relatedPaths}
                </h3>
                <nav className="divide-y divide-border">
                  <Link
                    href="/use-cases"
                    className="group flex items-center justify-between py-2 text-xs text-foreground/80 transition-colors hover:text-foreground"
                  >
                    <span>用途から探す</span>
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    href="/reports"
                    className="group flex items-center justify-between py-2 text-xs text-foreground/80 transition-colors hover:text-foreground"
                  >
                    <span>関連記事</span>
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    href="/contact"
                    className="group flex items-center justify-between py-2 text-xs text-foreground/80 transition-colors hover:text-foreground"
                  >
                    <span>相談する</span>
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </nav>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
