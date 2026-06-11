import type { MetadataRoute } from 'next';
import {
  getGuides,
  getManufacturers,
  getArticles,
  getRobots,
  getUseCases,
} from '@/lib/data';
import { siteUrl as base } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = [
    '',
    '/robots',
    '/manufacturers',
    '/compare',
    '/guides',
    '/use-cases',
    '/reports',
    '/about',
    '/contact',
  ];
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = staticPaths.map((p) => ({
    url: `${base}${p}`,
    lastModified: now,
  }));

  const robotEntries: MetadataRoute.Sitemap = getRobots().map((r) => ({
    url: `${base}/robots/${r.slug}`,
    lastModified: new Date(r.updatedAt),
  }));
  const manufacturerEntries: MetadataRoute.Sitemap = getManufacturers().map((m) => ({
    url: `${base}/manufacturers/${m.slug}`,
    lastModified: new Date(m.updatedAt),
  }));
  const guideEntries: MetadataRoute.Sitemap = getGuides().map((g) => ({
    url: `${base}/guides/${g.slug}`,
    lastModified: new Date(g.updatedAt),
  }));
  const useCaseEntries: MetadataRoute.Sitemap = getUseCases().map((u) => ({
    url: `${base}/use-cases/${u.slug}`,
    lastModified: new Date(u.updatedAt),
  }));
  const reportEntries: MetadataRoute.Sitemap = getArticles().map((r) => ({
    url: `${base}/reports/${r.slug}`,
    lastModified: new Date(r.updatedAt),
  }));

  return [
    ...staticEntries,
    ...robotEntries,
    ...manufacturerEntries,
    ...guideEntries,
    ...useCaseEntries,
    ...reportEntries,
  ];
}
