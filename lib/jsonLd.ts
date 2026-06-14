// 構造化データ（JSON-LD）のビルダー（設計: data-architecture-redesign-v1 §11.7）。
// Robot=Product / Manufacturer=Organization / Article=NewsArticle。
// 値はすべてレコードから導出する（直書きしない）。
import type { Article, Manufacturer, Robot } from '@/data/types';
import { getDisplayableAsset } from './media';
import { siteUrl } from './site';

const PUBLISHER = {
  '@type': 'Organization',
  name: 'Deploid',
  url: siteUrl,
} as const;

function imageSrc(robot: Robot): string | undefined {
  return getDisplayableAsset(robot.images?.hero ?? robot.heroImage)?.src;
}

export function robotJsonLd(robot: Robot, manufacturer?: Manufacturer) {
  const image = imageSrc(robot);
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: robot.name,
    ...(robot.nameJa && robot.nameJa !== robot.name ? { alternateName: robot.nameJa } : {}),
    description: robot.summary,
    url: `${siteUrl}/robots/${robot.slug}`,
    ...(image ? { image } : {}),
    ...(manufacturer
      ? { brand: { '@type': 'Brand', name: manufacturer.name } }
      : {}),
  };
}

export function manufacturerJsonLd(manufacturer: Manufacturer) {
  const logo = getDisplayableAsset(manufacturer.logo)?.src;
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: manufacturer.name,
    ...(manufacturer.nameJa && manufacturer.nameJa !== manufacturer.name
      ? { alternateName: manufacturer.nameJa }
      : {}),
    description: manufacturer.summary,
    url: `${siteUrl}/manufacturers/${manufacturer.slug}`,
    ...(manufacturer.website ? { sameAs: [manufacturer.website] } : {}),
    ...(logo && logo.trim() ? { logo } : {}),
  };
}

export function articleJsonLd(article: Article) {
  const image = getDisplayableAsset(article.heroImage)?.src;
  return {
    '@context': 'https://schema.org',
    // news は速報、その他は分析・解説（設計 §7-1 の category 軸に対応）
    '@type': article.category === 'news' ? 'NewsArticle' : 'Article',
    headline: article.titleJa ?? article.title,
    description: article.summary,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    url: `${siteUrl}/reports/${article.slug}`,
    mainEntityOfPage: `${siteUrl}/reports/${article.slug}`,
    ...(image ? { image } : {}),
    author: article.author
      ? { '@type': 'Organization', name: article.author }
      : PUBLISHER,
    publisher: PUBLISHER,
  };
}
