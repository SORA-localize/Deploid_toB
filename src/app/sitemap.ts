import type { MetadataRoute } from 'next';
import { getContentRepository } from '@/lib/content/getContentRepository';
import { shouldIndexArticle, shouldIndexPublishedRecord, shouldIndexRobot } from '@/lib/indexing';
import { siteUrl as base } from '@/lib/site';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
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
