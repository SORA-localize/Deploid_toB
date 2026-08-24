import type { MetadataRoute } from 'next';
import { cacheLife, cacheTag } from 'next/cache';
import { contentTags } from '@/lib/content/cacheTags';
import { getContentRepository } from '@/lib/content/getContentRepository';
import { shouldIndexArticle, shouldIndexPublishedRecord, shouldIndexRobot } from '@/lib/indexing';
import { siteUrl as base } from '@/lib/site';

/**
 * データ取得＋entry構築の本体。`'use cache'`を持たない、素の非同期関数として切り出してある
 * ——`'use cache'`/`cacheTag`/`cacheLife`はNext.jsのrequest scope（cacheComponents runtime）の
 * 中でしか呼べず、`tests/unit/sitemap.test.ts`のようにVitestから直接呼ぶ形では
 * 「outside a request scope」で例外化する（`revalidateTag`/`draftMode`と同じ制約、実機確認済み）。
 * ロジックそのものをテスト可能に保つため、cache directiveを持つ`sitemap()`（下）とは分離する。
 */
export async function buildSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const repository = await getContentRepository();
  const [robots, manufacturers, useCases, articles] = await Promise.all([
    repository.listAllPublishedRobots(),
    repository.listAllPublishedManufacturers(),
    repository.listAllPublishedUseCases(),
    repository.listAllPublishedArticles(),
  ]);
  const staticPaths = [
    '',
    '/robots',
    '/manufacturers',
    '/compare',
    '/use-cases',
    '/reports',
    '/about',
    '/contact',
    '/for-manufacturers',
    '/privacy',
  ];
  const robotEntries: MetadataRoute.Sitemap = robots
    .filter(shouldIndexRobot)
    .map((r) => ({
      url: `${base}/robots/${r.slug}`,
      lastModified: new Date(r.updatedAt),
    }));
  const manufacturerEntries: MetadataRoute.Sitemap = manufacturers
    .filter(shouldIndexPublishedRecord)
    .map((m) => ({
      url: `${base}/manufacturers/${m.slug}`,
      lastModified: new Date(m.updatedAt),
    }));
  const useCaseEntries: MetadataRoute.Sitemap = useCases
    .filter(shouldIndexPublishedRecord)
    .map((u) => ({
      url: `${base}/use-cases/${u.slug}`,
      lastModified: new Date(u.updatedAt),
    }));
  const reportEntries: MetadataRoute.Sitemap = articles
    .filter(shouldIndexArticle)
    .map((r) => ({
      url: `${base}/reports/${r.slug}`,
      lastModified: new Date(r.updatedAt),
    }));

  // staticPathsのlastModifiedはビルド時点の現在時刻ではなく、全データの最終更新の
  // 最大値（データ由来でdeterministic）を使う。cacheComponents配下でnew Date()を
  // 直接呼ぶとprerenderエラーになるため。
  const latestUpdatedAt = [
    ...robotEntries,
    ...manufacturerEntries,
    ...useCaseEntries,
    ...reportEntries,
  ].reduce<Date>((latest, entry) => {
    const candidate = entry.lastModified;
    if (candidate instanceof Date && candidate > latest) return candidate;
    return latest;
  }, new Date(0));

  const staticEntries: MetadataRoute.Sitemap = staticPaths.map((p) => ({
    url: `${base}${p}`,
    lastModified: latestUpdatedAt,
  }));

  return [
    ...staticEntries,
    ...robotEntries,
    ...manufacturerEntries,
    ...useCaseEntries,
    ...reportEntries,
  ];
}

/**
 * sitemap / search indexの依存表（`lib/content/cacheDependencies.ts`）: robots, manufacturers,
 * useCases, articles。briefの依存表は`robotSeries`/`settings`も挙げるが、実装は読まない
 * （`KNOWN_GAPS`参照）ため含めない。
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  'use cache';
  cacheLife('hours');
  cacheTag(contentTags.robots);
  cacheTag(contentTags.manufacturers);
  cacheTag(contentTags.useCases);
  cacheTag(contentTags.articles);

  return buildSitemapEntries();
}
