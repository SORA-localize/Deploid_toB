// collection横断の同一性・表示可能性の土台。
// 参照整合は不変 id で取る（slug は可変URLであり外部キーではない）。
// Task 6 fix round 1: DeploymentSiteはlegacyとdomainで構造が完全に同一。
import type { DeploymentSite } from '../content/domainTypes.ts';
import type { ContentSnapshot } from '../data/contentSnapshot.ts';
import {
  articleCategoryOrder,
  articleSectionOrder,
  companyStatusOrder,
  companyTypeOrder,
  japanAvailabilityOrder,
  manufacturerCountryOrder,
  robotCategoryOrder,
} from '../display.ts';
import type { ValidationCollector } from './types.ts';

export interface ReferenceIndex {
  robotIds: ReadonlySet<string>;
  manufacturerIds: ReadonlySet<string>;
  useCaseIds: ReadonlySet<string>;
  articleIds: ReadonlySet<string>;
  visibleRobotIds: ReadonlySet<string>;
  publishedRobotIds: ReadonlySet<string>;
  publishedManufacturerIds: ReadonlySet<string>;
  publishedUseCaseIds: ReadonlySet<string>;
  publishedArticleIds: ReadonlySet<string>;
  deploymentById: ReadonlyMap<string, DeploymentSite>;
}

/** 参照先idの集合と「公開面に出るか」の集合。各collection validatorはここから引く。 */
export function buildReferenceIndex(snapshot: ContentSnapshot): ReferenceIndex {
  const { articles, deployments, manufacturers, robots, useCases } = snapshot;
  return {
    robotIds: new Set(robots.map((r) => r.id)),
    manufacturerIds: new Set(manufacturers.map((m) => m.id)),
    useCaseIds: new Set(useCases.map((u) => u.id)),
    articleIds: new Set(articles.map((r) => r.id)),
    visibleRobotIds: new Set(
      robots
        .filter((r) => r.publishStatus === 'published' || r.publishStatus === 'archived')
        .map((r) => r.id),
    ),
    publishedRobotIds: new Set(
      robots.filter((r) => r.publishStatus === 'published').map((r) => r.id),
    ),
    publishedManufacturerIds: new Set(
      manufacturers.filter((m) => m.publishStatus === 'published').map((m) => m.id),
    ),
    publishedUseCaseIds: new Set(
      useCases.filter((u) => u.publishStatus === 'published').map((u) => u.id),
    ),
    publishedArticleIds: new Set(
      articles.filter((article) => article.publishStatus === 'published').map((article) => article.id),
    ),
    deploymentById: new Map(deployments.map((deployment) => [deployment.id, deployment])),
  };
}

// id / slug の一意性・文字種、previousSlugs の衝突。
// id は不変の外部キー、slug は可変URL（設計: data-architecture-redesign-v1 §3）。
const identifierPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function checkIdentifiers<T extends { id: string; slug: string; previousSlugs?: string[] }>(
  collector: ValidationCollector,
  name: string,
  arr: readonly T[],
): void {
  const seenIds = new Set<string>();
  const seenSlugs = new Set<string>();
  for (const x of arr) {
    if (seenIds.has(x.id)) collector.error(`[duplicate] ${name} にid重複: ${x.id}`);
    seenIds.add(x.id);
    if (seenSlugs.has(x.slug)) collector.error(`[duplicate] ${name} にslug重複: ${x.slug}`);
    seenSlugs.add(x.slug);
    if (!identifierPattern.test(x.id)) {
      collector.error(`[id-format] ${name} "${x.id}" のidは小文字英数とハイフンのみにしてください`);
    }
    if (!identifierPattern.test(x.slug)) {
      collector.error(`[slug-format] ${name} "${x.id}".slug は小文字英数とハイフンのみにしてください: ${x.slug}`);
    }
  }
  // previousSlugs は「現slug」「他レコードのpreviousSlugs」と衝突してはならない（301の宛先が曖昧になる）
  const allPrevious = new Set<string>();
  for (const x of arr) {
    for (const prev of x.previousSlugs ?? []) {
      if (!identifierPattern.test(prev)) {
        collector.error(`[slug-format] ${name} "${x.id}".previousSlugs は小文字英数とハイフンのみにしてください: ${prev}`);
      }
      if (seenSlugs.has(prev)) {
        collector.error(`[previous-slug] ${name} "${x.id}".previousSlugs "${prev}" が現存slugと衝突しています`);
      }
      if (allPrevious.has(prev)) {
        collector.error(`[previous-slug] ${name} の previousSlugs "${prev}" が複数レコードで重複しています`);
      }
      allPrevious.add(prev);
    }
  }
}

function checkOrderCoverage(
  collector: ValidationCollector,
  name: string,
  values: readonly string[],
  order: readonly string[],
): void {
  const orderSet = new Set(order);
  Array.from(new Set(values)).forEach((value) => {
    if (!orderSet.has(value)) {
      collector.error(`[order-missing] ${name} の表示順に "${value}" がありません`);
    }
  });
}

export function validateCrossCollection(
  snapshot: ContentSnapshot,
  collector: ValidationCollector,
): void {
  const { articles, deployments, manufacturers, robots, useCases } = snapshot;

  checkIdentifiers(collector, 'robots', robots);
  checkIdentifiers(collector, 'manufacturers', manufacturers);
  checkIdentifiers(collector, 'useCases', useCases);
  checkIdentifiers(collector, 'articles', articles);
  checkIdentifiers(collector, 'deployments', deployments);

  checkOrderCoverage(collector, 'robot.category', robots.map((robot) => robot.category), robotCategoryOrder);
  checkOrderCoverage(
    collector,
    'robot.japanAvailability',
    robots.map((robot) => robot.japanAvailability),
    japanAvailabilityOrder,
  );
  checkOrderCoverage(
    collector,
    'manufacturer.country',
    manufacturers.map((manufacturer) => manufacturer.country),
    manufacturerCountryOrder,
  );
  checkOrderCoverage(
    collector,
    'manufacturer.companyType',
    manufacturers.map((manufacturer) => manufacturer.companyType),
    companyTypeOrder,
  );
  checkOrderCoverage(
    collector,
    'manufacturer.companyStatus',
    manufacturers.map((manufacturer) => manufacturer.companyStatus),
    companyStatusOrder,
  );
  checkOrderCoverage(collector, 'article.section', articles.map((article) => article.section), articleSectionOrder);
  checkOrderCoverage(
    collector,
    'article.category',
    articles.map((article) => article.category),
    articleCategoryOrder,
  );
}
