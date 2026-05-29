import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Calendar, Clock, User } from 'lucide-react';
import { Breadcrumbs } from '@/components/Breadcrumbs';
import { Markdown } from '@/components/Markdown';
import { TagChip } from '@/components/TagChip';
import {
  getGuideBySlug,
  getGuides,
  getRelatedRobots,
  getRelatedUseCases,
} from '@/lib/data';
import { guideStageLabels, reliabilityLabels } from '@/lib/labels';

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
    { label: 'Overview', href: '#overview' },
    ...(hasBody ? [{ label: 'Body', href: '#body' }] : []),
    ...(hasChecklist ? [{ label: 'Checklist', href: '#checklist' }] : []),
    ...(robots.length > 0 ? [{ label: 'Related Robots', href: '#related-robots' }] : []),
    ...(useCases.length > 0 ? [{ label: 'Related Use Cases', href: '#related-use-cases' }] : []),
    { label: 'Resources', href: '#sources' },
  ];

  return (
    <div className="min-h-screen bg-neutral-100">
      <div className="border-b border-neutral-300 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <Breadcrumbs
            items={[{ label: 'Guides', path: '/guides' }, { label: guide.titleJa ?? guide.title }]}
          />
          <div className="text-xs uppercase tracking-wider text-neutral-500 font-medium mb-3">
            {guide.topics[0]}
          </div>
          <h1 className="text-3xl font-semibold text-neutral-900 mb-4 leading-tight max-w-4xl">
            {guide.titleJa ?? guide.title}
          </h1>
          <p className="text-sm text-neutral-700 leading-relaxed max-w-3xl mb-5">{guide.summary}</p>
          <div className="flex items-center gap-5 text-xs text-neutral-600 mb-4 pb-5 border-b border-neutral-200 flex-wrap">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              Updated {guide.updatedAt}
            </span>
            {guide.readingTimeMinutes && (
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {guide.readingTimeMinutes} min
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
                {topic}
              </TagChip>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-12 gap-6">
          {/* TOC */}
          <div className="col-span-2 hidden lg:block">
            <div className="sticky top-6">
              <div className="border border-neutral-300 bg-white p-4">
                <h3 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider mb-3 pb-2 border-b border-neutral-200">
                  Contents
                </h3>
                <nav className="space-y-1">
                  {toc.map((item) => (
                    <a
                      key={item.href}
                      href={item.href}
                      className="block text-xs text-neutral-700 hover:text-neutral-900 py-1.5 px-2 -mx-2 hover:bg-neutral-50 transition-colors"
                    >
                      {item.label}
                    </a>
                  ))}
                </nav>
                <div className="mt-4 pt-3 border-t border-neutral-200">
                  <Link href="/guides" className="text-xs text-neutral-600 hover:text-neutral-900">
                    ← Back to all guides
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="col-span-12 lg:col-span-7">
            <div className="space-y-6">
              <div id="overview" className="border border-neutral-300 bg-white p-6 scroll-mt-6">
                <h2 className="text-lg font-semibold text-neutral-900 mb-4">Overview</h2>
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
                <div id="related-robots" className="border border-neutral-300 bg-white p-6 scroll-mt-6">
                  <h2 className="text-lg font-semibold text-neutral-900 mb-4">Related Robots</h2>
                  <div className="space-y-3">
                    {robots.map((robot) => (
                      <Link
                        key={robot.slug}
                        href={`/robots/${robot.slug}`}
                        className="block p-4 border border-neutral-300 hover:border-neutral-500 transition-colors"
                      >
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <div className="font-semibold text-neutral-900 mb-1">
                              {robot.nameJa ?? robot.name}
                            </div>
                            <p className="text-sm text-neutral-700 line-clamp-2">{robot.summary}</p>
                          </div>
                          <ArrowRight className="w-5 h-5 text-neutral-400 flex-shrink-0" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {useCases.length > 0 && (
                <div id="related-use-cases" className="border border-neutral-300 bg-white p-6 scroll-mt-6">
                  <h2 className="text-lg font-semibold text-neutral-900 mb-4">Related Use Cases</h2>
                  <div className="flex flex-wrap gap-2">
                    {useCases.map((useCase) => (
                      <Link
                        key={useCase.slug}
                        href={`/use-cases/${useCase.slug}`}
                        className="text-xs px-3 py-1.5 bg-white border border-neutral-300 hover:border-neutral-500 transition-colors text-neutral-700"
                      >
                        {useCase.titleJa ?? useCase.title}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <div id="sources" className="border border-neutral-300 bg-white p-6 scroll-mt-6">
                <h2 className="text-lg font-semibold text-neutral-900 mb-4">Resources / 出典</h2>
                {guide.sources.length === 0 ? (
                  <p className="text-xs text-neutral-500">出典は本文作成時に追加予定です。</p>
                ) : (
                  <ul className="space-y-2 text-xs">
                    {guide.sources.map((source) => (
                      <li key={source.url}>
                        <a
                          href={source.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-neutral-900 hover:text-neutral-600 underline"
                        >
                          {source.title}
                        </a>
                        <span className="text-neutral-500">
                          {source.publisher ? ` / ${source.publisher}` : ''} / 確認 {source.checkedAt}{' '}
                          / {reliabilityLabels[source.reliability]}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Decision Summary */}
          <div className="col-span-12 lg:col-span-3">
            <div className="sticky top-6 space-y-4">
              <div className="border border-neutral-300 bg-white p-4">
                <h3 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider mb-3 pb-2 border-b border-neutral-200">
                  Decision Summary
                </h3>
                {guide.targetReaders.length > 0 && (
                  <div className="mb-4 pb-4 border-b border-neutral-200">
                    <h4 className="text-xs font-semibold text-neutral-900 mb-2">想定読者</h4>
                    <p className="text-xs text-neutral-700">{guide.targetReaders.join(' / ')}</p>
                  </div>
                )}
                <Link
                  href="/compare"
                  className="block w-full px-4 py-2.5 bg-neutral-900 text-white hover:bg-neutral-700 text-xs font-medium uppercase tracking-wider text-center transition-colors"
                >
                  Compare Candidate Robots
                </Link>
              </div>

              <div className="border border-neutral-300 bg-white p-4">
                <h3 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider mb-3 pb-2 border-b border-neutral-200">
                  Related Paths
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
