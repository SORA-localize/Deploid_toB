import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Calendar, Clock, User } from 'lucide-react';
import { ArticleToc } from '@/components/ArticleToc';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Markdown } from '@/components/Markdown';
import { RelatedLinkList } from '@/components/RelatedLinkList';
import { SourceList } from '@/components/SourceList';
import { TagChip } from '@/components/TagChip';
import {
  getGuideBySlug,
  getGuides,
  getRelatedRobots,
  getRelatedUseCases,
} from '@/lib/data';
import { guideStageLabels } from '@/lib/labels';
import { getTagLabel } from '@/lib/tags';
import { uiText } from '@/lib/uiText';

export function generateStaticParams() {
  return getGuides().map((guide) => ({ slug: guide.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  const seo = guide?.seo;
  return {
    title: seo?.metaTitle ?? (guide ? (guide.titleJa ?? guide.title) : 'Guide'),
    description: seo?.metaDescription ?? guide?.summary,
    robots: seo?.noindex ? { index: false, follow: false } : undefined,
  };
}

export default async function GuideDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) notFound();

  const robots = getRelatedRobots(guide.relatedRobotSlugs);
  const useCases = getRelatedUseCases(guide.relatedUseCaseSlugs);
  const hasChecklist = (guide.checklistItems ?? []).length > 0;
  const hasBody = (guide.body ?? '').trim().length > 0;

  const toc = [
    { label: uiText.common.overview, href: '#overview' },
    ...(hasBody ? [{ label: uiText.guides.body, href: '#body' }] : []),
    ...(hasChecklist ? [{ label: uiText.guides.checklist, href: '#checklist' }] : []),
    ...(robots.length > 0 ? [{ label: uiText.guides.relatedRobots, href: '#related-robots' }] : []),
    ...(useCases.length > 0 ? [{ label: uiText.guides.relatedUseCases, href: '#related-use-cases' }] : []),
    { label: uiText.common.resources, href: '#sources' },
  ];
  const relatedRobotItems = robots.map((robot) => ({
    href: `/robots/${robot.slug}`,
    title: robot.nameJa ?? robot.name,
    description: robot.summary,
  }));
  const relatedUseCaseItems = useCases.map((useCase) => ({
    href: `/use-cases/${useCase.slug}`,
    title: useCase.titleJa ?? useCase.title,
  }));

  return (
    <div className="min-h-screen bg-neutral-100">
      <div className="border-b border-neutral-300 bg-white">
        <div className="mx-auto max-w-[1440px] px-4 md:px-8 py-6">
          <Breadcrumbs
            items={[
              { label: uiText.guides.breadcrumb, path: '/guides' },
              { label: guide.titleJa ?? guide.title },
            ]}
          />
          <div className="text-xs text-neutral-500 font-medium mb-3">
            {guide.topics[0] ? getTagLabel(guide.topics[0], 'guide-topic') : null}
          </div>
          <h1 className="text-3xl font-semibold text-neutral-900 mb-4 leading-tight max-w-4xl">
            {guide.titleJa ?? guide.title}
          </h1>
          <p className="text-sm text-neutral-700 leading-relaxed max-w-3xl mb-5">{guide.summary}</p>
          <div className="flex items-center gap-5 text-xs text-neutral-600 mb-4 pb-5 border-b border-neutral-200 flex-wrap">
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
            <TagChip className="py-1 text-neutral-800 font-medium">
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
              <TagChip key={topic} className="py-1 bg-white border-neutral-300">
                {getTagLabel(topic, 'guide-topic')}
              </TagChip>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] px-4 md:px-8 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* TOC */}
          <div className="col-span-2 hidden lg:block">
            <ArticleToc items={toc} backHref="/guides" backLabel={uiText.guides.backToAll} />
          </div>

          {/* Content */}
          <div className="col-span-12 lg:col-span-7">
            <div className="space-y-6">
              <div id="overview" className="border border-neutral-300 bg-white p-6 scroll-mt-6">
                <h2 className="text-lg font-semibold text-neutral-900 mb-4">
                  {uiText.common.overview}
                </h2>
                <p className="text-sm text-neutral-700 leading-relaxed">{guide.description}</p>
              </div>

              {hasBody && (
                <div id="body" className="border border-neutral-300 bg-white p-6 scroll-mt-6">
                  <Markdown source={guide.body!} />
                </div>
              )}

              {hasChecklist && (
                <div id="checklist" className="border border-neutral-300 bg-neutral-50 p-6 scroll-mt-6">
                  <h3 className="text-sm font-semibold text-neutral-900 mb-4">チェックリスト</h3>
                  <ul className="space-y-2 text-sm text-neutral-700">
                    {(guide.checklistItems ?? []).map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="text-neutral-500">□</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {robots.length > 0 && (
                <RelatedLinkList
                  id="related-robots"
                  title={uiText.guides.relatedRobots}
                  items={relatedRobotItems}
                />
              )}

              {useCases.length > 0 && (
                <RelatedLinkList
                  id="related-use-cases"
                  title={uiText.guides.relatedUseCases}
                  items={relatedUseCaseItems}
                />
              )}

              <SourceList sources={guide.sources} />
            </div>
          </div>

          {/* Decision Summary */}
          <div className="col-span-12 lg:col-span-3">
            <div className="sticky top-6 space-y-4">
              <div className="border border-neutral-300 bg-white p-4">
                <h3 className="text-xs font-semibold text-neutral-900 mb-3 pb-2 border-b border-neutral-200">
                  {uiText.guides.decisionSummary}
                </h3>
                {guide.targetReaders.length > 0 && (
                  <div className="mb-4 pb-4 border-b border-neutral-200">
                    <h4 className="text-xs font-semibold text-neutral-900 mb-2">想定読者</h4>
                    <p className="text-xs text-neutral-700">{guide.targetReaders.join(' / ')}</p>
                  </div>
                )}
                <Link
                  href="/compare"
                  className="block w-full px-4 py-2.5 bg-neutral-900 text-white hover:bg-neutral-700 text-xs font-medium text-center transition-colors"
                >
                  {uiText.guides.compareCandidateRobots}
                </Link>
              </div>

              <div className="border border-neutral-300 bg-white p-4">
                <h3 className="text-xs font-semibold text-neutral-900 mb-3 pb-2 border-b border-neutral-200">
                  {uiText.guides.relatedPaths}
                </h3>
                <nav className="space-y-2">
                  <Link
                    href="/use-cases"
                    className="flex items-center justify-between text-xs text-neutral-700 hover:text-neutral-900 py-1.5 border-b border-neutral-100"
                  >
                    <span>用途から探す</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                  <Link
                    href="/reports"
                    className="flex items-center justify-between text-xs text-neutral-700 hover:text-neutral-900 py-1.5 border-b border-neutral-100"
                  >
                    <span>関連記事</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                  <Link
                    href="/contact"
                    className="flex items-center justify-between text-xs text-neutral-700 hover:text-neutral-900 py-1.5"
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
