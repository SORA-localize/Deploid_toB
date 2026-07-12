// 参照整合チェック。dev起動時に lib/data.ts から1度だけ呼ばれ、
// 「存在しないidを参照している」「双方向リンクが片側だけ」「id/slug重複」を
// console に出す。`npm run validate:data`（scripts/validate-data.mjs）からも実行される。
import { deployments } from '../data/deployments.ts';
import { manufacturers } from '../data/manufacturers.ts';
import { articlePlacements } from '../data/articlePlacements.ts';
import { articles } from '../data/articles.ts';
import { robots } from '../data/robots.ts';
import type { CandidateEvidenceBasis, ImageAsset, RightsStatus } from '../data/types.ts';
import { useCases } from '../data/useCases.ts';
import {
  articleCategoryOrder,
  articleSectionOrder,
  companyStatusOrder,
  companyTypeOrder,
  japanAvailabilityOrder,
  manufacturerCountryOrder,
  manufacturerGuideDeploymentCategoryOrder,
  manufacturerGuideEvaluationAxisOrder,
  robotCategoryOrder,
} from './display.ts';
import {
  articleCategoryLabels,
  articleSectionLabels,
  manufacturerGuideDeploymentCategoryLabels,
  manufacturerGuideEvaluationAxisLabels,
} from './labels.ts';
import { isSpecKey } from './specSchema.ts';
import { isRegisteredTag, normalizeTagKey, type TagKind } from './tagRegistry.ts';
import { isPublicUseCaseCandidateBasis } from './useCaseEvidence.ts';

