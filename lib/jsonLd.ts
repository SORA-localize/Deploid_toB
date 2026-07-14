// 構造化データ（JSON-LD）のビルダー（設計: data-architecture-redesign-v1 §11.7）。
// Robot=Product / Manufacturer=Organization / Article=NewsArticle。
// 値はすべてレコードから導出する（直書きしない）。
import type { Article, ManufacturerGuideFaqItem, Manufacturer, Robot, UseCase } from '@/data/types';
import { resolveManufacturerLogo } from './manufacturerLogo';
import { getDisplayableAsset } from './media';
import { getRobotPrimaryImage } from './robotMedia';
import { siteUrl } from './site';
import { uiText } from './uiText';

const PUBLISHER = {
  '@type': 'Organization',
  name: 'Deploid',
  url: siteUrl,
} as const;

function absoluteUrl(path: string) {
  return path.startsWith('http') ? path : `${siteUrl}${path.startsWith('/') ? path : `/${path}`}`;
}

function imageSrc(robot: Robot): string | undefined {
  const src = getRobotPrimaryImage(robot)?.src;
  return src ? absoluteUrl(src) : undefined;
}

export function robotJsonLd(robot: Robot, manufacturer?: Manufacturer) {
  const image = imageSrc(robot);
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: robot.name,
    ...(robot.nameJa && robot.nameJa !== robot.name ? { alternateName: robot.nameJa } : {}),
    description: robot.summary,
    url: absoluteUrl(`/robots/${robot.slug}`),
    ...(image ? { image } : {}),
    ...(manufacturer
      ? { brand: { '@type': 'Brand', name: manufacturer.name } }
      : {}),
  };
}

export function manufacturerJsonLd(manufacturer: Manufacturer) {
  const logoSrc = resolveManufacturerLogo(manufacturer, 'combined').asset?.src;
  const logo = logoSrc ? absoluteUrl(logoSrc) : undefined;
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: manufacturer.name,
    ...(manufacturer.nameJa && manufacturer.nameJa !== manufacturer.name
      ? { alternateName: manufacturer.nameJa }
      : {}),
    description: manufacturer.summary,
    url: absoluteUrl(`/manufacturers/${manufacturer.slug}`),
    ...(manufacturer.website ? { sameAs: [manufacturer.website] } : {}),
    ...(logo && logo.trim() ? { logo } : {}),
  };
}

export function articleJsonLd(article: Article) {
  const imageSrc = getDisplayableAsset(article.heroImage)?.src;
  const image = imageSrc ? absoluteUrl(imageSrc) : undefined;
  return {
    '@context': 'https://schema.org',
    // news は速報、その他は分析・解説（設計 §7-1 の category 軸に対応）
    '@type': article.category === 'news' ? 'NewsArticle' : 'Article',
    headline: article.titleJa ?? article.title,
    description: article.summary,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    url: absoluteUrl(`/reports/${article.slug}`),
    mainEntityOfPage: absoluteUrl(`/reports/${article.slug}`),
    ...(image ? { image } : {}),
    author: article.author
      ? { '@type': 'Organization', name: article.author }
      : PUBLISHER,
    publisher: PUBLISHER,
  };
}

/** メーカー解説のFAQセクション用（FAQPage）。 */
export function faqPageJsonLd(items: ManufacturerGuideFaqItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: { '@type': 'Answer', text: item.answer },
    })),
  };
}

export function websiteJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Deploid',
    url: siteUrl,
    publisher: PUBLISHER,
    inLanguage: 'ja-JP',
  };
}

export function organizationJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Deploid',
    url: siteUrl,
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  const withHome = [{ name: uiText.common.home, path: '/' }, ...items];
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: withHome.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}


export function useCaseJsonLd(useCase: UseCase) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: useCase.titleJa ?? useCase.title,
    description: useCase.subtitle ?? useCase.summary,
    dateModified: useCase.updatedAt,
    url: absoluteUrl(`/use-cases/${useCase.slug}`),
    mainEntityOfPage: absoluteUrl(`/use-cases/${useCase.slug}`),
    author: PUBLISHER,
    publisher: PUBLISHER,
    inLanguage: 'ja-JP',
  };
}
