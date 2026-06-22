// 参照整合チェック。dev起動時に lib/data.ts から1度だけ呼ばれ、
// 「存在しないidを参照している」「双方向リンクが片側だけ」「id/slug重複」を
// console に出す。`npm run validate:data`（scripts/validate-data.mjs）からも実行される。
import { deployments } from '../data/deployments.ts';
import { guides } from '../data/guides.ts';
import { manufacturers } from '../data/manufacturers.ts';
import { articlePlacements } from '../data/articlePlacements.ts';
import { articles } from '../data/articles.ts';
import { robots } from '../data/robots.ts';
import type { ImageAsset, RightsStatus } from '../data/types.ts';
import { useCases } from '../data/useCases.ts';
import {
  articleCategoryOrder,
  articleSectionOrder,
  companyStatusOrder,
  companyTypeOrder,
  japanAvailabilityOrder,
  manufacturerCountryOrder,
  robotCategoryOrder,
} from './display.ts';
import { articleCategoryLabels, articleSectionLabels } from './labels.ts';
import { isSpecKey } from './specSchema.ts';
import { isRegisteredTag, normalizeTagKey, type TagKind } from './tagRegistry.ts';

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const referenceDisplayStatuses = new Set<RightsStatus>([
  'reference-attributed',
  'permission-requested',
]);

/** 鮮度warningの既定: sources の最新確認日がこの日数を超えたら再確認を促す（設計 §11.6） */
const FRESHNESS_DAYS = 180;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * 検証は2段階（設計 §10-1）:
 * - errors: データとして壊れている。build を失敗させる（scripts/validate-data.mjs が exit 1）
 * - warnings: 運用上の注意（未ローカル画像・鮮度切れ）。ログのみで build は通す
 */
export interface ValidationResult {
  errors: string[];
  warnings: string[];
}