const isoDatePattern = /^\d{4}-\d{2}-\d{2}$/;
const referenceDisplayStatuses = new Set<RightsStatus>([
  'reference-attributed',
  'permission-requested',
]);
const candidateEvidenceBases = new Set<CandidateEvidenceBasis>([
  'deployment',
  'adjacent-deployment',
  'official-use-case',
  'product-capability',
  'market-signal',
  'editorial-watch',
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
  const useCaseIds = new Set(useCases.map((u) => u.id));
  const articleIds = new Set(articles.map((r) => r.id));
  const visibleRobotIds = new Set(
    robots
      .filter((r) => r.publishStatus === 'published' || r.publishStatus === 'archived')
      .map((r) => r.id),
  );
  const publishedRobotIds = new Set(
    robots.filter((r) => r.publishStatus === 'published').map((r) => r.id),
  );
  const publishedManufacturerIds = new Set(
    manufacturers.filter((m) => m.publishStatus === 'published').map((m) => m.id),
  );
  const publishedUseCaseIds = new Set(
    useCases.filter((u) => u.publishStatus === 'published').map((u) => u.id),
  );
  const publishedArticleIds = new Set(
    articles.filter((article) => article.publishStatus === 'published').map((article) => article.id),
  );
  const deploymentById = new Map(deployments.map((deployment) => [deployment.id, deployment]));

  const check = (kind: string, owner: string, field: string, id: string, set: Set<string>) => {
    if (!set.has(id)) {
      errors.push(`[missing] ${kind} "${owner}".${field} -> "${id}" は存在しません`);
    }
  };

  const checkDisplayableReference = (
    kind: string,
    owner: string,
    field: string,
    id: string,
    allIds: Set<string>,
    displayableIds: Set<string>,
    displayableStatus: string,
  ) => {
    if (allIds.has(id) && !displayableIds.has(id)) {
      errors.push(
        `[not-visible] ${kind} "${owner}".${field} -> "${id}" は存在しますが、` +
          `${displayableStatus} ではないため公開面で表示されません`,
      );
    }
  };

  const checkUniqueValues = (
    kind: string,
    owner: string,
    field: string,
    values: readonly string[],
  ) => {
    const seen = new Set<string>();
    for (const value of values) {
      if (seen.has(value)) {
        errors.push(`[duplicate] ${kind} "${owner}".${field} に重複があります: ${value}`);
      }
      seen.add(value);
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
    sources: readonly { checkedAt: string; url?: string }[],
    options: { requireNonEmpty?: boolean } = {},
  ) => {
    const requireNonEmpty = options.requireNonEmpty ?? true;
    if (requireNonEmpty && sources.length === 0) {
      errors.push(`[source-empty] ${kind} "${owner}".sources が空です`);
    }
    sources.forEach((source, index) => {
      checkUrl(kind, owner, `sources[${index}].url`, source.url);
      checkDate(kind, owner, `sources[${index}].checkedAt`, source.checkedAt);
    });
  };

  const checkUseCaseCandidateEvidence = (
    useCase: (typeof useCases)[number],
    candidate: (typeof useCases)[number]['candidateRobots'][number],
    index: number,
  ) => {
    const owner = `${useCase.slug}.candidateRobots[${index}]`;
    const deploymentIds = candidate.evidenceDeploymentIds ?? [];
    const sourceUrls = candidate.evidenceSourceUrls ?? [];

    if (!candidate.reason.trim()) {
      errors.push(`[candidate-reason] useCase "${owner}.reason" が空です`);
    }
    if (!candidateEvidenceBases.has(candidate.basis)) {
      errors.push(`[candidate-basis] useCase "${owner}.basis" が未定義または未登録です: ${candidate.basis}`);
    }
    if (useCase.publishStatus === 'published' && !isPublicUseCaseCandidateBasis(candidate.basis)) {
      errors.push(
        `[candidate-public-basis] useCase "${owner}" は公開UseCaseの候補なので ` +
          `basis:'${candidate.basis}' は使えません`,
      );
    }

    checkUniqueValues('useCase', useCase.slug, `candidateRobots[${index}].evidenceDeploymentIds`, deploymentIds);
    checkUniqueValues('useCase', useCase.slug, `candidateRobots[${index}].evidenceSourceUrls`, sourceUrls);

    const useCaseSourceUrls = new Set(useCase.sources.map((source) => source.url));
    sourceUrls.forEach((url, sourceIndex) => {
      checkUrl('useCase', useCase.slug, `candidateRobots[${index}].evidenceSourceUrls[${sourceIndex}]`, url);
      if (!useCaseSourceUrls.has(url)) {
        const message =
          `[candidate-source-unlisted] useCase "${useCase.slug}" の candidateRobots[${index}].evidenceSourceUrls ` +
          `"${url}" が useCase.sources にありません`;
        if (useCase.publishStatus === 'published' && candidate.basis === 'official-use-case') {
          errors.push(message);
        } else {
          warnings.push(message);
        }
      }
    });

    const evidenceDeployments = deploymentIds.flatMap((deploymentId, deploymentIndex) => {
      const deployment = deploymentById.get(deploymentId);
      if (!deployment) {
        errors.push(
          `[candidate-deployment-missing] useCase "${useCase.slug}".candidateRobots[${index}].` +
            `evidenceDeploymentIds[${deploymentIndex}] -> "${deploymentId}" は存在しません`,
        );
        return [];
      }
      if (useCase.publishStatus === 'published' && deployment.publishStatus !== 'published') {
        errors.push(
          `[candidate-deployment-draft] useCase "${useCase.slug}".candidateRobots[${index}] は公開ページの根拠として ` +
            `未公開deployment "${deploymentId}" を参照しています`,
        );
      }
      return [deployment];
    });

    if (candidate.fit === 'strong') {
      if (candidate.basis !== 'deployment') {
        errors.push(
          `[candidate-fit-basis] useCase "${owner}" は fit:'strong' なので basis:'deployment' にしてください`,
        );
      }
      if (deploymentIds.length === 0) {
        errors.push(
          `[candidate-evidence-empty] useCase "${owner}" は fit:'strong' なので evidenceDeploymentIds が必須です`,
        );
      }
      evidenceDeployments.forEach((deployment) => {
        if (deployment.robotId !== candidate.robotId) {
          errors.push(
            `[candidate-deployment-robot] useCase "${useCase.slug}".candidateRobots[${index}] の根拠deployment ` +
              `"${deployment.id}" は robotId が一致しません: ${deployment.robotId ?? '(none)'}`,
          );
        }
        if (!(deployment.relatedUseCaseIds ?? []).includes(useCase.id)) {
          errors.push(
            `[candidate-deployment-usecase] useCase "${useCase.slug}".candidateRobots[${index}] の根拠deployment ` +
              `"${deployment.id}" は relatedUseCaseIds に "${useCase.id}" を含みません`,
          );
        }
      });
      return;
    }

    if (candidate.fit === 'possible') {
      if (candidate.basis === 'deployment') {
        errors.push(
          `[candidate-fit-understated] useCase "${owner}" は basis:'deployment' なので fit:'strong' にするか、` +
            `根拠種別を adjacent-deployment 等に落としてください`,
        );
      }
      if (candidate.basis === 'editorial-watch') {
        errors.push(
          `[candidate-fit-basis] useCase "${owner}" は fit:'possible' なので basis:'editorial-watch' は使えません`,
        );
      }
      if (candidate.basis === 'adjacent-deployment' && deploymentIds.length === 0) {
        errors.push(
          `[candidate-evidence-empty] useCase "${owner}" は basis:'adjacent-deployment' なので evidenceDeploymentIds が必須です`,
        );
      }
      if (
        (candidate.basis === 'official-use-case' ||
          candidate.basis === 'product-capability' ||
          candidate.basis === 'market-signal') &&
        sourceUrls.length === 0
      ) {
        errors.push(
          `[candidate-evidence-empty] useCase "${owner}" は basis:'${candidate.basis}' なので evidenceSourceUrls が必須です`,
        );
      }
      return;
    }

    if (candidate.fit === 'watch') {
      if (
        candidate.basis !== 'market-signal' &&
        candidate.basis !== 'editorial-watch' &&
        candidate.basis !== 'product-capability'
      ) {
        errors.push(
          `[candidate-fit-basis] useCase "${owner}" は fit:'watch' なので ` +
            `basis は market-signal / product-capability / editorial-watch のいずれかにしてください`,
        );
      }
      if (
        (candidate.basis === 'market-signal' || candidate.basis === 'product-capability') &&
        sourceUrls.length === 0
      ) {
        errors.push(
          `[candidate-evidence-empty] useCase "${owner}" は basis:'${candidate.basis}' なので evidenceSourceUrls が必須です`,
        );
      }
      return;
    }

    errors.push(`[candidate-fit] useCase "${owner}.fit" が未登録です: ${candidate.fit}`);
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
  checkLabelOrderSync(
    'manufacturerGuideEvaluationAxis',
    manufacturerGuideEvaluationAxisLabels,
    manufacturerGuideEvaluationAxisOrder,
  );
  checkLabelOrderSync(
    'manufacturerGuideDeploymentCategory',
    manufacturerGuideDeploymentCategoryLabels,
    manufacturerGuideDeploymentCategoryOrder,
  );

  // manufacturer-guide は本文を manufacturerGuideContent に持つ固定テンプレート型。
  // 型では表現しきれない「非空文字であること」「prose に見出しを持ち込まないこと」をここで確認する。
  for (const article of articles) {
    if (article.type !== 'manufacturer-guide') continue;
    const content = article.manufacturerGuideContent;
    // prose フィールドは string 型のトップレベル値をすべて対象にする（新フィールド追加時の列挙漏れ防止）。
    Object.entries(content).forEach(([field, value]) => {
      if (typeof value !== 'string') return;
      if (!value.trim()) {
        errors.push(`[manufacturerGuideContent] ${article.slug}: ${field} が空です`);
      }
      // 見出しはテンプレート（MANUFACTURER_GUIDE_SECTIONS）の専有。prose に Markdown 見出しが
      // 混入すると TOC・スクロール連動の外に h2 が生まれるため build で弾く。
      if (/^#{1,6}\s/m.test(value)) {
        errors.push(
          `[manufacturerGuideContent] ${article.slug}: ${field} に Markdown 見出しが含まれています（見出しはテンプレート固定）`,
        );
      }
    });
    manufacturerGuideEvaluationAxisOrder.forEach((axis) => {
      const item = content.evaluationAxes[axis];
      if (!item || !item.body.trim() || item.labelOverride?.trim() === '') {
        errors.push(`[manufacturerGuideContent] ${article.slug}: evaluationAxes.${axis} が不完全です`);
      }
    });
    manufacturerGuideDeploymentCategoryOrder.forEach((category) => {
      const item = content.deploymentStatus[category];
      if (!item || !item.body.trim() || item.labelOverride?.trim() === '') {
        errors.push(`[manufacturerGuideContent] ${article.slug}: deploymentStatus.${category} が不完全です`);
      }
    });
    if (content.lineup.length === 0) {
      errors.push(`[manufacturerGuideContent] ${article.slug}: lineup が空です`);
    }
    const robotIdSet = new Set(robots.map((r) => r.id));
    content.lineup.forEach((row) => {
      if (!robotIdSet.has(row.robotId)) {
        errors.push(`[manufacturerGuideContent] ${article.slug}: lineup の robotId "${row.robotId}" が存在しません`);
      }
      if (!row.roleLabel.trim() || !row.priceLabel.trim()) {
        errors.push(`[manufacturerGuideContent] ${article.slug}: lineup.${row.robotId} の roleLabel/priceLabel が空です`);
      }
    });
    content.faq.forEach((item, i) => {
      if (!item.question.trim() || !item.answer.trim()) {
        errors.push(`[manufacturerGuideContent] ${article.slug}: faq[${i}] が不完全です`);
      }
      if (/^#{1,6}\s/m.test(item.answer)) {
        errors.push(`[manufacturerGuideContent] ${article.slug}: faq[${i}] の回答に Markdown 見出しが含まれています`);
      }
    });
    (content.videos ?? []).forEach((video, i) => {
      if (!/^[A-Za-z0-9_-]{11}$/.test(video.videoId)) {
        errors.push(`[manufacturerGuideContent] ${article.slug}: videos[${i}].videoId の形式が不正です`);
      }
      if (!video.title.trim() || !video.channelName.trim() || !video.channelUrl.trim()) {
        errors.push(`[manufacturerGuideContent] ${article.slug}: videos[${i}] が不完全です`);
      }
    });
  }

  for (const r of robots) {
    check('robot', r.slug, 'manufacturerId', r.manufacturerId, manufacturerIds);
    if (visibleRobotIds.has(r.id)) {
      checkDisplayableReference(
        'robot',
        r.slug,
        'manufacturerId',
        r.manufacturerId,
        manufacturerIds,
        publishedManufacturerIds,
        'published',
      );
    }
    if (r.supersededById) {
      check('robot', r.slug, 'supersededById', r.supersededById, robotIds);
      if (visibleRobotIds.has(r.id)) {
        checkDisplayableReference(
          'robot',
          r.slug,
          'supersededById',
          r.supersededById,
          robotIds,
          publishedRobotIds,
          'published',
        );
      }
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

  for (const u of useCases) {
    checkDate('useCase', u.slug, 'updatedAt', u.updatedAt);
    checkRequiredSources('useCase', u.slug, u.sources, {
      requireNonEmpty: u.publishStatus === 'published',
    });
    checkTags('useCase', u.slug, 'primaryIndustry', 'industry', [u.primaryIndustry]);
    checkTags('useCase', u.slug, 'industryTags', 'industry', u.industryTags);
    checkTags('useCase', u.slug, 'taskTags', 'task', u.taskTags);
    checkUniqueValues(
      'useCase',
      u.slug,
      'candidateRobots.robotId',
      u.candidateRobots.map((c) => c.robotId),
    );
    if (u.publishStatus === 'published' && u.candidateRobots.length === 0) {
      errors.push(`[candidate-empty] useCase "${u.slug}".candidateRobots が空です`);
    }
    if (
      u.publishStatus === 'published' &&
      !u.candidateRobots.some((candidate) => isPublicUseCaseCandidateBasis(candidate.basis))
    ) {
      errors.push(`[candidate-public-empty] useCase "${u.slug}" に公開候補として使える candidateRobots がありません`);
    }
    u.candidateRobots.forEach((c, index) => {
      check('useCase', u.slug, 'candidateRobots.robotId', c.robotId, robotIds);
      if (u.publishStatus === 'published') {
        checkDisplayableReference(
          'useCase',
          u.slug,
          'candidateRobots.robotId',
          c.robotId,
          robotIds,
          visibleRobotIds,
          'published/archived',
        );
      }
      checkUseCaseCandidateEvidence(u, c, index);
    });
  }

  for (const article of articles) {
    checkDate('article', article.slug, 'updatedAt', article.updatedAt);
    checkDate('article', article.slug, 'publishedAt', article.publishedAt);
    checkImageAsset('article', article.slug, 'heroImage', article.heroImage);
    checkRequiredSources('article', article.slug, article.sources, {
      requireNonEmpty: article.publishStatus === 'published' && article.contentKind !== 'sample',
    });
    checkTags('article', article.slug, 'industryTags', 'industry', article.industryTags ?? []);
    checkTags('article', article.slug, 'regionTags', 'region', article.regionTags ?? []);
    checkTags('article', article.slug, 'themeTags', 'theme', article.themeTags ?? []);
    if ((article.themeTags?.length ?? 0) > 4) {
      errors.push(
        `[tag-count] article "${article.slug}".themeTags は0〜4個にしてください（現在 ${article.themeTags?.length ?? 0}個）`,
      );
    }
    checkUniqueValues('article', article.slug, 'relatedRobotIds', article.relatedRobotIds);
    checkUniqueValues('article', article.slug, 'relatedManufacturerIds', article.relatedManufacturerIds);
    checkUniqueValues('article', article.slug, 'relatedUseCaseIds', article.relatedUseCaseIds);
    article.relatedRobotIds.forEach((s) => {
      check('article', article.slug, 'relatedRobotIds', s, robotIds);
      if (article.publishStatus === 'published') {
        checkDisplayableReference(
          'article',
          article.slug,
          'relatedRobotIds',
          s,
          robotIds,
          visibleRobotIds,
          'published/archived',
        );
      }
    });
    article.relatedManufacturerIds.forEach((s) => {
      check('article', article.slug, 'relatedManufacturerIds', s, manufacturerIds);
      if (article.publishStatus === 'published') {
        checkDisplayableReference(
          'article',
          article.slug,
          'relatedManufacturerIds',
          s,
          manufacturerIds,
          publishedManufacturerIds,
          'published',
        );
      }
    });
    article.relatedUseCaseIds.forEach((s) => {
      check('article', article.slug, 'relatedUseCaseIds', s, useCaseIds);
      if (article.publishStatus === 'published') {
        checkDisplayableReference(
          'article',
          article.slug,
          'relatedUseCaseIds',
          s,
          useCaseIds,
          publishedUseCaseIds,
          'published',
        );
      }
    });
  }

  for (const d of deployments) {
    check('deployment', d.id, 'manufacturerId', d.manufacturerId, manufacturerIds);
    if (d.publishStatus === 'published') {
      checkDisplayableReference(
        'deployment',
        d.id,
        'manufacturerId',
        d.manufacturerId,
        manufacturerIds,
        publishedManufacturerIds,
        'published',
      );
    }
    if (d.robotId) {
      check('deployment', d.id, 'robotId', d.robotId, robotIds);
      if (d.publishStatus === 'published') {
        checkDisplayableReference(
          'deployment',
          d.id,
          'robotId',
          d.robotId,
          robotIds,
          visibleRobotIds,
          'published/archived',
        );
      }
    }
    checkUniqueValues('deployment', d.id, 'relatedUseCaseIds', d.relatedUseCaseIds ?? []);
    (d.relatedUseCaseIds ?? []).forEach((s) => {
      check('deployment', d.id, 'relatedUseCaseIds', s, useCaseIds);
      if (d.publishStatus === 'published') {
        checkDisplayableReference(
          'deployment',
          d.id,
          'relatedUseCaseIds',
          s,
          useCaseIds,
          publishedUseCaseIds,
          'published',
        );
      }
    });
    checkDate('deployment', d.id, 'updatedAt', d.updatedAt);
    checkRequiredSources('deployment', d.id, d.sources);
  }

  const placementOrders = new Set<string>();
  const placementArticles = new Set<string>();
  for (const placement of articlePlacements) {
    const owner = `${placement.surface}.${placement.slot}.${placement.order}`;
    check('articlePlacement', owner, 'articleId', placement.articleId, articleIds);
    checkDisplayableReference(
      'articlePlacement',
      owner,
      'articleId',
      placement.articleId,
      articleIds,
      publishedArticleIds,
      'published',
    );

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

  return { errors, warnings };
}

let didRun = false;
export function runValidationInDev(): void {
  if (didRun) return;
  didRun = true;
  if (process.env.NODE_ENV === 'production') return;
  const { errors, warnings } = validateData();
  const total = robots.length + manufacturers.length + useCases.length + articles.length;
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