export function validateData(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  // 参照整合は不変 id で取る（slug は可変URLであり外部キーではない）
  const robotIds = new Set(robots.map((r) => r.id));
  const manufacturerIds = new Set(manufacturers.map((m) => m.id));
  const guideIds = new Set(guides.map((g) => g.id));
  const useCaseIds = new Set(useCases.map((u) => u.id));
  const articleIds = new Set(articles.map((r) => r.id));
  // useCase.candidateRobots の fit:'strong' は「このrobotIdがこのuseCaseで実証導入されている」という主張。
  // deployments.ts の robotId × relatedUseCaseIds の実在ペアでのみ裏付けられる（運用ルールは data-maintenance-checklist-v1.md §M）。
  const strongFitEvidence = new Set(
    deployments
      .filter((d) => d.robotId)
      .flatMap((d) => (d.relatedUseCaseIds ?? []).map((ucId) => `${d.robotId}::${ucId}`)),
  );

  const check = (kind: string, owner: string, field: string, id: string, set: Set<string>) => {
    if (!set.has(id)) {
      errors.push(`[missing] ${kind} "${owner}".${field} -> "${id}" は存在しません`);
    }
  };

  const checkDate = (kind: string, owner: string, field: string, value: string | undefined) => {
    if (value && !isoDatePattern.test(value)) {
      errors.push(`[date] ${kind} "${owner}".${field} は YYYY-MM-DD 形式にしてください: ${value}`);
    }
  };

  const checkUrl = (kind: string, owner: string, field: string, value: string | undefined) => {
    if (!value) return;
    try {
      const url = new URL(value);
      if (url.protocol !== 'https:' && url.protocol !== 'http:') {
        errors.push(`[url] ${kind} "${owner}".${field} は http(s) URL にしてください: ${value}`);
      }
    } catch {
      errors.push(`[url] ${kind} "${owner}".${field} はURL形式にしてください: ${value}`);
    }
  };

  const checkRequiredSources = (
    kind: string,
    owner: string,
    sources: readonly { checkedAt: string }[],
    options: { requireNonEmpty?: boolean } = {},
  ) => {
    const requireNonEmpty = options.requireNonEmpty ?? true;
    if (requireNonEmpty && sources.length === 0) {
      errors.push(`[source-empty] ${kind} "${owner}".sources が空です`);
    }
    sources.forEach((source, index) => {
      checkDate(kind, owner, `sources[${index}].checkedAt`, source.checkedAt);
    });
  };

  const checkImageAsset = (
    kind: string,
    owner: string,
    field: string,
    asset: ImageAsset | undefined,
  ) => {
    if (!asset) return;
    if (!asset.src.trim()) return; // 空src = 未取得。警告・検証不要
    if (!asset.src.startsWith('/')) {
      warnings.push(`[image-remote] ${kind} "${owner}".${field}.src が外部URLです（public/ へのローカル化推奨）: ${asset.src}`);
    }
    if (!asset.alt.trim()) errors.push(`[image-alt] ${kind} "${owner}".${field}.alt が空です`);
    if (!asset.rights) {
      errors.push(`[image-rights] ${kind} "${owner}".${field}.rights が未設定です`);
      return;
    }

    checkDate(kind, owner, `${field}.rights.checkedAt`, asset.rights.checkedAt);

    if (referenceDisplayStatuses.has(asset.rights.status)) {
      if (!asset.credit) errors.push(`[image-credit] ${kind} "${owner}".${field}.credit が未設定です`);
      if (!asset.sourceUrl) {
        errors.push(`[image-source] ${kind} "${owner}".${field}.sourceUrl が未設定です`);
      }
      if (!asset.rights.rightsHolder) {
        errors.push(`[image-rights-holder] ${kind} "${owner}".${field}.rights.rightsHolder が未設定です`);
      }
    }
  };

  const checkTagDuplicates = (kind: string, owner: string, field: string, values: readonly string[]) => {
    const seen = new Set<string>();
    for (const value of values) {
      const key = normalizeTagKey(value);
      if (seen.has(key)) {
        errors.push(`[tag-duplicate] ${kind} "${owner}".${field} に正規化後の重複があります: ${value}`);
      }
      seen.add(key);
    }
  };

  const checkTags = (
    kind: string,
    owner: string,
    field: string,
    tagKind: TagKind,
    values: readonly string[],
  ) => {
    checkTagDuplicates(kind, owner, field, values);
    for (const value of values) {
      if (!isRegisteredTag(tagKind, value)) {
        errors.push(`[tag-unknown] ${kind} "${owner}".${field} に未登録タグがあります: ${value}`);
      }
    }
  };

  // 鮮度チェック（warning）: nextReviewBy 超過、または最新 checkedAt が既定日数超（設計 §11.6）
  const now = Date.now();
  const checkFreshness = (
    kind: string,
    record: { id: string; publishStatus: string; nextReviewBy?: string; sources: readonly { checkedAt: string }[] },
  ) => {
    if (record.publishStatus !== 'published') return;
    if (record.nextReviewBy) {
      if (isoDatePattern.test(record.nextReviewBy) && Date.parse(record.nextReviewBy) < now) {
        warnings.push(`[stale] ${kind} "${record.id}" の nextReviewBy (${record.nextReviewBy}) を過ぎています。再確認してください`);
      }
      return;
    }
    const newestCheckedAt = record.sources
      .map((source) => Date.parse(source.checkedAt))
      .filter((time) => !Number.isNaN(time))
      .sort((a, b) => b - a)[0];
    if (newestCheckedAt != null && now - newestCheckedAt > FRESHNESS_DAYS * MS_PER_DAY) {
      const days = Math.floor((now - newestCheckedAt) / MS_PER_DAY);
      warnings.push(`[stale] ${kind} "${record.id}" の最終確認から${days}日経過しています（既定${FRESHNESS_DAYS}日）`);
    }
  };
  robots.forEach((r) => checkFreshness('robot', r));
  manufacturers.forEach((m) => checkFreshness('manufacturer', m));

  // id / slug の一意性・文字種、previousSlugs の衝突。
  // id は不変の外部キー、slug は可変URL（設計: data-architecture-redesign-v1 §3）。
  const identifierPattern = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  const dup = <T extends { id: string; slug: string; previousSlugs?: string[] }>(
    name: string,
    arr: T[],
  ) => {
    const seenIds = new Set<string>();
    const seenSlugs = new Set<string>();
    for (const x of arr) {
      if (seenIds.has(x.id)) errors.push(`[duplicate] ${name} にid重複: ${x.id}`);
      seenIds.add(x.id);
      if (seenSlugs.has(x.slug)) errors.push(`[duplicate] ${name} にslug重複: ${x.slug}`);
      seenSlugs.add(x.slug);
      if (!identifierPattern.test(x.id)) {
        errors.push(`[id-format] ${name} "${x.id}" のidは小文字英数とハイフンのみにしてください`);
      }
      if (!identifierPattern.test(x.slug)) {
        errors.push(`[slug-format] ${name} "${x.id}".slug は小文字英数とハイフンのみにしてください: ${x.slug}`);
      }
    }
    // previousSlugs は「現slug」「他レコードのpreviousSlugs」と衝突してはならない（301の宛先が曖昧になる）
    const allPrevious = new Set<string>();
    for (const x of arr) {
      for (const prev of x.previousSlugs ?? []) {
        if (!identifierPattern.test(prev)) {
          errors.push(`[slug-format] ${name} "${x.id}".previousSlugs は小文字英数とハイフンのみにしてください: ${prev}`);
        }
        if (seenSlugs.has(prev)) {
          errors.push(`[previous-slug] ${name} "${x.id}".previousSlugs "${prev}" が現存slugと衝突しています`);
        }
        if (allPrevious.has(prev)) {
          errors.push(`[previous-slug] ${name} の previousSlugs "${prev}" が複数レコードで重複しています`);
        }
        allPrevious.add(prev);
      }
    }
  };
  dup('robots', robots);
  dup('manufacturers', manufacturers);
  dup('guides', guides);
  dup('useCases', useCases);
  dup('articles', articles);
  dup('deployments', deployments);

  const checkOrderCoverage = (
    name: string,
    values: readonly string[],
    order: readonly string[],
  ) => {
    const orderSet = new Set(order);
    Array.from(new Set(values)).forEach((value) => {
      if (!orderSet.has(value)) {
        errors.push(`[order-missing] ${name} の表示順に "${value}" がありません`);
      }
    });
  };

  checkOrderCoverage('robot.category', robots.map((robot) => robot.category), robotCategoryOrder);
  checkOrderCoverage(
    'robot.japanAvailability',
    robots.map((robot) => robot.japanAvailability),
    japanAvailabilityOrder,
  );
  checkOrderCoverage(
    'manufacturer.country',
    manufacturers.map((manufacturer) => manufacturer.country),
    manufacturerCountryOrder,
  );
  checkOrderCoverage(
    'manufacturer.companyType',
    manufacturers.map((manufacturer) => manufacturer.companyType),
    companyTypeOrder,
  );
  checkOrderCoverage(
    'manufacturer.companyStatus',
    manufacturers.map((manufacturer) => manufacturer.companyStatus),
    companyStatusOrder,
  );
  checkOrderCoverage('article.section', articles.map((article) => article.section), articleSectionOrder);
  checkOrderCoverage(
    'article.category',
    articles.map((article) => article.category),
    articleCategoryOrder,
  );

  // ラベル(Record で union 全値を要求＝完全集合) と表示順(order) の双方向 diff。
  // order 配列の追加漏れ・余剰を実データ非依存で検出する。
  const checkLabelOrderSync = (
    name: string,
    labels: Record<string, string>,
    order: readonly string[],
  ) => {
    const labelKeys = Object.keys(labels);
    const orderSet = new Set<string>(order);
    const labelSet = new Set<string>(labelKeys);
    labelKeys.forEach((key) => {
      if (!orderSet.has(key)) {
        errors.push(`[${name}-order] 表示順に "${key}" がありません（ラベルは定義済み）`);
      }
    });
    order.forEach((value) => {
      if (!labelSet.has(value)) {
        errors.push(`[${name}-order] ラベルに "${value}" がありません（表示順に存在）`);
      }
    });
  };
  checkLabelOrderSync('section', articleSectionLabels, articleSectionOrder);
  checkLabelOrderSync('category', articleCategoryLabels, articleCategoryOrder);

  for (const r of robots) {
    check('robot', r.slug, 'manufacturerId', r.manufacturerId, manufacturerIds);
    if (r.supersededById) {
      check('robot', r.slug, 'supersededById', r.supersededById, robotIds);
      if (r.supersededById === r.id) {
        errors.push(`[superseded-self] robot "${r.id}".supersededById が自分自身を指しています`);
      }
    }
    // specs のキーは lib/specSchema.ts 登録値のみ（型でも保証されるが、将来のCMS/JSON化に備えた実行時保証）
    Object.keys(r.specs).forEach((key) => {
      if (!isSpecKey(key)) {
        errors.push(`[spec-unknown] robot "${r.id}".specs に未登録キーがあります: ${key}（lib/specSchema.ts に追加してください）`);
      }
    });
    checkDate('robot', r.slug, 'updatedAt', r.updatedAt);
    checkRequiredSources('robot', r.slug, r.sources);
    checkTags('robot', r.slug, 'industryTags', 'industry', r.industryTags ?? []);
    checkTags('robot', r.slug, 'taskTags', 'task', r.taskTags ?? []);
    checkImageAsset('robot', r.slug, 'heroImage', r.heroImage);
    Object.entries(r.images ?? {}).forEach(([role, image]) =>
      checkImageAsset('robot', r.slug, `images.${role}`, image),
    );
  }

  for (const m of manufacturers) {
    checkDate('manufacturer', m.slug, 'updatedAt', m.updatedAt);
    checkRequiredSources('manufacturer', m.slug, m.sources);
    checkImageAsset('manufacturer', m.slug, 'logo', m.logo);
    m.domesticDistributors?.forEach((distributor, index) => {
      const field = `domesticDistributors[${index}]`;
      if (!distributor.name.trim()) {
        errors.push(`[required] manufacturer "${m.slug}".${field}.name が空です`);
      }
      checkUrl('manufacturer', m.slug, `${field}.website`, distributor.website);
      checkUrl('manufacturer', m.slug, `${field}.sourceUrl`, distributor.sourceUrl);
      checkDate('manufacturer', m.slug, `${field}.checkedAt`, distributor.checkedAt);
    });
  }

  for (const g of guides) {
    checkDate('guide', g.slug, 'updatedAt', g.updatedAt);
    checkTags('guide', g.slug, 'topics', 'guide-topic', g.topics);
    g.relatedRobotIds.forEach((s) => check('guide', g.slug, 'relatedRobotIds', s, robotIds));
    g.relatedUseCaseIds.forEach((s) =>
      check('guide', g.slug, 'relatedUseCaseIds', s, useCaseIds),
    );
  }

  for (const u of useCases) {
    checkDate('useCase', u.slug, 'updatedAt', u.updatedAt);
    checkTags('useCase', u.slug, 'industryTags', 'industry', u.industryTags);
    checkTags('useCase', u.slug, 'taskTags', 'task', u.taskTags);
    checkTags('useCase', u.slug, 'primaryDomain', 'use-case-domain', [u.primaryDomain]);
    checkTags('useCase', u.slug, 'secondaryDomains', 'use-case-domain', u.secondaryDomains ?? []);
    u.candidateRobots.forEach((c) => {
      check('useCase', u.slug, 'candidateRobots.robotId', c.robotId, robotIds);
      if (c.fit === 'strong' && !strongFitEvidence.has(`${c.robotId}::${u.id}`)) {
        errors.push(
          `[fit-unverified] useCase "${u.slug}" の candidateRobots「${c.robotId}」は fit:'strong' だが、` +
            `data/deployments.ts に同じrobotId・同じuseCaseの実証事例が見つかりません`,
        );
      }
    });
    u.relatedGuideIds.forEach((s) =>
      check('useCase', u.slug, 'relatedGuideIds', s, guideIds),
    );
  }

  for (const article of articles) {
    checkDate('article', article.slug, 'updatedAt', article.updatedAt);
    checkDate('article', article.slug, 'publishedAt', article.publishedAt);
    checkImageAsset('article', article.slug, 'heroImage', article.heroImage);
    checkRequiredSources('article', article.slug, article.sources, {
      requireNonEmpty: article.publishStatus === 'published' && article.contentKind !== 'sample',
    });
    checkTags('article', article.slug, 'tags', 'article', article.tags);
    article.relatedRobotIds.forEach((s) =>
      check('article', article.slug, 'relatedRobotIds', s, robotIds),
    );
    article.relatedManufacturerIds.forEach((s) =>
      check('article', article.slug, 'relatedManufacturerIds', s, manufacturerIds),
    );
    article.relatedUseCaseIds.forEach((s) =>
      check('article', article.slug, 'relatedUseCaseIds', s, useCaseIds),
    );
    (article.relatedGuideIds ?? []).forEach((s) =>
      check('article', article.slug, 'relatedGuideIds', s, guideIds),
    );
  }

  for (const d of deployments) {
    check('deployment', d.id, 'manufacturerId', d.manufacturerId, manufacturerIds);
    if (d.robotId) check('deployment', d.id, 'robotId', d.robotId, robotIds);
    (d.relatedUseCaseIds ?? []).forEach((s) =>
      check('deployment', d.id, 'relatedUseCaseIds', s, useCaseIds),
    );
    checkDate('deployment', d.id, 'updatedAt', d.updatedAt);
    checkRequiredSources('deployment', d.id, d.sources);
  }

  const placementOrders = new Set<string>();
  const placementArticles = new Set<string>();
  for (const placement of articlePlacements) {
    const owner = `${placement.surface}.${placement.slot}.${placement.order}`;
    check('articlePlacement', owner, 'articleId', placement.articleId, articleIds);

    const orderKey = `${placement.surface}:${placement.slot}:${placement.order}`;
    if (placementOrders.has(orderKey)) {
      errors.push(`[duplicate] reportPlacement order 重複: ${orderKey}`);
    }
    placementOrders.add(orderKey);

    const articleKey = `${placement.surface}:${placement.slot}:${placement.articleId}`;
    if (placementArticles.has(articleKey)) {
      errors.push(`[duplicate] reportPlacement report 重複: ${articleKey}`);
    }
    placementArticles.add(articleKey);

    if (placement.kind === 'sponsored' && !placement.sponsor?.name.trim()) {
      errors.push(`[required] reportPlacement "${owner}".sponsor.name が空です`);
    }
    if (placement.sponsor) {
      if (!placement.sponsor.name.trim()) {
        errors.push(`[required] reportPlacement "${owner}".sponsor.name が空です`);
      }
      checkUrl('articlePlacement', owner, 'sponsor.url', placement.sponsor.url);
    }
  }

  // Bidirectional consistency: Guide <-> UseCase（両側ともUIで使うため整合が必要・id参照）
  for (const g of guides) {
    for (const ucId of g.relatedUseCaseIds) {
      const uc = useCases.find((u) => u.id === ucId);
      if (uc && !uc.relatedGuideIds.includes(g.id)) {
        errors.push(
          `[asymmetric] guide "${g.id}" は useCase "${ucId}" を参照しているが、逆向き(useCase.relatedGuideIds)に含まれていません`,
        );
      }
    }
  }
  for (const u of useCases) {
    for (const gId of u.relatedGuideIds) {
      const g = guides.find((x) => x.id === gId);
      if (g && !g.relatedUseCaseIds.includes(u.id)) {
        errors.push(
          `[asymmetric] useCase "${u.id}" は guide "${gId}" を参照しているが、逆向き(guide.relatedUseCaseIds)に含まれていません`,
        );
      }
    }
  }

  // 余談: report.relatedGuideIds があるならガイドが知らなくても警告しない
  // (片方向リレーション。reportが主、guideは知らなくていい設計)

  return { errors, warnings };
}

let didRun = false;
export function runValidationInDev(): void {
  if (didRun) return;
  didRun = true;
  if (process.env.NODE_ENV === 'production') return;
  const { errors, warnings } = validateData();
  const total = robots.length + manufacturers.length + guides.length + useCases.length + articles.length;
  if (errors.length === 0 && warnings.length === 0) {
    // eslint-disable-next-line no-console
    console.log(`[data] referential integrity: OK (${total} records)`);
    return;
  }
  if (warnings.length > 0) {
    // eslint-disable-next-line no-console
    console.warn(`[data] warnings (${warnings.length}):\n` + warnings.map((i) => '  - ' + i).join('\n'));
  }
  if (errors.length > 0) {
    // eslint-disable-next-line no-console
    console.error(`[data] errors (${errors.length}) — build はゲートで失敗します:\n` + errors.map((i) => '  - ' + i).join('\n'));
  }
}
